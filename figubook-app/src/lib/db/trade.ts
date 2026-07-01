import { loadAlbumData } from '@/data/albums'
import { subscribeAlbum, subscribeMyAlbumIds } from '@/lib/db/albums'
import { allCodesFromSections } from '@/lib/trade/albumCodes'
import { deriveInventory } from '@/lib/trade/match'
import { publishIndex } from '@/lib/db/tradeIndex'

// Ricalcola e pubblica l'indice scambi per un album leggendo l'album doc una volta.
// Ogni album posseduto è scambiabile in automatico: non c'è opt-in.
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

// Ripubblica TUTTI i miei indici con la città aggiornata (chiamata al salvataggio
// del profilo). La città di scambio vive nel tradeIndex (leggibile da tutti i
// loggati, indipendente da profilo pubblico/privato) e va tenuta fresca.
export async function syncAllIndexesCitta(uid: string, citta: string): Promise<void> {
  const ids = await new Promise<string[]>((resolve) => {
    const unsub = subscribeMyAlbumIds(uid, (d) => { unsub(); resolve(d.ids ?? []) })
  })
  for (const albumId of ids) await syncIndexForAlbum(uid, albumId, citta)
}
