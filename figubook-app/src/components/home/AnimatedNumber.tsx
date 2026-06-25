import { useEffect } from 'react'
import { animate, motion, useMotionValue, useTransform, useReducedMotion } from 'framer-motion'

// Numero che sale da 0 al valore (count-up). Rispetta prefers-reduced-motion:
// chi ha il movimento ridotto vede subito il valore finale.
export function AnimatedNumber({
  value,
  suffix = '',
  className,
}: {
  value: number
  suffix?: string
  className?: string
}) {
  const reduce = useReducedMotion()
  const mv = useMotionValue(0)
  const text = useTransform(mv, (v) => `${Math.round(v).toLocaleString('it-IT')}${suffix}`)

  useEffect(() => {
    if (reduce) {
      mv.set(value)
      return
    }
    const controls = animate(mv, value, { duration: 0.9, ease: [0.22, 1, 0.36, 1] })
    return controls.stop
  }, [value, reduce, mv])

  return <motion.span className={className}>{text}</motion.span>
}
