import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

// Entrata in cascata: fade + slide-up leggero al mount (contenuto above-the-fold,
// quindi animate diretto, non gated su scroll). Reduced-motion → nessun movimento.
export function FadeIn({
  delay = 0,
  className,
  children,
}: {
  delay?: number
  className?: string
  children: ReactNode
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
