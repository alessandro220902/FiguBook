import { useState } from 'react'
import { ArrowRightLeft } from 'lucide-react'

interface Props {
  username: string
  albumNames: Record<string, string>   // code -> nome figurina
  receiveCodes: string[]               // sue doubles ∩ mie missing
  giveCodes: string[]                  // mie doubles ∩ sue missing
  onSend: (give: string[], receive: string[]) => void
  onCancel: () => void
  sending?: boolean
}

interface Selection {
  sel: Set<string>
  toggle: (c: string) => void
}

function useSelection(initial: string[]): Selection {
  const [sel, setSel] = useState<Set<string>>(new Set(initial))
  const toggle = (c: string) =>
    setSel((s) => {
      const n = new Set(s)
      if (n.has(c)) n.delete(c)
      else n.add(c)
      return n
    })
  return { sel, toggle }
}

// Lista di selezione (hoistata fuori dal render: no re-creazione componente).
function SelectList({
  codes, state, names,
}: {
  codes: string[]
  state: Selection
  names: Record<string, string>
}) {
  return (
    <div className="flex max-h-72 flex-col gap-0.5 overflow-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
      {codes.length === 0 && (
        <div className="px-2 py-3 text-sm text-muted-foreground">Niente da selezionare.</div>
      )}
      {codes.map((c) => {
        const on = state.sel.has(c)
        return (
          <label
            key={c}
            className={
              'flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors ' +
              (on ? 'bg-lime/10' : 'hover:bg-white/[0.05]')
            }
          >
            <input
              type="checkbox"
              checked={on}
              onChange={() => state.toggle(c)}
              className="h-4 w-4 shrink-0 accent-lime"
            />
            <span className="min-w-0 truncate">
              <span className="text-muted-foreground">#{c}</span> {names[c] ?? c}
            </span>
          </label>
        )
      })}
    </div>
  )
}

export function ComponiScambio({
  username, albumNames, receiveCodes, giveCodes, onSend, onCancel, sending = false,
}: Props) {
  // Selezione manuale: si parte da zero, l'utente spunta cosa vuole.
  const recv = useSelection([])
  const give = useSelection([])

  const canSend = recv.sel.size > 0 || give.sel.size > 0

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-card p-5">
      <div className="flex items-center gap-2">
        <ArrowRightLeft className="h-4 w-4 text-lime" />
        <span className="font-semibold text-ink">Scambio con {username}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-sm font-medium text-lime">Ricevi</span>
            <span className="text-xs text-muted-foreground">{recv.sel.size} di {receiveCodes.length}</span>
          </div>
          <SelectList codes={receiveCodes} state={recv} names={albumNames} />
        </div>
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-sm font-medium text-ink">Dai</span>
            <span className="text-xs text-muted-foreground">{give.sel.size} di {giveCodes.length}</span>
          </div>
          <SelectList codes={giveCodes} state={give} names={albumNames} />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Ricevi <span className="font-semibold text-ink">{recv.sel.size}</span> · Dai{' '}
          <span className="font-semibold text-ink">{give.sel.size}</span>
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="rounded-xl border border-white/15 px-4 py-2 text-ink transition-colors hover:bg-white/[0.05] active:scale-[0.98]"
          >
            Annulla
          </button>
          <button
            disabled={!canSend || sending}
            onClick={() => onSend([...give.sel], [...recv.sel])}
            className="rounded-xl bg-lime px-4 py-2 font-semibold text-black transition-opacity hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
          >
            {sending ? 'Invio…' : 'Invia proposta'}
          </button>
        </div>
      </div>
    </div>
  )
}
