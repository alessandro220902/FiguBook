const KEY = 'figubook.invitedBy'

// Salva lo username dell'invitante (normalizzato). No-op se vuoto.
export function rememberReferrer(username: string): void {
  const u = username.trim().toLowerCase()
  if (u) localStorage.setItem(KEY, u)
}

// Legge senza cancellare. null se assente.
export function peekReferrer(): string | null {
  return localStorage.getItem(KEY) || null
}

// Legge e cancella (one-shot, dopo l'attribuzione a registrazione).
export function consumeReferrer(): string | null {
  const v = peekReferrer()
  if (v) localStorage.removeItem(KEY)
  return v
}
