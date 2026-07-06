// src/components/home/HeroRing.tsx
import { AnimatedNumber } from './AnimatedNumber'
import { pctColor } from '@/lib/stats/pctColor'

// Anello di completamento globale. pct 0..100. Colore per percentuale
// (rosso -> giallo -> verde), scala gauge 21st.
export function HeroRing({
  pct, have, total, delta,
}: {
  pct: number
  have: number
  total: number
  delta: number | null
}) {
  const color = pctColor(pct)
  const r = 34
  const circ = 2 * Math.PI * r
  const off = circ * (1 - Math.max(0, Math.min(100, pct)) / 100)
  return (
    <div
      className="col-span-2 flex items-center gap-4 rounded-2xl border px-4 py-3.5 shadow-[var(--card-shadow)] sm:col-span-1"
      style={{
        background: `color-mix(in srgb, ${color} 10%, var(--color-surface))`,
        borderColor: `color-mix(in srgb, ${color} 28%, transparent)`,
      }}
    >
      <svg width="84" height="84" viewBox="0 0 84 84" className="shrink-0">
        <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle
          cx="42" cy="42" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off}
          transform="rotate(-90 42 42)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x="42" y="47" textAnchor="middle" className="fill-ink font-display" fontSize="18" fontWeight="700">
          {pct}%
        </text>
      </svg>
      <div className="min-w-0">
        <div className="text-xs text-ink md:text-sm">Collezione totale</div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <AnimatedNumber
            value={have}
            className="type-stat text-3xl text-ink md:text-4xl"
          />
          <span className="font-display text-sm tabular-nums text-ink-2">
            / {total.toLocaleString('it-IT')}
          </span>
        </div>
        {delta != null && delta > 0 && (
          <span
            className="mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs"
            style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
          >
            +{delta} settimana
          </span>
        )}
      </div>
    </div>
  )
}
