import type { AlbumStats } from '@/lib/db/albums'
import { AnimatedNumber } from './AnimatedNumber'

// Striscia dati piatta divisa da hairline. Numeri in ink con count-up al mount.
// Il colore semantico vive solo nel pallino accanto alla label.
export function StatTicker({ totals }: { totals: AlbumStats }) {
  const items: { label: string; value: number; suffix?: string; dot?: string }[] = [
    { label: 'Possedute', value: totals.have, dot: 'var(--color-stat-have)' },
    { label: 'Mancanti', value: totals.missing, dot: 'var(--color-stat-missing)' },
    { label: 'Doppie', value: totals.doubles, dot: 'var(--color-lime)' },
    { label: 'Completamento', value: totals.pct, suffix: '%' },
  ]
  return (
    <dl className="grid grid-cols-2 divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.08] bg-surface sm:grid-cols-4 sm:divide-x">
      {items.map((it) => (
        <div key={it.label} className="px-6 py-5">
          <dt className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted">
            {it.dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: it.dot }} />}
            {it.label}
          </dt>
          <AnimatedNumber
            value={it.value}
            suffix={it.suffix}
            className="mt-2 block text-3xl font-medium tabular-nums tracking-tight text-ink"
          />
        </div>
      ))}
    </dl>
  )
}
