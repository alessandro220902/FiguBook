// figubook-app/src/hooks/useNearbyCollectors.ts
import { useEffect, useState } from 'react'
import { fetchNearbyUids } from '@/lib/functions/nearby'
import { getPublicByUid } from '@/lib/db/publicProfiles'
import type { PublicProfile } from '@/lib/db/profile'

// Carica il teaser di prossimità (una tantum). enabled=false → non chiama.
export function useNearbyCollectors(enabled: boolean) {
  const [people, setPeople] = useState<PublicProfile[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled) return
    let active = true
    setLoading(true)
    fetchNearbyUids()
      .then(async (uids) => {
        const profs = await Promise.all(uids.map((u) => getPublicByUid(u)))
        return profs.filter((p): p is PublicProfile => !!p)
      })
      .then((p) => active && setPeople(p))
      .catch(() => active && setPeople([]))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [enabled])

  return { people, loading }
}
