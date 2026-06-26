import { useEffect, useRef } from 'react'
import { Plus, Minus, X } from 'lucide-react'
import { sectionGradient } from '@/lib/album/color'

export interface StickerInfoOverlayProps {
  open: boolean
  code: string
  name?: string
  sectionName: string
  c1: string
  c2: string
  count: number
  onAdd: () => void
  onRemove: () => void
  onClose: () => void
}

export function StickerInfoOverlay({ open, code, name, sectionName, c1, c2, count, onAdd, onRemove, onClose }: StickerInfoOverlayProps) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  if (!open) return null
  const doubles = Math.max(0, count - 1)

  return (
    <dialog ref={ref} onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose() }}
      className="m-auto w-[min(92vw,360px)] rounded-lg border border-white/10 bg-bg-elev p-0 text-ink backdrop:bg-black/60">
      <div className="relative h-40 w-full" style={{ backgroundImage: sectionGradient(c1, c2) }}>
        <button type="button" onClick={onClose} aria-label="Chiudi" className="absolute right-3 top-3 rounded-full bg-black/30 p-1.5 text-white">
          <X size={16} />
        </button>
        <span className="absolute bottom-3 left-4 font-display text-3xl font-bold text-white drop-shadow">{code}</span>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <div className="font-display text-lg font-semibold">{name ?? code}</div>
          <div className="text-xs text-muted-foreground">{sectionName} · {count === 0 ? 'mancante' : count === 1 ? 'posseduta' : `posseduta · ${doubles} doppie`}</div>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onRemove} disabled={count === 0} aria-label="Rimuovi una copia"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-surface text-ink disabled:opacity-40">
            <Minus size={16} />
          </button>
          <span className="min-w-8 text-center font-display text-xl font-bold">{count}</span>
          <button type="button" onClick={onAdd} aria-label="Aggiungi una copia"
            className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-lime font-semibold text-lime">
            <Plus size={16} /> Aggiungi
          </button>
        </div>
      </div>
    </dialog>
  )
}
