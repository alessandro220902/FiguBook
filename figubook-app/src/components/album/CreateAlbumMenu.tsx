import { useEffect, useId, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { ALBUM_CATALOG, type AlbumCatalogEntry } from '@/data/albumCatalog'
import { ctrlFilter, ctrlPrimary, CTRL_BADGE_ON, CTRL_BADGE_OFF } from '@/lib/album/controlStyles'

export interface CreateAlbumMenuProps {
  ownedIds: string[]
  onAdd: (id: string) => void
  className?: string
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const
const SPRING_MORPH = { type: 'spring', stiffness: 320, damping: 26, mass: 0.9 } as const

type Facet = { key: string; label: string; count: number }

// Deriva i valori distinti di un campo (in ordine di catalogo) coi conteggi.
function facets(list: AlbumCatalogEntry[], field: 'editor' | 'season'): Facet[] {
  const seen: string[] = []
  const count: Record<string, number> = {}
  for (const a of list) {
    const v = a[field]
    if (!(v in count)) { seen.push(v); count[v] = 0 }
    count[v]++
  }
  return seen.map((key) => ({ key, label: key, count: count[key] }))
}

// Menu "Nuovo album": il trigger morfa (layoutId) in un pannello centrato
// con catalogo filtrabile per editoriale/annata. Esclude i posseduti.
export function CreateAlbumMenu({ ownedIds, onAdd, className }: CreateAlbumMenuProps) {
  const [open, setOpen] = useState(false)
  const [editor, setEditor] = useState('all')
  const [season, setSeason] = useState('all')
  const reduce = useReducedMotion()
  const layoutId = useId()

  const owned = useMemo(() => new Set(ownedIds), [ownedIds])
  const available = useMemo(() => ALBUM_CATALOG.filter((a) => !owned.has(a.id)), [owned])

  // Facet su ciò che è disponibile (non su tutto il catalogo).
  const editorFacets = useMemo(() => facets(available, 'editor'), [available])
  const seasonFacets = useMemo(() => facets(available, 'season'), [available])

  const visible = useMemo(
    () => available.filter((a) => (editor === 'all' || a.editor === editor) && (season === 'all' || a.season === season)),
    [available, editor, season],
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Apre pulito: azzera i filtri all'apertura.
  const openMenu = () => { setEditor('all'); setSeason('all'); setOpen(true) }

  const morph = reduce ? { duration: 0.15 } : SPRING_MORPH

  const filterRow = (
    label: string,
    facetList: Facet[],
    total: number,
    value: string,
    onPick: (v: string) => void,
  ) => (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 font-mono text-[11px] uppercase tracking-wide text-ink-2">{label}</span>
      <div className="-mx-1 flex flex-1 items-center gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button type="button" onClick={() => onPick('all')} aria-pressed={value === 'all'} className={`shrink-0 ${ctrlFilter(value === 'all')}`}>
          Tutti<span className={value === 'all' ? CTRL_BADGE_ON : CTRL_BADGE_OFF}>{total}</span>
        </button>
        {facetList.map((f) => {
          const on = f.key === value
          return (
            <button key={f.key} type="button" onClick={() => onPick(f.key)} aria-pressed={on} className={`shrink-0 ${ctrlFilter(on)}`}>
              {f.label}<span className={on ? CTRL_BADGE_ON : CTRL_BADGE_OFF}>{f.count}</span>
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <>
      <motion.button
        type="button"
        layoutId={layoutId}
        transition={morph}
        style={{ borderRadius: 9999 }}
        onClick={openMenu}
        aria-haspopup="dialog"
        aria-expanded={open}
        whileTap={reduce ? undefined : { scale: 0.98 }}
        className={`shrink-0 ${ctrlPrimary()} ${className ?? ''}`}
      >
        <motion.span layout className="inline-flex items-center gap-2 whitespace-nowrap">
          <Plus className="h-4 w-4" aria-hidden /> Nuovo album
        </motion.span>
      </motion.button>

      {createPortal(
        <AnimatePresence>
          {open ? (
            <div className="album-theme fixed inset-0 z-[100] grid place-items-center p-4">
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />

              <motion.div
                key="panel"
                layoutId={layoutId}
                transition={morph}
                style={{ borderRadius: 18 }}
                role="dialog"
                aria-modal="true"
                aria-label="Aggiungi album"
                className="relative flex max-h-[85vh] w-[min(92vw,560px)] flex-col overflow-hidden border border-white/10 bg-bg-elev"
              >
                <motion.div
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: reduce ? 0 : 0.1, duration: 0.2 }}
                  className="flex min-h-0 flex-col"
                >
                  <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                    <span className="type-h3 text-ink">Aggiungi album</span>
                    <button type="button" onClick={() => setOpen(false)} aria-label="Chiudi" className="text-ink-2 transition-colors hover:text-ink">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {available.length === 0 ? (
                    <p className="px-5 py-10 text-center type-body text-ink-2">Hai già tutti gli album disponibili.</p>
                  ) : (
                    <>
                      <div className="flex flex-col gap-2 border-b border-white/10 px-5 py-3">
                        {filterRow('Editoriale', editorFacets, available.length, editor, setEditor)}
                        {filterRow('Annata', seasonFacets, available.length, season, setSeason)}
                      </div>

                      <motion.div
                        initial={reduce ? false : { clipPath: 'inset(0 0 100% 0)' }}
                        animate={{ clipPath: 'inset(0 0 0% 0)' }}
                        transition={{ delay: reduce ? 0 : 0.08, duration: 0.4, ease: EASE_OUT }}
                        className="min-h-0 flex-1 overflow-y-auto p-4"
                      >
                        {visible.length === 0 ? (
                          <p className="py-10 text-center type-body text-ink-2">Nessun album con questi filtri.</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {visible.map((a, i) => (
                              <motion.button
                                key={a.id}
                                type="button"
                                onClick={() => { onAdd(a.id); setOpen(false) }}
                                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8, filter: 'blur(6px)' }}
                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                transition={{ delay: reduce ? 0 : 0.12 + i * 0.03, type: 'spring', stiffness: 460, damping: 30 }}
                                className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] text-left transition-transform duration-150 ease-out hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
                              >
                                <span
                                  aria-hidden
                                  className="aspect-[4/3] w-full bg-cover bg-center"
                                  style={a.cover ? { backgroundImage: `url(${a.cover})` } : { background: `linear-gradient(145deg, ${a.c1}, ${a.c2})` }}
                                />
                                <span className="min-w-0 px-3 py-2.5">
                                  <span className="block truncate type-body font-semibold text-ink">{a.title}</span>
                                  <span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-wide text-ink-2">
                                    {a.editor} · {a.season} · {a.total} fig.
                                  </span>
                                </span>
                              </motion.button>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    </>
                  )}
                </motion.div>
              </motion.div>
            </div>
          ) : null}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}
