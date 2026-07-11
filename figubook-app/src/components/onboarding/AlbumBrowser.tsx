import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Plus, Trophy, Building2, Calendar } from 'lucide-react'
import { ALBUM_CATALOG } from '@/data/albumCatalog'
import { useCollection } from '@/hooks/useCollection'
import { addAlbum, removeAlbum } from '@/lib/db/albums'

// Anno d'inizio della stagione: "2024/25" -> "2024", "2026" -> "2026".
function startYear(season: string): string {
  return season.match(/\d{4}/)?.[0] ?? season
}

type Option = { value: string; label: string; disabled?: boolean }

// Dropdown a cascata: trigger + lista sotto. Chiusura via click-fuori dal genitore.
function Select({
  icon: Icon, options, value, open, onToggle, onPick,
}: {
  icon: typeof Calendar
  options: Option[]
  value: string
  open: boolean
  onToggle: () => void
  onPick: (v: string) => void
}) {
  const current = options.find((o) => o.value === value)
  return (
    <div className="relative flex-1">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-white/12 bg-white/[0.03] px-3 py-2.5 text-left text-sm text-ink transition-colors hover:bg-white/[0.06]"
      >
        <Icon className="h-4 w-4 shrink-0 text-ink-2" aria-hidden />
        <span className="min-w-0 flex-1 truncate">{current?.label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-ink-2 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="absolute left-0 top-full z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-white/10 bg-bg-elev p-1 shadow-xl shadow-black/40">
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                disabled={o.disabled}
                onClick={() => onPick(o.value)}
                className={
                  'flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ' +
                  (o.disabled
                    ? 'cursor-not-allowed text-ink-2/40'
                    : o.value === value
                      ? 'bg-white/10 text-ink'
                      : 'text-ink-2 hover:bg-white/[0.06] hover:text-ink')
                }
              >
                <span className="truncate">
                  {o.label}
                  {o.disabled && <span className="ml-1 text-[10px] uppercase tracking-wide">presto</span>}
                </span>
                {o.value === value && !o.disabled && <Check className="h-4 w-4 shrink-0 text-lime" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Pannello sempre aperto: sfoglia il catalogo (filtri a cascata) e aggiungi album
// al volo (scrittura live). Tap = aggiungi, di nuovo = togli. Scroll interno.
export function AlbumBrowser({ uid }: { uid: string }) {
  const { albums } = useCollection()
  const owned = new Set(albums.map((a) => a.id))
  const [busy, setBusy] = useState<string | null>(null)
  const [sport, setSport] = useState('calcio')
  const [editor, setEditor] = useState('all')
  const [year, setYear] = useState('all')
  const [dd, setDd] = useState<'sport' | 'editor' | 'year' | null>(null)
  const filtersRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) setDd(null)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const sportOpts: Option[] = [
    { value: 'calcio', label: 'Calcio' },
    { value: 'basket', label: 'Basket', disabled: true },
    { value: 'f1', label: 'F1', disabled: true },
  ]
  const editorOpts: Option[] = useMemo(
    () => [{ value: 'all', label: 'Tutti gli editori' }, ...[...new Set(ALBUM_CATALOG.map((a) => a.editor))].map((e) => ({ value: e, label: e }))],
    [],
  )
  const yearOpts: Option[] = useMemo(() => {
    const ys = [...new Set(ALBUM_CATALOG.map((a) => startYear(a.season)))].sort((x, y) => Number(y) - Number(x))
    return [{ value: 'all', label: 'Tutte le annate' }, ...ys.map((y) => ({ value: y, label: y }))]
  }, [])

  const list = ALBUM_CATALOG.filter(
    (a) => (editor === 'all' || a.editor === editor) && (year === 'all' || startYear(a.season) === year),
  )

  async function toggle(id: string) {
    if (busy) return
    setBusy(id)
    try {
      if (owned.has(id)) await removeAlbum(uid, id)
      else await addAlbum(uid, id)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">Sfoglia e scegli i tuoi album</h2>
        {owned.size > 0 && <span className="shrink-0 text-sm font-medium text-lime">{owned.size} scelti</span>}
      </div>

      <div ref={filtersRef} className="mt-4 flex gap-2">
        <Select icon={Trophy} options={sportOpts} value={sport} open={dd === 'sport'}
          onToggle={() => setDd((d) => (d === 'sport' ? null : 'sport'))}
          onPick={(v) => { setSport(v); setDd(null) }} />
        <Select icon={Building2} options={editorOpts} value={editor} open={dd === 'editor'}
          onToggle={() => setDd((d) => (d === 'editor' ? null : 'editor'))}
          onPick={(v) => { setEditor(v); setDd(null) }} />
        <Select icon={Calendar} options={yearOpts} value={year} open={dd === 'year'}
          onToggle={() => setDd((d) => (d === 'year' ? null : 'year'))}
          onPick={(v) => { setYear(v); setDd(null) }} />
      </div>

      <ul className="mt-4 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {list.map((a) => {
          const isOwned = owned.has(a.id)
          return (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => toggle(a.id)}
                disabled={busy === a.id}
                className={
                  'flex w-full cursor-pointer items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ' +
                  (isOwned ? 'border-lime bg-lime/[0.06]' : 'border-white/10 hover:border-white/25')
                }
              >
                <span
                  className="grid h-14 w-11 shrink-0 place-items-center overflow-hidden rounded-md font-display text-lg font-bold text-white/80"
                  style={{ background: `linear-gradient(135deg, ${a.c1}, ${a.c2})` }}
                >
                  {a.cover ? <img src={a.cover} alt="" className="h-full w-full object-cover" /> : startYear(a.season).slice(2)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-ink">{a.title}</span>
                  <span className="block truncate text-xs text-ink-2">
                    {a.editor} · {startYear(a.season)} · {a.total} figurine
                  </span>
                </span>
                <span
                  className={
                    'grid h-7 w-7 shrink-0 place-items-center rounded-full transition-colors ' +
                    (isOwned ? 'bg-lime text-lime-ink' : 'border border-white/20 text-ink-2')
                  }
                >
                  {isOwned ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </span>
              </button>
            </li>
          )
        })}
        {list.length === 0 && <li className="px-1 py-4 text-sm text-ink-2">Nessun album con questi filtri.</li>}
      </ul>
    </div>
  )
}
