export interface TradeFilters {
  reciprocal: boolean
  nearMe: boolean
}

interface Props {
  filters: TradeFilters
  onChange: (f: TradeFilters) => void
}

const base =
  'rounded-full px-3 py-1 text-sm border transition select-none cursor-pointer'

export function FilterChips({ filters, onChange }: Props) {
  // chip attiva = accento lime brand; inattiva = bordo neutro
  const chip = (active: boolean) =>
    active
      ? `${base} border-lime bg-lime/15 text-lime`
      : `${base} border-white/15 text-muted-foreground hover:border-white/30`
  return (
    <div className="flex flex-wrap gap-2">
      <button
        className={chip(filters.reciprocal)}
        onClick={() => onChange({ ...filters, reciprocal: !filters.reciprocal })}
      >
        Reciproci
      </button>
      <button
        className={chip(filters.nearMe)}
        onClick={() => onChange({ ...filters, nearMe: !filters.nearMe })}
      >
        Vicino a me
      </button>
    </div>
  )
}
