import { useId } from 'react'

// Stemma astratto a 2 colori (c1/c2 della squadra). NIENTE logo ufficiale
// (copyright club): scudo diviso in diagonale con i colori sociali.
export function TeamCrest({
  c1,
  c2,
  className,
}: {
  c1: string
  c2: string
  className?: string
}) {
  const uid = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 24 28" className={className} aria-hidden>
      <defs>
        <clipPath id={`sh-${uid}`}>
          <path d="M12 1 L23 4 V14 C23 21 18 25 12 27 C6 25 1 21 1 14 V4 Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#sh-${uid})`}>
        <rect x="0" y="0" width="12" height="28" fill={c1} />
        <rect x="12" y="0" width="12" height="28" fill={c2} />
      </g>
      <path
        d="M12 1 L23 4 V14 C23 21 18 25 12 27 C6 25 1 21 1 14 V4 Z"
        fill="none"
        stroke="rgba(255,255,255,.25)"
        strokeWidth="1"
      />
    </svg>
  )
}
