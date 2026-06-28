import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'

// Doc profilo privato: users/{uid}/meta/profile.
// Campi base (displayName, username, ts) scritti alla registrazione (register.ts);
// qui si aggiungono i campi editabili dall'utente nella sezione Impostazioni.
// I campi "scambi/privacy" sono tipati ma non ancora editati dalla UI (step >2).
export interface ProfileDoc {
  displayName: string
  username: string
  ts: number
  // Account (editabili ora)
  nome?: string
  citta?: string
  bio?: string
  avatarId?: string
  // Pianificati (vetrina/scambi) — non ancora in UI
  isPublic?: boolean
  tradesEnabled?: boolean
  copiesToKeep?: number
  tradeNote?: string
  tradePref?: string
  blocked?: string[]
}

// Solo i campi che la tab Account modifica.
export type ProfileAccountPatch = Pick<
  ProfileDoc,
  'nome' | 'username' | 'citta' | 'bio' | 'avatarId'
>

function profileRef(uid: string) {
  return doc(db, 'users', uid, 'meta', 'profile')
}

// Sottoscrizione live al doc profilo. Errore/assenza => null.
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

// Salva i campi Account. Tiene il displayName di Firebase Auth allineato allo
// username (è ciò che mostrano navbar e intestazione profilo finché non esiste
// la vetrina pubblica). merge:true => non tocca gli altri campi del doc.
export async function saveProfileAccount(uid: string, patch: ProfileAccountPatch) {
  const clean: ProfileAccountPatch = {
    username: patch.username.trim(),
    nome: patch.nome?.trim() || '',
    citta: patch.citta?.trim() || '',
    bio: patch.bio?.trim() || '',
    avatarId: patch.avatarId || '',
  }
  await setDoc(profileRef(uid), clean, { merge: true })
  if (auth.currentUser && clean.username && auth.currentUser.displayName !== clean.username) {
    await updateProfile(auth.currentUser, { displayName: clean.username })
  }
}

// Salva solo l'avatar (azione diretta dalla matita sulla foto).
export async function saveAvatar(uid: string, avatarId: string) {
  await setDoc(profileRef(uid), { avatarId }, { merge: true })
}
