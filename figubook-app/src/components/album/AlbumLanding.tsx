// figubook-app/src/components/album/AlbumLanding.tsx
import { useRef, useState } from 'react'
import { Share2, Check } from 'lucide-react'
import type { AlbumCatalogEntry } from '@/data/albumCatalog'
import { sectionGradient } from '@/lib/album/color'
import type { AlbumStats } from '@/lib/db/albums'

export interface AlbumLandingProps {
  entry: AlbumCatalogEntry
  stats: AlbumStats
  // codici per la condivisione (calcolati in Album.tsx, dove c'è il dataset)
  missingCodes: string[]
  doubleCodes: string[]
}

// Hero statico full-width: copertina + statistiche ad alto contrasto. Le stat sono
// chip solide leggibili. I tasti condividono la lista doppie/mancanti via Web Share
// API (mobile) con fallback copia-negli-appunti.
export function AlbumLanding({ entry, stats, missingCodes, doubleCodes }: AlbumLandingProps) {
  const [toast, setToast] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function flash(msg: string) {
    setToast(msg)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 2600)
  }

  async function share(kind: 'doubles' | 'missing', codes: string[]) {
    const label = kind === 'doubles' ? 'Doppie' : 'Mancanti'
    const text = `${entry.title} — ${label} (${codes.length}):\n${codes.join(', ')}`
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: `FiguBook · ${label}`, text })
        return
      }
      await navigator.clipboard.writeText(text)
      flash(`${label}: lista copiata negli appunti`)
    } catch {
      // condivisione annullata dall'utente: nessun feedback
    }
  }

  return (
    <section className="relative w-full">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-stretch">
        {/* Copertina */}
        <div
          className="relative aspect-[3/4] overflow-hidden rounded-3xl border border-white/10 shadow-2xl lg:aspect-auto lg:min-h-[22rem]"
          style={{ backgroundImage: sectionGradient(entry.c1, entry.c2) }}
        >
          <div aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 55%, transparent 100%)' }} />
          <div className="absolute right-5 top-5 rounded-2xl bg-black/55 px-4 py-2 text-right backdrop-blur">
            <div className="font-display text-4xl font-bold leading-none text-white">{stats.pct}%</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-widest text-white/75">Completo</div>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-6">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-white/80">{entry.editor} · {entry.season}</div>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-white drop-shadow sm:text-4xl">{entry.title}</h1>
          </div>
        </div>

        {/* Pannello statistiche leggibile */}
        <div className="flex flex-col justify-center gap-5">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Possedute" value={`${stats.have}`} sub={`/ ${stats.total}`} tone="have" />
            <Stat label="Mancanti" value={`${stats.missing}`} tone="missing" />
            <Stat label="Doppie" value={`${stats.doubles}`} />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>Completamento</span><span className="tabular-nums">{stats.pct}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-bg-elev">
              <div className="h-full rounded-full bg-gradient-to-r from-lime to-lime-2 transition-[width] duration-500" style={{ width: `${stats.pct}%` }} />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <ShareButton label="Condividi doppie" disabled={doubleCodes.length === 0} onClick={() => share('doubles', doubleCodes)} />
            <ShareButton label="Condividi mancanti" disabled={missingCodes.length === 0} onClick={() => share('missing', missingCodes)} />
          </div>
        </div>
      </div>

      {toast && (
        <div role="status" className="pointer-events-none absolute bottom-0 left-0 flex items-center gap-2 rounded-xl border border-lime/30 bg-bg-elev px-4 py-2.5 text-sm font-medium text-ink shadow-lg">
          <Check size={16} className="text-lime" /> {toast}
        </div>
      )}
    </section>
  )
}

function ShareButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? 'Niente da condividere' : label}
      className="flex items-center gap-2 rounded-xl border border-white/10 bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-lime/40 hover:bg-surface/80 disabled:cursor-not-allowed disabled:text-muted-foreground disabled:opacity-50 disabled:hover:border-white/10"
    >
      <Share2 size={16} /> {label}
    </button>
  )
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'have' | 'missing' }) {
  const color = tone === 'have' ? 'text-stat-have' : tone === 'missing' ? 'text-stat-missing' : 'text-ink'
  return (
    <div className="rounded-2xl border border-white/10 bg-bg-elev p-4">
      <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 whitespace-nowrap font-display text-3xl font-bold tabular-nums ${color}`}>
        {value}{sub && <span className="text-base font-semibold text-muted-foreground"> {sub}</span>}
      </div>
    </div>
  )
}
