import { StickerCard } from './StickerCard'
import type { Section } from '@/data/albums/types'
import { passes, type Filter } from '@/lib/album/filter'

export type { Filter }

export interface StickerGridProps {
  section: Section
  names: Record<string, string>
  countOf: (code: string) => number
  insertOn: boolean
  filter: Filter
  onAdd: (code: string) => void
  onRemove: (code: string) => void
  onInfo: (code: string) => void
}

export function StickerGrid({ section, names, countOf, insertOn, filter, onAdd, onRemove, onInfo }: StickerGridProps) {
  const codes = section.codes.filter((c) => passes(filter, countOf(c)))
  // Serie C: nessun nome sulle carte (solo numero).
  const showNames = section.id !== 'serie-c'
  if (codes.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Nessuna figurina in questo filtro.</p>
  }
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-[repeat(auto-fill,minmax(7rem,1fr))]">
      {codes.map((code) => (
        <StickerCard
          key={code}
          code={code}
          name={showNames ? names[code] : undefined}
          c1={section.c1}
          c2={section.c2}
          count={countOf(code)}
          insertOn={insertOn}
          onAdd={() => onAdd(code)}
          onRemove={() => onRemove(code)}
          onInfo={() => onInfo(code)}
        />
      ))}
    </div>
  )
}
