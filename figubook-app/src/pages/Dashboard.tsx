import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCollection } from '@/hooks/useCollection'
import { StatTicker } from '@/components/dashboard/StatTicker'
import { AlbumDeck } from '@/components/dashboard/AlbumDeck'
import { NewsPanel } from '@/components/dashboard/NewsPanel'
import { GroupsPanel } from '@/components/dashboard/GroupsPanel'
import { FadeIn } from '@/components/dashboard/FadeIn'
import { Typewriter } from '@/components/dashboard/Typewriter'
import { useTradesCount } from '@/hooks/useTradesCount'

export default function Dashboard() {
  const { user } = useAuth()
  const { albums, totals, loading, error, retry } = useCollection()
  const trades = useTradesCount()
  const name = user?.displayName?.trim() || user?.email?.split('@')[0] || 'collezionista'

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
      <FadeIn>
        <h1 className="text-pretty text-[28px] font-medium tracking-tight text-ink sm:text-[32px]">
          Ciao, <Typewriter text={name} className="text-lime" />
        </h1>
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
            className="mt-5 rounded-lg bg-lime px-5 py-2.5 text-sm font-medium text-lime-ink transition-transform duration-150 hover:-translate-y-px"
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
            className="mt-5 rounded-lg bg-lime px-5 py-2.5 text-sm font-medium text-lime-ink transition-transform duration-150 hover:-translate-y-px"
          >
            Aggiungi il primo album
          </Link>
        </div>
      ) : (
        <>
          <FadeIn delay={0.06} className="mt-8">
            <h2 className="sr-only">Le tue statistiche</h2>
            <StatTicker totals={totals} albumsCount={albums.length} trades={trades} />
          </FadeIn>

          <FadeIn delay={0.12} className="mt-2">
            <h2 className="sr-only">I tuoi album</h2>
            <AlbumDeck albums={albums} />
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
