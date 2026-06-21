import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCollection } from '@/hooks/useCollection'
import { useAuth } from '@/hooks/useAuth'
import type { PerAlbumStats } from '@/lib/db/albums'
import { addAlbum, removeAlbum, archiveAlbum, unarchiveAlbum } from '@/lib/db/albums'
import { AlbumButton } from '@/components/album/ui/Button'
import { LibraryFilters } from '@/components/album/LibraryFilters'
import { NewAlbumDialog } from '@/components/album/NewAlbumDialog'
import { AlbumMenu } from '@/components/album/AlbumMenu'
import {
  inBucket, LIBRARY_FILTERS, DEFAULT_FILTER, type LibraryFilter,
} from '@/lib/album/libraryFilters'

export default function AlbumList() {
  const { albums, archived, loading, error, retry } = useCollection()
  const { user } = useAuth()
  const [filter, setFilter] = useState<LibraryFilter>(DEFAULT_FILTER)
  const [newOpen, setNewOpen] = useState(false)

  const archivedSet = useMemo(() => new Set(archived), [archived])
  const withFlag = useMemo(
    () => albums.map((a) => ({ a, archived: archivedSet.has(a.id) })),
    [albums, archivedSet],
  )

  const counts = useMemo(() => {
    const c = { 'in-corso': 0, tutti: 0, completati: 0, archivio: 0 } as Record<LibraryFilter, number>
    for (const { a, archived } of withFlag) {
      for (const { key } of LIBRARY_FILTERS) {
        if (inBucket(key, { pct: a.pct, archived })) c[key]++
      }
    }
    return c
  }, [withFlag])

  const visible = withFlag.filter(({ a, archived }) => inBucket(filter, { pct: a.pct, archived }))
  const ownedIds = albums.map((a) => a.id)

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
          <AlbumButton type="button" onClick={retry} className="mt-5">Riprova</AlbumButton>
        </div>
      ) : (
        <>
          <div className="mt-6">
            <LibraryFilters active={filter} counts={counts} onChange={setFilter} onNew={() => setNewOpen(true)} />
          </div>

          {visible.length === 0 ? (
            <div className="mt-8 flex flex-col items-center rounded-xl border border-white/[0.07] bg-bg-elev px-6 py-16 text-center">
              <div className="text-xl font-medium tracking-tight text-ink">
                {albums.length === 0 ? 'Nessun album ancora' : 'Niente in questo filtro'}
              </div>
              <p className="mt-2 max-w-xs text-sm text-ink-2">
                {albums.length === 0 ? 'Aggiungi un album per iniziare a collezionare.' : 'Cambia filtro o aggiungi un nuovo album.'}
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map(({ a, archived }) => (
                <AlbumTile
                  key={a.id}
                  a={a}
                  archived={archived}
                  onArchive={() => user && archiveAlbum(user.uid, a.id)}
                  onUnarchive={() => user && unarchiveAlbum(user.uid, a.id)}
                  onDelete={() => user && removeAlbum(user.uid, a.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <NewAlbumDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        ownedIds={ownedIds}
        onAdd={(id) => user && addAlbum(user.uid, id)}
      />
    </div>
  )
}

interface TileProps {
  a: PerAlbumStats
  archived: boolean
  onArchive: () => void
  onUnarchive: () => void
  onDelete: () => void
}

// Tile a gradiente pieno colore-album. Il <Link> copre la card come overlay
// assoluto (z-10); AlbumMenu è fratello sopra (z-20) col proprio stato =>
// il tap sul menu non naviga. Il contenuto testuale è pointer-events-none
// così i click passano attraverso al Link overlay.
function AlbumTile({ a, archived, onArchive, onUnarchive, onDelete }: TileProps) {
  const { entry } = a
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/10 p-5 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.7)] transition-transform duration-150 ease-out hover:-translate-y-0.5"
      style={{ background: `linear-gradient(145deg, ${entry.c1} 0%, ${entry.c2} 100%)` }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.05) 40%, transparent 60%, rgba(0,0,0,0.45) 100%)' }} />

      {/* Link overlay: copre tutta la card ma sta sotto il menu (z-10 < z-20) */}
      <Link
        to={`/album/${a.id}`}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
        aria-label={`Apri ${entry.title} — ${a.pct}% completo`}
      />

      {/* Menu: fratello del Link, z più alto => intercetta i propri click */}
      <div className="absolute right-3 top-3 z-20">
        <AlbumMenu title={entry.title} archived={archived} onArchive={onArchive} onUnarchive={onUnarchive} onDelete={onDelete} />
      </div>

      {/* Contenuto: pointer-events-none => i click passano al Link overlay */}
      <div className="pointer-events-none relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-[11px] uppercase tracking-wide text-white/85">{entry.editor} · {entry.season}</div>
            <h2 className="mt-1 truncate text-2xl font-semibold tracking-tight text-white">{entry.title}</h2>
          </div>
          <div className="shrink-0 pr-10 font-display text-3xl font-bold leading-none tabular-nums text-white">
            {a.pct}<span className="text-xl text-white/75">%</span>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/30">
          <div className="h-full rounded-full bg-white" style={{ width: `${Math.max(2, a.pct)}%` }} />
        </div>

        <div className="mt-4 flex items-end justify-between">
          <dl className="flex gap-5 text-white">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wide text-white/75">Possedute</dt>
              <dd className="mt-0.5 font-display text-lg font-bold tabular-nums">{a.have}<span className="text-sm font-medium text-white/70"> / {a.total}</span></dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wide text-white/75">Mancanti</dt>
              <dd className="mt-0.5 font-display text-lg font-bold tabular-nums">{a.missing}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wide text-white/75">Doppie</dt>
              <dd className="mt-0.5 font-display text-lg font-bold tabular-nums">{a.doubles}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
