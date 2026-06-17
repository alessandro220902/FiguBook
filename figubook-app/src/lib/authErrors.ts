// Traduzione codici errore Firebase Auth (come nel sito vecchio).
const MAP: Record<string, string> = {
  'auth/wrong-password': 'Password errata. Riprova.',
  'auth/user-not-found': 'Nessun account con questa email.',
  'auth/invalid-credential': 'Email o password non corretti.',
  'auth/email-already-in-use': 'Esiste già un account con questa email.',
  'auth/invalid-email': 'Indirizzo email non valido.',
  'auth/weak-password': 'La password deve avere almeno 6 caratteri.',
  'auth/popup-closed-by-user': 'Accesso annullato.',
  'auth/network-request-failed': 'Problema di rete. Controlla la connessione.',
  'auth/too-many-requests': 'Troppi tentativi. Riprova più tardi.',
}

export function mapFirebaseError(code?: string): string {
  return (code && MAP[code]) || 'Si è verificato un errore. Riprova.'
}
