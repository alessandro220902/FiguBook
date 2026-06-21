import { Modal, Dialog } from '@/components/ui/dialog'
import { ALBUM_CATALOG } from '@/data/albumCatalog'

export interface NewAlbumDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ownedIds: string[]
  onAdd: (id: string) => void
}

// Picker: catalogo MENO posseduti. Click su una riga = onAdd + chiude.
export function NewAlbumDialog({ open, onOpenChange, ownedIds, onAdd }: NewAlbumDialogProps) {
  const owned = new Set(ownedIds)
  const available = ALBUM_CATALOG.filter((a) => !owned.has(a.id))

  return (
    <Modal open={open} onOpenChange={(o) => onOpenChange(o)} size="md">
      <Dialog.Title className="text-lg font-semibold tracking-tight text-ink">Aggiungi un album</Dialog.Title>
      {available.length === 0 ? (
        <p className="mt-4 text-sm text-ink-2">Hai già tutti gli album disponibili.</p>
      ) : (
        <ul className="mt-4 max-h-[60vh] space-y-2 overflow-y-auto">
          {available.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => { onAdd(a.id); onOpenChange(false) }}
                className="flex w-full items-center gap-3 rounded-xl border border-white/10 p-3 text-left transition-transform duration-150 ease-out hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
              >
                <span aria-hidden className="h-10 w-10 shrink-0 rounded-lg" style={{ background: `linear-gradient(145deg, ${a.c1}, ${a.c2})` }} />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">{a.title}</span>
                  <span className="block font-mono text-[11px] uppercase tracking-wide text-ink-2">{a.editor} · {a.season} · {a.total} fig.</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
