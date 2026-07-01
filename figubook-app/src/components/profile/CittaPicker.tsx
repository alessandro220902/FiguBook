import { useEffect, useMemo, useRef, useState } from 'react'
import { MapPin, X } from 'lucide-react'
import { searchComuni } from '@/lib/geo/searchComuni'

const inputCls =
  'w-full rounded-xl border border-white/[0.1] bg-surface px-3.5 py-3 text-[16px] text-ink outline-none transition-colors placeholder:text-ink-2 focus:border-lime'

interface Props {
  value: string
  onChange: (v: string) => void
}

export function CittaPicker({ value, onChange }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  const hits = useMemo(() => (open ? searchComuni(query, 8) : []), [query, open])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-surface px-3.5 py-3">
        <MapPin className="h-4 w-4 shrink-0 text-lime" />
        <span className="min-w-0 flex-1 truncate text-[16px] text-ink">{value}</span>
        <button
          type="button"
          aria-label="Cambia città"
          onClick={() => { onChange(''); setQuery(''); setOpen(true) }}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-ink-2 hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div ref={boxRef} className="relative">
      <input
        className={inputCls}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Cerca il tuo comune…"
        autoComplete="off"
      />
      {open && hits.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-white/[0.1] bg-card p-1 shadow-2xl">
          {hits.map((h) => (
            <li key={h.label}>
              <button
                type="button"
                onClick={() => { onChange(h.label); setOpen(false); setQuery('') }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-ink hover:bg-white/[0.05]"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-2" />
                <span className="truncate">{h.nome}</span>
                <span className="ml-auto shrink-0 text-xs text-ink-2">{h.prov}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
