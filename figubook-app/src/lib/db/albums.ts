import { albumById, type AlbumCatalogEntry } from '@/data/albumCatalog'

export interface AlbumStats {
  have: number
  doubles: number
  missing: number
  total: number
  pct: number
}

export interface AlbumDoc {
  states: Record<string, string>
  counts: Record<string, number>
}

export type PerAlbumStats = AlbumStats & { id: string; entry: AlbumCatalogEntry }

// Logica portata fedele da figubook-db.js:220 (getAlbumStats).
// Totale dal catalogo tipato (fix B13: niente window.STICKER_STATES/FB_STORAGE_KEY).
export function computeStats(
  albumId: string,
  states: Record<string, string>,
  counts: Record<string, number>,
): AlbumStats {
  let have = 0
  let doubles = 0
  for (const code of Object.keys(states)) {
    const s = states[code]
    if (s === 'have' || s === 'double') {
      have++
      if (s === 'double') doubles += (counts[code] || 2) - 1
    }
  }
  const total = albumById[albumId] ? albumById[albumId].total : Object.keys(states).length
  const missing = total - have
  const pct = total > 0 ? Math.round((have / total) * 100) : 0
  return { have, doubles, missing, total, pct }
}

export function aggregate(list: AlbumStats[]): AlbumStats {
  const have = list.reduce((n, s) => n + s.have, 0)
  const doubles = list.reduce((n, s) => n + s.doubles, 0)
  const missing = list.reduce((n, s) => n + s.missing, 0)
  const total = list.reduce((n, s) => n + s.total, 0)
  const pct = total > 0 ? Math.round((have / total) * 100) : 0
  return { have, doubles, missing, total, pct }
}
