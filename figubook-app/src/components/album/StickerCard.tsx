import { Plus, Minus } from 'lucide-react'
import { sectionGradient } from '@/lib/album/color'

export interface StickerCardProps {
  code: string
  name?: string
  c1: string
  c2: string
  count: number
  insertOn: boolean
  onAdd: () => void
  onRemove: () => void
  onInfo: () => void
}

export function StickerCard({ code, name, c1, c2, count, insertOn, onAdd, onRemove, onInfo }: StickerCardProps) {
  const owned = count >= 1
  const doubles = Math.max(0, count - 1)

  const handleClick = () => (insertOn ? onAdd() : onInfo())

  return (
    <div className="group relative aspect-[5/6]">
      <button
        type="button"
        onClick={handleClick}
        aria-label={`${code}${name ? ' ' + name : ''}${owned ? ', posseduta' : ', mancante'}`}
        className={[
          'absolute inset-0 flex items-center justify-center rounded-xl border transition',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime',
          owned
            ? 'border-white/15 text-white shadow-sm hover:-translate-y-0.5 hover:shadow-lg'
            : 'border-dashed border-white/10 bg-surface text-muted-foreground hover:-translate-y-0.5',
        ].join(' ')}
        style={owned ? { backgroundImage: sectionGradient(c1, c2) } : undefined}
      >
        {owned && <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />}
        <span className="relative z-10 font-display text-xl font-bold tracking-wide drop-shadow">{code}</span>
        {name && owned && (
          <span className="absolute inset-x-0 bottom-0 z-10 translate-y-full bg-gradient-to-t from-black/60 to-transparent px-2 py-1 text-center text-[10px] font-semibold text-white transition group-hover:translate-y-0">
            {name}
          </span>
        )}
      </button>

      {owned && (
        <span data-testid="owned-badge" className="pointer-events-none absolute left-1.5 top-1.5 z-20 flex h-[18px] min-w-[18px] items-center justify-center rounded-md bg-stat-have px-1 text-[10px] font-bold text-lime-ink">1</span>
      )}
      {doubles > 0 && (
        <span data-testid="dup-badge" className="pointer-events-none absolute right-1.5 top-1.5 z-20 rounded-md bg-gold px-1.5 text-[10px] font-bold text-[#1a1205]">×{doubles}</span>
      )}

      {/* + mancante: solo hover/focus */}
      {!owned && (
        <button type="button" onClick={(e) => { e.stopPropagation(); onAdd() }} aria-label={`Aggiungi ${code}`}
          className="absolute bottom-2 left-1/2 z-20 flex h-7 w-7 -translate-x-1/2 translate-y-1.5 items-center justify-center rounded-full bg-stat-have text-lime-ink opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100">
          <Plus size={16} />
        </button>
      )}
      {/* meno: posseduta */}
      {owned && (
        <button type="button" onClick={(e) => { e.stopPropagation(); onRemove() }} aria-label={`Rimuovi una copia di ${code}`}
          className="absolute inset-x-0 bottom-0 z-20 flex h-6 items-center justify-center rounded-b-xl bg-black/30 text-white/90 opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100">
          <Minus size={14} />
        </button>
      )}
    </div>
  )
}
