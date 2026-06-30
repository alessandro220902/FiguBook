import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MapPin, Lock, Pencil, Ban } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/Avatar'
import { TeamCrest } from '@/components/TeamCrest'
import { teamById } from '@/lib/teams'
import { teamAccent, teamPageBg, teamCardBg } from '@/lib/teamStyle'
import { getPublicByUsername } from '@/lib/db/publicProfiles'
import { FriendButton } from '@/components/FriendButton'
import type { PublicProfile } from '@/lib/db/profile'
import { FadeIn } from '@/components/home/FadeIn'
import { useProfile } from '@/hooks/useProfile'
import { ProfileActionsMenu } from '@/components/ProfileActionsMenu'
import { getOtherAlbumIds, getOtherAlbum } from '@/lib/db/otherAlbums'
import { computeStats } from '@/lib/db/albums'
import { albumById } from '@/data/albumCatalog'

export default function ProfiloPubblico() {
  // Rimonta per username => stato seminato pulito, niente setState sincrono in effect.
  const { username = '' } = useParams()
  return <VetrinaInner key={username} username={username} />
}

function VetrinaInner({ username }: { username: string }) {
  const { user } = useAuth()
  const { profile: myProfile } = useProfile()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [albums, setAlbums] = useState<{ id: string; pct: number }[]>([])

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

  useEffect(() => {
    if (!profile) return
    if (myProfile?.blocked?.includes(profile.uid)) return
    let active = true
    ;(async () => {
      const ids = await getOtherAlbumIds(profile.uid)
      const withPct = await Promise.all(
        ids.filter((id) => albumById[id]).map(async (id) => {
          const a = await getOtherAlbum(profile.uid, id)
          const pct = a ? computeStats(id, a.states, a.counts).pct : 0
          return { id, pct }
        }),
      )
      if (active) setAlbums(withPct)
    })()
    return () => { active = false }
  }, [profile, myProfile])

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
  const isBlocked = !isMe && (myProfile?.blocked?.includes(profile.uid) ?? false)
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
              <div className="flex items-start justify-center gap-2 sm:justify-start">
                <h1 className="truncate font-display text-[30px] font-semibold tracking-tight text-ink sm:text-[36px]">
                  {name}
                </h1>
                {!isMe && <ProfileActionsMenu otherUid={profile.uid} />}
              </div>
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
                ) : isBlocked ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-stat-missing/15 px-4 py-2 text-sm font-medium text-stat-missing">
                    Utente bloccato
                  </span>
                ) : (
                  <FriendButton otherUid={profile.uid} />
                )}
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Album (gated lato rules: vuoto se privato e non amico) */}
      <FadeIn>
        {isBlocked ? (
          <div className="mt-6 rounded-2xl border border-white/[0.08] bg-surface/40 px-5 py-12 text-center">
            <Ban className="mx-auto h-6 w-6 text-stat-missing" />
            <p className="mt-2 text-base font-medium text-ink">Utente bloccato</p>
            <p className="mt-1.5 text-sm text-ink-2">Sbloccalo dal menu accanto al nome per rivedere il profilo.</p>
          </div>
        ) : albums.length > 0 ? (
          <div className="mt-6">
            <h2 className="mb-3 px-1 font-display text-lg font-semibold text-ink">Album</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {albums.map(({ id, pct }) => {
                const entry = albumById[id]
                return (
                  <Link
                    key={id}
                    to={`/u/${profile.username}/album/${id}`}
                    className="group flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-surface/40 p-4 transition-colors hover:border-white/20"
                  >
                    <div
                      className="h-12 w-9 shrink-0 overflow-hidden rounded-md bg-cover bg-center"
                      style={{ background: `linear-gradient(135deg, ${entry.c1}, ${entry.c2})` }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{entry.title}</p>
                      <p className="text-xs text-ink-2">{pct}% completo</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-white/[0.08] bg-surface/40 px-5 py-12 text-center">
            {profile.isPublic ? (
              <>
                <p className="text-base font-medium text-ink">Nessun album pubblico</p>
                <p className="mt-1.5 text-sm text-ink-2">Questo collezionista non ha ancora album da mostrare.</p>
              </>
            ) : (
              <>
                <Lock className="mx-auto h-6 w-6 text-ink-2" />
                <p className="mt-2 text-base font-medium text-ink">Profilo privato</p>
                <p className="mt-1.5 text-sm text-ink-2">Aggiungilo come amico per vedere i suoi album.</p>
              </>
            )}
          </div>
        )}
      </FadeIn>
    </div>
  )
}
