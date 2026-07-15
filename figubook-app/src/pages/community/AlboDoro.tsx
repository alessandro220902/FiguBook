import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FadeIn } from '@/components/home/FadeIn'
import { useProfile } from '@/hooks/useProfile'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { ScoreTiles } from '@/components/community/ScoreTiles'
import { LeaderboardPodium } from '@/components/community/LeaderboardPodium'
import { LeaderboardRow } from '@/components/community/LeaderboardRow'
import type { Scope, Axis } from '@/lib/functions/leaderboard'

const SCOPES: { key: Scope; label: string }[] = [
  { key: 'nazionale', label: 'Nazionale' },
  { key: 'citta', label: 'Città' },
  { key: 'squadra', label: 'Squadra' },
  { key: 'amici', label: 'Amici' },
]
const AXES: { key: Axis; label: string }[] = [
  { key: 'totale', label: 'Totale' },
  { key: 'collezionista', label: 'Collezionista' },
  { key: 'scambista', label: 'Scambista' },
]

function Pills<T extends string>({ items, active, onPick }: { items: { key: T; label: string }[]; active: T; onPick: (k: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => onPick(it.key)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
            active === it.key ? 'bg-lime text-lime-ink' : 'border border-white/[0.1] text-ink-2 hover:border-white/25 hover:text-ink'
          }`}
        >{it.label}</button>
      ))}
    </div>
  )
}

export default function AlboDoro() {
  const { profile } = useProfile()
  const [scope, setScope] = useState<Scope>('nazionale')
  const [axis, setAxis] = useState<Axis>('totale')
  const { data, loading, error } = useLeaderboard(scope, axis)

  const profileIncomplete = !profile?.citta && !profile?.favTeam

  return (
    <FadeIn>
      <div className="mt-6 max-w-3xl">
        {data?.me && <ScoreTiles punti={data.me.value} posizione={data.me.rank} />}

        <div className="mt-6 space-y-3">
          <Pills items={SCOPES} active={scope} onPick={setScope} />
          <Pills items={AXES} active={axis} onPick={setAxis} />
        </div>

        {data?.season && <p className="mt-4 text-sm text-ink-2">Stagione {data.season}</p>}

        {loading && !data ? (
          <div className="mt-4 space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[62px] animate-pulse rounded-2xl border border-white/[0.06] bg-surface/40" />
            ))}
          </div>
        ) : error ? (
          <p className="mt-4 text-sm text-ink-2">Classifica non disponibile ora. Riprova.</p>
        ) : profileIncomplete && (scope === 'citta' || scope === 'squadra') ? (
          <Link to="/profilo" className="group mt-4 block rounded-2xl border border-white/[0.08] bg-surface/40 p-5 transition-colors hover:border-white/20">
            <p className="type-body text-ink">Completa il tuo profilo</p>
            <p className="mt-1 text-sm text-ink-2">Aggiungi comune e squadra per entrare nelle classifiche di zona e squadra.</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-lime">Vai al profilo →</span>
          </Link>
        ) : data && data.rows.length > 0 ? (
          <>
            <LeaderboardPodium top={data.rows.slice(0, 3)} />
            <div className="mt-4 space-y-2">
              {data.rows.slice(3).map((r) => (
                <LeaderboardRow key={r.uid} r={r} highlight={r.uid === data.me.uid} />
              ))}
            </div>
          </>
        ) : (
          <p className="mt-4 text-sm text-ink-2">Ancora nessuno in classifica qui. Completa album e scambi per comparire.</p>
        )}
      </div>
    </FadeIn>
  )
}
