import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { albumById } from '@/data/albumCatalog'
import {
  subscribeMyAlbumIds,
  subscribeAlbum,
  computeStats,
  aggregate,
  type AlbumStats,
  type PerAlbumStats,
} from '@/lib/db/albums'

const EMPTY: AlbumStats = { have: 0, doubles: 0, missing: 0, total: 0, pct: 0 }

export function useCollection(): {
  albums: PerAlbumStats[]
  totals: AlbumStats
  loading: boolean
} {
  const { user } = useAuth()
  const [ids, setIds] = useState<string[]>([])
  const [idsLoaded, setIdsLoaded] = useState(false)
  const [statsMap, setStatsMap] = useState<Record<string, AlbumStats>>({})

  // Lista album dell'utente (live).
  useEffect(() => {
    if (!user) return
    let active = true
    const unsub = subscribeMyAlbumIds(user.uid, (next) => {
      if (active) {
        setIds(next)
        setIdsLoaded(true)
      }
    })
    return () => {
      active = false
      unsub()
      setIds([])
      setIdsLoaded(false)
      setStatsMap({})
    }
  }, [user])

  // Un listener per album; cleanup su cambio lista/unmount (nessun orfano).
  useEffect(() => {
    if (!user) return
    const unsubs = ids.map((id) =>
      subscribeAlbum(user.uid, id, ({ states, counts }) =>
        setStatsMap((m) => ({ ...m, [id]: computeStats(id, states, counts) })),
      ),
    )
    return () => unsubs.forEach((u) => u())
  }, [user, ids])

  const albums: PerAlbumStats[] = ids
    .filter((id) => albumById[id])
    .map((id) => ({ id, entry: albumById[id], ...(statsMap[id] ?? EMPTY) }))

  const totals = aggregate(albums)
  const loading = !!user && (!idsLoaded || ids.some((id) => albumById[id] && !statsMap[id]))

  return { albums, totals, loading }
}
