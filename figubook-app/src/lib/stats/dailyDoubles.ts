import type { StatSnapshot } from './computeDeltas'

export interface DayDoublesPoint {
  date: string // 'YYYY-MM-DD'
  nuove: number
  doppie: number
  perAlbum: Record<string, { nuove: number; doppie: number }>
}

function todayMinus(todayIso: string, n: number): string {
  const t = Date.parse(todayIso + 'T00:00:00Z')
  const d = new Date(t - n * 86_400_000)
  return d.toISOString().slice(0, 10)
}

// Serie rolling 7 giorni (vecchio→oggi). Per ogni giorno con snapshot: delta vs
// ultimo snapshot precedente esistente, aggregato (have/doubles) e per album.
export function dailyDoublesSeries(snapshots: StatSnapshot[], todayIso: string): DayDoublesPoint[] {
  const byDate = new Map(snapshots.map((s) => [s.date, s]))
  const asc = [...snapshots].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  const out: DayDoublesPoint[] = []
  for (let i = 6; i >= 0; i--) {
    const date = todayMinus(todayIso, i)
    const snap = byDate.get(date)
    if (!snap) {
      out.push({ date, nuove: 0, doppie: 0, perAlbum: {} })
      continue
    }
    let prev: StatSnapshot | undefined
    for (const s of asc) {
      if (s.date < date) prev = s
      else break
    }
    const nuove = Math.max(0, prev ? snap.have - prev.have : 0)
    const doppie = Math.max(0, prev ? snap.doubles - prev.doubles : 0)
    // Aggiunte per album del giorno = stato corrente - stato a inizio giornata
    // (albumsStart). Si costruisce live durante la giornata, senza dipendere da ieri.
    const perAlbum: Record<string, { nuove: number; doppie: number }> = {}
    const cur = snap.albums
    const start = snap.albumsStart
    if (cur && start) {
      for (const id of Object.keys(cur)) {
        const c = cur[id]
        const b = start[id] ?? { have: 0, doubles: 0 }
        const n = Math.max(0, c.have - b.have)
        const d = Math.max(0, c.doubles - b.doubles)
        if (n > 0 || d > 0) perAlbum[id] = { nuove: n, doppie: d }
      }
    }
    out.push({ date, nuove, doppie, perAlbum })
  }
  return out
}
