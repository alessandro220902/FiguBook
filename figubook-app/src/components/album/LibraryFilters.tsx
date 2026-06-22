import { Plus } from 'lucide-react'
import { LIBRARY_FILTERS, type LibraryFilter } from '@/lib/album/libraryFilters'

export interface LibraryFiltersProps {
  active: LibraryFilter
  counts: Record<LibraryFilter, number>
  onChange: (f: LibraryFilter) => void
  onNew: () => void
}

// Barra filtri: pills sempre su una riga (scroll-x su mobile), "Nuovo album"
// sotto su mobile e a destra da sm in su. Min touch target 44px.
export function LibraryFilters({ active, counts, onChange, onNew }: LibraryFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
      {/* Filtri: una riga sola. Su mobile scrollano in orizzontale (no wrap)
          invece di andare a capo; scrollbar nascosta. */}
      <div className="-mx-1 flex flex-1 items-center gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {LIBRARY_FILTERS.map(({ key, label }) => {
          const on = key === active
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-pressed={on}
              className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime ${
                on ? 'bg-bg-elev text-ink' : 'border border-white/10 text-ink-2 hover:text-ink'
              }`}
            >
              {label}
              <span className={`tabular-nums text-xs ${on ? 'rounded-full bg-lime px-1.5 text-lime-ink' : 'text-ink-2/70'}`}>{counts[key]}</span>
            </button>
          )
        })}
      </div>
      <button
        type="button"
        onClick={onNew}
        className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-full border border-lime/60 bg-lime/10 px-4 text-sm font-semibold text-lime transition-colors duration-150 ease-out hover:bg-lime/20 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
      >
        <Plus className="h-4 w-4" aria-hidden /> Nuovo album
      </button>
    </div>
  )
}
