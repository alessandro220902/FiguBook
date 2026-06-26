import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

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
  await updateProfile(cred.user, { displayName: username })
  await setDoc(
    doc(db, 'users', cred.user.uid, 'meta', 'profile'),
    { displayName: username, username, ts: Date.now() },
    { merge: true },
  )
  await sendEmailVerification(cred.user)
  return cred.user
}
