import { pctColor } from '@/lib/stats/pctColor'

// Anello completamento squadra, pensato per stare SUL gradiente hero (no card).
// Arco e percentuale riprendono il colore per completamento (rosso->giallo->verde).
export function TeamHeroRing({
  pct,
  have,
  total,
}: {
  pct: number
  have: number
  total: number
}) {
  const r = 34
  const circ = 2 * Math.PI * r
  const off = circ * (1 - Math.max(0, Math.min(100, pct)) / 100)
  const color = pctColor(pct)
  return (
    <div className="flex shrink-0 flex-col items-center drop-shadow-md">
      <svg width="92" height="92" viewBox="0 0 84 84">
        <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="8" />
        <circle
          cx="42" cy="42" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off}
          transform="rotate(-90 42 42)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x="42" y="47" textAnchor="middle" className="font-display" fontSize="19" fontWeight="700" fill={color}>
          {pct}%
        </text>
      </svg>
      <div className="mt-1.5 font-mono text-sm tabular-nums text-white/90">
        {have} / {total}
      </div>
    </div>
  )
}
