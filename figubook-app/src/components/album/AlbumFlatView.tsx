import { useMemo, useState } from 'react'
import type { AlbumData, Section } from '@/data/albums/types'
import { passes, type Filter } from '@/lib/album/filter'
import { StickerCard } from './StickerCard'
import { Pagination } from '@/components/ui/pagination'
import { ctrlFilter, CTRL_BADGE_ON, CTRL_BADGE_OFF } from '@/lib/album/controlStyles'

const PAGE_SIZE = 60

export interface AlbumFlatViewProps {
  data: AlbumData
  countOf: (code: string) => number
  onAdd: (code: string) => void
  onRemove: (code: string) => void
  onInfo: (code: string) => void
  stats: { total: number; missing: number; doubles: number; have: number }
}

const TABS: { key: Filter; label: string; n: (s: AlbumFlatViewProps['stats']) => number }[] = [
  { key: 'all', label: 'Tutte', n: (s) => s.total },
  { key: 'missing', label: 'Mancanti', n: (s) => s.missing },
  { key: 'double', label: 'Doppie', n: (s) => s.doubles },
  { key: 'have', label: 'Possedute', n: (s) => s.have },
]

export function AlbumFlatView({ data, countOf, onAdd, onRemove, onInfo, stats }: AlbumFlatViewProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [insertOn, setInsertOn] = useState(false)
  const [page, setPage] = useState(1)

  // code -> sezione (per colore squadra della box)
  const sectionByCode = useMemo(() => {
    const m = new Map<string, Section>()
    for (const s of data.sections) for (const c of s.codes) m.set(c, s)
    return m
  }, [data])

  const allCodes = useMemo(() => data.sections.flatMap((s) => s.codes), [data])
  const filtered = useMemo(() => allCodes.filter((c) => passes(filter, countOf(c))), [allCodes, filter, countOf])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const slice = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  function changeFilter(f: Filter) {
    setFilter(f)
    setPage(1)
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => {
          const on = filter === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => changeFilter(t.key)}
              aria-pressed={on}
              className={ctrlFilter(on)}
            >
              {t.label} <span className={on ? CTRL_BADGE_ON : CTRL_BADGE_OFF}>{t.n(stats)}</span>
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setInsertOn((v) => !v)}
          aria-pressed={insertOn}
          className={`${ctrlFilter(insertOn)} ml-auto`}
        >
          Inserimento rapido
        </button>
      </div>

      {slice.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Nessuna figurina in questo filtro.</p>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-[repeat(auto-fill,minmax(7rem,1fr))]">
          {slice.map((code) => {
            const sec = sectionByCode.get(code)
            return (
              <StickerCard
                key={code}
                code={code}
                name={data.names[code]}
                c1={sec?.c1 ?? '#444'}
                c2={sec?.c2 ?? '#222'}
                count={countOf(code)}
                insertOn={insertOn}
                onAdd={() => onAdd(code)}
                onRemove={() => onRemove(code)}
                onInfo={() => onInfo(code)}
              />
            )
          })}
        </div>
      )}

      <div className="mt-6">
        <Pagination page={current} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  )
}
