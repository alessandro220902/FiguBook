import { Plus, Minus, Check } from 'lucide-react'
import { sectionGradient, ownedInkIsDark } from '@/lib/album/color'

// Nome su due righe: nome sopra, cognome a capo. Le carte a doppia squadra
// ("Avellino / Bari") si spezzano su " / " (una squadra sopra, una sotto).
function nameLines(name: string): string[] {
  if (name.includes(' / ')) return name.split(' / ').map((s) => s.trim())
  const parts = name.trim().split(/\s+/)
  if (parts.length <= 1) return [name]
  return [parts[0], parts.slice(1).join(' ')]
}

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
  const darkInk = owned && ownedInkIsDark(c1, c2)

  const handleClick = () => (insertOn ? onAdd() : onInfo())

  const dupText = doubles > 0 ? (doubles === 1 ? ', 1 doppia' : `, ${doubles} doppie`) : ''

  return (
    <div className="group flex flex-col">
      {/* Tile del numero */}
      <div className="relative aspect-square">
        <button
          type="button"
          onClick={handleClick}
          aria-label={`${code}${name ? ' ' + name : ''}${owned ? ', posseduta' : ', mancante'}${dupText}`}
          className={[
            'absolute inset-0 flex flex-col items-center justify-center gap-0.5 rounded-xl border px-1.5 transition',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime',
            owned
              ? 'border-white/15 shadow-sm hover:-translate-y-0.5 hover:shadow-lg ' + (darkInk ? 'text-[#14110a]' : 'text-white')
              : 'border-dashed border-white/10 bg-surface text-muted-foreground hover:-translate-y-0.5',
          ].join(' ')}
          style={owned ? { backgroundImage: sectionGradient(c1, c2) } : undefined}
        >
          {owned && (
            <span
              className={
                'pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br to-transparent ' +
                (darkInk ? 'from-black/10' : 'from-white/20')
              }
            />
          )}
          <span className="relative z-10 font-display text-2xl font-bold tracking-wide drop-shadow md:text-3xl">{code}</span>
          {owned && name && (
            <span className="relative z-10 flex w-full flex-col items-center text-center leading-tight drop-shadow" title={name}>
              {nameLines(name).map((l, i) => (
                <span key={i} className="w-full truncate text-[13px] font-semibold md:text-[15px]">{l}</span>
              ))}
            </span>
          )}
        </button>

        {owned && (
          <span data-testid="owned-badge" aria-hidden className="pointer-events-none absolute left-1.5 top-1.5 z-20 flex h-[18px] w-[18px] items-center justify-center rounded-md bg-stat-have text-lime-ink"><Check size={12} strokeWidth={3} /></span>
        )}
        {doubles > 0 && (
          <span data-testid="dup-badge" aria-hidden className="pointer-events-none absolute right-1.5 top-1.5 z-20 rounded-md bg-gold px-1.5 text-[10px] font-bold text-lime-ink">×{doubles}</span>
        )}
      </div>

      {insertOn ? (
        // Inserimento rapido: tap sulla card = +1. Per rimuovere, striscia rossa col meno
        // (solo se posseduta). Niente stepper/numero: tutto veloce.
        owned ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            aria-label={`Rimuovi una copia di ${code}`}
            className="mt-1 flex h-11 w-full items-center justify-center rounded-md bg-stat-missing text-white transition hover:brightness-110"
          >
            <Minus size={16} />
          </button>
        ) : (
          <div className="mt-1 h-11" aria-hidden />
        )
      ) : (
        // Modalità lettura: stepper − N +
        <div className="mt-1 flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            disabled={count === 0}
            aria-label={`Rimuovi una copia di ${code}`}
            className="flex h-11 flex-1 items-center justify-center rounded-md border border-white/10 bg-surface text-ink transition hover:border-stat-missing/50 hover:text-stat-missing disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-ink"
          >
            <Minus size={16} />
          </button>
          <span className="type-stat min-w-6 text-center font-display text-base text-ink">{count}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAdd() }}
            aria-label={`Aggiungi ${code}`}
            className="flex h-11 flex-1 items-center justify-center rounded-md bg-stat-have text-lime-ink transition hover:brightness-110"
          >
            <Plus size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
