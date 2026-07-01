import { X } from 'lucide-react'

interface Props {
  fromLabel: string          // es. "Alessandro22 dà"
  toLabel: string            // es. "yepes dà"
  fromCodes: string[]
  toCodes: string[]
  names: Record<string, string>
  onClose: () => void
}

function List({ label, codes, names }: { label: string; codes: string[]; names: Record<string, string> }) {
  return (
    <div>
      <div className="mb-2 text-sm font-semibold text-lime">{label} ({codes.length})</div>
      <div className="flex max-h-64 flex-col gap-0.5 overflow-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
        {codes.length === 0 && <div className="px-2 py-3 text-sm text-muted-foreground">Nessuna carta.</div>}
        {codes.map((c) => (
          <div key={c} className="rounded-lg px-2 py-1.5 text-sm">
            <span className="text-muted-foreground">#{c}</span> {names[c] ?? c}
          </div>
        ))}
      </div>
    </div>
  )
}

export function CardsDialog({ fromLabel, toLabel, fromCodes, toCodes, names, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-card p-5 shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Chiudi"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-white/12 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <h3 className="mb-4 font-display text-lg font-bold text-ink">Carte dello scambio</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <List label={fromLabel} codes={fromCodes} names={names} />
          <List label={toLabel} codes={toCodes} names={names} />
        </div>
      </div>
    </div>
  )
}
