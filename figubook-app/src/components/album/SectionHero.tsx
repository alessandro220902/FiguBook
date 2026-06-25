// figubook-app/src/components/album/SectionHero.tsx
import type { Section } from '@/data/albums/types'
import { sectionGradient } from '@/lib/album/color'
import type { SectionStats } from '@/lib/album/stats'
import type { Filter } from './StickerGrid'
import { ctrlFilter } from '@/lib/album/controlStyles'

// Tre filtri principali in riga; "Possedute" va sotto accanto al toggle inserimento.
const TABS: { key: Filter; label: string; n: (s: SectionStats) => number }[] = [
  { key: 'all', label: 'Tutte', n: (s) => s.total },
  { key: 'missing', label: 'Mancanti', n: (s) => s.missing },
  { key: 'double', label: 'Doppie', n: (s) => s.doubles },
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

// Anello percentuale: track scuro + arco lime, numero al centro.
function ProgressRing({ pct }: { pct: number }) {
  const r = 26
  const c = 2 * Math.PI * r
  const offset = c * (1 - pct / 100)
  return (
    <div className="relative shrink-0" style={{ width: 64, height: 64 }}>
      <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="6" />
        <circle
          cx="32" cy="32" r={r} fill="none" strokeWidth="6"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          className="stroke-lime transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-base font-bold tabular-nums text-white">
        {pct}%
      </span>
    </div>
  )
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={`${ctrlFilter(active)} flex-1 whitespace-nowrap md:text-base`}>
      {children}
    </button>
  )
}

export function SectionHero({ section, stats, filter, onFilter, insertOn, onToggleInsert }: SectionHeroProps) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-white/10 p-4 sm:p-6" style={{ backgroundImage: sectionGradient(section.c1, section.c2) }}>
      {/* Scrim scuro: contrasto del testo bianco anche su sezioni chiare (gold, azzurro). */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(0,0,0,0.62)_0%,rgba(0,0,0,0.42)_55%,rgba(0,0,0,0.30)_100%)]" />
      <div className="relative z-10">
        {/* Titolo + anello percentuale */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-bold tracking-tight text-white drop-shadow-sm sm:text-4xl">{section.name}</h1>
            <p className="mt-1 text-sm text-white/85">{section.codes[0]} – {section.codes[section.codes.length - 1]} · {section.codes.length} figurine</p>
          </div>
          <ProgressRing pct={stats.pct} />
        </div>

        {/* Filtri: Tutte / Mancanti / Doppie sulla stessa riga */}
        <div className="mt-4 flex gap-2">
          {TABS.map((t) => (
            <FilterButton key={t.key} active={filter === t.key} onClick={() => onFilter(t.key)}>
              {t.label} <span className="opacity-70">{t.n(stats)}</span>
            </FilterButton>
          ))}
        </div>

        {/* Possedute + toggle inserimento rapido (stato = colore, niente ON/OFF) */}
        <div className="mt-2 flex gap-2">
          <FilterButton active={filter === 'have'} onClick={() => onFilter('have')}>
            Possedute <span className="opacity-70">{stats.have}</span>
          </FilterButton>
          <button type="button" onClick={onToggleInsert} aria-pressed={insertOn}
            className={`${ctrlFilter(insertOn)} flex-1 whitespace-nowrap md:text-base`}>
            Inserimento rapido
          </button>
        </div>
      </div>
    </header>
  )
}
