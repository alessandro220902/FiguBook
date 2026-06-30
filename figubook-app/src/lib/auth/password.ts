import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

// True se l'utente può cambiare password (provider email/password).
export function hasPasswordProvider(user: User | null): boolean {
  return user?.providerData?.some((p) => p.providerId === 'password') ?? false
}

// Cambia la password riautenticando con quella attuale (richiesto da Firebase
// per operazioni sensibili).
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = auth.currentUser
  if (!user || !user.email) throw new Error('no-user')
  const cred = EmailAuthProvider.credential(user.email, currentPassword)
  await reauthenticateWithCredential(user, cred)
  await updatePassword(user, newPassword)
}

// Invia email di reset password (fallback "password dimenticata").
export function sendReset(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email)
}
