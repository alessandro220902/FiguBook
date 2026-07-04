import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Share2, ArrowRight, Check } from 'lucide-react'
import { useCollection } from '@/hooks/useCollection'
import { useAuth } from '@/hooks/useAuth'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import type { PerAlbumStats } from '@/lib/db/albums'
import { addAlbum, removeAlbum, archiveAlbum, unarchiveAlbum } from '@/lib/db/albums'
import { fetchShareCodes, shareList, type ShareKind } from '@/lib/album/share'
import { ctrlPrimary, ctrlGhost } from '@/lib/album/controlStyles'
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
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()
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
      <h1 className="type-h1 text-ink">I tuoi album</h1>

      {error ? (
        <div role="alert" className="mt-10 flex flex-col items-center rounded-xl border border-white/[0.07] bg-bg-elev px-6 py-16 text-center">
          <div className="type-h3 text-ink">Non riesco a caricare gli album</div>
          <AlbumButton type="button" onClick={retry} className="mt-5">Riprova</AlbumButton>
        </div>
      ) : (
        <>
          <div className="mt-6">
            <LibraryFilters active={filter} counts={counts} onChange={setFilter} onNew={() => setNewOpen(true)} />
          </div>

          {visible.length === 0 ? (
            <div className="mt-8 flex flex-col items-center rounded-xl border border-white/[0.07] bg-bg-elev px-6 py-16 text-center">
              <div className="type-h3 text-ink">
                {albums.length === 0 ? 'Nessun album ancora' : 'Niente in questo filtro'}
              </div>
              <p className="type-body mt-2 max-w-xs text-ink-2">
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
                  uid={user?.uid ?? null}
                  isDesktop={isDesktop}
                  onOpen={() => navigate(`/album/${a.id}`)}
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
  uid: string | null
  isDesktop: boolean
  onOpen: () => void
  onArchive: () => void
  onUnarchive: () => void
  onDelete: () => void
}

// Tile a gradiente pieno colore-album.
// Mobile/iPad: il <Link> copre la card (tap = apri), menu z sopra.
// PC (isDesktop): niente Link; all'hover sale un pannello nero con Condividi
// doppie/mancanti + Apri. Il menu (3 punti) sta sopra al pannello (z più alto),
// così cliccarlo non innesca l'apertura.
function AlbumTile({ a, archived, uid, isDesktop, onOpen, onArchive, onUnarchive, onDelete }: TileProps) {
  const { entry } = a
  const [toast, setToast] = useState<string | null>(null)
  const [busy, setBusy] = useState<ShareKind | null>(null)

  async function handleShare(kind: ShareKind) {
    if (!uid || busy) return
    setBusy(kind)
    try {
      const codes = await fetchShareCodes(uid, a.id)
      if (!codes) return
      const list = kind === 'doubles' ? codes.doubleCodes : codes.missingCodes
      if (await shareList(entry.title, kind, list) === 'copied') {
        setToast(`${kind === 'doubles' ? 'Doppie' : 'Mancanti'}: lista copiata`)
        setTimeout(() => setToast(null), 2400)
      }
    } finally {
      setBusy(null)
    }
  }

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/10 p-5 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.7)] transition-transform duration-150 ease-out hover:-translate-y-0.5"
      style={{ background: `linear-gradient(145deg, ${entry.c1} 0%, ${entry.c2} 100%)` }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.05) 40%, transparent 60%, rgba(0,0,0,0.45) 100%)' }} />

      {/* Mobile/iPad: Link overlay (tap = apri). Su PC niente Link: apre il bottone. */}
      {!isDesktop && (
        <Link
          to={`/album/${a.id}`}
          className="absolute inset-0 z-10 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
          aria-label={`Apri ${entry.title} — ${a.pct}% completo`}
        />
      )}

      {/* Menu: z più alto del pannello hover => cliccarlo non innesca l'effetto */}
      <div className="absolute right-3 top-3 z-30">
        <AlbumMenu title={entry.title} archived={archived} onArchive={onArchive} onUnarchive={onUnarchive} onDelete={onDelete} />
      </div>

      {/* Copertina: piena altezza a filo dell'angolo destro (object-cover). */}
      {entry.cover && (
        <img
          src={entry.cover}
          alt=""
          className="pointer-events-none absolute inset-y-0 right-0 z-20 aspect-[3/4] h-full rounded-r-2xl border-l border-white/15 object-cover"
        />
      )}

      {/* Contenuto: pointer-events-none => i click passano al Link overlay.
          pr lascia spazio alla copertina sull'angolo destro. */}
      <div className="pointer-events-none relative pr-[32%]">
        <div className="pr-2">
          <div className="font-mono text-[11px] uppercase tracking-wide text-white/85">{entry.editor} · {entry.season}</div>
          <h2 className="mt-1 truncate text-2xl font-bold tracking-tight text-white">{entry.title}</h2>
        </div>

        {/* Barra con % a fine linea (niente numero gigante separato). */}
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/30">
            <div className="h-full rounded-full bg-white" style={{ width: `${Math.max(2, a.pct)}%` }} />
          </div>
          <span className="type-stat shrink-0 font-display text-2xl text-white">{a.pct}<span className="text-base text-white/75">%</span></span>
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

      {/* PC: striscia azioni che sale dal basso all'hover (non copre titolo/stats) */}
      {isDesktop && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex translate-y-2 items-center justify-center gap-2 rounded-b-2xl bg-gradient-to-t from-black/95 via-black/85 to-transparent px-4 pb-3 pt-12 opacity-0 transition-[transform,opacity] duration-200 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
          <ActionButton onClick={() => handleShare('doubles')} disabled={busy !== null}>
            <Share2 size={15} /> Doppie
          </ActionButton>
          <ActionButton onClick={() => handleShare('missing')} disabled={busy !== null}>
            <Share2 size={15} /> Mancanti
          </ActionButton>
          <ActionButton onClick={onOpen} primary>
            Apri <ArrowRight size={15} />
          </ActionButton>
        </div>
      )}

      {toast && (
        <div role="status" className="pointer-events-none absolute bottom-3 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1.5 rounded-lg bg-black/90 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
          <Check size={13} className="text-lime" /> {toast}
        </div>
      )}
    </div>
  )
}

function ActionButton({ onClick, disabled, primary, children }: { onClick: () => void; disabled?: boolean; primary?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${primary ? ctrlPrimary() : ctrlGhost()} flex-1 whitespace-nowrap disabled:opacity-50`}
    >
      {children}
    </button>
  )
}
