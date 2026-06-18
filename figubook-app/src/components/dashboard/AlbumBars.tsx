import type { PerAlbumStats } from '@/lib/db/albums'

// Panorama compatto: una riga-barra per album, ordinate per completamento.
// Barre CSS (niente charting widget con assi/griglie = piu' minimale).
export function AlbumBars({ albums }: { albums: PerAlbumStats[] }) {
  const rows = [...albums].sort((a, b) => b.pct - a.pct)
  return (
    <ul className="flex flex-col gap-3.5 rounded-2xl border border-white/[0.08] bg-surface p-5 sm:p-6">
      {rows.map((a) => (
        <li
          key={a.id}
          className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[11rem_1fr_2.5rem]"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: a.entry.c1 }} />
            <span className="truncate text-sm text-ink">{a.entry.title}</span>
          </span>
          <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07] sm:col-span-1">
            <div
              className="h-full rounded-full transition-[width] duration-700 ease-out"
              style={{ width: `${Math.max(2, a.pct)}%`, background: a.entry.c1 }}
            />
          </div>
          <span className="text-right text-sm tabular-nums text-muted">{a.pct}%</span>
        </li>
      ))}
    </ul>
  )
}
