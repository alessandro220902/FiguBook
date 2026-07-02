// src/components/home/StatTicker.tsx
import { Link } from 'react-router-dom'
import type { AlbumStats } from '@/lib/db/albums'
import type { StatDeltas } from '@/lib/stats/computeDeltas'
import { AnimatedNumber } from './AnimatedNumber'
import { HeroRing } from './HeroRing'

const TILE =
  'rounded-2xl border border-white/[0.08] bg-surface px-4 py-3.5 transition duration-200 hover:border-white/20 active:scale-[0.98]'
const LABEL = 'flex items-center gap-1.5 text-xs font-medium text-ink md:text-sm'
const NUM = 'mt-1.5 block font-display text-3xl font-semibold tabular-nums tracking-tight text-ink md:text-4xl'

function Dot({ color }: { color: string }) {
  return <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
}

// Delta settimanale: verde se coerente col "meglio" (doppie ↑ buono, mancanti ↓ buono).
function DeltaRow({ value, kind }: { value: number | null; kind: 'up-good' | 'down-good' }) {
  if (value == null || value === 0) return null
  const up = value > 0
  const arrow = up ? '↑' : '↓'
  const good = kind === 'up-good' ? up : !up
  const color = good ? 'var(--color-lime)' : '#ff7a7a'
  return (
    <span className="mt-2 block text-xs font-semibold" style={{ color }}>
      {arrow} {up ? '+' : ''}{value}
    </span>
  )
}

export function StatTicker({
  totals,
  albumsCount,
  trades,
  deltas,
  ringColor,
}: {
  totals: AlbumStats
  albumsCount: number
  trades: number
  deltas: StatDeltas
  ringColor: string
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <HeroRing
        pct={totals.pct}
        have={totals.have}
        total={totals.total}
        delta={deltas.haveDelta}
        color={ringColor}
      />

      <Link to="/scambi" className={`group ${TILE}`}>
        <div className={`${LABEL} justify-between`}>
          <span className="flex items-center gap-1.5">
            <Dot color="var(--color-lime)" /> Doppie
          </span>
          <span className="text-lime transition-transform group-hover:translate-x-0.5">→</span>
        </div>
        <AnimatedNumber value={totals.doubles} className={NUM} />
        <DeltaRow value={deltas.doublesDelta} kind="up-good" />
      </Link>

      <div className={TILE}>
        <div className={LABEL}>
          <Dot color="var(--color-stat-missing)" /> Mancanti
        </div>
        <AnimatedNumber value={totals.missing} className={NUM} />
        <DeltaRow value={deltas.missingDelta} kind="down-good" />
      </div>

      <div className={TILE}>
        <div className={LABEL}>
          <Dot color="var(--color-ink-2)" /> Album
        </div>
        <AnimatedNumber value={albumsCount} className={NUM} />
      </div>

      <div className={TILE}>
        <div className={LABEL}>
          <Dot color="var(--color-lime)" /> Scambi completati
        </div>
        <AnimatedNumber value={trades} className={NUM} />
      </div>
    </div>
  )
}
