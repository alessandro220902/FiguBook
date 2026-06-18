import { Link } from 'react-router-dom'
import type { PerAlbumStats } from '@/lib/db/albums'

// Album dove manca meno (missing>0). Spinge all'azione. CTA -> /album (lista).
export function ClosestAlbumCard({ albums }: { albums: PerAlbumStats[] }) {
  const closest = albums
    .filter((a) => a.missing > 0)
    .sort((x, y) => x.missing - y.missing)[0]
  if (!closest) return null
  return (
    <div className="rounded-xl border border-white/8 bg-pitch p-5">
      <div className="font-mono text-[10px] uppercase tracking-widest text-pitch-ink/80">
        Più vicino a chiudere
      </div>
      <div className="mt-2 font-display text-2xl font-bold text-pitch-ink">
        Ti mancano {closest.missing} a {closest.entry.title}
      </div>
      <Link
        to="/album"
        className="mt-3 inline-block rounded-lg bg-lime px-4 py-2 font-mono text-sm font-semibold text-lime-ink"
      >
        Apri →
      </Link>
    </div>
  )
}
