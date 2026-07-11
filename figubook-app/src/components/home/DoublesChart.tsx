import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DayDoublesPoint } from '@/lib/stats/dailyDoubles'

const GREEN = '#22c55e' // "nuove" — verde esplicito (NON --color-lime, che su Home è oro)
const RED = '#ef4444' // "doppie" — rosso esplicito
const WD3 = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']

function wd3(iso: string): string {
  return WD3[new Date(iso + 'T00:00:00Z').getUTCDay()]
}

function DoublesTooltip({ active, payload }: { active?: boolean; payload?: { payload: DayDoublesPoint }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border border-white/10 bg-bg-elev px-3 py-2 text-sm shadow-xl">
      <p className="font-semibold text-ink">{new Date(d.date + 'T00:00:00Z').toLocaleDateString('it-IT')}</p>
      <p className="text-ink-2"><span style={{ color: GREEN }}>●</span> {d.nuove} nuove</p>
      <p className="text-ink-2"><span style={{ color: RED }}>●</span> {d.doppie} doppie</p>
      <p className="mt-1 text-xs text-ink-2">Clicca per il dettaglio per album</p>
    </div>
  )
}

// Grafico ②: due barre per giorno — nuove (verde) e doppie (rosso).
// Click su una barra → onSelectDay(date) (apre la torta del giorno).
export function DoublesChart({
  series, onSelectDay,
}: {
  series: DayDoublesPoint[]
  onSelectDay: (date: string) => void
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={series}
          barCategoryGap="20%"
          onClick={(e: { activeLabel?: string | number }) => { const d = e?.activeLabel; if (typeof d === 'string') onSelectDay(d) }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink-2)" strokeOpacity={0.15} vertical={false} />
          <XAxis dataKey="date" tickFormatter={wd3} tick={{ fill: 'var(--color-ink-2)', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: 'var(--color-ink-2)', fontSize: 12 }} axisLine={false} tickLine={false} width={28} />
          <Tooltip cursor={{ fill: 'var(--color-ink-2)', fillOpacity: 0.08 }} content={<DoublesTooltip />} />
          <Bar dataKey="nuove" fill={GREEN} radius={[3, 3, 0, 0]} cursor="pointer" />
          <Bar dataKey="doppie" fill={RED} radius={[3, 3, 0, 0]} cursor="pointer" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
