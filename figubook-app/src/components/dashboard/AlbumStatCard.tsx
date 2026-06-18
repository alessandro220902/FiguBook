import type { PerAlbumStats } from '@/lib/db/albums'
import { CompletionRing } from './CompletionRing'

// Card album: anello completamento + "have di total" + doppie/mancanti.
export function AlbumStatCard({ a }: { a: PerAlbumStats }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/8 bg-bg-elev p-4">
      <CompletionRing pct={a.pct} size={84} />
      <div className="min-w-0">
        <div className="truncate font-display text-lg font-semibold text-ink">
          {a.entry.title}
        </div>
        <div className="mt-0.5 font-mono text-sm text-ink-2">
          {a.have} di {a.total}
        </div>
        <div className="mt-1 flex gap-3 font-mono text-[11px] text-muted">
          <span style={{ color: 'var(--color-stat-missing)' }}>{a.missing} mancanti</span>
          <span style={{ color: 'var(--color-lime)' }}>{a.doubles} doppie</span>
        </div>
      </div>
    </div>
  )
}
