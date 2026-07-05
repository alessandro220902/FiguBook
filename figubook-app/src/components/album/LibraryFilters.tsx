import { LIBRARY_FILTERS, type LibraryFilter } from '@/lib/album/libraryFilters'
import { ctrlFilter, CTRL_BADGE_ON, CTRL_BADGE_OFF } from '@/lib/album/controlStyles'
import { CreateAlbumMenu } from './CreateAlbumMenu'

export interface LibraryFiltersProps {
  active: LibraryFilter
  counts: Record<LibraryFilter, number>
  onChange: (f: LibraryFilter) => void
  ownedIds: string[]
  onAdd: (id: string) => void
}

// Barra filtri: pills sempre su una riga (scroll-x su mobile), "Nuovo album"
// sotto su mobile e a destra da sm in su. Min touch target 44px.
export function LibraryFilters({ active, counts, onChange, ownedIds, onAdd }: LibraryFiltersProps) {
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
              className={`shrink-0 ${ctrlFilter(on)}`}
            >
              {label}
              <span className={on ? CTRL_BADGE_ON : CTRL_BADGE_OFF}>{counts[key]}</span>
            </button>
          )
        })}
      </div>
      <CreateAlbumMenu ownedIds={ownedIds} onAdd={onAdd} />
    </div>
  )
}
