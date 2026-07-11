import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, BookOpen, Hash } from 'lucide-react'
import { ALBUM_CATALOG } from '@/data/albumCatalog'
import { buildCardIndex, searchCatalog, type SearchCard } from '@/lib/album/search'
import { Breadcrumb } from '@/components/Breadcrumb'

// Pagina ricerca dedicata (mobile): stessa logica del SearchDock desktop
// (searchCatalog + indice carte cross-album).
export default function Cerca() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [cards, setCards] = useState<SearchCard[]>([])

  useEffect(() => {
    let active = true
    buildCardIndex().then((c) => { if (active) setCards(c) })
    return () => { active = false }
  }, [])

  const results = useMemo(() => searchCatalog(ALBUM_CATALOG, cards, q), [cards, q])
  const hasResults = results.albums.length > 0 || results.cards.length > 0

  function go(to: string) {
    navigate(to)
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <Breadcrumb items={[{ label: 'Home', to: '/home' }, { label: 'Cerca' }]} />
      <div className="flex h-11 items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 backdrop-blur-md">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca album o carte…"
          style={{ outline: 'none' }}
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground caret-foreground placeholder:text-muted-foreground"
        />
      </div>

      {q.trim() && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/12 bg-neutral-900/80 backdrop-blur-md">
          {!hasResults ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">Nessun risultato per “{q.trim()}”.</p>
          ) : (
            <div className="py-1.5">
              {results.albums.length > 0 && (
                <Group label="Album">
                  {results.albums.map((a) => (
                    <Row key={a.id} icon={<BookOpen className="h-4 w-4" />} title={a.title} sub={a.season} onClick={() => go(`/album/${a.id}`)} />
                  ))}
                </Group>
              )}
              {results.cards.length > 0 && (
                <Group label="Carte">
                  {results.cards.map((c, i) => (
                    <Row
                      key={`${c.albumId}-${c.code}-${i}`}
                      icon={<Hash className="h-4 w-4" />}
                      title={c.name || `Figurina n.${c.code}`}
                      sub={`${c.albumTitle} · n.${c.code}`}
                      onClick={() => go(`/album/${c.albumId}?code=${encodeURIComponent(c.code)}`)}
                    />
                  ))}
                </Group>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-0.5">
      <p className="px-4 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function Row({ icon, title, sub, onClick }: { icon: React.ReactNode; title: string; sub: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/[0.06] active:bg-white/[0.08]"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-muted-foreground">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-foreground">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{sub}</span>
      </span>
    </button>
  )
}
