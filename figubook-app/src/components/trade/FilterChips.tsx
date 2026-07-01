import { MapPin, Star } from 'lucide-react'

// La reciprocità è SEMPRE richiesta (uno scambio ha senso solo se entrambi hanno
// almeno una carta per l'altro): non è un filtro opzionale.
export interface TradeFilters {
  nearMe: boolean
  minStars: boolean
}

interface Props {
  filters: TradeFilters
  onChange: (f: TradeFilters) => void
}

const base =
  'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors select-none cursor-pointer active:scale-95'

export function FilterChips({ filters, onChange }: Props) {
  // chip attiva = accento lime brand; inattiva = bordo neutro
  const chip = (active: boolean) =>
    active
      ? `${base} border border-lime bg-lime/15 text-lime`
      : `${base} border border-white/12 text-muted-foreground hover:border-white/30 hover:text-foreground`
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        aria-pressed={filters.nearMe}
        className={chip(filters.nearMe)}
        onClick={() => onChange({ ...filters, nearMe: !filters.nearMe })}
      >
        <MapPin className="h-3.5 w-3.5" />
        Vicino a me
      </button>
      <button
        type="button"
        aria-pressed={filters.minStars}
        className={chip(filters.minStars)}
        onClick={() => onChange({ ...filters, minStars: !filters.minStars })}
      >
        <Star className="h-3.5 w-3.5" />
        4+
      </button>
    </div>
  )
}
