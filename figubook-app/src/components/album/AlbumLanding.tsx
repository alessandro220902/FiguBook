// figubook-app/src/components/album/AlbumLanding.tsx
import { motion, useReducedMotion } from 'framer-motion'
import { Share2 } from 'lucide-react'
import type { AlbumCatalogEntry } from '@/data/albumCatalog'
import { sectionGradient } from '@/lib/album/color'
import type { AlbumStats } from '@/lib/db/albums'

export function AlbumLanding({ entry, stats }: { entry: AlbumCatalogEntry; stats: AlbumStats }) {
  const reduce = useReducedMotion()
  return (
    <section className="grid items-center gap-6 py-6 md:grid-cols-[minmax(0,360px)_1fr]">
      <motion.div
        initial={reduce ? false : { opacity: 0, rotateX: 12, y: 24 }}
        animate={{ opacity: 1, rotateX: 0, y: 0 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
        style={{ backgroundImage: sectionGradient(entry.c1, entry.c2) }}
      >
        <div className="absolute bottom-4 right-4 rounded-xl bg-black/40 px-4 py-2 text-right backdrop-blur">
          <div className="font-display text-3xl font-bold text-white">{stats.pct}%</div>
          <div className="text-[10px] uppercase tracking-widest text-white/70">Completo</div>
        </div>
      </motion.div>

      <div>
        <div className="text-xs text-muted">{entry.editor} · {entry.season}</div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink">{entry.title}</h1>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <Stat label="Possedute" value={`${stats.have}`} sub={`/ ${stats.total}`} tone="have" />
          <Stat label="Mancanti" value={`${stats.missing}`} tone="missing" />
          <Stat label="Doppie" value={`${stats.doubles}`} />
        </div>

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded bg-surface">
          <div className="h-full rounded bg-gradient-to-r from-lime to-lime-2 transition-[width] duration-500" style={{ width: `${stats.pct}%` }} />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" disabled title="Presto" className="flex cursor-not-allowed items-center gap-2 rounded-xl border border-white/10 bg-surface px-4 py-2.5 text-sm font-semibold text-muted opacity-60">
            <Share2 size={16} /> Condividi doppie
          </button>
          <button type="button" disabled title="Presto" className="flex cursor-not-allowed items-center gap-2 rounded-xl border border-white/10 bg-surface px-4 py-2.5 text-sm font-semibold text-muted opacity-60">
            <Share2 size={16} /> Condividi mancanti
          </button>
        </div>
      </div>
    </section>
  )
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'have' | 'missing' }) {
  const color = tone === 'have' ? 'text-stat-have' : tone === 'missing' ? 'text-stat-missing' : 'text-ink'
  return (
    <div className="rounded-xl border border-white/8 bg-bg-elev p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted">{label}</div>
      <div className={`font-display text-2xl font-bold ${color}`}>{value}{sub && <span className="text-sm text-muted"> {sub}</span>}</div>
    </div>
  )
}
