import type { Key } from 'react'
import { Area, AreaChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BUCKET_LABELS, bucketScale, type InsertedPoint } from '@/lib/stats/dailyInserted'

const LIME = '#c2f23d'
const WD3 = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']

// 'YYYY-MM-DD' → {wd3, ddmm, full}
function parts(iso: string) {
  const d = new Date(iso + 'T00:00:00Z')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  return {
    wd3: WD3[d.getUTCDay()],
    ddmm: `${dd}.${mm}`,
    full: `${d.getUTCDate()} ${MESI[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
  }
}

// Tick asse X su due righe: giorno (3 lettere, "Oggi" per l'ultimo) + data gg.mm.
function XTick(props: { x?: number; y?: number; payload?: { value: string }; index?: number; last?: number }) {
  const { x = 0, y = 0, payload, index = 0, last = 0 } = props
  if (!payload) return null
  const p = parts(payload.value)
  const isToday = index === last
  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="middle">
        <tspan x={0} dy={16} fontSize={13} fontWeight={isToday ? 700 : 600} fill="var(--color-ink)">
          {isToday ? 'Oggi' : p.wd3}
        </tspan>
        <tspan x={0} dy={16} fontSize={12} fill="var(--color-ink-2)">{p.ddmm}</tspan>
      </text>
    </g>
  )
}

// Numero figurine sopra il punto (solo se > 0).
function CountLabel(props: { x?: number; y?: number; value?: number }) {
  const { x = 0, y = 0, value } = props
  if (!value) return null
  return (
    <text x={x} y={y - 11} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--color-ink)">
      {value}
    </text>
  )
}

type Row = InsertedPoint & { y: number }

function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Row }> }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border border-white/10 bg-bg-elev px-2.5 py-1.5 text-xs shadow-lg">
      <div className="font-medium text-ink">{parts(p.date).full}</div>
      <div className="text-ink-2">{p.count} inserite</div>
    </div>
  )
}

// Area-chart "figurine inserite giorno per giorno" (rolling 7gg). Asse Y a buckets.
export function InsertedChart({ series }: { series: InsertedPoint[] }) {
  const hasData = series.some((p) => p.count > 0)
  const rows: Row[] = series.map((p) => ({ ...p, y: bucketScale(p.count) }))

  return (
    <div className="flex h-full min-h-[240px] flex-col rounded-2xl border border-white/[0.08] bg-surface p-5 sm:p-6">
      <h2 className="type-section">Figurine inserite</h2>
      <p className="text-xs text-muted-foreground">Ultimi 7 giorni</p>

      {!hasData ? (
        <div className="mt-4 flex grow flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-4 py-8 text-center">
          <p className="text-sm text-ink-2">Ancora nessun dato.</p>
          <p className="mt-1 text-xs text-muted-foreground">Il grafico crescerà nei prossimi giorni.</p>
        </div>
      ) : (
        <div className="mt-4 grow">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={{ top: 18, right: 12, left: 4, bottom: 8 }}>
              <defs>
                <linearGradient id="insertedFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={LIME} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={LIME} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid horizontal vertical={false} stroke="rgba(255,255,255,0.055)" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                interval={0}
                height={46}
                tick={<XTick last={rows.length - 1} />}
              />
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
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.12)' }} />
              <Area
                type="monotone"
                dataKey="y"
                stroke={LIME}
                strokeWidth={2}
                fill="url(#insertedFill)"
                dot={(props: { cx?: number; cy?: number; payload?: Row; key?: Key | null }) =>
                  props.payload && props.payload.count > 0
                    ? <circle key={props.key} cx={props.cx} cy={props.cy} r={3} fill={LIME} />
                    : <g key={props.key} />
                }
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              >
                <LabelList dataKey="count" content={<CountLabel />} />
              </Area>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
