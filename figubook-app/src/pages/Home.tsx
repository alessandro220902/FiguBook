import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useCollection } from '@/hooks/useCollection'
import { TeamCrest } from '@/components/TeamCrest'
import { teamById } from '@/lib/teams'
import { StatTicker } from '@/components/home/StatTicker'
import { AlbumDeck } from '@/components/home/AlbumDeck'
import { NewsPanel } from '@/components/home/NewsPanel'
import { GroupsPanel } from '@/components/home/GroupsPanel'
import { FadeIn } from '@/components/home/FadeIn'
import { Typewriter } from '@/components/home/Typewriter'
import { useTradesCount } from '@/hooks/useTradesCount'
import { useEffect } from 'react'
import { useStatsDeltas } from '@/hooks/useStatsDeltas'
import { touchStatsSnapshot } from '@/lib/db/statsHistory'

export default function Home() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const { albums, totals, loading, error, retry } = useCollection()
  const trades = useTradesCount()
  const name = profile?.username || user?.displayName?.trim() || user?.email?.split('@')[0] || 'collezionista'
  const team = profile?.favTeam ? teamById[profile.favTeam] : undefined
  const ringColor = '#c2f23d' // verde brand, non colore squadra
  const deltas = useStatsDeltas(totals.have)
  useEffect(() => {
    if (!user || loading || error || albums.length === 0) return
    void touchStatsSnapshot(user.uid, totals)
  }, [user, loading, error, albums.length, totals])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[88rem]">
        <div className="h-8 w-48 animate-pulse rounded bg-bg-elev" />
        <div className="mt-8 h-24 animate-pulse rounded-xl bg-bg-elev" />
        <div className="mt-5 grid gap-4 sm:grid-cols-[auto_1fr]">
          <div className="h-52 w-full animate-pulse rounded-xl bg-bg-elev sm:w-72" />
          <div className="h-52 animate-pulse rounded-xl bg-bg-elev" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[88rem]">
      {/* glow tenue colore squadra in cima alla dashboard (casa tua) */}
      {team && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-80"
          style={{
            background: `radial-gradient(80% 100% at 50% -20%, color-mix(in srgb, ${team.c1} 28%, transparent), transparent 70%)`,
          }}
        />
      )}
      <FadeIn>
        <h1 className="text-pretty text-[28px] font-medium tracking-tight text-ink sm:text-[32px]">
          Ciao, <Typewriter text={name} className="text-lime" />
        </h1>
        {team && (
          <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-ink-2">
            <TeamCrest c1={team.c1} c2={team.c2} className="h-5 w-[16px]" />
            {team.name}
          </p>
        )}
      </FadeIn>

      {error ? (
        <div
          role="alert"
          className="mt-10 flex flex-col items-center rounded-xl border border-white/[0.07] bg-bg-elev px-6 py-16 text-center"
        >
          <div className="text-xl font-medium tracking-tight text-ink">
            Non riesco a caricare la collezione
          </div>
          <p className="mt-2 max-w-xs text-sm text-ink-2">
            Controlla la connessione e riprova. I tuoi dati sono al sicuro.
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-5 rounded-full border border-lime px-5 py-2.5 text-sm font-medium text-lime transition-transform duration-150 hover:-translate-y-px active:scale-95"
          >
            Riprova
          </button>
        </div>
      ) : albums.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-xl border border-white/[0.07] bg-bg-elev px-6 py-16 text-center">
          <div className="text-xl font-medium tracking-tight text-ink">Nessun album ancora</div>
          <p className="mt-2 max-w-xs text-sm text-ink-2">
            Aggiungi il primo album per vedere i tuoi progressi qui.
          </p>
          <Link
            to="/album"
            className="mt-5 rounded-full border border-lime px-5 py-2.5 text-sm font-medium text-lime transition-transform duration-150 hover:-translate-y-px active:scale-95"
          >
            Aggiungi il primo album
          </Link>
        </div>
      ) : (
        <>
          <FadeIn delay={0.06} className="mt-8">
            <h2 className="sr-only">Le tue statistiche</h2>
            <StatTicker totals={totals} albumsCount={albums.length} trades={trades} deltas={deltas} ringColor={ringColor} />
          </FadeIn>

          <FadeIn delay={0.12} className="mt-2 lg:grid lg:grid-cols-[minmax(0,52%)_1fr] lg:gap-4">
            <h2 className="sr-only">I tuoi album</h2>
            <AlbumDeck albums={albums} />
            {/* Spazio riservato a destra del deck: contenuto in arrivo. */}
            <div aria-hidden className="hidden lg:block" />
          </FadeIn>

          <FadeIn delay={0.2} className="mt-8 grid gap-4 lg:grid-cols-2">
            <NewsPanel />
            <GroupsPanel />
          </FadeIn>
        </>
      )}
    </div>
  )
}
