import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { X } from 'lucide-react'
import { albumById } from '@/data/albumCatalog'
import type { DayDoublesPoint } from '@/lib/stats/dailyDoubles'

interface Slice {
  id: string
  name: string
  value: number // totale aggiunte del giorno per album (nuove + doppie)
  nuove: number
  doppie: number
  color: string
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: { payload: Slice }[] }) {
  if (!active || !payload?.length) return null
  const s = payload[0].payload
  return (
    <div className="rounded-lg border border-white/10 bg-bg-elev px-3 py-2 text-sm shadow-xl">
      <p className="font-semibold text-ink">{s.name}</p>
      <p className="text-ink-2">{s.doppie} doppie · {s.nuove} nuove</p>
    </div>
  )
}

// Overlay: torta delle aggiunte di un giorno divise per album (legenda a destra).
export function DayAlbumPie({ day, onClose }: { day: DayDoublesPoint; onClose: () => void }) {
  const slices: Slice[] = Object.entries(day.perAlbum).map(([id, v]) => ({
    id,
    name: albumById[id]?.title ?? id,
    value: v.nuove + v.doppie,
    nuove: v.nuove,
    doppie: v.doppie,
    color: albumById[id]?.c1 ?? '#888',
  }))
  const title = new Date(day.date + 'T00:00:00Z').toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Chiudi" className="grid h-8 w-8 place-items-center rounded-full text-ink-2 hover:bg-white/10 hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        {slices.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-2">Nessun dettaglio per album per questo giorno.</p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={slices} dataKey="value" nameKey="name" cx="40%" cy="50%" outerRadius={90}>
                  {slices.map((s) => <Cell key={s.id} fill={s.color} />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" wrapperStyle={{ fontSize: 13, color: 'var(--color-ink)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
