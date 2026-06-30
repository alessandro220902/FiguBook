import type { MatchResult } from '@/lib/trade/match'

interface Props {
  username: string
  citta: string
  match: MatchResult
  onCompose: () => void
}

export function MatchCard({ username, citta, match, onCompose }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="font-semibold">{username}</div>
        {citta && <div className="text-sm text-muted-foreground">{citta}</div>}
      </div>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl bg-white/[0.04] py-2">
          <div className="text-2xl font-bold text-lime">{match.receiveCount}</div>
          <div className="text-xs text-muted-foreground">RICEVI</div>
        </div>
        <div className="rounded-xl bg-white/[0.04] py-2">
          <div className="text-2xl font-bold">{match.giveCount}</div>
          <div className="text-xs text-muted-foreground">OFFRI</div>
        </div>
      </div>
      <div className="text-xs text-muted-foreground text-center">
        Completi +{match.completionPct}% dell'album
      </div>
      <button
        onClick={onCompose}
        className="rounded-xl bg-lime text-black font-semibold py-2 hover:opacity-90 transition"
      >
        Componi scambio
      </button>
    </div>
  )
}
