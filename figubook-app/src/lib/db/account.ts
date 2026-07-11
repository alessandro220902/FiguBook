import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '@/lib/firebase'

// Confronto per la modale di conferma: input digitato vs username reale.
export function usernameMatches(typed: string, username: string): boolean {
  const t = typed.trim().toLowerCase()
  return t.length > 0 && t === username.trim().toLowerCase()
}

// Chiama la Cloud Function che cancella l'account del chiamante.
export async function deleteAccount(): Promise<void> {
  const functions = getFunctions(app, 'europe-west1')
  const call = httpsCallable(functions, 'deleteAccount')
  await call()
}
