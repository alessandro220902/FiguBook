import { Link } from 'react-router-dom'
import type { PerAlbumStats } from '@/lib/db/albums'

// Album dove manca meno. Superficie piatta e sobria: il brand vive solo nel
// pallino; titolo grande in ink, CTA lime. Niente gradiente full-bleed.
export function ClosestAlbumCard({ albums }: { albums: PerAlbumStats[] }) {
  const closest = albums
    .filter((a) => a.missing > 0)
    .sort((x, y) => x.missing - y.missing)[0]
  if (!closest) return null
  const { entry } = closest
  return (
    <div className="flex h-full flex-col justify-center rounded-2xl border border-white/[0.08] bg-surface p-7">
      <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-ink-2">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: entry.c1 }} />
        Più vicino a chiudere
      </div>
      <h3 className="mt-3 text-2xl font-medium leading-snug tracking-tight text-ink text-balance sm:text-[28px]">
        Ti mancano <span className="tabular-nums">{closest.missing}</span> figurine
        <br className="hidden sm:block" /> per chiudere {entry.title}
      </h3>
      <Link
        to="/album"
        className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-lg bg-lime px-4 py-2 text-sm font-medium text-lime-ink transition-transform duration-150 hover:-translate-y-px active:translate-y-0"
      >
        Apri l'album
        <span aria-hidden>→</span>
      </Link>
    </div>
  )
}
