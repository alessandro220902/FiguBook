import { useId } from 'react'
import { avatarById, uniquifyIds } from '@/lib/avatars'

// Avatar: preset oggetto-calcio (se id valido) oppure monogramma lime di fallback.
export function Avatar({
  id,
  name,
  className,
  style,
}: {
  id?: string | null
  name: string
  className?: string
  style?: React.CSSProperties
}) {
  const uid = useId().replace(/:/g, '')
  const preset = avatarById(id)
  const cls = (className ?? '') + ' block'

  if (!preset) {
    const initial = (name.trim().charAt(0) || '?').toUpperCase()
    return (
      <svg viewBox="0 0 100 100" className={cls} style={style} aria-hidden>
        <circle cx="50" cy="50" r="50" fill="#c2f23d" />
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="52"
          fontWeight="800"
          fill="#0f1a06"
          fontFamily="Inter,sans-serif"
        >
          {initial}
        </text>
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 100 100"
      className={cls}
      style={style}
      aria-label={preset.label}
      dangerouslySetInnerHTML={{ __html: uniquifyIds(preset.inner, uid) }}
    />
  )
}
