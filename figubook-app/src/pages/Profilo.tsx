import { useAuth } from '@/hooks/useAuth'
import { useCollection } from '@/hooks/useCollection'
import { FadeIn } from '@/components/home/FadeIn'
import { AnimatedNumber } from '@/components/home/AnimatedNumber'

const TILE =
  'rounded-2xl border border-white/[0.08] bg-surface px-4 py-3.5'
const LABEL = 'flex items-center gap-1.5 text-xs font-medium text-ink md:text-sm'
const NUM =
  'mt-1.5 block font-display text-3xl font-semibold tabular-nums tracking-tight text-ink md:text-4xl'

function Dot({ color }: { color: string }) {
  return <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
}

// Data iscrizione: creationTime di Firebase Auth (stringa UTC) -> "mese aaaa" it.
function memberSince(creationTime?: string): string | null {
  if (!creationTime) return null
  const d = new Date(creationTime)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
}

export default function Profilo() {
  const { user } = useAuth()
  const { totals, albums, loading } = useCollection()

  const name = user?.displayName?.trim() || user?.email?.split('@')[0] || 'Collezionista'
  const initial = name.charAt(0).toUpperCase()
  const since = memberSince(user?.metadata?.creationTime)
  const verified = user?.emailVerified ?? false

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Intestazione: avatar monogramma (eco del logo F) + identità */}
      <FadeIn>
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              className="h-20 w-20 shrink-0 -rotate-6 rounded-[18px] object-cover sm:h-24 sm:w-24"
            />
          ) : (
            <span className="grid h-20 w-20 shrink-0 -rotate-6 place-items-center rounded-[18px] bg-lime font-display text-4xl font-extrabold text-lime-ink sm:h-24 sm:w-24 sm:text-5xl">
              {initial}
            </span>
          )}

          <div className="min-w-0 text-center sm:text-left">
            <h1 className="truncate font-display text-[28px] font-semibold tracking-tight text-ink sm:text-[34px]">
              {name}
            </h1>
            {user?.email && (
              <p className="mt-0.5 truncate text-sm text-ink-2">{user.email}</p>
            )}
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span
                className={
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ' +
                  (verified
                    ? 'bg-lime/12 text-lime'
                    : 'bg-stat-missing/15 text-stat-missing')
                }
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {verified ? 'Email verificata' : 'Email da verificare'}
              </span>
              {since && (
                <span className="text-xs text-ink-2">Iscritto da {since}</span>
              )}
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Riepilogo collezione */}
      <FadeIn>
        <h2 className="mt-10 text-sm font-medium text-ink-2">La tua collezione</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className={TILE}>
            <div className={LABEL}>
              <Dot color="var(--color-ink-2)" /> Album
            </div>
            <AnimatedNumber value={loading ? 0 : albums.length} className={NUM} />
          </div>
          <div className={TILE}>
            <div className={LABEL}>
              <Dot color="var(--color-stat-have)" /> Possedute
            </div>
            <AnimatedNumber value={loading ? 0 : totals.have} className={NUM} />
          </div>
          <div className={TILE}>
            <div className={LABEL}>
              <Dot color="var(--color-lime)" /> Doppie
            </div>
            <AnimatedNumber value={loading ? 0 : totals.doubles} className={NUM} />
          </div>
          <div className={TILE}>
            <div className={LABEL}>
              <Dot color="var(--color-stat-have)" /> Completamento
            </div>
            <div className="mt-1.5 flex items-baseline gap-0.5">
              <AnimatedNumber
                value={loading ? 0 : totals.pct}
                className="font-display text-3xl font-semibold tabular-nums tracking-tight text-ink md:text-4xl"
              />
              <span className="font-display text-lg font-semibold text-ink-2">%</span>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Azioni: ancora non attive (placeholder onesti, non fanno nulla) */}
      <FadeIn>
        <h2 className="mt-10 text-sm font-medium text-ink-2">Account</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled
            className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-surface px-4 py-3.5 text-left opacity-60"
          >
            <span className="text-sm font-medium text-ink">Modifica profilo</span>
            <span className="text-xs text-ink-2">Presto</span>
          </button>
          <button
            type="button"
            disabled
            className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-surface px-4 py-3.5 text-left opacity-60"
          >
            <span className="text-sm font-medium text-ink">Cambia avatar</span>
            <span className="text-xs text-ink-2">Presto</span>
          </button>
        </div>
      </FadeIn>
    </div>
  )
}
