// figubook-app/src/components/album/AlbumToolbar.tsx
import type { Filter } from './StickerGrid'
import type { SectionStats } from '@/lib/album/stats'

export interface AlbumToolbarProps {
  filter: Filter
  onFilter: (f: Filter) => void
  insertOn: boolean
  onToggleInsert: () => void
  stats: SectionStats
}

const TABS: { key: Filter; label: string; n: (s: SectionStats) => number }[] = [
  { key: 'all', label: 'Tutte', n: (s) => s.total },
  { key: 'missing', label: 'Mancanti', n: (s) => s.missing },
  { key: 'double', label: 'Doppie', n: (s) => s.doubles },
  { key: 'have', label: 'Possedute', n: (s) => s.have },
]

export function AlbumToolbar({ filter, onFilter, insertOn, onToggleInsert, stats }: AlbumToolbarProps) {
  return (
    <div className="py-4">
      {/* Toggle centrato e prominente: è l'azione che velocizza tutto */}
      <div className="mb-3 flex justify-center">
        <button type="button" onClick={onToggleInsert} aria-pressed={insertOn}
          className={[
            'rounded-full border px-6 py-2.5 text-sm font-semibold transition',
            insertOn ? 'border-lime bg-lime text-lime-ink shadow-[0_0_20px_rgba(194,242,61,0.35)]' : 'border-white/10 bg-surface text-ink hover:border-lime/40',
          ].join(' ')}>
          Inserimento rapido {insertOn ? 'ON' : 'OFF'}
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => onFilter(t.key)}
            className={[
              'rounded-full border px-4 py-1.5 text-sm transition',
              filter === t.key ? 'border-ink bg-ink text-bg' : 'border-white/10 bg-surface text-muted-foreground hover:text-ink',
            ].join(' ')}>
            {t.label} <span className="opacity-60">{t.n(stats)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
