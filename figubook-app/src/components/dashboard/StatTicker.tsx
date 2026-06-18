import type { AlbumStats } from '@/lib/db/albums'

// Riga tile cruscotto. Accent-line colorata in alto + numeri display tabular.
// Rosso/verde semantico-di-stato. NIENTE frecce trend (no storico → A2.3).
export function StatTicker({ totals }: { totals: AlbumStats }) {
  const fmt = (n: number) => n.toLocaleString('it-IT')
  const tiles: { label: string; value: string; color: string }[] = [
    { label: 'Possedute', value: fmt(totals.have), color: 'var(--color-stat-have)' },
    { label: 'Mancanti', value: fmt(totals.missing), color: 'var(--color-stat-missing)' },
    { label: 'Doppie', value: fmt(totals.doubles), color: 'var(--color-lime)' },
    { label: 'Completamento', value: `${totals.pct}%`, color: 'var(--color-stat-have)' },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-bg-elev/80 px-5 py-4 shadow-lg shadow-black/20"
        >
          <div
            className="absolute inset-x-0 top-0 h-[3px]"
            style={{ background: t.color, opacity: 0.85 }}
          />
          <div
            className="font-display text-3xl font-bold tabular-nums sm:text-4xl"
            style={{ color: t.color }}
          >
            {t.value}
          </div>
          <div className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
            {t.label}
          </div>
        </div>
      ))}
    </div>
  )
}
