import { ArrowRightLeft, MapPin } from 'lucide-react'
import type { MatchResult } from '@/lib/trade/match'
import { StarRating } from './StarRating'

interface Props {
  username: string
  citta: string
  match: MatchResult
  rating?: { avg: number; count: number }
  onCompose: () => void
}

export function MatchCard({ username, citta, match, rating, onCompose }: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-surface/40 p-4 transition-colors hover:border-white/20">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-semibold text-ink">{username}</div>
          {rating && rating.count > 0 ? (
            <div className="mt-1 flex items-center gap-1.5">
              <StarRating value={rating.avg} size={14} />
              <span className="text-xs text-muted-foreground">
                {rating.avg} ({rating.count})
              </span>
            </div>
          ) : (
            <div className="mt-1 text-xs text-muted-foreground">Nuovo</div>
          )}
        </div>
        {citta && (
          <div className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {citta}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl bg-white/[0.04] py-2.5">
          <div className="text-2xl font-bold leading-none text-lime">{match.receiveCount}</div>
          <div className="mt-1 text-[11px] font-medium tracking-wide text-muted-foreground">RICEVI</div>
        </div>
        <div className="rounded-xl bg-white/[0.04] py-2.5">
          <div className="text-2xl font-bold leading-none text-ink">{match.giveCount}</div>
          <div className="mt-1 text-[11px] font-medium tracking-wide text-muted-foreground">OFFRI</div>
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground">
        Completi <span className="font-semibold text-ink">+{match.completionPct}%</span> dell'album
      </div>

      <button
        onClick={onCompose}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime py-2 font-semibold text-black transition-opacity hover:opacity-90 active:scale-[0.98]"
      >
        <ArrowRightLeft className="h-4 w-4" />
        Componi scambio
      </button>
    </div>
  )
}
