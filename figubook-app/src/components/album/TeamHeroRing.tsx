// Anello completamento squadra, pensato per stare SUL gradiente hero (no card).
// Arco bianco per leggibilità su qualsiasi colore squadra.
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
  return (
    <div className="flex shrink-0 flex-col items-center drop-shadow-md">
      <svg width="84" height="84" viewBox="0 0 84 84">
        <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="8" />
        <circle
          cx="42" cy="42" r={r} fill="none" stroke="#ffffff" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off}
          transform="rotate(-90 42 42)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x="42" y="47" textAnchor="middle" className="font-display" fontSize="18" fontWeight="700" fill="#ffffff">
          {pct}%
        </text>
      </svg>
      <div className="mt-1 font-mono text-[11px] tabular-nums text-white/80">
        {have} / {total}
      </div>
    </div>
  )
}
