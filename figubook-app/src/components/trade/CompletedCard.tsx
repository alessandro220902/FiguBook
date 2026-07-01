import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import type { Person } from './SwapCard'

interface Props {
  albumTitle: string
  albumCover?: string
  other?: Person
  completedAt: number
  reviewed: boolean
  onViewCards: () => void
  onReview: () => void
}

// Data compatta relativa: oggi / ieri / N giorni fa / gg/mm.
function whenLabel(ts: number, now: number): string {
  const day = 86_400_000
  const diff = now - ts
  if (diff < day) return 'oggi'
  if (diff < 2 * day) return 'ieri'
  if (diff < 7 * day) return `${Math.floor(diff / day)} giorni fa`
  const d = new Date(ts)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function CompletedCard({
  albumTitle, albumCover, other, completedAt, reviewed, onViewCards, onReview,
}: Props) {
  const [now] = useState(() => Date.now())
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-surface/40 p-3">
      <div className="flex items-center gap-2.5">
        {albumCover
          ? <img src={albumCover} alt="" className="h-8 w-6 shrink-0 rounded object-cover" />
          : <div className="h-8 w-6 shrink-0 rounded bg-white/10" />}
        <span className="truncate text-sm font-semibold text-ink">{albumTitle}</span>
        <span className="ml-auto shrink-0 inline-flex items-center gap-1 rounded-full bg-lime/10 px-2.5 py-0.5 text-xs font-medium text-lime">
          <Check className="h-3 w-3" /> Completato
        </span>
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
        <span>Scambio completato con</span>
        <Link to={other ? `/u/${other.username}` : '#'} className="inline-flex items-center gap-1.5 font-semibold text-ink hover:underline">
          <Avatar id={other?.avatarId} name={other?.username ?? '?'} className="h-5 w-5 shrink-0 rounded-full" />
          {other?.username ?? 'utente'}
        </Link>
        <span className="ml-auto shrink-0 text-xs">{whenLabel(completedAt, now)}</span>
      </div>

      <div className="mt-2.5 flex items-center gap-4">
        <button onClick={onViewCards} className="text-xs font-semibold text-lime hover:underline">Visualizza dettagli</button>
        {reviewed ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-lime">
            <Check className="h-3.5 w-3.5" /> Recensione
          </span>
        ) : (
          <button onClick={onReview} className="text-xs font-semibold text-lime hover:underline">Lascia recensione</button>
        )}
      </div>
    </div>
  )
}
