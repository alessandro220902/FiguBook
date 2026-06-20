import { useMemo, useState } from 'react'
import type { AlbumData, Section } from '@/data/albums/types'
import { sectionGradient, sectionVars } from '@/lib/album/color'
import { sectionStats } from '@/lib/album/stats'

export interface SectionSidebarProps {
  data: AlbumData
  states: Record<string, string>
  counts: Record<string, number>
  activeId: string
  onSelect: (sectionId: string) => void
}

export function SectionSidebar({ data, states, counts, activeId, onSelect }: SectionSidebarProps) {
  const [q, setQ] = useState('')

  // raggruppa sezioni per `group`, preservando l'ordine di data.groups
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
    <aside className="flex w-full shrink-0 flex-col rounded-2xl border border-white/8 bg-bg-elev p-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:w-60 lg:self-start">
      <h2 className="mb-3 shrink-0 font-display text-lg font-semibold">Sezioni</h2>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cerca sezione o #figurina"
        className="mb-4 w-full shrink-0 rounded-lg border border-white/10 bg-surface px-3 py-2 text-xs text-ink placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
      />
      {/* la lista scrolla internamente: header + ricerca restano pinnati */}
      <nav className="-mr-2 min-h-0 flex-1 space-y-1 overflow-y-auto pr-2">
        {grouped.map(({ group, sections }) => {
          const visible = sections.filter(match)
          if (visible.length === 0) return null
          return (
            <div key={group}>
              <div className="mt-3 px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{group}</div>
              {visible.map((s) => {
                const st = sectionStats(states, counts, s.codes)
                const active = s.id === activeId
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onSelect(s.id)}
                    style={active ? sectionVars(s.c1, s.c2) : undefined}
                    className={[
                      'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition',
                      active
                        ? 'bg-[linear-gradient(100deg,color-mix(in_srgb,var(--t1)_36%,transparent),color-mix(in_srgb,var(--t2)_22%,transparent))] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--t1)_50%,transparent)]'
                        : 'hover:bg-surface',
                    ].join(' ')}
                  >
                    <span className="h-6 w-6 shrink-0 rounded-md border border-white/15" style={{ backgroundImage: sectionGradient(s.c1, s.c2) }} />
                    <span className="font-display text-sm">{s.name}</span>
                    <span className="ml-auto text-right text-[10px] leading-tight text-muted-foreground">{st.have}/{st.total}<br />{st.pct}%</span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
