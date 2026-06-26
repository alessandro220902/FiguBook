import type { User } from 'firebase/auth'

// Data di attivazione della verifica email. Gli utenti email/password creati
// PRIMA di questa data sono "grandfathered": passano liberi senza verifica.
// Google (e altri provider) hanno emailVerified=true e non sono mai bloccati.
export const VERIFICATION_CUTOFF = Date.parse('2026-06-26T00:00:00Z')

// True se l'utente deve verificare l'email prima di accedere all'app.
// Vale solo per account email/password creati dopo il cutoff.
export function needsVerification(user: User | null): boolean {
  if (!user || user.emailVerified) return false
  const isPassword = user.providerData.some((p) => p.providerId === 'password')
  if (!isPassword) return false
  const created = user.metadata.creationTime ? Date.parse(user.metadata.creationTime) : 0
  return created > VERIFICATION_CUTOFF
}
