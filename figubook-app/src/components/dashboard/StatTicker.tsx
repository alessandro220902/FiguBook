import type { AlbumStats } from '@/lib/db/albums'

// Striscia dati: un'unica superficie piatta divisa da hairline. Numeri in ink
// (non neon), il colore semantico vive solo in un pallino accanto alla label.
// Niente card-glow, niente top-line, niente hero-metric template.
export function StatTicker({ totals }: { totals: AlbumStats }) {
  const fmt = (n: number) => n.toLocaleString('it-IT')
  const items: { label: string; value: string; dot?: string }[] = [
    { label: 'Possedute', value: fmt(totals.have), dot: 'var(--color-stat-have)' },
    { label: 'Mancanti', value: fmt(totals.missing), dot: 'var(--color-stat-missing)' },
    { label: 'Doppie', value: fmt(totals.doubles), dot: 'var(--color-lime)' },
    { label: 'Completamento', value: `${totals.pct}%` },
  ]
  return (
    <dl className="grid grid-cols-2 divide-white/[0.06] rounded-xl border border-white/[0.07] bg-bg-elev sm:grid-cols-4 sm:divide-x">
      {items.map((it) => (
        <div key={it.label} className="px-6 py-5">
          <dt className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted">
            {it.dot && (
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: it.dot }} />
            )}
            {it.label}
          </dt>
          <dd className="mt-2 text-3xl font-medium tabular-nums tracking-tight text-ink">
            {it.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
