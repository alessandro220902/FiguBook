import type { AlbumStats } from '@/lib/db/albums'

// Riga tile cruscotto. Rosso/verde semantico-di-stato. NIENTE frecce trend (no storico).
export function StatTicker({ totals }: { totals: AlbumStats }) {
  const tiles: { label: string; value: string | number; color: string }[] = [
    { label: 'Possedute', value: totals.have, color: 'var(--color-stat-have)' },
    { label: 'Mancanti', value: totals.missing, color: 'var(--color-stat-missing)' },
    { label: 'Doppie', value: totals.doubles, color: 'var(--color-lime)' },
    { label: 'Completamento', value: `${totals.pct}%`, color: 'var(--color-stat-have)' },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="rounded-xl border border-white/8 bg-bg-elev px-4 py-3"
        >
          <div className="font-mono text-3xl font-bold" style={{ color: t.color }}>
            {t.value}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted">
            {t.label}
          </div>
        </div>
      ))}
    </div>
  )
}
