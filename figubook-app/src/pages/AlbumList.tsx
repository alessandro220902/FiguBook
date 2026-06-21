import { Link } from 'react-router-dom'
import { useCollection } from '@/hooks/useCollection'
import type { PerAlbumStats } from '@/lib/db/albums'

// Pagina "Album" (nav): elenco degli album posseduti, ognuno link diretto a
// /album/:id. Link normali (no card-stack draggable) => sempre cliccabili.
export default function AlbumList() {
  const { albums, loading, error, retry } = useCollection()

  if (loading) {
    return (
      <div className="album-theme mx-auto w-full max-w-[88rem]">
        <div className="h-8 w-40 animate-pulse rounded bg-bg-elev" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-bg-elev" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="album-theme mx-auto w-full max-w-[88rem]">
      <h1 className="text-[28px] font-medium tracking-tight text-ink sm:text-[32px]">I tuoi album</h1>

      {error ? (
        <div role="alert" className="mt-10 flex flex-col items-center rounded-xl border border-white/[0.07] bg-bg-elev px-6 py-16 text-center">
          <div className="text-xl font-medium tracking-tight text-ink">Non riesco a caricare gli album</div>
          <button type="button" onClick={retry} className="mt-5 rounded-lg bg-lime px-5 py-2.5 text-sm font-medium text-lime-ink transition-transform duration-150 hover:-translate-y-px active:scale-95">
            Riprova
          </button>
        </div>
      ) : albums.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-xl border border-white/[0.07] bg-bg-elev px-6 py-16 text-center">
          <div className="text-xl font-medium tracking-tight text-ink">Nessun album ancora</div>
          <p className="mt-2 max-w-xs text-sm text-ink-2">Aggiungi un album per iniziare a collezionare.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => (
            <AlbumTile key={a.id} a={a} />
          ))}
        </div>
      )}
    </div>
  )
}

function AlbumTile({ a }: { a: PerAlbumStats }) {
  const { entry } = a
  return (
    <Link
      to={`/album/${a.id}`}
      className="group relative block overflow-hidden rounded-2xl border border-white/10 p-5 shadow-[0_18px_40px_-20px_rgba(4,10,7,0.7)] transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
      style={{ background: `linear-gradient(145deg, ${entry.c1} 0%, ${entry.c2} 100%)` }}
      aria-label={`Apri ${entry.title} — ${a.pct}% completo`}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.05) 40%, transparent 60%, rgba(0,0,0,0.45) 100%)' }} />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-[11px] text-white/85">{entry.editor} · {entry.season}</div>
            <h2 className="mt-1 truncate font-display text-2xl font-semibold tracking-tight text-white">{entry.title}</h2>
          </div>
          <div className="shrink-0 font-display text-3xl font-semibold tabular-nums text-white">{a.pct}%</div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/30">
          <div className="h-full rounded-full bg-white" style={{ width: `${Math.max(2, a.pct)}%` }} />
        </div>

        <div className="mt-4 flex items-end justify-between">
          <dl className="flex gap-5 text-white">
            <div>
              <dt className="text-[11px] text-white/85">Possedute</dt>
              <dd className="font-display text-lg font-semibold tabular-nums">{a.have}<span className="text-sm text-white/75"> / {a.total}</span></dd>
            </div>
            <div>
              <dt className="text-[11px] text-white/85">Mancanti</dt>
              <dd className="font-display text-lg font-semibold tabular-nums">{a.missing}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-white/85">Doppie</dt>
              <dd className="font-display text-lg font-semibold tabular-nums">{a.doubles}</dd>
            </div>
          </dl>
          <span className="font-medium text-white/90 transition-transform duration-150 group-hover:translate-x-0.5">Apri →</span>
        </div>
      </div>
    </Link>
  )
}
