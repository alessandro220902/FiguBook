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
import { CompleteProfileBanner } from '@/components/home/CompleteProfileBanner'
import { Typewriter } from '@/components/home/Typewriter'
import { useTradesCount } from '@/hooks/useTradesCount'
import { useStatsDeltas } from '@/hooks/useStatsDeltas'
import { ChartPanel } from '@/components/home/ChartPanel'
import { useThemeMode } from '@/hooks/useThemeMode'

export default function Home() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const { albums, totals, loading, error, retry } = useCollection()
  const trades = useTradesCount()
  const name = profile?.username || user?.displayName?.trim() || user?.email?.split('@')[0] || 'collezionista'
  const team = profile?.favTeam ? teamById[profile.favTeam] : undefined
  const deltas = useStatsDeltas(totals.have)
  const mode = useThemeMode()

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
    <div className={`home-gold${mode === 'light' ? ' home-light' : ''} mx-auto w-full max-w-[88rem]`}>
      {/* TEST tema Midnight Gold: sfondo con sfumatura nero<->oro, copre il
          radiale verde di AppLayout. Dark = nero prevalente sfuma in oro in basso;
          light = oro/chiaro prevalente sfuma verso scuro. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: mode === 'light'
            ? 'linear-gradient(180deg, #f4ecd8 0%, #ead9b2 40%, #d8be8a 78%, #c8a96e 100%)'
            : 'linear-gradient(180deg, #0f0f0f 0%, #141210 48%, #241d12 80%, #3d3018 100%)',
        }}
      />
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
      <CompleteProfileBanner />
      <FadeIn>
        <h1 className="type-h1 text-pretty text-ink">
          Ciao, <Typewriter text={name} className="text-lime" />
        </h1>
        {team && (
          <p className="mt-2 inline-flex items-center gap-2 text-sm text-ink-2">
            <TeamCrest teamId={team.id} c1={team.c1} c2={team.c2} className="h-5 w-[16px]" />
            {team.name}
          </p>
        )}
      </FadeIn>

      {error ? (
        <div
          role="alert"
          className="mt-10 flex flex-col items-center rounded-xl border border-white/[0.07] bg-bg-elev px-6 py-16 text-center"
        >
          <div className="type-h3 text-ink">
            Non riesco a caricare la collezione
          </div>
          <p className="type-body mt-2 max-w-xs text-ink-2">
            Controlla la connessione e riprova. I tuoi dati sono al sicuro.
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-5 rounded-full border border-lime px-5 py-2.5 text-sm text-lime transition-transform duration-150 hover:-translate-y-px active:scale-95"
          >
            Riprova
          </button>
        </div>
      ) : albums.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-xl border border-white/[0.07] bg-bg-elev px-6 py-16 text-center">
          <div className="type-h3 text-ink">Nessun album ancora</div>
          <p className="type-body mt-2 max-w-xs text-ink-2">
            Aggiungi il primo album per vedere i tuoi progressi qui.
          </p>
          <Link
            to="/album"
            className="mt-5 rounded-full border border-lime px-5 py-2.5 text-sm text-lime transition-transform duration-150 hover:-translate-y-px active:scale-95"
          >
            Aggiungi il primo album
          </Link>
        </div>
      ) : (
        <>
          <FadeIn delay={0.06} className="mt-8">
            <h2 className="sr-only">Le tue statistiche</h2>
            <StatTicker totals={totals} albumsCount={albums.length} trades={trades} deltas={deltas} />
          </FadeIn>

          <FadeIn delay={0.12} className="mt-6 lg:grid lg:grid-cols-2 lg:gap-4">
            <h2 className="sr-only">I tuoi album</h2>
            <div className="lg:pl-6">
              <AlbumDeck albums={albums} />
            </div>
            {/* Sezione grafico (toggle aggiunte/doppie): solo su lg, spazio a destra. */}
            <div className="hidden lg:block">
              <ChartPanel refreshKey={`${totals.have}:${totals.doubles}`} />
            </div>
          </FadeIn>

          <FadeIn delay={0.2} className="mt-6 grid gap-4 lg:grid-cols-2">
            <NewsPanel />
            <GroupsPanel />
          </FadeIn>
        </>
      )}
    </div>
  )
}
