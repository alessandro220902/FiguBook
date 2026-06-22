import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import type { AlbumData, Section } from '@/data/albums/types'
import { sectionGradient, sectionVars } from '@/lib/album/color'
import { sectionStats } from '@/lib/album/stats'

export interface SectionAccordionProps {
  data: AlbumData
  states: Record<string, string>
  counts: Record<string, number>
  /** id della sezione aperta, oppure null se tutte chiuse (single-open) */
  openId: string | null
  onToggle: (sectionId: string) => void
  /** dettaglio (hero + griglia) della sezione aperta, fornito dal parent */
  renderDetail: () => ReactNode
}

// Accordion mobile-only: lista sezioni raggruppata; una sola sezione aperta per
// volta (single-open) così la pagina resta compatta. Il dettaglio della sezione
// aperta è renderizzato dal parent (riusa SectionHero + StickerGrid).
export function SectionAccordion({ data, states, counts, openId, onToggle, renderDetail }: SectionAccordionProps) {
  const [q, setQ] = useState('')
  // Porta l'header della sezione appena aperta sotto la barra in alto.
  const openRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (openId) requestAnimationFrame(() => openRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }, [openId])

  const grouped = useMemo(() => {
    const map = new Map<string, Section[]>()
    for (const s of data.sections) {
      if (!map.has(s.group)) map.set(s.group, [])
      map.get(s.group)!.push(s)
    }
    const order = data.groups.length ? data.groups : [...map.keys()]
    return order.filter((g) => map.has(g)).map((g) => ({ group: g, sections: map.get(g)! }))
  }, [data])

  const needle = q.trim().toLowerCase()
  const match = (s: Section) =>
    !needle ||
    s.name.toLowerCase().includes(needle) ||
    s.codes.some((c) => c.toLowerCase().includes(needle.replace('#', '')))

  return (
    <section className="flex flex-col rounded-2xl border border-white/8 bg-bg-elev p-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cerca sezione o #figurina"
        className="mb-3 w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
      />
      <div className="space-y-1">
        {grouped.map(({ group, sections }) => {
          const visible = sections.filter(match)
          if (visible.length === 0) return null
          return (
            <div key={group}>
              <div className="mb-1 mt-3 px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{group}</div>
              {visible.map((s) => {
                const st = sectionStats(states, counts, s.codes)
                const open = s.id === openId
                return (
                  <div key={s.id} ref={open ? openRef : undefined} className="scroll-mt-20">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => onToggle(s.id)}
                      style={open ? sectionVars(s.c1, s.c2) : undefined}
                      className={[
                        'flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-left transition-transform duration-150 ease-out active:scale-[0.99]',
                        open
                          ? 'bg-[linear-gradient(100deg,color-mix(in_srgb,var(--t1)_36%,transparent),color-mix(in_srgb,var(--t2)_22%,transparent))] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--t1)_50%,transparent)]'
                          : 'hover:bg-surface',
                      ].join(' ')}
                    >
                      <span className="h-7 w-7 shrink-0 rounded-md border border-white/15" style={{ backgroundImage: sectionGradient(s.c1, s.c2) }} />
                      <span className="text-sm font-medium">{s.name}</span>
                      {open && <Check size={14} className="shrink-0 text-lime" strokeWidth={3} />}
                      <span className="ml-auto text-right text-[10px] leading-tight text-muted-foreground">{st.have}/{st.total}<br />{st.pct}%</span>
                      <ChevronDown size={16} className={`shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                    </button>
                    {open && <div className="pb-2 pt-3">{renderDetail()}</div>}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </section>
  )
}
