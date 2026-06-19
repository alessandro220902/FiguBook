import { Link } from 'react-router-dom'
import type { AlbumStats } from '@/lib/db/albums'
import { AnimatedNumber } from './AnimatedNumber'
import { CompletionRing } from './CompletionRing'

const TILE =
  'rounded-2xl border border-white/[0.08] bg-surface px-5 py-4 transition-all duration-200 hover:-translate-y-1 hover:border-white/20'
const LABEL = 'flex items-center gap-1.5 text-xs font-medium text-ink-2'
const NUM = 'mt-2 block text-3xl font-medium tabular-nums tracking-tight text-ink sm:text-4xl'

function Dot({ color }: { color: string }) {
  return <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
}

// 5 statistiche: Possedute (su totale + %), Doppie, Mancanti, Album, Scambi (link).
export function StatTicker({
  totals,
  albumsCount,
  trades,
}: {
  totals: AlbumStats
  albumsCount: number
  trades: number
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <div className={`${TILE} col-span-2 sm:col-span-1`}>
        <div className={LABEL}>
          <Dot color="var(--color-stat-have)" /> Possedute
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-1.5">
            <AnimatedNumber
              value={totals.have}
              className="text-3xl font-medium tabular-nums tracking-tight text-ink sm:text-4xl"
            />
            <span className="text-sm tabular-nums text-ink-2">
              / {totals.total.toLocaleString('it-IT')}
            </span>
          </div>
          <div className="shrink-0">
            <CompletionRing pct={totals.pct} size={60} />
          </div>
        </div>
      </div>

      <div className={TILE}>
        <div className={LABEL}>
          <Dot color="var(--color-lime)" /> Doppie
        </div>
        <AnimatedNumber value={totals.doubles} className={NUM} />
      </div>

      <div className={TILE}>
        <div className={LABEL}>
          <Dot color="var(--color-stat-missing)" /> Mancanti
        </div>
        <AnimatedNumber value={totals.missing} className={NUM} />
      </div>

      <div className={TILE}>
        <div className={LABEL}>
          <Dot color="var(--color-ink-2)" /> Album
        </div>
        <AnimatedNumber value={albumsCount} className={NUM} />
      </div>

      <Link to="/scambi" className={`group ${TILE}`}>
        <div className={`${LABEL} justify-between`}>
          <span className="flex items-center gap-1.5">
            <Dot color="var(--color-lime)" /> Scambi
          </span>
          <span className="text-lime opacity-0 transition-opacity group-hover:opacity-100">→</span>
        </div>
        <AnimatedNumber value={trades} className={NUM} />
      </Link>
    </div>
  )
}
