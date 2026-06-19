import { Link } from 'react-router-dom'
import type { AlbumStats } from '@/lib/db/albums'
import { AnimatedNumber } from './AnimatedNumber'
import { CompletionRing } from './CompletionRing'

const TILE =
  'rounded-2xl border border-white/[0.08] bg-surface px-5 py-4 transition-all duration-200 hover:-translate-y-1 hover:border-white/20'
const LABEL = 'flex items-center gap-1.5 text-xs font-medium text-ink-2'
const NUM = 'mt-2 block font-display text-3xl font-semibold tabular-nums tracking-tight text-ink'

function Dot({ color }: { color: string }) {
  return <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
}

// Gerarchia: "Possedute" è la stat eroe (tile grande, tinta campo + anello),
// le altre 4 sono satelliti minori. Niente più griglia di card identiche.
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
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {/* EROE — Possedute: superficie tinta pitch (verde campo), numero da tabellone */}
      <div
        className="col-span-2 flex items-center justify-between gap-4 rounded-2xl border px-6 py-5 lg:row-span-2 lg:flex-col lg:items-start lg:justify-center"
        style={{
          background: 'color-mix(in srgb, var(--color-pitch) 16%, var(--color-surface))',
          borderColor: 'color-mix(in srgb, var(--color-pitch) 35%, transparent)',
        }}
      >
        <div className="min-w-0">
          <div className={LABEL}>
            <Dot color="var(--color-stat-have)" /> Possedute
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <AnimatedNumber
              value={totals.have}
              className="font-display text-5xl font-semibold tabular-nums leading-none tracking-tight text-ink sm:text-6xl"
            />
            <span className="font-display text-lg tabular-nums text-ink-2">
              / {totals.total.toLocaleString('it-IT')}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted">
            {totals.pct >= 100 ? 'Collezione completa ✦' : `${(100 - totals.pct)}% al traguardo`}
          </p>
        </div>
        <div className="shrink-0 lg:mt-5">
          <CompletionRing pct={totals.pct} size={84} />
        </div>
      </div>

      {/* SATELLITI */}
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
