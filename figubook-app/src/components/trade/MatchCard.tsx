import { useState } from 'react'
import { ArrowRightLeft, ArrowDown, ArrowUp, Clock, MapPin } from 'lucide-react'
import type { MatchResult } from '@/lib/trade/match'
import { Avatar } from '@/components/Avatar'
import { lastSeenLabel } from '@/lib/time/lastSeenLabel'
import { StarRating } from './StarRating'

interface Props {
  username: string
  avatarId?: string
  citta: string
  lastSeen?: number
  match: MatchResult
  rating?: { avg: number; count: number }
  onCompose: () => void
}

export function MatchCard({ username, avatarId, citta, lastSeen, match, rating, onCompose }: Props) {
  const [now] = useState(() => Date.now())
  const seen = lastSeenLabel(lastSeen, now)
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-surface/40 p-4 transition-colors hover:border-white/20">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar id={avatarId} name={username} className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0">
            <div className="truncate font-semibold text-ink">{username}</div>
            {rating && rating.count > 0 ? (
              <div className="mt-0.5 flex items-center gap-1.5">
                <StarRating value={rating.avg} size={14} />
                <span className="text-xs text-muted-foreground">
                  {rating.avg} ({rating.count})
                </span>
              </div>
            ) : (
              <div className="mt-0.5 text-xs text-muted-foreground">Nuovo</div>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {citta && (
            <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {citta}
            </div>
          )}
          {seen && (
            <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {seen}
            </div>
          )}
        </div>
      </div>

      <div className="relative grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl bg-white/[0.04] py-2.5">
          <div className="inline-flex items-center gap-1 text-2xl font-bold leading-none text-lime">
            <ArrowDown className="h-4 w-4" />{match.receiveCount}
          </div>
          <div className="mt-1 text-[11px] font-medium tracking-wide text-muted-foreground">POTRESTI RICEVERE</div>
        </div>
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/12 bg-card text-lime">
            <ArrowRightLeft className="h-3.5 w-3.5" />
          </span>
        </div>
        <div className="rounded-xl bg-white/[0.04] py-2.5">
          <div className="inline-flex items-center gap-1 text-2xl font-bold leading-none text-ink">
            <ArrowUp className="h-4 w-4" />{match.giveCount}
          </div>
          <div className="mt-1 text-[11px] font-medium tracking-wide text-muted-foreground">POTRESTI OFFRIRE</div>
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
