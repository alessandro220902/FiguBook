import { useState } from 'react'
import { StarRating } from './StarRating'

interface Props {
  username: string
  onSubmit: (rating: number, comment: string) => void
  onCancel: () => void
}

export function ReviewDialog({ username, onSubmit, onCancel }: Props) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-card p-5">
      <div className="font-semibold text-ink">Recensisci {username}</div>
      <StarRating value={rating} onChange={setRating} size={28} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, 500))}
        placeholder="Com'è andato lo scambio? (facoltativo)"
        rows={3}
        className="w-full resize-none rounded-xl border border-white/12 bg-white/[0.03] p-3 text-sm text-ink outline-none focus:border-lime/50"
      />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-xl border border-white/15 px-4 py-2 text-ink">Annulla</button>
        <button
          disabled={rating === 0}
          onClick={() => onSubmit(rating, comment.trim())}
          className="rounded-xl bg-lime px-4 py-2 font-semibold text-black disabled:opacity-40"
        >
          Invia recensione
        </button>
      </div>
    </div>
  )
}
