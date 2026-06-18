import { Link } from 'react-router-dom'
import type { PerAlbumStats } from '@/lib/db/albums'

// Card album in stile pagina Album vecchia: gradiente brand (c1/c2) + texture
// diagonale + barra completamento. Niente anello qui (il ring resta focale solo
// nell'hero) — le card-lista usano la barra, come il sito vecchio.
export function AlbumStatCard({ a }: { a: PerAlbumStats }) {
  const { entry } = a
  return (
    <Link
      to="/album"
      aria-label={`Apri ${entry.title}`}
      className="group relative block overflow-hidden rounded-2xl p-5 shadow-lg shadow-black/30 transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
      style={{ background: `linear-gradient(135deg, ${entry.c1} 0%, ${entry.c2} 100%)` }}
    >
      {/* texture diagonale sottile (come .cover del vecchio) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'repeating-linear-gradient(45deg, rgba(255,255,255,.05) 0 2px, transparent 2px 14px)',
        }}
      />
      <div className="relative">
        <div className="font-mono text-[10px] uppercase tracking-widest text-white/65">
          {entry.editor} · {entry.season}
        </div>
        <div className="mt-1 truncate font-display text-xl font-bold text-white drop-shadow-sm">
          {entry.title}
        </div>

        <div className="mt-5 flex items-baseline justify-between gap-3">
          <div className="font-mono text-sm tabular-nums text-white/85">
            {a.have} <span className="text-white/55">/ {a.total}</span>
            <span className="ml-2 text-white/70">· {a.doubles} doppie</span>
          </div>
          <div className="font-display text-2xl font-bold tabular-nums text-white">{a.pct}%</div>
        </div>

        <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/30">
          <div
            className="h-full rounded-full bg-white/90 transition-[width] duration-500"
            style={{ width: `${Math.max(2, a.pct)}%` }}
          />
        </div>
      </div>
    </Link>
  )
}
