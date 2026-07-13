import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useUserSearch } from '@/hooks/useUserSearch'
import { useProfile } from '@/hooks/useProfile'
import { useAuth } from '@/hooks/useAuth'
import { useInviteCount } from '@/hooks/useInviteCount'
import { useMyFriends } from '@/hooks/useMyFriends'
import { useIncomingRequestProfiles } from '@/hooks/useIncomingRequestProfiles'
import { useNearbyCollectors } from '@/hooks/useNearbyCollectors'
import { acceptFriendRequest, rejectFriendRequest } from '@/lib/db/friends'
import { Avatar } from '@/components/Avatar'
import { TeamCrest } from '@/components/TeamCrest'
import { teamById } from '@/lib/teams'
import { FadeIn } from '@/components/home/FadeIn'
import type { PublicProfile } from '@/lib/db/profile'

function PersonRow({ u }: { u: PublicProfile }) {
  const team = u.favTeam ? teamById[u.favTeam] : undefined
  return (
    <Link
      to={`/u/${u.username}`}
      className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-surface/40 px-4 py-3 transition-colors hover:border-white/20"
    >
      <Avatar id={u.avatarId} name={u.username} className="h-11 w-11 shrink-0 overflow-hidden rounded-full" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-ink">{u.username}</p>
        {u.nome && <p className="truncate text-sm text-ink-2">{u.nome}</p>}
      </div>
      {team && <TeamCrest teamId={team.id} c1={team.c1} c2={team.c2} className="h-6 w-[18px] shrink-0" />}
    </Link>
  )
}

export default function Community() {
  const { profile } = useProfile()
  const { user } = useAuth()
  const [q, setQ] = useState('')
  const { results, loading } = useUserSearch(q)
  const term = q.trim()

  const inviteCount = useInviteCount()
  const { friends } = useMyFriends()
  const requests = useIncomingRequestProfiles()
  const noFriends = friends.length === 0
  const { people: nearby } = useNearbyCollectors(noFriends)

  const [copied, setCopied] = useState(false)
  const shareInvite = async () => {
    const uname = profile?.username
    if (!uname) return
    const url = `${window.location.origin}/FiguBook/app/invita/${uname}`
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {}
  }

  const myUid = user?.uid

  return (
    <div className="mx-auto w-full max-w-[88rem]">
      <div className="max-w-2xl">
      <FadeIn>
        <h1 className="type-h1 text-ink">Il mondo di FiguBook</h1>
        <p className="type-body mt-1.5 text-ink-2">
          {inviteCount > 0 ? `Hai invitato ${inviteCount} ${inviteCount === 1 ? 'amico' : 'amici'}.` : 'Invita i tuoi amici e trova collezionisti vicini.'}
        </p>
        <button
          onClick={shareInvite}
          className="group mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-lime px-5 py-2.5 font-semibold text-lime-ink transition-opacity hover:opacity-90"
        >
          {copied ? 'Link copiato!' : 'Invita un amico'}
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </button>
      </FadeIn>

      {requests.length > 0 && myUid && profile && (
        <FadeIn>
          <h2 className="type-h2 mt-8 text-ink">Richieste di amicizia</h2>
          <div className="mt-3 space-y-2">
            {requests.map((u) => (
              <div key={u.uid} className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-surface/40 px-4 py-3">
                <Avatar id={u.avatarId} name={u.username} className="h-11 w-11 shrink-0 overflow-hidden rounded-full" />
                <p className="min-w-0 flex-1 truncate text-[15px] font-medium text-ink">{u.username}</p>
                <button
                  onClick={() => acceptFriendRequest(u.uid, myUid, profile.username)}
                  className="rounded-full bg-lime px-4 py-1.5 text-sm font-semibold text-lime-ink transition-opacity hover:opacity-90"
                >Accetta</button>
                <button
                  onClick={() => rejectFriendRequest(u.uid, myUid, profile.username)}
                  className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-ink-2 transition-colors hover:border-white/30 hover:text-ink"
                >Rifiuta</button>
              </div>
            ))}
          </div>
        </FadeIn>
      )}

      <FadeIn>
        <div className="relative mt-8">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cerca un collezionista…"
            className="w-full rounded-full border border-white/[0.1] bg-surface py-3.5 pl-12 pr-4 text-[16px] text-ink outline-none transition-colors placeholder:text-ink-2 focus:border-lime"
          />
        </div>
        <div className="mt-4 space-y-2">
          {term.length >= 2 && !loading && results.length === 0 && (
            <p className="px-1 text-sm text-ink-2">Nessun collezionista per "{term}".</p>
          )}
          {results.map((u) => <PersonRow key={u.uid} u={u} />)}
        </div>
      </FadeIn>

      <FadeIn>
        <h2 className="type-h2 mt-8 text-ink">I miei amici</h2>
        {friends.length > 0 ? (
          <div className="mt-3 space-y-2">{friends.map((u) => <PersonRow key={u.uid} u={u} />)}</div>
        ) : (
          <div className="mt-3">
            <p className="text-sm text-ink-2">Non hai ancora amici.</p>
            {nearby.length > 0 && (
              <>
                <p className="mt-5 text-sm font-medium text-ink">Collezionisti vicini a te</p>
                <div className="mt-3 space-y-2">{nearby.map((u) => <PersonRow key={u.uid} u={u} />)}</div>
              </>
            )}
          </div>
        )}
      </FadeIn>
      </div>
    </div>
  )
}
