import type { StatSnapshot } from './computeDeltas'

export interface InsertedPoint {
  date: string // 'YYYY-MM-DD'
  count: number
}

// Confini dei bucket dell'asse Y (non-lineare). L'ultimo è il cap "200+".
export const BUCKETS = [0, 5, 20, 50, 100, 200]
// Etichette dei tick (posizioni 0..5). 0 resta vuoto per non affollare la base.
export const BUCKET_LABELS = ['', '5', '20', '50', '100', '200+']

// Mappa un conteggio a una posizione 0..(BUCKETS.length-1) con spaziatura uniforme
// tra i confini (piecewise-linear). Così i valori piccoli restano leggibili e i
// bustoni 100+ non schiacciano il resto. Oltre 200 → cap alla posizione massima.
export function bucketScale(count: number): number {
  const c = Math.max(0, count)
  const last = BUCKETS.length - 1
  if (c >= BUCKETS[last]) return last
  for (let i = 0; i < last; i++) {
    const lo = BUCKETS[i]
    const hi = BUCKETS[i + 1]
    if (c >= lo && c < hi) {
      return i + (c - lo) / (hi - lo)
    }
  }
  return 0
}

function todayMinus(todayIso: string, n: number): string {
  const t = Date.parse(todayIso + 'T00:00:00Z')
  const d = new Date(t - n * 86_400_000)
  return d.toISOString().slice(0, 10)
}

// Serie rolling 7 giorni (vecchio→oggi). count = figurine inserite quel giorno:
// have(giorno) - have(snapshot precedente esistente). Giorno senza snapshot = 0.
// Nessun precedente (primo snapshot) = 0. Negativi (rimozioni) clampati a 0.
export function dailyInsertedSeries(snapshots: StatSnapshot[], todayIso: string): InsertedPoint[] {
  // Mappa data→snapshot per lookup rapido.
  const byDate = new Map(snapshots.map((s) => [s.date, s]))
  // Snapshot ordinati ascendente per trovare il precedente esistente.
  const asc = [...snapshots].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  const out: InsertedPoint[] = []
  for (let i = 6; i >= 0; i--) {
    const date = todayMinus(todayIso, i)
    const snap = byDate.get(date)
    if (!snap) {
      out.push({ date, count: 0 })
      continue
    }
    // Precedente esistente = ultimo snapshot con data < date.
    let prev: StatSnapshot | undefined
    for (const s of asc) {
      if (s.date < date) prev = s
      else break
    }
    const delta = prev ? snap.have - prev.have : 0
    out.push({ date, count: Math.max(0, delta) })
  }
  return out
}
