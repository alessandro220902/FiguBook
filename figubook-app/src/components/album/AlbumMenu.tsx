import { useEffect, useState } from 'react'
import { MoreVertical, Archive, ArchiveRestore, Trash2, ArrowLeftRight } from 'lucide-react'
import { MenuRoot, MenuTrigger, MenuContent, MenuItem } from '@/components/ui/menu'
import { ConfirmActionDialog } from './ConfirmActionDialog'
import { requireUid } from '@/lib/firebase'
import { subscribeTradeAlbums, setTradeAlbum } from '@/lib/db/trade'
import { getPublicByUid } from '@/lib/db/publicProfiles'

export interface AlbumMenuProps {
  albumId: string
  title: string
  archived: boolean
  onArchive: () => void
  onUnarchive: () => void
  onDelete: () => void
}

// Menu azioni per-card. Archivia = immediato (reversibile). Ripristina/Elimina
// passano dal dialog di conferma. Trigger fuori dal <Link> della tile.
export function AlbumMenu({ albumId, title, archived, onArchive, onUnarchive, onDelete }: AlbumMenuProps) {
  const [confirm, setConfirm] = useState<null | 'delete' | 'restore'>(null)

  // Stato scambi live: gli album resi scambiabili dall'utente.
  const uid = requireUid()
  const [tradeAlbums, setTradeAlbums] = useState<string[]>([])
  useEffect(() => subscribeTradeAlbums(uid, setTradeAlbums), [uid])
  const tradeEnabled = tradeAlbums.includes(albumId)

  // Opt-in scambi: scrive meta/trade.tradeAlbums e (dis)pubblica l'indice.
  async function toggleTrade() {
    const p = await getPublicByUid(uid)
    await setTradeAlbum(uid, albumId, !tradeEnabled, tradeAlbums, p?.citta ?? '')
  }

  return (
    <>
      <MenuRoot>
        <MenuTrigger aria-label="Azioni album">
          <MoreVertical className="h-5 w-5" aria-hidden />
        </MenuTrigger>
        <MenuContent>
          <MenuItem onClick={toggleTrade}>
            <ArrowLeftRight className="h-4 w-4" aria-hidden />{' '}
            {tradeEnabled ? 'Disattiva scambi' : 'Rendi scambiabile'}
          </MenuItem>
          {archived ? (
            <MenuItem onClick={() => setConfirm('restore')}>
              <ArchiveRestore className="h-4 w-4" aria-hidden /> Ripristina
            </MenuItem>
          ) : (
            <MenuItem onClick={onArchive}>
              <Archive className="h-4 w-4" aria-hidden /> Archivia
            </MenuItem>
          )}
          <MenuItem destructive onClick={() => setConfirm('delete')}>
            <Trash2 className="h-4 w-4" aria-hidden /> Elimina
          </MenuItem>
        </MenuContent>
      </MenuRoot>

      <ConfirmActionDialog
        open={confirm === 'delete'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`Eliminare «${title}»?`}
        body="Verranno cancellati per sempre tutti i dati di questo album: figurine possedute, doppie e progresso. L'operazione non è reversibile — se in futuro lo riaggiungi, riparti da zero."
        confirmLabel="Elimina"
        destructive
        onConfirm={() => { onDelete(); setConfirm(null) }}
      />
      <ConfirmActionDialog
        open={confirm === 'restore'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`Ripristinare «${title}»?`}
        body="L'album torna tra quelli attivi e ricompare nei filtri In corso/Completati. Nessun dato è andato perso durante l'archiviazione: ritrovi progresso e doppie esattamente com'erano."
        confirmLabel="Ripristina"
        onConfirm={() => { onUnarchive(); setConfirm(null) }}
      />
    </>
  )
}
