import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useUserSearch } from '@/hooks/useUserSearch'
import { Avatar } from '@/components/Avatar'
import { TeamCrest } from '@/components/TeamCrest'
import { teamById } from '@/lib/teams'
import { FadeIn } from '@/components/home/FadeIn'

export default function Community() {
  const [q, setQ] = useState('')
  const { results, loading } = useUserSearch(q)
  const term = q.trim()

  return (
    <div className="mx-auto w-full max-w-3xl">
      <FadeIn>
        <h1 className="type-h1 text-ink">
          Community
        </h1>
        <p className="type-body mt-1.5 text-ink-2">Cerca altri collezionisti per username.</p>

        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cerca un collezionista…"
            className="w-full rounded-full border border-white/[0.1] bg-surface py-3.5 pl-12 pr-4 text-[16px] text-ink outline-none transition-colors placeholder:text-ink-2 focus:border-lime"
          />
        </div>
      </FadeIn>

      <FadeIn>
        <div className="mt-5 space-y-2">
          {term.length >= 2 && !loading && results.length === 0 && (
            <p className="px-1 text-sm text-ink-2">Nessun collezionista per “{term}”.</p>
          )}
          {results.map((u) => {
            const team = u.favTeam ? teamById[u.favTeam] : undefined
            return (
              <Link
                key={u.uid}
                to={`/u/${u.username}`}
                className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-surface/40 px-4 py-3 transition-colors hover:border-white/20"
              >
                <Avatar
                  id={u.avatarId}
                  name={u.username}
                  className="h-11 w-11 shrink-0 overflow-hidden rounded-full"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-ink">{u.username}</p>
                  {u.nome && <p className="truncate text-sm text-ink-2">{u.nome}</p>}
                </div>
                {team && <TeamCrest c1={team.c1} c2={team.c2} className="h-6 w-[18px] shrink-0" />}
              </Link>
            )
          })}
        </div>
      </FadeIn>
    </div>
  )
}
