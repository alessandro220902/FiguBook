import { Link } from 'react-router-dom'
import type { PerAlbumStats } from '@/lib/db/albums'

// Card album piatta e sobria: superficie unica, colore brand ridotto a un pallino
// + la barra a tinta unica. Nessun gradiente full-bleed, nessuna texture.
export function AlbumStatCard({ a }: { a: PerAlbumStats }) {
  const { entry } = a
  return (
    <Link
      to="/album"
      aria-label={`Apri ${entry.title}`}
      className="group block rounded-xl border border-white/[0.07] bg-bg-elev p-5 transition-colors duration-200 hover:border-white/15"
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: entry.c1 }}
          />
          <span className="truncate text-[15px] font-medium text-ink">{entry.title}</span>
        </div>
        <span className="shrink-0 text-sm font-medium tabular-nums text-ink-2">{a.pct}%</span>
      </div>

      <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${Math.max(2, a.pct)}%`, background: entry.c1 }}
        />
      </div>

      <div className="mt-3 flex items-center gap-3 text-[12px] tabular-nums text-muted">
        <span>{a.have} / {a.total}</span>
        <span aria-hidden className="text-white/15">·</span>
        <span>{a.doubles} doppie</span>
      </div>
    </Link>
  )
}
