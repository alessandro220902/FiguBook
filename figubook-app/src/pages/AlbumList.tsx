import { Link } from 'react-router-dom'
import { useCollection } from '@/hooks/useCollection'
import type { PerAlbumStats } from '@/lib/db/albums'
import { AlbumButton } from '@/components/album/ui/Button'

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
            <div key={i} className="h-36 animate-pulse rounded-lg bg-bg-elev" />
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
          <AlbumButton type="button" onClick={retry} className="mt-5">Riprova</AlbumButton>
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
      className="group relative flex overflow-hidden rounded-lg border border-border bg-bg-elev transition-transform duration-150 ease-out hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
      aria-label={`Apri ${entry.title} — ${a.pct}% completo`}
    >
      {/* Spina colore squadra: identifica senza annegare la card */}
      <span aria-hidden className="w-1 shrink-0" style={{ background: `linear-gradient(${entry.c1}, ${entry.c2})` }} />
      <div className="min-w-0 flex-1 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-[11px] uppercase tracking-wide text-ink-2">{entry.editor} · {entry.season}</div>
            <h2 className="mt-1 truncate text-lg font-semibold tracking-tight text-ink">{entry.title}</h2>
          </div>
          <div className="shrink-0 font-display text-4xl font-bold leading-none tabular-nums text-ink">
            {a.pct}<span className="text-xl text-ink-2">%</span>
          </div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-lime transition-[width] duration-500" style={{ width: `${Math.max(2, a.pct)}%` }} />
        </div>

        <div className="mt-4 flex items-end justify-between">
          <dl className="flex gap-5">
            <TileStat label="Possedute" value={`${a.have}`} sub={`/ ${a.total}`} />
            <TileStat label="Mancanti" value={`${a.missing}`} />
            <TileStat label="Doppie" value={`${a.doubles}`} />
          </dl>
          <span className="text-sm font-medium text-ink-2 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-lime">Apri →</span>
        </div>
      </div>
    </Link>
  )
}

function TileStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-wide text-ink-2">{label}</dt>
      <dd className="mt-0.5 font-display text-lg font-bold tabular-nums text-ink">
        {value}{sub && <span className="text-sm font-medium text-ink-2"> {sub}</span>}
      </dd>
    </div>
  )
}
