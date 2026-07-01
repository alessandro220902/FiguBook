// Etichetta relativa "attivo di recente" da un timestamp (ms) e un now (ms).
// Ritorna '' se il timestamp manca/è 0 (nessun dato).
export function lastSeenLabel(ts: number | undefined, now: number): string {
  if (!ts) return ''
  const diff = now - ts
  const p = 'ultimo accesso: '
  if (diff < 0) return `${p}oggi`
  const day = 86_400_000
  if (diff < day) return `${p}oggi`
  if (diff < 2 * day) return `${p}ieri`
  if (diff < 7 * day) return `${p}${Math.floor(diff / day)} gg fa`
  const d = new Date(ts)
  const gg = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${p}${gg}/${mm}`
}
