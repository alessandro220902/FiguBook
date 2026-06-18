import { albumById, type AlbumCatalogEntry } from '@/data/albumCatalog'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

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
  // Clamp: dati storici corrotti (have > total) non producono mancanti negativi / pct > 100.
  const missing = Math.max(0, total - have)
  const pct = total > 0 ? Math.min(100, Math.round((have / total) * 100)) : 0
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

// onSnapshot live su users/{uid}/albums/_my-albums -> ids[]. Errore => [].
export function subscribeMyAlbumIds(
  uid: string,
  cb: (ids: string[]) => void,
): () => void {
  const ref = doc(db, 'users', uid, 'albums', '_my-albums')
  return onSnapshot(
    ref,
    (snap) => cb(snap.exists() ? ((snap.data().ids as string[]) ?? []) : []),
    (err) => {
      console.error('album ids', err)
      cb([])
    },
  )
}

// onSnapshot live sul doc album -> { states, counts }. Errore => vuoto.
export function subscribeAlbum(
  uid: string,
  albumId: string,
  cb: (d: AlbumDoc) => void,
): () => void {
  const ref = doc(db, 'users', uid, 'albums', albumId)
  return onSnapshot(
    ref,
    (snap) => {
      const data = snap.exists() ? snap.data() : {}
      cb({
        states: (data.states as Record<string, string>) ?? {},
        counts: (data.counts as Record<string, number>) ?? {},
      })
    },
    (err) => {
      console.error('album', albumId, err)
      cb({ states: {}, counts: {} })
    },
  )
}
