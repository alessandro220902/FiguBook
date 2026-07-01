// Etichetta relativa "attivo di recente" da un timestamp (ms) e un now (ms).
// Ritorna '' se il timestamp manca/è 0 (nessun dato).
export function lastSeenLabel(ts: number | undefined, now: number): string {
  if (!ts) return ''
  const diff = now - ts
  if (diff < 0) return 'Attivo oggi'
  const day = 86_400_000
  if (diff < day) return 'Attivo oggi'
  if (diff < 2 * day) return 'Attivo ieri'
  if (diff < 7 * day) return `Attivo ${Math.floor(diff / day)} giorni fa`
  const d = new Date(ts)
  const gg = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `Attivo il ${gg}/${mm}`
}
