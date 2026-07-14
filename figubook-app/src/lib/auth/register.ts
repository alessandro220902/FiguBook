import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth'
import { doc, runTransaction } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { UsernameTakenError } from '@/lib/db/profile'
import { consumeReferrer } from '@/lib/invite/referrer'
import { getPublicByUsername } from '@/lib/db/publicProfiles'
import { writeInviteEdge } from '@/lib/db/invites'

export interface RegisterInput {
  username: string
  email: string
  password: string
  remember: boolean
}

// Registrazione email/password ISOLATA: creazione account + profilo + invio
// verifica vivono solo qui. Per cambiare meccanismo di verifica in futuro
// (es. codice 6 cifre via Cloud Function) si sostituisce SOLO questa funzione,
// la UI di Login.tsx resta invariata.
export async function registerWithEmail({ username, email, password, remember }: RegisterInput) {
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  const uid = cred.user.uid
  const lower = username.trim().toLowerCase()

  try {
    await updateProfile(cred.user, { displayName: username })
    // Riserva username + crea profilo e doc pubblico in UN'unica transazione:
    // se lo username è già preso da un altro uid, niente viene scritto (no
    // account orfani / username duplicati su publicProfiles).
    await runTransaction(db, async (tx) => {
      const uSnap = await tx.get(doc(db, 'usernames', lower))
      if (uSnap.exists() && (uSnap.data() as { uid: string }).uid !== uid) {
        throw new UsernameTakenError()
      }
      tx.set(
        doc(db, 'users', uid, 'meta', 'profile'),
        { displayName: username, username, ts: Date.now(), isPublic: true },
        { merge: true },
      )
      // Doc pubblico (cercabile) così il nuovo utente è subito trovabile nella
      // Community. Default PUBBLICO: appare nella scoperta "vicini a te" appena
      // completa il profilo; può rendersi privato dal toggle in Profilo.
      // nome/città/bio restano vuoti finché non compila il profilo.
      tx.set(doc(db, 'publicProfiles', uid), {
        uid,
        username,
        usernameLower: lower,
        nome: '',
        avatarId: '',
        favTeam: '',
        isPublic: true,
        citta: '',
        bio: '',
        updatedAt: Date.now(),
      })
      tx.set(doc(db, 'usernames', lower), { uid })
    })
  } catch (err) {
    // Username collisione (o altro errore di scrittura): non lasciare un account
    // auth orfano senza profilo. Elimina l'utente appena creato e rilancia.
    await cred.user.delete().catch(() => {})
    throw err
  }

  // Attribuzione invito (best-effort: mai bloccare la registrazione).
  try {
    const ref = consumeReferrer()
    if (ref) {
      const inviter = await getPublicByUsername(ref)
      if (inviter && inviter.uid !== uid) {
        await writeInviteEdge(uid, inviter.uid)
      }
    }
  } catch {
    // ignora: l'attribuzione non è critica
  }

  await sendEmailVerification(cred.user)
  return cred.user
}
