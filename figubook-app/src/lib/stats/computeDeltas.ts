export interface StatSnapshot {
  date: string // 'YYYY-MM-DD'
  have: number
  doubles: number
  missing: number
  total: number
  // Breakdown per album: stato CORRENTE (cumulativo) del giorno.
  albums?: Record<string, { have: number; doubles: number }>
  // Stato per album a INIZIO giornata (baseline). Le aggiunte di oggi per album
  // = albums - albumsStart → la torta si costruisce live durante la giornata.
  albumsStart?: Record<string, { have: number; doubles: number }>
}

export interface StatDeltas {
  haveDelta: number | null
  doublesDelta: number | null
  missingDelta: number | null
}

const NONE: StatDeltas = { haveDelta: null, doublesDelta: null, missingDelta: null }

function daysBetween(aIso: string, bIso: string): number {
  const a = Date.parse(aIso + 'T00:00:00Z')
  const b = Date.parse(bIso + 'T00:00:00Z')
  return Math.round((a - b) / 86_400_000)
}

// snapshots: ordinati dal più recente al più vecchio. todayIso: giorno corrente 'YYYY-MM-DD'.
export function computeDeltas(snapshots: StatSnapshot[], todayIso: string): StatDeltas {
  if (snapshots.length < 2) return NONE
  const today = snapshots[0]
  let base: StatSnapshot | undefined
  for (const s of snapshots) {
    const d = daysBetween(todayIso, s.date)
    if (d >= 1 && d <= 7) base = s
  }
  if (!base) return NONE
  return {
    haveDelta: today.have - base.have,
    doublesDelta: today.doubles - base.doubles,
    missingDelta: today.missing - base.missing,
  }
}
