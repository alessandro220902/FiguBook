import { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { ALBUM_CATALOG } from '@/data/albumCatalog'
import { useCollection } from '@/hooks/useCollection'
import { addAlbum, removeAlbum } from '@/lib/db/albums'

// Pannello sempre aperto: sfoglia il catalogo e aggiungi album al volo (scrittura
// live, indipendente dal Salva del profilo). Tap = aggiungi, tap di nuovo = togli.
export function AlbumBrowser({ uid }: { uid: string }) {
  const { albums } = useCollection()
  const owned = new Set(albums.map((a) => a.id))
  const [busy, setBusy] = useState<string | null>(null)

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
      <p className="mt-1 text-sm text-ink-2">
        Aggiungine almeno uno: la tua Home parte subito coi progressi.
      </p>

      <ul className="mt-4 flex max-h-[440px] flex-col gap-2 overflow-auto pr-1">
        {ALBUM_CATALOG.map((a) => {
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
                  {a.cover ? (
                    <img src={a.cover} alt="" className="h-full w-full object-cover" />
                  ) : (
                    a.season.slice(2)
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-ink">{a.title}</span>
                  <span className="block truncate text-xs text-ink-2">
                    {a.editor} · {a.total} figurine
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
      </ul>
    </div>
  )
}
