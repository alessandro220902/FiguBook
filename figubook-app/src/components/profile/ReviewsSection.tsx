import { useEffect, useState } from 'react'
import { Avatar } from '@/components/Avatar'
import { StarRating } from '@/components/trade/StarRating'
import { aggregateRating, type Review } from '@/lib/db/feedback'
import { getPublicByUid } from '@/lib/db/publicProfiles'

type Author = { username: string; avatarId: string }

const dateFmt = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })

// Sezione recensioni sul profilo pubblico, stile "testimonials-stars":
// stelle in alto, commento al centro, autore (avatar + username + data) in basso.
// Risolve fromUid -> profilo pubblico (username/avatar) con cache locale.
export function ReviewsSection({ reviews }: { reviews: Review[] }) {
  const [authors, setAuthors] = useState<Record<string, Author>>({})
  const rating = aggregateRating(reviews)

  useEffect(() => {
    let alive = true
    const missing = [...new Set(reviews.map((r) => r.fromUid))].filter((uid) => !(uid in authors))
    if (missing.length === 0) return
    Promise.all(missing.map(async (uid) => [uid, await getPublicByUid(uid)] as const)).then((pairs) => {
      if (!alive) return
      setAuthors((prev) => {
        const next = { ...prev }
        for (const [uid, p] of pairs) next[uid] = { username: p?.username ?? 'Utente', avatarId: p?.avatarId ?? '' }
        return next
      })
    })
    return () => { alive = false }
  }, [reviews, authors])

  return (
    <section className="mt-6">
      <div className="mb-4 flex items-center gap-2 px-1">
        <h2 className="font-display text-lg font-semibold text-ink">Reputazione</h2>
        {rating.count > 0 && (
          <span className="flex items-center gap-2">
            <StarRating value={rating.avg} size={16} />
            <span className="type-stat text-sm text-ink-2">{rating.avg} · {rating.count} {rating.count === 1 ? 'recensione' : 'recensioni'}</span>
          </span>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="px-1 text-sm text-ink-2">Nessuna recensione</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => {
            const a = authors[r.fromUid]
            return (
              <figure key={r.id} className="flex flex-col rounded-2xl border border-white/10 bg-surface/40 p-5">
                <StarRating value={r.rating} size={15} />
                {r.comment ? (
                  <blockquote className="my-4 flex-1 text-sm leading-relaxed text-ink">{r.comment}</blockquote>
                ) : (
                  <div className="my-4 flex-1" />
                )}
                <figcaption className="flex items-center gap-2.5">
                  <Avatar id={a?.avatarId} name={a?.username ?? '?'} className="h-8 w-8 rounded-full" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">{a?.username ?? '…'}</span>
                    <span className="block text-xs text-ink-2">{dateFmt.format(r.createdAt)}</span>
                  </span>
                </figcaption>
              </figure>
            )
          })}
        </div>
      )}
    </section>
  )
}
