// figubook-app/src/components/album/AlbumLanding.tsx
import { useRef, useState } from 'react'
import { Share2, Check } from 'lucide-react'
import type { AlbumCatalogEntry } from '@/data/albumCatalog'
import { sectionGradient } from '@/lib/album/color'
import type { AlbumStats } from '@/lib/db/albums'
import { AlbumButton } from './ui/Button'
import { shareList } from '@/lib/album/share'

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
    if ((await shareList(entry.title, kind, codes)) === 'copied') {
      flash(`${label}: lista copiata negli appunti`)
    }
  }

  return (
    <section className="relative w-full">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-stretch">
        {/* Copertina */}
        <div
          className="relative aspect-[3/4] overflow-hidden rounded-lg border border-border lg:aspect-auto lg:min-h-[20rem]"
          style={{ backgroundImage: sectionGradient(entry.c1, entry.c2) }}
        >
          {entry.cover && <img src={entry.cover} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          <div aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.05) 55%, transparent 100%)' }} />
          <div className="absolute inset-x-0 bottom-0 p-6">
            <div className="font-mono text-[11px] uppercase tracking-wide text-white/80">{entry.editor} · {entry.season}</div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white drop-shadow sm:text-4xl">{entry.title}</h1>
          </div>
        </div>

        {/* Pannello statistiche: numero eroe + barra + stat + condivisione */}
        <div className="flex flex-col justify-center gap-6">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wide text-ink-2">Completamento</div>
            {/* Barra con % a fine linea (niente numero gigante separato). */}
            <div className="mt-2 flex items-center gap-3">
              <div className="h-2 max-w-[440px] flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-lime transition-[width] duration-500" style={{ width: `${stats.pct}%` }} />
              </div>
              <span className="shrink-0 font-display text-3xl font-bold leading-none tabular-nums text-ink">{stats.pct}%</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <Stat label="Possedute" value={`${stats.have}`} sub={`/ ${stats.total}`} tone="have" />
            <Stat label="Mancanti" value={`${stats.missing}`} tone="missing" />
            <Stat label="Doppie" value={`${stats.doubles}`} />
          </div>

          <div className="flex gap-3">
            <ShareButton label="Condividi doppie" disabled={doubleCodes.length === 0} onClick={() => share('doubles', doubleCodes)} />
            <ShareButton label="Condividi mancanti" disabled={missingCodes.length === 0} onClick={() => share('missing', missingCodes)} />
          </div>
        </div>
      </div>

      {toast && (
        <div role="status" className="pointer-events-none absolute bottom-0 left-0 flex items-center gap-2 rounded-lg border border-lime/30 bg-bg-elev px-4 py-2.5 text-sm font-medium text-ink shadow-lg">
          <Check size={16} className="text-lime" /> {toast}
        </div>
      )}
    </section>
  )
}

function ShareButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <AlbumButton variant="ghost" className="flex-1 whitespace-nowrap px-2 text-[13px]" onClick={onClick} disabled={disabled} title={disabled ? 'Niente da condividere' : label}>
      <Share2 size={15} className="shrink-0" /> {label}
    </AlbumButton>
  )
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'have' | 'missing' }) {
  const color = tone === 'have' ? 'text-stat-have' : tone === 'missing' ? 'text-stat-missing' : 'text-ink'
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-wide text-ink-2">{label}</div>
      <div className={`mt-1 whitespace-nowrap font-display text-3xl font-bold tabular-nums ${color}`}>
        {value}{sub && <span className="text-base font-medium text-ink-2"> {sub}</span>}
      </div>
    </div>
  )
}
