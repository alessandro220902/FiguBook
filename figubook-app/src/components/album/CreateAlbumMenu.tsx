import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Building2, Calendar, Check, ChevronDown, Plus, Search, X } from 'lucide-react'
import { ALBUM_CATALOG } from '@/data/albumCatalog'
import { ctrlPrimary } from '@/lib/album/controlStyles'

export interface CreateAlbumMenuProps {
  ownedIds: string[]
  onAdd: (id: string) => void
  className?: string
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const
const SPRING_MORPH = { type: 'spring', stiffness: 320, damping: 26, mass: 0.9 } as const

// Anno d'inizio della stagione: "2024/25" -> "2024", "2026" -> "2026".
function startYear(season: string): string {
  return season.match(/\d{4}/)?.[0] ?? season
}

type Option = { value: string; label: string }

// Dropdown "a elenco": trigger (icona + valore + chevron) che apre la lista
// sotto. Chiusura via click-fuori / Esc gestita a livello di pannello.
function FilterDropdown({
  icon: Icon, placeholder, options, value, open, onToggle, onPick,
}: {
  icon: typeof Calendar
  placeholder: string
  options: Option[]
  value: string
  open: boolean
  onToggle: () => void
  onPick: (v: string) => void
}) {
  const current = options.find((o) => o.value === value)
  return (
    <div className="relative flex-1">
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left text-sm text-ink transition-colors hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
      >
        <Icon className="h-4 w-4 shrink-0 text-ink-2" aria-hidden />
        <span className={`min-w-0 flex-1 truncate ${current ? 'text-ink' : 'text-ink-2'}`}>{current ? current.label : placeholder}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-ink-2 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className="absolute left-0 top-full z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-white/10 bg-bg-elev p-1 shadow-xl shadow-black/40"
          >
            {options.map((o) => {
              const on = o.value === value
              return (
                <li key={o.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => onPick(o.value)}
                    className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${on ? 'bg-white/10 text-ink' : 'text-ink-2 hover:bg-white/[0.06] hover:text-ink'}`}
                  >
                    <span className="truncate">{o.label}</span>
                    {on ? <Check className="h-4 w-4 shrink-0 text-lime" aria-hidden /> : null}
                  </button>
                </li>
              )
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

// Menu "Nuovo album": il trigger morfa (layoutId) in un pannello centrato
// con catalogo filtrabile per editoriale/annata. Esclude i posseduti.
export function CreateAlbumMenu({ ownedIds, onAdd, className }: CreateAlbumMenuProps) {
  const [open, setOpen] = useState(false)
  const [editor, setEditor] = useState('all')
  const [year, setYear] = useState('all')
  const [dd, setDd] = useState<'editor' | 'year' | null>(null)
  const [q, setQ] = useState('')
  const reduce = useReducedMotion()
  const layoutId = useId()
  const filtersRef = useRef<HTMLDivElement>(null)

  const owned = useMemo(() => new Set(ownedIds), [ownedIds])
  const available = useMemo(() => ALBUM_CATALOG.filter((a) => !owned.has(a.id)), [owned])

  // Opzioni da ciò che è disponibile. Anno = anno d'inizio, crescente.
  const editorOptions = useMemo<Option[]>(() => {
    const seen = [...new Set(available.map((a) => a.editor))]
    return [{ value: 'all', label: 'Tutti gli editori' }, ...seen.map((e) => ({ value: e, label: e }))]
  }, [available])
  const yearOptions = useMemo<Option[]>(() => {
    const seen = [...new Set(available.map((a) => startYear(a.season)))].sort((x, y) => Number(x) - Number(y))
    return [{ value: 'all', label: 'Tutti gli anni' }, ...seen.map((y) => ({ value: y, label: y }))]
  }, [available])

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return available.filter((a) =>
      (editor === 'all' || a.editor === editor) &&
      (year === 'all' || startYear(a.season) === year) &&
      (needle === '' || a.title.toLowerCase().includes(needle)),
    )
  }, [available, editor, year, q])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (dd) setDd(null); else setOpen(false) } }
    const onPointer = (e: PointerEvent) => { if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) setDd(null) }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('pointerdown', onPointer) }
  }, [open, dd])

  // Apre pulito: azzera i filtri all'apertura.
  const openMenu = () => { setEditor('all'); setYear('all'); setQ(''); setDd(null); setOpen(true) }

  const morph = reduce ? { duration: 0.15 } : SPRING_MORPH

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
                      <div className="border-b border-white/10 px-5 pt-3">
                        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 focus-within:border-lime/60">
                          <Search className="h-4 w-4 shrink-0 text-ink-2" aria-hidden />
                          <input
                            type="text"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Cerca album per nome…"
                            aria-label="Cerca album per nome"
                            className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-2 focus:outline-none"
                          />
                          {q ? (
                            <button type="button" onClick={() => setQ('')} aria-label="Pulisci ricerca" className="text-ink-2 transition-colors hover:text-ink">
                              <X className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div ref={filtersRef} className="relative z-10 flex items-center gap-2 border-b border-white/10 px-5 py-3">
                        <FilterDropdown
                          icon={Calendar}
                          placeholder="Anno"
                          options={yearOptions}
                          value={year}
                          open={dd === 'year'}
                          onToggle={() => setDd((d) => (d === 'year' ? null : 'year'))}
                          onPick={(v) => { setYear(v); setDd(null) }}
                        />
                        <FilterDropdown
                          icon={Building2}
                          placeholder="Editore"
                          options={editorOptions}
                          value={editor}
                          open={dd === 'editor'}
                          onToggle={() => setDd((d) => (d === 'editor' ? null : 'editor'))}
                          onPick={(v) => { setEditor(v); setDd(null) }}
                        />
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
