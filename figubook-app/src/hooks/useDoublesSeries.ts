import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { fetchRecentSnapshots, todayIso } from '@/lib/db/statsHistory'
import { dailyDoublesSeries, type DayDoublesPoint } from '@/lib/stats/dailyDoubles'

// Serie doppie/nuove per giorno (rolling 7gg). Legge fino a 14 snapshot per
// coprire la finestra anche con giorni saltati. `refreshKey` forza rilettura.
export function useDoublesSeries(refreshKey?: unknown): DayDoublesPoint[] {
  const { user } = useAuth()
  const [series, setSeries] = useState<DayDoublesPoint[]>([])

  useEffect(() => {
    if (!user) return
    let alive = true
    fetchRecentSnapshots(user.uid, 14)
      .then((snaps) => { if (alive) setSeries(dailyDoublesSeries(snaps, todayIso())) })
      .catch((e) => { console.error('doublesSeries', e); if (alive) setSeries([]) })
    return () => { alive = false }
  }, [user, refreshKey])

  return series
}
