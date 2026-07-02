// src/hooks/useStatsDeltas.ts
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { fetchRecentSnapshots, todayIso } from '@/lib/db/statsHistory'
import { computeDeltas, type StatDeltas } from '@/lib/stats/computeDeltas'

const NONE: StatDeltas = { haveDelta: null, doublesDelta: null, missingDelta: null }

// `refreshKey` opzionale: cambiando forza una rilettura (es. dopo aver salvato lo snapshot).
export function useStatsDeltas(refreshKey?: unknown): StatDeltas {
  const { user } = useAuth()
  const [deltas, setDeltas] = useState<StatDeltas>(NONE)

  useEffect(() => {
    if (!user) return
    let alive = true
    fetchRecentSnapshots(user.uid)
      .then((snaps) => { if (alive) setDeltas(computeDeltas(snaps, todayIso())) })
      .catch((e) => { console.error('statsDeltas', e); if (alive) setDeltas(NONE) })
    return () => { alive = false }
  }, [user, refreshKey])

  return deltas
}
