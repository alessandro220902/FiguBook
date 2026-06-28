import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { Avatar } from '@/components/Avatar'
import { teamById } from '@/lib/teams'
import { teamAccent } from '@/lib/teamStyle'

// Chip identità nella navbar: avatar (con ring colore squadra) + username,
// cliccabile -> profilo. Porta l'identità fuori dal profilo con un tocco.
export function ProfileChip() {
  const { user } = useAuth()
  const { profile } = useProfile()
  if (!user) return null

  const name =
    profile?.username || user.displayName?.trim() || user.email?.split('@')[0] || 'Profilo'
  const team = profile?.favTeam ? teamById[profile.favTeam] : undefined
  const ring = team ? teamAccent(team) : 'rgba(255,255,255,.15)'

  return (
    <Link
      to="/profilo"
      className="flex shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-white/[0.06]"
    >
      <Avatar
        id={profile?.avatarId}
        name={name}
        className="h-8 w-8 overflow-hidden rounded-full"
        style={{ boxShadow: `0 0 0 2px ${ring}` }}
      />
      <span className="max-w-[140px] truncate text-[15px] font-medium text-white">{name}</span>
    </Link>
  )
}
