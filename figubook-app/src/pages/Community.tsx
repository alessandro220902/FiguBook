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
  const { people: nearby, hasMore, loading: nearbyLoading, loadMore } = useNearbyCollectors()

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

      </div>

      {friends.length === 0 && nearby.length === 0 && !nearbyLoading ? (
        <FadeIn>
          <div className="mt-8 max-w-2xl rounded-2xl border border-white/[0.08] bg-surface/40 p-5 sm:p-6">
            <p className="type-body text-ink">La tua cerchia è ancora vuota.</p>
            <p className="mt-1 text-sm text-ink-2">Bastano pochi passi per popolarla.</p>
            <ol className="mt-5 space-y-4">
              {[
                ['1', 'Invita i tuoi amici', 'Manda il tuo link: chi si iscrive entra nella tua cerchia.'],
                ['2', 'Trova collezionisti vicini', 'Appari qui quando altri del tuo comune o CAP si iscrivono.'],
                ['3', 'Sblocca ricompense', 'Presto: più inviti e attività, più vantaggi in FiguBook.'],
              ].map(([n, title, desc]) => (
                <li key={n} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-semibold text-ink-2">{n}</span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium text-ink">{title}</p>
                    <p className="text-sm text-ink-2">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            <button
              onClick={shareInvite}
              className="group mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-lime px-5 py-2.5 font-semibold text-lime-ink transition-opacity hover:opacity-90"
            >
              {copied ? 'Link copiato!' : 'Invita un amico'}
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>
        </FadeIn>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <FadeIn>
            <h2 className="type-h2 text-ink">I miei amici</h2>
            {friends.length > 0 ? (
              <div className="mt-3 space-y-2">{friends.map((u) => <PersonRow key={u.uid} u={u} />)}</div>
            ) : (
              <p className="mt-3 text-sm text-ink-2">Non hai ancora amici. Invita qualcuno con il tuo link.</p>
            )}
          </FadeIn>

          <FadeIn>
            <h2 className="type-h2 text-ink">Collezionisti per te</h2>
            <p className="mt-1 text-sm text-ink-2">Vicini a te per comune o CAP.</p>
            {nearby.length > 0 ? (
              <>
                <div className="mt-3 space-y-2">{nearby.map((u) => <PersonRow key={u.uid} u={u} />)}</div>
                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={nearbyLoading}
                    className="group mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-white/30 disabled:opacity-50"
                  >
                    {nearbyLoading ? 'Carico…' : 'Mostra altri'}
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </button>
                )}
              </>
            ) : (
              <p className="mt-3 text-sm text-ink-2">Nessuno vicino per ora. Compila comune e CAP nel profilo per trovare collezionisti della tua zona.</p>
            )}
          </FadeIn>
        </div>
      )}
    </div>
  )
}
