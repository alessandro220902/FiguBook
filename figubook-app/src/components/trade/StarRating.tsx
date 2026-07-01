import { Star } from 'lucide-react'

interface Props {
  value: number
  onChange?: (v: number) => void   // se presente: input; altrimenti display
  size?: number
}

// Stelle: display (media) o input (selezione 1-5) se onChange è passato.
export function StarRating({ value, onChange, size = 18 }: Props) {
  const stars = [1, 2, 3, 4, 5]
  return (
    <div className="flex items-center gap-0.5">
      {stars.map((s) => {
        const filled = s <= Math.round(value)
        const cls = filled ? 'fill-lime text-lime' : 'text-white/25'
        return onChange ? (
          <button key={s} type="button" aria-label={`${s} stelle`} onClick={() => onChange(s)} className="transition-transform active:scale-90">
            <Star style={{ width: size, height: size }} className={cls} />
          </button>
        ) : (
          <Star key={s} style={{ width: size, height: size }} className={cls} />
        )
      })}
    </div>
  )
}
