import { albumById, type AlbumCatalogEntry } from '@/data/albumCatalog'
import { doc, onSnapshot, setDoc, deleteDoc, deleteField, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { countToFields } from '@/lib/album/stats'

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

export interface MyAlbums {
  ids: string[]
  archived: string[]
  opened: string[]
}

// "Nuovo nella tua lista": in collezione ma non ancora aperto.
export function isNewInList(my: MyAlbums, id: string): boolean {
  return my.ids.includes(id) && !my.opened.includes(id)
}

// onSnapshot live su users/{uid}/albums/_my-albums -> { ids, archived }.
export function subscribeMyAlbumIds(
  uid: string,
  cb: (data: MyAlbums) => void,
  onError?: (err: unknown) => void,
): () => void {
  const ref = doc(db, 'users', uid, 'albums', '_my-albums')
  return onSnapshot(
    ref,
    (snap) => {
      const d = snap.exists() ? snap.data() : {}
      cb({
        ids: (d.ids as string[]) ?? [],
        archived: (d.archived as string[]) ?? [],
        opened: (d.opened as string[]) ?? [],
      })
    },
    (err) => {
      console.error('album ids', err)
      if (onError) onError(err)
      else cb({ ids: [], archived: [], opened: [] })
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

// Costruisce l'update Firestore da una mappa code->count (parte pura, testabile).
export function buildAlbumUpdate(deltas: Record<string, number>) {
  const states: Record<string, unknown> = {}
  const counts: Record<string, unknown> = {}
  for (const [code, count] of Object.entries(deltas)) {
    const f = countToFields(count)
    states[code] = f.state ?? deleteField()
    counts[code] = f.count ?? deleteField()
  }
  return { states, counts, ts: Date.now() }
}

// Hook opzionale chiamato dopo ogni flush riuscito (usato dal layer scambi per
// risincronizzare l'indice solo se l'album è opted-in). Disaccoppia albums<->trade.
type FlushHook = (uid: string, albumId: string) => void
let afterFlush: FlushHook | null = null
export function setAfterFlushHook(fn: FlushHook | null) { afterFlush = fn }

// Un solo setDoc merge con tutti i delta accumulati (fix B1: niente 1-write-per-tap).
// NB: non porta _syncInventory del vecchio sito (layer scambi, fuori scope A2.3).
export async function flushAlbumCounts(
  uid: string,
  albumId: string,
  deltas: Record<string, number>,
): Promise<void> {
  if (Object.keys(deltas).length === 0) return
  const ref = doc(db, 'users', uid, 'albums', albumId)
  await setDoc(ref, buildAlbumUpdate(deltas), { merge: true })
  if (afterFlush) afterFlush(uid, albumId)
}

const myAlbumsRef = (uid: string) => doc(db, 'users', uid, 'albums', '_my-albums')

// Aggiunge un album alla collezione (idempotente via arrayUnion).
export async function addAlbum(uid: string, id: string): Promise<void> {
  await setDoc(myAlbumsRef(uid), { ids: arrayUnion(id) }, { merge: true })
}

// Segna un album come "aperto almeno una volta" (idempotente via arrayUnion).
export async function markAlbumOpened(uid: string, id: string): Promise<void> {
  await setDoc(myAlbumsRef(uid), { opened: arrayUnion(id) }, { merge: true })
}

// Archivia: l'album resta in ids, entra in archived (escluso dai filtri non-archivio).
export async function archiveAlbum(uid: string, id: string): Promise<void> {
  await setDoc(myAlbumsRef(uid), { archived: arrayUnion(id) }, { merge: true })
}

export async function unarchiveAlbum(uid: string, id: string): Promise<void> {
  await setDoc(myAlbumsRef(uid), { archived: arrayRemove(id) }, { merge: true })
}

// Elimina IRREVERSIBILE: rimuove da lista (e archived) poi cancella il doc dati.
// Ordine: prima fuori dalla lista live, poi wipe; re-add riparte da doc vuoto.
export async function removeAlbum(uid: string, id: string): Promise<void> {
  await setDoc(myAlbumsRef(uid), { ids: arrayRemove(id), archived: arrayRemove(id) }, { merge: true })
  await deleteDoc(doc(db, 'users', uid, 'albums', id))
}
