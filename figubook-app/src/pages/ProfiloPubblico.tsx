import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MapPin, Lock, Pencil } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/Avatar'
import { TeamCrest } from '@/components/TeamCrest'
import { teamById } from '@/lib/teams'
import { teamAccent, teamPageBg, teamCardBg } from '@/lib/teamStyle'
import { getPublicByUsername } from '@/lib/db/publicProfiles'
import { FriendButton } from '@/components/FriendButton'
import type { PublicProfile } from '@/lib/db/profile'
import { FadeIn } from '@/components/home/FadeIn'

export default function ProfiloPubblico() {
  // Rimonta per username => stato seminato pulito, niente setState sincrono in effect.
  const { username = '' } = useParams()
  return <VetrinaInner key={username} username={username} />
}

function VetrinaInner({ username }: { username: string }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getPublicByUsername(username).then((p) => {
      if (!active) return
      setProfile(p)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [username])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <div className="h-40 animate-pulse rounded-2xl bg-bg-elev" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="mx-auto w-full max-w-3xl py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Profilo non trovato</h1>
        <p className="mt-2 text-ink-2">Nessun collezionista con username “{username}”.</p>
        <Link
          to="/community"
          className="mt-5 inline-block rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-ink-2 hover:text-ink"
        >
          Torna alla Community
        </Link>
      </div>
    )
  }

  const isMe = user?.uid === profile.uid
  const team = profile.favTeam ? teamById[profile.favTeam] : undefined
  const accent = team ? teamAccent(team) : undefined
  const name = profile.username

  return (
    <div className="mx-auto w-full max-w-3xl">
      {team && (
        <div aria-hidden className="fixed inset-0 -z-10" style={{ background: teamPageBg(team) }} />
      )}

      {/* Card identità */}
      <FadeIn>
        <div
          className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-surface/40 p-6 sm:p-8"
          style={team ? { background: teamCardBg(team) } : undefined}
        >
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:text-left">
            <Avatar
              id={profile.avatarId}
              name={name}
              className="h-28 w-28 shrink-0 overflow-hidden rounded-full"
              style={accent ? { boxShadow: `0 0 0 3px ${accent}` } : undefined}
            />
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-[30px] font-semibold tracking-tight text-ink sm:text-[36px]">
                {name}
              </h1>
              {profile.nome && <p className="mt-0.5 text-base text-ink-2">{profile.nome}</p>}
              <div className="mt-2.5 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                {team && (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink">
                    <TeamCrest c1={team.c1} c2={team.c2} className="h-5 w-[16px]" /> {team.name}
                  </span>
                )}
                {profile.isPublic && profile.citta && (
                  <span className="inline-flex items-center gap-1 text-sm text-ink-2">
                    <MapPin className="h-4 w-4" /> {profile.citta}
                  </span>
                )}
                <span
                  className={
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ' +
                    (profile.isPublic ? 'bg-lime/12 text-lime' : 'bg-white/10 text-ink-2')
                  }
                >
                  {profile.isPublic ? 'Profilo pubblico' : 'Profilo privato'}
                </span>
              </div>
              {profile.isPublic && profile.bio && (
                <p className="mt-3 max-w-prose text-base leading-relaxed text-ink-2">{profile.bio}</p>
              )}

              {/* Azione */}
              <div className="mt-4">
                {isMe ? (
                  <Link
                    to="/profilo"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-[15px] font-medium text-ink transition-colors hover:bg-white/10"
                  >
                    <Pencil className="h-4 w-4" /> Modifica profilo
                  </Link>
                ) : (
                  <FriendButton otherUid={profile.uid} />
                )}
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Album e attività (gated) */}
      <FadeIn>
        <div className="mt-6 rounded-2xl border border-white/[0.08] bg-surface/40 px-5 py-12 text-center">
          {profile.isPublic ? (
            <>
              <p className="text-base font-medium text-ink">Album e attività</p>
              <p className="mt-1.5 text-sm text-ink-2">In arrivo.</p>
            </>
          ) : (
            <>
              <Lock className="mx-auto h-6 w-6 text-ink-2" />
              <p className="mt-2 text-base font-medium text-ink">Profilo privato</p>
              <p className="mt-1.5 text-sm text-ink-2">
                Aggiungilo come amico per vedere album e attività.
              </p>
            </>
          )}
        </div>
      </FadeIn>
    </div>
  )
}
