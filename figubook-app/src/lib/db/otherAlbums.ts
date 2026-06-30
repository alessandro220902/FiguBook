import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { AlbumDoc } from '@/lib/db/albums'

// Letture ONE-SHOT degli album di un ALTRO utente (sola vista, niente onSnapshot).
// Il gating reale e' nelle firestore.rules: se la lettura e' negata
// (profilo privato e non amico) le promise rigettano e qui torniamo vuoto/null.

// Lista album visibili dell'altro utente (esclusi gli archiviati).
export async function getOtherAlbumIds(uid: string): Promise<string[]> {
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'albums', '_my-albums'))
    if (!snap.exists()) return []
    const d = snap.data() as { ids?: string[]; archived?: string[] }
    const archived = new Set(d.archived ?? [])
    return (d.ids ?? []).filter((id) => !archived.has(id))
  } catch {
    return []
  }
}

// Conteggi salvati di un singolo album dell'altro utente.
export async function getOtherAlbum(uid: string, albumId: string): Promise<AlbumDoc | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'albums', albumId))
    if (!snap.exists()) return null
    const d = snap.data() as Partial<AlbumDoc>
    return { states: d.states ?? {}, counts: d.counts ?? {} }
  } catch {
    return null
  }
}
