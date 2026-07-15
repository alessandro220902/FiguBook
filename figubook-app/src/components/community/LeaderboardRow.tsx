import { Link } from 'react-router-dom'
import { Avatar } from '@/components/Avatar'
import { TeamCrest } from '@/components/TeamCrest'
import { teamById } from '@/lib/teams'
import type { RankedRow } from '@/lib/functions/leaderboard'

export function LeaderboardRow({ r, highlight }: { r: RankedRow; highlight?: boolean }) {
  const team = r.favTeam ? teamById[r.favTeam] : undefined
  const city = r.citta ? r.citta.replace(/\s*\(.*\)$/, '') : ''
  return (
    <Link
      to={`/u/${r.username}`}
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${
        highlight ? 'border-lime/60 bg-lime/[0.06]' : 'border-white/[0.08] bg-surface/40 hover:border-white/20'
      }`}
    >
      <span className="w-6 shrink-0 text-center text-sm font-semibold text-ink-2">{r.rank}</span>
      <Avatar id={r.avatarId} name={r.username ?? ''} className="h-10 w-10 shrink-0 overflow-hidden rounded-full" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-ink">{r.username}</p>
        {city && <p className="truncate text-sm text-ink-2">{city}</p>}
      </div>
      {team && <TeamCrest teamId={team.id} c1={team.c1} c2={team.c2} className="h-6 w-[18px] shrink-0" />}
      <span className="shrink-0 text-sm font-bold text-ink">{Math.round(r.value)}</span>
    </Link>
  )
}
