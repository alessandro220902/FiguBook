import { AnimatePresence, motion } from 'framer-motion'
import { Search, X, BookOpen, Hash } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ALBUM_CATALOG } from '@/data/albumCatalog'
import { buildCardIndex, searchCatalog, type SearchCard } from '@/lib/album/search'

// Adattato da moumensoliman/expanding-search-dock (21st). La lente si espande in
// dock; al primo focus carica l'indice carte cross-album (una volta) e mostra un
// dropdown con album + carte. Album -> /album/:id, carta -> /album/:id?code=N.
export function SearchDock({ placeholder = 'Cerca album o carte…' }: { placeholder?: string }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [cards, setCards] = useState<SearchCard[]>([])
  const rootRef = useRef<HTMLDivElement>(null)

  // Indice carte: caricato al primo open, condiviso a livello modulo (cache).
  useEffect(() => {
    if (!open || cards.length) return
    let active = true
    buildCardIndex().then((c) => { if (active) setCards(c) })
    return () => { active = false }
  }, [open, cards.length])

  // Click fuori -> chiudi.
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const results = useMemo(() => searchCatalog(ALBUM_CATALOG, cards, q), [cards, q])
  const hasResults = results.albums.length > 0 || results.cards.length > 0

  function close() {
    setOpen(false)
    setQ('')
  }
  function go(to: string) {
    navigate(to)
    close()
  }

  return (
    <div ref={rootRef} className="relative">
      <AnimatePresence mode="wait" initial={false}>
        {!open ? (
          <motion.button
            key="icon"
            type="button"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => setOpen(true)}
            aria-label="Cerca"
            className="grid h-10 w-10 place-items-center rounded-full text-foreground transition-colors hover:bg-white/8"
          >
            <Search className="h-5 w-5" />
          </motion.button>
        ) : (
          <motion.div
            key="input"
            initial={{ width: 40, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex items-center gap-2 overflow-hidden rounded-full border border-white/12 bg-white/[0.06] pr-1 backdrop-blur-md"
          >
            <span className="ml-3 text-muted-foreground"><Search className="h-4 w-4" /></span>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && close()}
              placeholder={placeholder}
              className="h-10 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={close}
              aria-label="Chiudi ricerca"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {open && q.trim() && (
        <div className="absolute left-1/2 top-12 z-50 w-80 -translate-x-1/2 overflow-hidden rounded-2xl border border-white/12 bg-neutral-900/95 shadow-xl backdrop-blur-md">
          {!hasResults ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">Nessun risultato per “{q.trim()}”.</p>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto py-1.5">
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
      className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-white/[0.06]"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-muted-foreground">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-foreground">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{sub}</span>
      </span>
    </button>
  )
}
