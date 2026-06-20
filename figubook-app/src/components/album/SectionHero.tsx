// figubook-app/src/components/album/SectionHero.tsx
import type { Section } from '@/data/albums/types'
import { sectionGradient } from '@/lib/album/color'
import type { SectionStats } from '@/lib/album/stats'
import type { Filter } from './StickerGrid'

const TABS: { key: Filter; label: string; n: (s: SectionStats) => number }[] = [
  { key: 'all', label: 'Tutte', n: (s) => s.total },
  { key: 'missing', label: 'Mancanti', n: (s) => s.missing },
  { key: 'double', label: 'Doppie', n: (s) => s.doubles },
  { key: 'have', label: 'Possedute', n: (s) => s.have },
]

export interface SectionHeroProps {
  section: Section
  index: number
  stats: SectionStats
  filter: Filter
  onFilter: (f: Filter) => void
  insertOn: boolean
  onToggleInsert: () => void
}

export function SectionHero({ section, index, stats, filter, onFilter, insertOn, onToggleInsert }: SectionHeroProps) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-white/10 p-6" style={{ backgroundImage: sectionGradient(section.c1, section.c2) }}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_100%_0,rgba(255,255,255,0.16),transparent_50%)]" />
      <div className="relative z-10">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-white/70">
          Sezione {String(index + 1).padStart(2, '0')} · {section.group}
        </div>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-white">{section.name}</h1>
        <p className="mt-1 text-sm text-white/80">{section.codes[0]} – {section.codes[section.codes.length - 1]} · {section.codes.length} figurine</p>

        {/* Filtri + toggle inserimento rapido, dentro il banner (niente toolbar separata) */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {TABS.map((t) => {
            const active = filter === t.key
            return (
              <button key={t.key} type="button" onClick={() => onFilter(t.key)}
                className={[
                  'rounded-full px-3.5 py-1.5 text-sm font-semibold transition',
                  active ? 'bg-white text-black shadow' : 'border border-white/30 bg-black/45 text-white hover:bg-black/60',
                ].join(' ')}>
                {t.label} <span className="opacity-70">{t.n(stats)}</span>
              </button>
            )
          })}
          <button type="button" onClick={onToggleInsert} aria-pressed={insertOn}
            className={[
              'ml-auto rounded-full px-5 py-1.5 text-sm font-semibold transition',
              insertOn ? 'bg-lime text-lime-ink shadow-[0_0_18px_rgba(194,242,61,0.45)]' : 'border border-white/30 bg-black/45 text-white hover:bg-black/60',
            ].join(' ')}>
            Inserimento rapido {insertOn ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className="absolute right-6 top-6 z-10 text-right">
        <div className="text-[10px] uppercase tracking-widest text-white/70">Completamento</div>
        <div className="font-display text-4xl font-bold leading-none text-white">{stats.pct}%</div>
        <div className="mt-2 h-1.5 w-48 overflow-hidden rounded bg-black/30">
          <div className="h-full rounded bg-lime transition-[width] duration-500" style={{ width: `${stats.pct}%` }} />
        </div>
      </div>
    </header>
  )
}
