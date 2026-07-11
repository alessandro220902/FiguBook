import { useState } from 'react'
import { useInsertedSeries } from '@/hooks/useInsertedSeries'
import { useDoublesSeries } from '@/hooks/useDoublesSeries'
import { InsertedChart } from '@/components/home/InsertedChart'
import { DoublesChart } from '@/components/home/DoublesChart'
import { DayAlbumPie } from '@/components/home/DayAlbumPie'
import type { DayDoublesPoint } from '@/lib/stats/dailyDoubles'

const TABS = [
  { key: 'aggiunte', label: 'Aggiunte' },
  { key: 'doppie', label: 'Doppie e nuove' },
] as const

// Sezione grafico con toggle: ① aggiunte (area) / ② doppie-nuove (barre + torta).
export function ChartPanel({ refreshKey }: { refreshKey?: unknown }) {
  const [view, setView] = useState<'aggiunte' | 'doppie'>('aggiunte')
  const [day, setDay] = useState<DayDoublesPoint | null>(null)
  const inserted = useInsertedSeries(refreshKey)
  const doubles = useDoublesSeries(refreshKey)

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 inline-flex shrink-0 rounded-full border border-white/10 bg-surface/60 p-0.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setView(t.key)}
            className={
              'cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ' +
              (view === t.key ? 'bg-lime text-lime-ink' : 'text-ink hover:text-ink')
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1">
        {view === 'aggiunte' ? (
          <InsertedChart series={inserted} />
        ) : (
          <DoublesChart series={doubles} onSelectDay={(d) => setDay(doubles.find((x) => x.date === d) ?? null)} />
        )}
      </div>

      {day && <DayAlbumPie day={day} onClose={() => setDay(null)} />}
    </div>
  )
}
