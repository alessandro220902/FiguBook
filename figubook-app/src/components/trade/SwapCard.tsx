import { Link } from 'react-router-dom'
import { ArrowUpDown } from 'lucide-react'
import type { Proposal } from '@/lib/db/proposals'
import { proposalView } from '@/lib/trade/proposalView'

export interface Person { uid: string; username: string; rating?: number; avatarId?: string }

interface Props {
  proposal: Proposal
  meUid: string
  people: Record<string, Person>       // uid -> profilo
  albumTitle: string
  albumCover?: string
  onViewCards: () => void
  actions: React.ReactNode             // bottoni footer (decisi dal parent per sezione)
  statusLabel: string
  statusClass: string
}

function Panel({ person, count, onViewCards }: { person?: Person; count: number; onViewCards: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
      <Link to={person ? `/u/${person.username}` : '#'} className="flex min-w-0 items-center gap-2 hover:underline">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-lime/15 text-xs font-bold text-lime">
          {(person?.username ?? '?').slice(0, 1).toUpperCase()}
        </span>
        <span className="truncate text-sm font-semibold text-ink">{person?.username ?? 'utente'}</span>
        {person?.rating != null && person.rating > 0 && (
          <span className="shrink-0 text-xs text-muted-foreground">⭐ {person.rating.toFixed(1)}</span>
        )}
      </Link>
      <div className="flex shrink-0 items-center gap-2.5">
        <span className="text-sm text-muted-foreground">Dà <span className="font-semibold text-ink">{count}</span></span>
        <button onClick={onViewCards} className="text-xs font-semibold text-lime hover:underline">Visualizza →</button>
      </div>
    </div>
  )
}

export function SwapCard({
  proposal, meUid, people, albumTitle, albumCover, onViewCards, actions, statusLabel, statusClass,
}: Props) {
  const v = proposalView(proposal, meUid)
  return (
    <div className="w-full max-w-xl rounded-2xl border border-white/[0.08] bg-surface/40 p-3 backdrop-blur-sm">
      <div className="mb-2.5 flex items-center gap-2.5">
        {albumCover
          ? <img src={albumCover} alt="" className="h-9 w-7 shrink-0 rounded object-cover" />
          : <div className="h-9 w-7 shrink-0 rounded bg-white/10" />}
        <span className="truncate text-sm font-semibold text-ink">{albumTitle}</span>
        <span className={'ml-auto shrink-0 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ' + statusClass}>
          {statusLabel}
        </span>
      </div>

      <div className="relative flex flex-col gap-1.5">
        <Panel person={people[v.fromUid]} count={v.fromGives.length} onViewCards={onViewCards} />
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/12 bg-card text-lime shadow-lg">
            <ArrowUpDown className="h-4 w-4" />
          </span>
        </div>
        <Panel person={people[v.toUid]} count={v.toGives.length} onViewCards={onViewCards} />
      </div>

      {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
