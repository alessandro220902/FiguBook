import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BUCKET_LABELS, bucketScale } from '@/lib/stats/dailyInserted'
import type { DayDoublesPoint } from '@/lib/stats/dailyDoubles'

const GREEN = '#22c55e' // "nuove" — verde esplicito (NON --color-lime, che su Home è oro)
const RED = '#ef4444' // "doppie" — rosso esplicito
const WD3 = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']

function wd3(iso: string): string {
  return WD3[new Date(iso + 'T00:00:00Z').getUTCDay()]
}

type Row = DayDoublesPoint & { nuoveY: number; doppieY: number }

function DoublesTooltip({ active, payload }: { active?: boolean; payload?: { payload: Row }[] }) {
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

// Grafico ②: due barre per giorno — nuove (verde) e doppie (rosso). Scala Y a
// bucket come InsertedChart (5/10/20/50/100+). Click barra → onSelectDay(date).
export function DoublesChart({
  series, onSelectDay,
}: {
  series: DayDoublesPoint[]
  onSelectDay: (date: string) => void
}) {
  const hasData = series.some((p) => p.nuove > 0 || p.doppie > 0)
  const rows: Row[] = series.map((p) => ({ ...p, nuoveY: bucketScale(p.nuove), doppieY: bucketScale(p.doppie) }))

  return (
    <div className="flex h-full min-h-[240px] flex-col rounded-2xl border border-[color:var(--card-hair)] bg-surface p-5 shadow-[var(--card-shadow)] sm:p-6">
      <h2 className="type-section">Doppie e nuove</h2>
      <p className="text-xs text-muted-foreground">Ultimi 7 giorni</p>

      {!hasData ? (
        <div className="mt-4 flex grow flex-col items-center justify-center rounded-xl border border-dashed border-[color:var(--card-hair-strong)] px-4 py-8 text-center">
          <p className="text-sm text-ink-2">Ancora nessun dato.</p>
          <p className="mt-1 text-xs text-muted-foreground">Il grafico crescerà nei prossimi giorni.</p>
        </div>
      ) : (
        <div className="mt-4 grow">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rows}
              barCategoryGap="22%"
              margin={{ top: 18, right: 12, left: 4, bottom: 8 }}
              onClick={(e: { activeLabel?: string | number }) => {
                if (typeof e?.activeLabel === 'string') onSelectDay(e.activeLabel)
              }}
            >
              <CartesianGrid horizontal vertical={false} stroke="var(--grid-line)" />
              <XAxis dataKey="date" tickFormatter={wd3} tick={{ fill: 'var(--color-ink-2)', fontSize: 12 }} axisLine={false} tickLine={false} interval={0} />
              <YAxis
                type="number"
                domain={[0, BUCKET_LABELS.length - 1]}
                ticks={BUCKET_LABELS.map((_, i) => i)}
                tickLine={false}
                axisLine={false}
                width={46}
                tick={{ fill: 'var(--color-ink-2)', fontSize: 13 }}
                tickFormatter={(v: number) => BUCKET_LABELS[v] ?? ''}
              />
              <Tooltip cursor={{ fill: 'var(--color-ink-2)', fillOpacity: 0.08 }} content={<DoublesTooltip />} />
              <Bar dataKey="nuoveY" fill={GREEN} radius={[3, 3, 0, 0]} cursor="pointer" isAnimationActive={false} />
              <Bar dataKey="doppieY" fill={RED} radius={[3, 3, 0, 0]} cursor="pointer" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
