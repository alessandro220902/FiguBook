export type CardState = 'have' | 'double'

// count corrente di una figurina dallo schema {states,counts}.
export function counterOf(
  code: string,
  states: Record<string, string>,
  counts: Record<string, number>,
): number {
  const s = states[code]
  if (s === 'have') return 1
  if (s === 'double') return counts[code] || 2
  return 0
}

// mappa un count UI ai campi storage (null = campo da rimuovere/deleteField).
export function countToFields(count: number): { state: CardState | null; count: number | null } {
  const n = Math.max(0, Math.floor(count))
  if (n === 0) return { state: null, count: null }
  if (n === 1) return { state: 'have', count: null }
  return { state: 'double', count: n }
}

export interface SectionStats {
  have: number
  missing: number
  doubles: number
  total: number
  pct: number
}

export function sectionStats(
  states: Record<string, string>,
  counts: Record<string, number>,
  codes: string[],
): SectionStats {
  let have = 0
  let doubles = 0
  for (const code of codes) {
    const c = counterOf(code, states, counts)
    if (c >= 1) have++
    if (c >= 2) doubles += c - 1
  }
  const total = codes.length
  const missing = Math.max(0, total - have)
  const pct = total > 0 ? Math.min(100, Math.round((have / total) * 100)) : 0
  return { have, missing, doubles, total, pct }
}
