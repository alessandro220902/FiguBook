import { Link } from 'react-router-dom'
import type { PerAlbumStats } from '@/lib/db/albums'

// Card album hover-reveal: cover = gradiente brand (al posto della copertina vera),
// badge % sempre visibile; il dettaglio (carte/totale · doppie · Apri) compare su
// hover (desktop) ed e' sempre visibile su mobile (niente hover). Spazio riservato
// => nessun salto di layout, solo opacita'.
export function AlbumStatCard({ a }: { a: PerAlbumStats }) {
  const { entry } = a
  return (
    <Link
      to="/album"
      aria-label={`Apri ${entry.title}`}
      className="group block overflow-hidden rounded-2xl border border-white/[0.08] bg-surface transition-all duration-200 hover:-translate-y-1 hover:border-white/20"
    >
      <div
        className="relative h-24"
        style={{ background: `linear-gradient(150deg, ${entry.c1} 0%, ${entry.c2} 100%)` }}
      >
        <span className="absolute inset-0 ring-1 ring-inset ring-white/10" />
        <span className="absolute right-3 top-3 rounded-md bg-black/30 px-2 py-0.5 text-sm font-semibold tabular-nums text-white">
          {a.pct}%
        </span>
      </div>

      <div className="p-4">
        <div className="truncate text-[15px] font-medium text-ink">{entry.title}</div>
        <div className="mt-1 text-[11px] tabular-nums text-muted">
          {entry.editor} · {entry.season}
        </div>

        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out"
            style={{ width: `${Math.max(2, a.pct)}%`, background: entry.c1 }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-[12px] tabular-nums text-muted opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100">
          <span>
            {a.have} / {a.total} · {a.doubles} doppie
          </span>
          <span className="font-medium text-lime">Apri →</span>
        </div>
      </div>
    </Link>
  )
}
