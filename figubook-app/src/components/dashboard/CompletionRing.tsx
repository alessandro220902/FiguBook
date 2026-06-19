import { motion, useReducedMotion } from 'framer-motion'
import { STAT_COLORS } from './statColors'
import { AnimatedNumber } from './AnimatedNumber'

// Anello completamento: arco proporzionale a pct, % al centro.
// SVG nativo (niente recharts) — zero dipendenza chart, un solo <circle> animato.
export function CompletionRing({
  pct,
  size = 120,
  color = STAT_COLORS.have,
  track = STAT_COLORS.track,
}: {
  pct: number
  size?: number
  color?: string
  track?: string
}) {
  const reduce = useReducedMotion()
  const stroke = Math.max(4, Math.round(size * 0.16))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, pct))
  const offset = c * (1 - clamped / 100)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        {/* parte da ore 12, in senso orario */}
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={track}
            strokeWidth={stroke}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={reduce ? false : { strokeDashoffset: c }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: reduce ? 0 : 1.1, ease: [0.22, 1, 0.36, 1] }}
          />
        </g>
      </svg>
      <div
        className="absolute inset-0 grid place-items-center"
        style={{ fontSize: Math.round(size * 0.24) }}
      >
        <AnimatedNumber
          value={pct}
          suffix="%"
          className="font-medium tabular-nums tracking-tight text-ink"
        />
      </div>
    </div>
  )
}
