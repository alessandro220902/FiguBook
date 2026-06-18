import { Link } from 'react-router-dom'
import type { PerAlbumStats } from '@/lib/db/albums'

// Album dove manca meno (missing>0). Usa il gradiente brand del SUO album:
// lega l'hero alla collezione invece del verde piatto. CTA -> /album.
export function ClosestAlbumCard({ albums }: { albums: PerAlbumStats[] }) {
  const closest = albums
    .filter((a) => a.missing > 0)
    .sort((x, y) => x.missing - y.missing)[0]
  if (!closest) return null
  const { entry } = closest
  return (
    <div
      className="relative flex h-full flex-col justify-center overflow-hidden rounded-2xl p-6 shadow-lg shadow-black/30"
      style={{ background: `linear-gradient(135deg, ${entry.c1} 0%, ${entry.c2} 100%)` }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'repeating-linear-gradient(45deg, rgba(255,255,255,.05) 0 2px, transparent 2px 14px)',
        }}
      />
      <div className="relative">
        <div className="font-mono text-[10px] uppercase tracking-widest text-white/70">
          Più vicino a chiudere
        </div>
        <div className="mt-2 font-display text-2xl font-bold text-white drop-shadow-sm sm:text-3xl">
          Ti mancano <span className="tabular-nums">{closest.missing}</span> a {entry.title}
        </div>
        <Link
          to="/album"
          className="mt-4 inline-block rounded-lg bg-white px-4 py-2 font-mono text-sm font-semibold text-black transition-transform duration-150 hover:scale-[1.03] active:scale-95"
        >
          Apri l'album →
        </Link>
      </div>
    </div>
  )
}
