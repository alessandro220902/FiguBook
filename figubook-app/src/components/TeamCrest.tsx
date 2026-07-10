import { useId } from 'react'
import type { KitPattern } from '@/lib/album/teamKits'
import { inkForKit, DARK_INK, LIGHT_INK } from '@/lib/album/color'

const SHIELD = 'M12 1 L23 4 V14 C23 21 18 25 12 27 C6 25 1 21 1 14 V4 Z'

// Stemma astratto a 2 colori (colori sociali). NIENTE logo ufficiale (copyright club):
// scudo con pattern maglia + monogramma opzionale a 1 lettera.
export function TeamCrest({
  c1,
  c2,
  accent,
  pattern = 'halves',
  monogram,
  className,
}: {
  c1: string
  c2: string
  accent?: string
  pattern?: KitPattern
  monogram?: string
  className?: string
}) {
  const uid = useId().replace(/:/g, '')
  const clip = `url(#sh-${uid})`
  const ink = inkForKit({ c1, c2, accent, pattern }).isDark ? DARK_INK : LIGHT_INK

  return (
    <svg viewBox="0 0 24 28" className={className} aria-hidden>
      <defs>
        <clipPath id={`sh-${uid}`}>
          <path d={SHIELD} />
        </clipPath>
      </defs>
      <g clipPath={clip}>
        <PatternFill pattern={pattern} c1={c1} c2={c2} accent={accent} />
      </g>
      <path d={SHIELD} fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="1" />
      {monogram && (
        <text
          x="12"
          y="15"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="Times New Roman, Georgia, serif"
          fontWeight="700"
          fontSize="12"
          fill={ink}
          style={{ paintOrder: 'stroke' }}
        >
          {monogram}
        </text>
      )}
    </svg>
  )
}

function PatternFill({
  pattern,
  c1,
  c2,
  accent,
}: {
  pattern: KitPattern
  c1: string
  c2: string
  accent?: string
}) {
  switch (pattern) {
    case 'stripes': {
      const bars = []
      for (let x = 0; x < 24; x += 4) {
        bars.push(<rect key={x} x={x} y="0" width="4" height="28" fill={(x / 4) % 2 === 0 ? c1 : c2} />)
      }
      return <>{bars}</>
    }
    case 'hoops': {
      const bars = []
      for (let y = 0; y < 28; y += 3.5) {
        bars.push(<rect key={y} x="0" y={y} width="24" height="3.5" fill={(Math.round(y / 3.5)) % 2 === 0 ? c1 : c2} />)
      }
      return <>{bars}</>
    }
    case 'sash':
      return (
        <>
          <rect x="0" y="0" width="24" height="28" fill={c1} />
          <path d="M-4 22 L18 -4 L26 -4 L4 22 Z" fill={accent ?? c2} />
        </>
      )
    case 'halves':
      return (
        <>
          <rect x="0" y="0" width="12" height="28" fill={c1} />
          <rect x="12" y="0" width="12" height="28" fill={c2} />
        </>
      )
    default: // solid
      return <rect x="0" y="0" width="24" height="28" fill={c1} />
  }
}
