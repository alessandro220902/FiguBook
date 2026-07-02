import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { fetchRecentSnapshots, todayIso } from '@/lib/db/statsHistory'
import { dailyInsertedSeries, type InsertedPoint } from '@/lib/stats/dailyInserted'

// Serie "figurine inserite/giorno" (rolling 7gg). Legge fino a 14 snapshot per
// coprire la finestra anche con giorni saltati. `refreshKey` forza rilettura.
export function useInsertedSeries(refreshKey?: unknown): InsertedPoint[] {
  const { user } = useAuth()
  const [series, setSeries] = useState<InsertedPoint[]>([])

  useEffect(() => {
    if (!user) return
    let alive = true
    fetchRecentSnapshots(user.uid, 14)
      .then((snaps) => { if (alive) setSeries(dailyInsertedSeries(snaps, todayIso())) })
      .catch((e) => { console.error('insertedSeries', e); if (alive) setSeries([]) })
    return () => { alive = false }
  }, [user, refreshKey])

  return series
}
