import { Trophy, Medal } from 'lucide-react'

export function ScoreTiles({ punti, posizione }: { punti: number; posizione: number }) {
  const tiles = [
    { icon: Trophy, value: String(Math.round(punti)), label: 'Punti stagione' },
    { icon: Medal, value: `#${posizione}`, label: 'Posizione' },
  ]
  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      {tiles.map((t, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-surface/40 px-4 py-4">
          <t.icon className="h-8 w-8 shrink-0 text-lime" />
          <div className="min-w-0">
            <p className="text-2xl font-bold text-ink">{t.value}</p>
            <p className="text-sm text-ink-2">{t.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
