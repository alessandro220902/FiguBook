import { Link } from 'react-router-dom'
import { Avatar } from '@/components/Avatar'
import type { RankedRow } from '@/lib/functions/leaderboard'

const ORDER = [1, 0, 2] // 2° | 1° | 3°
const H = ['h-20', 'h-28', 'h-16']

export function LeaderboardPodium({ top }: { top: RankedRow[] }) {
  const slots = ORDER.map((i) => top[i]).filter(Boolean)
  if (slots.length === 0) return null
  return (
    <div className="mt-4 flex items-end justify-center gap-3">
      {ORDER.map((idx, pos) => {
        const r = top[idx]
        if (!r) return <div key={pos} className="w-24" />
        return (
          <Link key={pos} to={`/u/${r.username}`} className="flex w-24 flex-col items-center">
            <Avatar id={r.avatarId} name={r.username ?? ''} className="mb-2 h-14 w-14 overflow-hidden rounded-full" />
            <p className="mb-1 max-w-full truncate text-center text-sm font-medium text-ink">{r.username}</p>
            <div className={`flex w-full ${H[pos]} flex-col items-center justify-start rounded-t-xl border border-white/[0.08] bg-surface/60 pt-2`}>
              <span className="text-lg font-bold text-lime">#{r.rank}</span>
              <span className="text-sm font-semibold text-ink">{Math.round(r.value)}</span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
