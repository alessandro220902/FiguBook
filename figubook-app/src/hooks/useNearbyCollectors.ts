// figubook-app/src/hooks/useNearbyCollectors.ts
import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchNearbyUids } from '@/lib/functions/nearby'
import { getPublicByUid } from '@/lib/db/publicProfiles'
import type { PublicProfile } from '@/lib/db/profile'

const PAGE = 6

// Suggeriti di prossimità paginati: primo batch al mount, loadMore per i successivi.
export function useNearbyCollectors(): {
  people: PublicProfile[]
  hasMore: boolean
  loading: boolean
  loadMore: () => void
} {
  const [people, setPeople] = useState<PublicProfile[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true) // il primo batch parte al mount
  const seen = useRef<string[]>([])
  const seenSet = useRef<Set<string>>(new Set())
  const inFlight = useRef(false)
  const mounted = useRef(true)

  const load = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    setLoading(true)
    try {
      const { uids, hasMore: more } = await fetchNearbyUids([...seen.current], PAGE)
      for (const u of uids) {
        if (!seenSet.current.has(u)) { seenSet.current.add(u); seen.current.push(u) }
      }
      const profs = await Promise.all(uids.map((u) => getPublicByUid(u)))
      const fresh = profs.filter((p): p is PublicProfile => !!p)
      if (!mounted.current) return
      setPeople((prev) => {
        const have = new Set(prev.map((p) => p.uid))
        return [...prev, ...fresh.filter((p) => !have.has(p.uid))]
      })
      setHasMore(more)
    } catch {
      if (mounted.current) setHasMore(false)
    } finally {
      inFlight.current = false
      if (mounted.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    load()
    return () => { mounted.current = false }
  }, [load])

  const loadMore = useCallback(() => {
    if (!hasMore || inFlight.current) return
    load()
  }, [hasMore, load])

  return { people, hasMore, loading, loadMore }
}
