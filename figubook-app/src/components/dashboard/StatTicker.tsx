import type { AlbumStats } from '@/lib/db/albums'
import { AnimatedNumber } from './AnimatedNumber'

// Tile statistiche: card separate che si sollevano all'hover. Label visibili
// (text-ink-2), numeri in ink con count-up. Colore semantico nel pallino.
export function StatTicker({ totals }: { totals: AlbumStats }) {
  const items: { label: string; value: number; suffix?: string; dot?: string }[] = [
    { label: 'Possedute', value: totals.have, dot: 'var(--color-stat-have)' },
    { label: 'Mancanti', value: totals.missing, dot: 'var(--color-stat-missing)' },
    { label: 'Doppie', value: totals.doubles, dot: 'var(--color-lime)' },
    { label: 'Completamento', value: totals.pct, suffix: '%' },
  ]
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-2xl border border-white/[0.08] bg-surface px-5 py-4 transition-all duration-200 hover:-translate-y-1 hover:border-white/20"
        >
          <dt className="flex items-center gap-1.5 text-xs font-medium text-ink-2">
            {it.dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: it.dot }} />}
            {it.label}
          </dt>
          <AnimatedNumber
            value={it.value}
            suffix={it.suffix}
            className="mt-2 block text-3xl font-medium tabular-nums tracking-tight text-ink sm:text-4xl"
          />
        </div>
      ))}
    </dl>
  )
}
