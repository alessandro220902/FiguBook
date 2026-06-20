// figubook-app/src/components/album/AlbumLanding.tsx
import { Share2 } from 'lucide-react'
import type { AlbumCatalogEntry } from '@/data/albumCatalog'
import { sectionGradient } from '@/lib/album/color'
import type { AlbumStats } from '@/lib/db/albums'

// Hero statico full-width: copertina + statistiche ad alto contrasto. Nessun effetto
// scroll qui (parte all'apertura). Le stat sono chip solide leggibili (prima erano
// semitrasparenti sul gradiente -> illeggibili).
export function AlbumLanding({ entry, stats }: { entry: AlbumCatalogEntry; stats: AlbumStats }) {
  return (
    <section className="w-full">
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
            <button type="button" disabled title="Presto" className="flex cursor-not-allowed items-center gap-2 rounded-xl border border-white/10 bg-surface px-4 py-2.5 text-sm font-semibold text-muted-foreground opacity-60">
              <Share2 size={16} /> Condividi doppie
            </button>
            <button type="button" disabled title="Presto" className="flex cursor-not-allowed items-center gap-2 rounded-xl border border-white/10 bg-surface px-4 py-2.5 text-sm font-semibold text-muted-foreground opacity-60">
              <Share2 size={16} /> Condividi mancanti
            </button>
          </div>
        </div>
      </div>
    </section>
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
