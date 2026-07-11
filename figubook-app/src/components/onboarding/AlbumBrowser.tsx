import { useMemo, useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { ALBUM_CATALOG } from '@/data/albumCatalog'
import { useCollection } from '@/hooks/useCollection'
import { addAlbum, removeAlbum } from '@/lib/db/albums'

const SPORTS = ['Calcio', 'Basket', 'F1'] as const

function Chip({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string
  active: boolean
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        'shrink-0 cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors ' +
        (active
          ? 'border-lime bg-lime/[0.12] text-lime'
          : disabled
            ? 'cursor-not-allowed border-white/10 text-ink-2/50'
            : 'border-white/12 text-ink-2 hover:border-white/25 hover:text-ink')
      }
    >
      {label}
      {disabled && <span className="ml-1 text-[10px] uppercase tracking-wide text-ink-2/40">presto</span>}
    </button>
  )
}

// Pannello sempre aperto: sfoglia il catalogo (con filtri) e aggiungi album al volo
// (scrittura live, indipendente dal Salva profilo). Tap = aggiungi, di nuovo = togli.
export function AlbumBrowser({ uid }: { uid: string }) {
  const { albums } = useCollection()
  const owned = new Set(albums.map((a) => a.id))
  const [busy, setBusy] = useState<string | null>(null)
  const [editor, setEditor] = useState('Tutti')
  const [season, setSeason] = useState('Tutte')

  const editors = useMemo(() => ['Tutti', ...Array.from(new Set(ALBUM_CATALOG.map((a) => a.editor)))], [])
  const seasons = useMemo(
    () => ['Tutte', ...Array.from(new Set(ALBUM_CATALOG.map((a) => a.season))).sort().reverse()],
    [],
  )
  const list = ALBUM_CATALOG.filter(
    (a) => (editor === 'Tutti' || a.editor === editor) && (season === 'Tutte' || a.season === season),
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
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">Sfoglia e scegli i tuoi album</h2>
        {owned.size > 0 && <span className="shrink-0 text-sm font-medium text-lime">{owned.size} scelti</span>}
      </div>

      {/* Filtri */}
      <div className="mt-4 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {SPORTS.map((s) => (
            <Chip key={s} label={s} active={s === 'Calcio'} disabled={s !== 'Calcio'} />
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {editors.map((e) => (
            <Chip key={e} label={e} active={editor === e} onClick={() => setEditor(e)} />
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {seasons.map((s) => (
            <Chip key={s} label={s} active={season === s} onClick={() => setSeason(s)} />
          ))}
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
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
                  {a.cover ? <img src={a.cover} alt="" className="h-full w-full object-cover" /> : a.season.slice(2)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-ink">{a.title}</span>
                  <span className="block truncate text-xs text-ink-2">
                    {a.editor} · {a.season} · {a.total} figurine
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
