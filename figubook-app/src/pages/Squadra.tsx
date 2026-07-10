import { useParams, Link } from 'react-router-dom'
import { TEAMS } from '@/lib/teams'
import { TEAM_ALIAS, hasTeamPage, teamDisplayName } from '@/lib/album/teamIdentity'
import { factsForTeam } from '@/data/teamFacts'
import { kitFromColors } from '@/lib/album/teamKits'
import { kitGradient, kitPattern } from '@/lib/album/color'
import { TeamCrest } from '@/components/TeamCrest'
import { useTeamProgress } from '@/hooks/useTeamProgress'
import { pctColor } from '@/lib/stats/pctColor'

export default function Squadra() {
  const { teamId = '' } = useParams()
  const id = TEAM_ALIAS[teamId] ?? teamId
  const team = TEAMS.find((t) => t.id === id)
  const progress = useTeamProgress(id)

  if (!hasTeamPage(id) || !team) {
    return (
      <div className="album-theme mx-auto w-full max-w-[64rem]">
        <div className="mt-10 rounded-xl border border-white/[0.07] bg-bg-elev px-6 py-16 text-center">
          <div className="type-h3 text-ink">Squadra non trovata</div>
          <Link to="/album" className="mt-4 inline-block type-body text-ink-2 underline">Torna agli album</Link>
        </div>
      </div>
    )
  }

  const kit = progress.kit ?? kitFromColors(team.c1, team.c2)
  const pattern = kitPattern(kit)
  const facts = factsForTeam(id)
  const hasFacts = facts.city || facts.founded || facts.stadium || facts.nickname

  return (
    <div className="album-theme mx-auto w-full max-w-[64rem]">
      <header className="relative overflow-hidden rounded-2xl border border-white/10 p-6 sm:p-8" style={{ backgroundImage: kitGradient(kit) }}>
        {pattern && <div aria-hidden className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-70" style={{ backgroundImage: pattern }} />}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(0,0,0,0.52)_0%,rgba(0,0,0,0.34)_55%,rgba(0,0,0,0.22)_100%)]" />
        <div className="relative z-10 flex items-center gap-4">
          <TeamCrest
            c1={kit.c1}
            c2={kit.c2}
            accent={kit.accent}
            pattern={kit.pattern}
            monogram={teamDisplayName(id).charAt(0).toUpperCase()}
            className="h-16 w-16 drop-shadow-md sm:h-20 sm:w-20"
          />
          <h1 className="font-display text-3xl font-bold tracking-tight text-white drop-shadow-sm sm:text-4xl">{teamDisplayName(id)}</h1>
        </div>
      </header>

      {hasFacts && (
        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {facts.city && <Fact label="Città" value={facts.city} />}
          {facts.founded && <Fact label="Fondazione" value={String(facts.founded)} />}
          {facts.stadium && <Fact label="Stadio" value={facts.stadium} />}
          {facts.nickname && <Fact label="Soprannome" value={facts.nickname} />}
        </dl>
      )}

      <section className="mt-6 rounded-2xl border border-white/[0.07] bg-bg-elev p-5">
        <h2 className="type-h3 text-ink">I tuoi progressi</h2>
        {progress.loading ? (
          <div className="mt-4 h-2 w-full animate-pulse rounded-full bg-white/10" />
        ) : progress.total === 0 ? (
          <p className="mt-2 type-body text-ink-2">Non è in nessuno dei tuoi album.</p>
        ) : (
          <>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/30">
                <div className="h-full rounded-full" style={{ width: `${Math.max(2, progress.pct)}%`, background: pctColor(progress.pct) }} />
              </div>
              <span className="type-stat shrink-0 font-display text-2xl text-ink">{progress.pct}<span className="text-base text-ink-2">%</span></span>
            </div>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-ink-2">{progress.have} / {progress.total} figurine</p>
            <ul className="mt-4 space-y-1">
              {progress.appearsIn.map((x) => (
                <li key={`${x.albumId}-${x.sectionName}`} className="flex items-center justify-between type-body text-ink-2">
                  <span className="truncate">{x.albumTitle}</span>
                  <span className="shrink-0 font-mono text-xs">{x.pct}%</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-bg-elev px-4 py-3">
      <dt className="font-mono text-[10px] uppercase tracking-wide text-ink-2">{label}</dt>
      <dd className="type-body mt-0.5 font-semibold text-ink">{value}</dd>
    </div>
  )
}
