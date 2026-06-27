import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { useMyGroups } from '@/hooks/useMyGroups'

// Riquadro "Gruppi a cui partecipi": lista reale + link al gruppo (per ora /community).
export function GroupsPanel() {
  const { groups, loading } = useMyGroups()
  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/[0.08] bg-surface p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium tracking-tight text-ink">Gruppi a cui partecipi</h2>
        <Link to="/community" className="text-sm font-medium text-lime">
          Tutti →
        </Link>
      </div>

      {loading ? (
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="mt-4 flex grow flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-4 py-8 text-center">
          <p className="text-sm text-ink-2">Non sei ancora in nessun gruppo.</p>
          <Link
            to="/community"
            className="mt-3 rounded-full border border-lime px-4 py-2 text-sm font-medium text-lime transition-transform duration-150 hover:-translate-y-px"
          >
            Trova un gruppo
          </Link>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {groups.map((g) => (
            <li key={g.id}>
              <Link
                to="/community"
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-colors duration-200 hover:border-white/15 hover:bg-white/[0.04]"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-lime/15 text-lime">
                  <Users className="h-4 w-4" />
                </span>
                <span className="truncate text-sm font-medium text-ink">{g.name}</span>
                <span className="ml-auto text-muted-foreground">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
