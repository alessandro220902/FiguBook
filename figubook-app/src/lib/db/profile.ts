import { doc, onSnapshot, setDoc, runTransaction, getDoc } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { isValidComune } from '@/lib/geo/searchComuni'

// CAP valido = esattamente 5 cifre, oppure vuoto (è opzionale).
export function isValidCap(cap: string): boolean {
  const c = cap.trim()
  return c === '' || /^\d{5}$/.test(c)
}

// Doc profilo privato: users/{uid}/meta/profile.
// Campi base (displayName, username, ts) scritti alla registrazione (register.ts);
// qui si aggiungono i campi editabili dall'utente.
export interface ProfileDoc {
  displayName: string
  username: string
  ts: number
  nome?: string
  citta?: string
  bio?: string
  avatarId?: string
  favTeam?: string
  // CAP privato (mai in publicProfiles). 5 cifre o assente.
  cap?: string
  // true = l'utente ha già visto l'onboarding (anche se l'ha saltato).
  onboarded?: boolean
  // Visibilità: unico interruttore. true = chiunque vede tutto; false = solo amici.
  isPublic?: boolean
  // Pianificati (scambi) — non ancora in UI
  tradesEnabled?: boolean
  copiesToKeep?: number
  tradeNote?: string
  tradePref?: string
  blocked?: string[]
}

// Doc pubblico per ricerca/vetrina: publicProfiles/{uid}. Solo campi "carta"
// (username/nome/avatar/squadra/visibilità). Città/album restano gated altrove.
export interface PublicProfile {
  uid: string
  username: string
  usernameLower: string
  nome: string
  avatarId: string
  favTeam: string
  isPublic: boolean
  // Sempre pubblici (privato nasconde solo lo sfoglio album).
  citta: string
  bio: string
  updatedAt: number
  lastSeen?: number   // ultimo accesso app (ms); assente = mai tracciato
}

// isPublic NON è qui: si salva subito col toggle (savePrivacy), non col form.
export type ProfileAccountPatch = Pick<
  ProfileDoc,
  'nome' | 'username' | 'citta' | 'bio' | 'favTeam'
>

// Errore dedicato: username già preso da un altro utente.
export class UsernameTakenError extends Error {
  constructor() {
    super('username-taken')
    this.name = 'UsernameTakenError'
  }
}

function profileRef(uid: string) {
  return doc(db, 'users', uid, 'meta', 'profile')
}
function publicRef(uid: string) {
  return doc(db, 'publicProfiles', uid)
}
function usernameRef(lower: string) {
  return doc(db, 'usernames', lower)
}

export function subscribeProfile(
  uid: string,
  cb: (p: ProfileDoc | null) => void,
): () => void {
  return onSnapshot(
    profileRef(uid),
    (snap) => cb(snap.exists() ? (snap.data() as ProfileDoc) : null),
    () => cb(null),
  )
}

// Salva i campi Account in una transazione che:
//  - garantisce l'unicità dello username (collection usernames/{lower} -> uid)
//  - rispecchia i dati "carta" su publicProfiles (per ricerca/vetrina)
//  - aggiorna il doc privato meta/profile
// Lancia UsernameTakenError se lo username è di un altro utente.
export async function saveProfileAccount(uid: string, patch: ProfileAccountPatch) {
  const username = patch.username.trim()
  const lower = username.toLowerCase()
  const clean = {
    username,
    nome: patch.nome?.trim() || '',
    // Solo comuni canonici ("Nome (PROV)"); testo non valido -> città non impostata.
    citta: isValidComune((patch.citta ?? '').trim()) ? patch.citta!.trim() : '',
    bio: patch.bio?.trim() || '',
    favTeam: patch.favTeam || '',
  }

  await runTransaction(db, async (tx) => {
    const profSnap = await tx.get(profileRef(uid))
    const pubSnap = await tx.get(publicRef(uid))
    const prev = profSnap.data() as ProfileDoc | undefined
    const oldLower = (prev?.username || '').toLowerCase()
    const changed = lower !== oldLower
    // isPublic gestito dal toggle (savePrivacy): qui si preserva quello esistente.
    const pub = !!prev?.isPublic

    if (changed) {
      const uSnap = await tx.get(usernameRef(lower))
      if (uSnap.exists() && (uSnap.data() as { uid: string }).uid !== uid) {
        throw new UsernameTakenError()
      }
    }

    tx.set(profileRef(uid), clean, { merge: true })

    const pubDoc: PublicProfile = {
      uid,
      username,
      usernameLower: lower,
      // nome è PII: esposto solo se il profilo è pubblico (publicProfiles è
      // leggibile da ogni utente loggato).
      nome: pub ? clean.nome : '',
      avatarId: prev?.avatarId || (pubSnap.data() as PublicProfile | undefined)?.avatarId || '',
      favTeam: clean.favTeam,
      isPublic: pub,
      // città e bio sono sempre pubblici: "privato" nasconde SOLO lo sfoglio album.
      citta: clean.citta,
      bio: clean.bio,
      updatedAt: Date.now(),
    }
    tx.set(publicRef(uid), pubDoc, { merge: true })

    if (changed) {
      tx.set(usernameRef(lower), { uid })
      if (oldLower) tx.delete(usernameRef(oldLower))
    }
  })

  if (auth.currentUser && username && auth.currentUser.displayName !== username) {
    await updateProfile(auth.currentUser, { displayName: username })
  }
}

// Salva subito la visibilità (toggle). Aggiorna meta/profile.isPublic e
// rispecchia publicProfiles: città/bio visibili solo se pubblico.
export async function savePrivacy(uid: string, isPublic: boolean) {
  await runTransaction(db, async (tx) => {
    const prev = (await tx.get(profileRef(uid))).data() as ProfileDoc | undefined
    tx.set(profileRef(uid), { isPublic }, { merge: true })
    // Mirror COMPLETO (incl. usernameLower) così il doc resta sempre cercabile.
    const username = prev?.username || ''
    const pub: PublicProfile = {
      uid,
      username,
      usernameLower: username.toLowerCase(),
      // nome è PII: solo se pubblico (come città/bio).
      nome: isPublic ? prev?.nome || '' : '',
      avatarId: prev?.avatarId || '',
      favTeam: prev?.favTeam || '',
      isPublic,
      // città e bio sempre pubblici (privato nasconde solo gli album).
      citta: prev?.citta || '',
      bio: prev?.bio || '',
      updatedAt: Date.now(),
    }
    tx.set(publicRef(uid), pub, { merge: true })
  })
}

// Salva solo l'avatar (matita) + rispecchia su publicProfiles.
export async function saveAvatar(uid: string, avatarId: string) {
  await setDoc(profileRef(uid), { avatarId }, { merge: true })
  await setDoc(publicRef(uid), { avatarId }, { merge: true })
}

// Aggiorna lastSeen (ultimo accesso) sul profilo pubblico, con throttle locale
// (una scrittura ogni ~30 min per utente) per non scrivere ad ogni navigazione.
export async function touchLastSeen(uid: string): Promise<void> {
  const key = `figubook:lastSeen:${uid}`
  const now = Date.now()
  const prev = Number(localStorage.getItem(key) || 0)
  if (now - prev < 30 * 60_000) return
  localStorage.setItem(key, String(now))
  try {
    await setDoc(publicRef(uid), { lastSeen: now }, { merge: true })
  } catch (e) { console.error('lastSeen', e) }
}

// Salva campi privati dell'onboarding (cap/onboarded) senza toccare publicProfiles.
// Il CAP viene validato: se non valido, non viene scritto.
export async function saveProfilePrivate(
  uid: string,
  patch: { cap?: string; onboarded?: boolean },
): Promise<void> {
  const data: Partial<ProfileDoc> = {}
  if (patch.cap !== undefined) data.cap = isValidCap(patch.cap) ? patch.cap.trim() : ''
  if (patch.onboarded !== undefined) data.onboarded = patch.onboarded
  await setDoc(profileRef(uid), data, { merge: true })
}

// Segna l'onboarding come visto (per "Configura più tardi").
export async function markOnboarded(uid: string): Promise<void> {
  await saveProfilePrivate(uid, { onboarded: true })
}

// Disponibilità username (per check live nel form). true = libero o già mio.
export async function isUsernameFree(username: string, uid: string): Promise<boolean> {
  const lower = username.trim().toLowerCase()
  if (!lower) return false
  const snap = await getDoc(usernameRef(lower))
  return !snap.exists() || (snap.data() as { uid: string }).uid === uid
}
