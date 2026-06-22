import { loadAlbumData } from '@/data/albums'
import { subscribeAlbum } from '@/lib/db/albums'
import { counterOf } from '@/lib/album/stats'

export type ShareKind = 'doubles' | 'missing'
export type ShareResult = 'shared' | 'copied' | 'cancelled'

const LABEL: Record<ShareKind, string> = { doubles: 'Doppie', missing: 'Mancanti' }

// Condivide la lista codici: Web Share API (mobile) con fallback copia-appunti.
export async function shareList(title: string, kind: ShareKind, codes: string[]): Promise<ShareResult> {
  const label = LABEL[kind]
  const text = `${title} — ${label} (${codes.length}):\n${codes.join(', ')}`
  try {
    if (typeof navigator.share === 'function') {
      await navigator.share({ title: `FiguBook · ${label}`, text })
      return 'shared'
    }
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'cancelled'
  }
}

// Snapshot one-shot dei conteggi salvati di un album (sottoscrive e si stacca subito).
function albumSnapshotOnce(uid: string, albumId: string): Promise<{ states: Record<string, string>; counts: Record<string, number> }> {
  return new Promise((resolve) => {
    const unsub = subscribeAlbum(uid, albumId, (snap) => {
      resolve(snap)
      // microtask: l'unsub potrebbe non essere ancora assegnato al primo giro sincrono
      queueMicrotask(() => unsub())
    })
  })
}

// Calcola i codici mancanti (count 0) e doppi (count >= 2) di un album, caricando
// dataset + conteggi salvati. Usato dalla lista album dove i codici non sono in memoria.
export async function fetchShareCodes(uid: string, albumId: string): Promise<{ missingCodes: string[]; doubleCodes: string[] } | null> {
  const [data, snap] = await Promise.all([loadAlbumData(albumId), albumSnapshotOnce(uid, albumId)])
  if (!data) return null
  const allCodes = data.sections.flatMap((s) => s.codes)
  const missingCodes = allCodes.filter((c) => counterOf(c, snap.states, snap.counts) === 0)
  const doubleCodes = allCodes.filter((c) => counterOf(c, snap.states, snap.counts) >= 2)
  return { missingCodes, doubleCodes }
}
