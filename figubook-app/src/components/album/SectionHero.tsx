// figubook-app/src/components/album/SectionHero.tsx
import type { Section } from '@/data/albums/types'
import { sectionGradient } from '@/lib/album/color'
import type { SectionStats } from '@/lib/album/stats'

export function SectionHero({ section, index, stats }: { section: Section; index: number; stats: SectionStats }) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-white/10 p-6" style={{ backgroundImage: sectionGradient(section.c1, section.c2) }}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_100%_0,rgba(255,255,255,0.16),transparent_50%)]" />
      <div className="relative z-10">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-white/70">
          Sezione {String(index + 1).padStart(2, '0')} · {section.group}
        </div>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-white">{section.name}</h1>
        <p className="mt-1 text-sm text-white/80">{section.codes[0]} – {section.codes[section.codes.length - 1]} · {section.codes.length} figurine</p>
        <div className="mt-3 flex gap-2">
          <span className="rounded-full border border-white/20 bg-black/20 px-3 py-1 text-[11px] font-semibold text-white">{stats.have} possedute</span>
          <span className="rounded-full border border-white/20 bg-black/20 px-3 py-1 text-[11px] font-semibold text-white">{stats.missing} mancanti</span>
        </div>
      </div>
      <div className="absolute right-6 top-6 z-10 text-right">
        <div className="text-[10px] uppercase tracking-widest text-white/70">Completamento</div>
        <div className="font-display text-4xl font-bold leading-none text-white">{stats.pct}%</div>
        <div className="mt-2 h-1.5 w-48 overflow-hidden rounded bg-black/30">
          <div className="h-full rounded bg-lime transition-[width] duration-500" style={{ width: `${stats.pct}%` }} />
        </div>
      </div>
    </header>
  )
}
