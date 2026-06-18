import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'
import { STAT_COLORS } from './statColors'

// Anello completamento: arco verde proporzionale a pct, % al centro.
// Pattern da 21st stats-2 (RadialBarChart + PolarAngleAxis).
export function CompletionRing({
  pct,
  size = 120,
  color = STAT_COLORS.have,
}: {
  pct: number
  size?: number
  color?: string
}) {
  const data = [{ value: pct }]
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <RadialBarChart
        width={size}
        height={size}
        innerRadius="72%"
        outerRadius="100%"
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar
          dataKey="value"
          cornerRadius={size}
          fill={color}
          background={{ fill: STAT_COLORS.track }}
        />
      </RadialBarChart>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-mono text-2xl font-bold text-ink">{pct}%</span>
      </div>
    </div>
  )
}
