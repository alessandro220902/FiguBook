import { useState } from 'react'
import { Search } from 'lucide-react'
import { TEAMS, teamById } from '@/lib/teams'
import { TeamCrest } from '@/components/TeamCrest'

const inputCls =
  'w-full rounded-xl border border-white/[0.1] bg-surface px-3.5 py-3 text-[16px] text-ink outline-none transition-colors placeholder:text-ink-2 focus:border-lime'

// Picker squadra del cuore: barra ricerca + lista filtrata con stemma 2 colori.
export function TeamPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const sel = teamById[value]
  const filtered = q.trim()
    ? TEAMS.filter((t) => t.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 40)
    : TEAMS.slice(0, 40)

  return (
    <div className="relative">
      {sel ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2.5 rounded-xl border border-white/[0.1] bg-surface px-3.5 py-2.5 text-left transition-colors hover:border-white/20"
        >
          <TeamCrest teamId={sel.id} c1={sel.c1} c2={sel.c2} className="h-6 w-[22px] shrink-0" />
          <span className="flex-1 text-[16px] text-ink">{sel.name}</span>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              onChange('')
            }}
            className="text-xs text-ink-2 hover:text-ink"
          >
            Rimuovi
          </span>
        </button>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-2" />
          <input
            className={inputCls + ' pl-10'}
            placeholder="Cerca la tua squadra…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
          />
        </div>
      )}

      {open && !sel && (
        <div className="absolute z-30 mt-1.5 max-h-72 w-full overflow-auto rounded-xl border border-white/10 bg-card p-1 shadow-2xl">
          {filtered.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                onChange(t.id)
                setOpen(false)
                setQ('')
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/10"
            >
              <TeamCrest teamId={t.id} c1={t.c1} c2={t.c2} className="h-5 w-[18px] shrink-0" />
              <span className="text-[15px] text-ink">{t.name}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-3 text-sm text-ink-2">Nessuna squadra trovata.</p>
          )}
        </div>
      )}
    </div>
  )
}
