import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { albumById } from '@/data/albumCatalog'
import { loadAlbumData } from '@/data/albums'
import type { Section } from '@/data/albums/types'
import { subscribeMyAlbumIds, subscribeAlbum } from '@/lib/db/albums'
import { aggregateTeamProgress, type AlbumForTeam, type TeamProgressResult } from '@/lib/album/teamProgress'

export interface TeamProgress extends TeamProgressResult {
  loading: boolean
}

export function useTeamProgress(canonicalId: string): TeamProgress {
  const { user } = useAuth()
  const [ids, setIds] = useState<string[]>([])
  const [idsLoaded, setIdsLoaded] = useState(false)
  const [sectionsMap, setSectionsMap] = useState<Record<string, Section[]>>({})
  const [dataMap, setDataMap] = useState<Record<string, { states: Record<string, string>; counts: Record<string, number> }>>({})

  useEffect(() => {
    if (!user) return
    let active = true
    const unsub = subscribeMyAlbumIds(
      user.uid,
      (next) => {
        if (active) {
          setIds(next.ids)
          setIdsLoaded(true)
        }
      },
      () => {},
    )
    return () => {
      active = false
      unsub()
      setIds([])
      setIdsLoaded(false)
      setSectionsMap({})
      setDataMap({})
    }
  }, [user])

  useEffect(() => {
    let active = true
    for (const id of ids) {
      if (sectionsMap[id]) continue
      loadAlbumData(id).then((d) => {
        if (active && d) setSectionsMap((m) => ({ ...m, [id]: d.sections }))
      })
    }
    return () => {
      active = false
    }
  }, [ids, sectionsMap])

  useEffect(() => {
    if (!user) return
    const unsubs = ids.map((id) =>
      subscribeAlbum(user.uid, id, ({ states, counts }) =>
        setDataMap((m) => ({ ...m, [id]: { states, counts } })),
      ),
    )
    return () => unsubs.forEach((u) => u())
  }, [user, ids])

  const albums: AlbumForTeam[] = ids
    .filter((id) => albumById[id] && sectionsMap[id] && dataMap[id])
    .map((id) => ({
      albumId: id,
      albumTitle: albumById[id].title,
      sections: sectionsMap[id],
      states: dataMap[id].states,
      counts: dataMap[id].counts,
    }))

  const result = aggregateTeamProgress(albums, canonicalId)
  const loading = !!user && (!idsLoaded || ids.some((id) => albumById[id] && (!sectionsMap[id] || !dataMap[id])))
  return { ...result, loading }
}
