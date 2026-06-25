import { Link } from 'react-router-dom'
import type { AlbumStats } from '@/lib/db/albums'
import { AnimatedNumber } from './AnimatedNumber'

const TILE =
  'rounded-2xl border border-white/[0.08] bg-surface px-4 py-3.5 transition duration-200 hover:border-white/20 active:scale-[0.98]'
// Label sempre bianche (no grigio), più grandi su PC/iPad.
const LABEL = 'flex items-center gap-1.5 text-xs font-medium text-ink md:text-sm'
const NUM = 'mt-1.5 block font-display text-3xl font-semibold tabular-nums tracking-tight text-ink md:text-4xl'

function Dot({ color }: { color: string }) {
  return <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
}

// Riga compatta. "Possedute" è la primaria, marcata con mezzi sottili (anello
// inline + tinta campo), non con la massa. Stessa altezza per tutte.
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
      {/* Primaria — Possedute: tinta pitch tenue + anello inline */}
      <div
        className="col-span-2 rounded-2xl border px-4 py-3.5 sm:col-span-1"
        style={{
          background: 'color-mix(in srgb, var(--color-pitch) 12%, var(--color-surface))',
          borderColor: 'color-mix(in srgb, var(--color-pitch) 28%, transparent)',
        }}
      >
        <div className={LABEL}>
          <Dot color="var(--color-stat-have)" /> Possedute
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <AnimatedNumber
            value={totals.have}
            className="font-display text-3xl font-semibold tabular-nums tracking-tight text-ink md:text-4xl"
          />
          <span className="font-display text-sm tabular-nums text-ink-2">
            / {totals.total.toLocaleString('it-IT')}
          </span>
        </div>
        {/* Niente anello: barra sottile con % a fine linea. */}
        <div className="mt-2.5 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-stat-have transition-[width] duration-500" style={{ width: `${totals.pct}%` }} />
          </div>
          <span className="shrink-0 font-display text-xs font-bold tabular-nums text-ink">{totals.pct}%</span>
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
          <span className="text-lime transition-transform group-hover:translate-x-0.5">→</span>
        </div>
        <AnimatedNumber value={trades} className={NUM} />
      </Link>
    </div>
  )
}
