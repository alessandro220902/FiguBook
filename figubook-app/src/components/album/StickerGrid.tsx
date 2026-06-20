import { StickerCard } from './StickerCard'
import type { Section } from '@/data/albums/types'

export type Filter = 'all' | 'missing' | 'double' | 'have'

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

function passes(filter: Filter, count: number): boolean {
  if (filter === 'all') return true
  if (filter === 'have') return count >= 1
  if (filter === 'missing') return count === 0
  if (filter === 'double') return count >= 2
  return true
}

export function StickerGrid({ section, names, countOf, insertOn, filter, onAdd, onRemove, onInfo }: StickerGridProps) {
  const codes = section.codes.filter((c) => passes(filter, countOf(c)))
  if (codes.length === 0) {
    return <p className="py-12 text-center text-sm text-muted">Nessuna figurina in questo filtro.</p>
  }
  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-7 lg:grid-cols-8">
      {codes.map((code) => (
        <StickerCard
          key={code}
          code={code}
          name={names[code]}
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
