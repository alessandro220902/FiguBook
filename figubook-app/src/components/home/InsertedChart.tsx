import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BUCKET_LABELS, bucketScale, type InsertedPoint } from '@/lib/stats/dailyInserted'

const LIME = '#c2f23d'
const WD = ['D', 'L', 'M', 'M', 'G', 'V', 'S']
const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']

// 'YYYY-MM-DD' → {wd, day, full}
function parts(iso: string) {
  const d = new Date(iso + 'T00:00:00Z')
  return {
    wd: WD[d.getUTCDay()],
    day: d.getUTCDate(),
    full: `${d.getUTCDate()} ${MESI[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
  }
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
            <AreaChart data={rows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="insertedFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={LIME} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={LIME} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--color-ink-2)', fontSize: 11 }}
                tickFormatter={(iso: string) => { const p = parts(iso); return `${p.wd} ${p.day}` }}
                interval={0}
              />
              <YAxis
                type="number"
                domain={[0, BUCKET_LABELS.length - 1]}
                ticks={BUCKET_LABELS.map((_, i) => i)}
                tickLine={false}
                axisLine={false}
                width={36}
                tick={{ fill: 'var(--color-ink-2)', fontSize: 11 }}
                tickFormatter={(v: number) => BUCKET_LABELS[v] ?? ''}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.12)' }} />
              <Area
                type="monotone"
                dataKey="y"
                stroke={LIME}
                strokeWidth={2}
                fill="url(#insertedFill)"
                dot={{ r: 2.5, fill: LIME, strokeWidth: 0 }}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
