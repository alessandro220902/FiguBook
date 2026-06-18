import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCollection } from '@/hooks/useCollection'
import { StatTicker } from '@/components/dashboard/StatTicker'
import { CompletionRing } from '@/components/dashboard/CompletionRing'
import { AlbumStatCard } from '@/components/dashboard/AlbumStatCard'
import { ClosestAlbumCard } from '@/components/dashboard/ClosestAlbumCard'

export default function Dashboard() {
  const { user } = useAuth()
  const { albums, totals, loading } = useCollection()
  const name = user?.displayName?.trim() || user?.email?.split('@')[0] || 'collezionista'

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded bg-bg-elev" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-bg-elev" />
          ))}
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-ink">
        Ciao, <span className="text-lime">{name}</span>
      </h1>

      {albums.length === 0 ? (
        <div className="mt-8 grid place-items-center rounded-2xl border border-white/8 bg-bg-elev p-12 text-center">
          <div className="font-display text-2xl font-bold text-ink">
            Nessun album ancora
          </div>
          <div className="mt-1 text-ink-2">Aggiungi il primo per vedere i tuoi progressi.</div>
          <Link
            to="/album"
            className="mt-4 rounded-lg bg-lime px-5 py-2.5 font-mono text-sm font-semibold text-lime-ink"
          >
            Aggiungi il primo album
          </Link>
        </div>
      ) : (
        <>
          <section className="mt-6">
            <StatTicker totals={totals} />
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-stretch">
            <div className="grid place-items-center rounded-2xl border border-white/10 bg-bg-elev/80 px-8 py-6 shadow-lg shadow-black/20">
              <CompletionRing pct={totals.pct} size={168} />
              <div className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted">
                Completamento totale
              </div>
            </div>
            <ClosestAlbumCard albums={albums} />
          </section>

          <section className="mt-8">
            <h2 className="font-display text-xl font-bold text-ink">I tuoi album</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {albums.map((a) => (
                <AlbumStatCard key={a.id} a={a} />
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  )
}
