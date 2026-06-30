import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { loadAlbumData } from '@/data/albums'
import { subscribeAlbum } from '@/lib/db/albums'
import { allCodesFromSections } from '@/lib/trade/albumCodes'
import { deriveInventory } from '@/lib/trade/match'
import { publishIndex, removeIndex } from '@/lib/db/tradeIndex'

function tradeMetaRef(uid: string) {
  return doc(db, 'users', uid, 'meta', 'trade')
}

// Sottoscrive gli album resi scambiabili dall'utente.
export function subscribeTradeAlbums(uid: string, cb: (ids: string[]) => void): () => void {
  return onSnapshot(
    tradeMetaRef(uid),
    (snap) => cb((snap.exists() ? (snap.data().tradeAlbums as string[]) : []) ?? []),
    (err) => {
      console.error('trade albums', err)
      cb([])
    },
  )
}

// Attiva/disattiva uno scambio per un album e sincronizza l'indice una tantum.
export async function setTradeAlbum(
  uid: string,
  albumId: string,
  enabled: boolean,
  current: string[],
  citta: string,
): Promise<void> {
  const next = enabled
    ? Array.from(new Set([...current, albumId]))
    : current.filter((a) => a !== albumId)
  await setDoc(tradeMetaRef(uid), { tradeAlbums: next }, { merge: true })
  if (enabled) {
    await syncIndexForAlbum(uid, albumId, citta)
  } else {
    await removeIndex(albumId, uid)
  }
}

// Ricalcola e pubblica l'indice per un album leggendo l'album doc una volta.
export async function syncIndexForAlbum(uid: string, albumId: string, citta: string): Promise<void> {
  const data = await loadAlbumData(albumId)
  if (!data) return
  const allCodes = allCodesFromSections(data)
  await new Promise<void>((resolve) => {
    const unsub = subscribeAlbum(uid, albumId, async (d) => {
      unsub()
      const inv = deriveInventory(allCodes, d.states)
      await publishIndex(albumId, uid, inv, citta)
      resolve()
    })
  })
}
