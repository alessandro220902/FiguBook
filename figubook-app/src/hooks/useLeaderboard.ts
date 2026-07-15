import { useEffect, useState } from 'react'
import { fetchLeaderboard, type Scope, type Axis, type LeaderboardResult } from '@/lib/functions/leaderboard'
import { useAuth } from '@/hooks/useAuth'

export function useLeaderboard(scope: Scope, axis: Axis) {
  const { user } = useAuth()
  const [data, setData] = useState<LeaderboardResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!user) return
    let alive = true
    setLoading(true)
    setError(false)
    fetchLeaderboard(scope, axis)
      .then((r) => { if (alive) setData(r) })
      .catch((e) => { console.error('leaderboard', e); if (alive) setError(true) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [user, scope, axis])

  return { data, loading, error }
}
