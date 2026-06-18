import { Link } from 'react-router-dom'
import type { PerAlbumStats } from '@/lib/db/albums'

// Card album: mini-copertina (gradiente brand, come una spina) + info + barra.
// Più ricca del pallino, pulita (niente texture/gloss). Hover lift.
export function AlbumStatCard({ a }: { a: PerAlbumStats }) {
  const { entry } = a
  return (
    <Link
      to="/album"
      aria-label={`Apri ${entry.title}`}
      className="group flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20"
    >
      {/* mini-copertina: identità colore dell'album */}
      <div
        className="relative grid h-16 w-12 shrink-0 place-items-center overflow-hidden rounded-lg shadow-inner"
        style={{ background: `linear-gradient(150deg, ${entry.c1} 0%, ${entry.c2} 100%)` }}
      >
        <span className="absolute inset-0 ring-1 ring-inset ring-white/15" />
        <span className="text-sm font-semibold tabular-nums text-white drop-shadow">{a.pct}%</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[15px] font-medium text-ink">{entry.title}</span>
          <span className="shrink-0 text-[11px] tabular-nums text-muted">
            {entry.editor} · {entry.season}
          </span>
        </div>

        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out"
            style={{ width: `${Math.max(2, a.pct)}%`, background: entry.c1 }}
          />
        </div>

        <div className="mt-2.5 flex items-center gap-2.5 text-[12px] tabular-nums text-muted">
          <span>{a.have} / {a.total}</span>
          <span aria-hidden className="text-white/15">·</span>
          <span>{a.doubles} doppie</span>
        </div>
      </div>
    </Link>
  )
}
