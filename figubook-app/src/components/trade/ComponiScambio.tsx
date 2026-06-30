import { useState } from 'react'

interface Props {
  username: string
  albumNames: Record<string, string>   // code -> nome figurina
  receiveCodes: string[]               // sue doubles ∩ mie missing
  giveCodes: string[]                  // mie doubles ∩ sue missing
  onSend: (give: string[], receive: string[]) => void
  onCancel: () => void
}

function useSelection(initial: string[]) {
  const [sel, setSel] = useState<Set<string>>(new Set(initial))
  const toggle = (c: string) =>
    setSel((s) => {
      const n = new Set(s)
      n.has(c) ? n.delete(c) : n.add(c)
      return n
    })
  return { sel, toggle }
}

export function ComponiScambio({
  username, albumNames, receiveCodes, giveCodes, onSend, onCancel,
}: Props) {
  const recv = useSelection(receiveCodes)
  const give = useSelection(giveCodes)
  const label = (c: string) => albumNames[c] ?? c

  const List = ({ codes, state }: { codes: string[]; state: ReturnType<typeof useSelection> }) => (
    <div className="flex flex-col gap-1 max-h-72 overflow-auto">
      {codes.length === 0 && <div className="text-sm text-muted-foreground">Niente qui.</div>}
      {codes.map((c) => (
        <label key={c} className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-white/[0.04] cursor-pointer">
          <input type="checkbox" checked={state.sel.has(c)} onChange={() => state.toggle(c)} />
          <span className="text-sm"><span className="text-muted-foreground">#{c}</span> {label(c)}</span>
        </label>
      ))}
    </div>
  )

  return (
    <div className="rounded-2xl border border-white/10 bg-card p-4 flex flex-col gap-4">
      <div className="font-semibold">Scambio con {username}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm font-medium text-lime mb-2">Ricevi</div>
          <List codes={receiveCodes} state={recv} />
        </div>
        <div>
          <div className="text-sm font-medium mb-2">Dai</div>
          <List codes={giveCodes} state={give} />
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        Ricevi {recv.sel.size} · Dai {give.sel.size}
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="rounded-xl px-4 py-2 border border-white/15">Annulla</button>
        <button
          disabled={recv.sel.size === 0 && give.sel.size === 0}
          onClick={() => onSend([...give.sel], [...recv.sel])}
          className="rounded-xl px-4 py-2 bg-lime text-black font-semibold disabled:opacity-40"
        >
          Invia proposta
        </button>
      </div>
    </div>
  )
}
