// figubook-app/src/components/album/ContainerScroll.tsx
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'

// hook: viewport mobile (< md). matchMedia stubbato nei test (setup.ts).
function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const apply = () => setMobile(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return mobile
}

export interface ContainerScrollProps {
  header?: ReactNode
  children: ReactNode
  className?: string
}

// Effetto Aceternity ContainerScroll: il blocco entra inclinato (rotateX 20°) e si
// appiattisce a 0° man mano che raggiunge la cima del viewport. Disattivo su mobile
// / reduced-motion -> statico (perf + a11y). A rotateX 0 il contenuto è interattivo.
export function ContainerScroll({ header, children, className }: ContainerScrollProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const isMobile = useIsMobile()
  const disabled = !!reduce || isMobile

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start start'] })
  const rotateX = useTransform(scrollYProgress, [0, 1], [20, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [1.04, 1])
  // L'header è un titolo di sezione: deve restare sempre leggibile. Niente fade
  // d'opacità (prima scompariva finché non avevi scrollato il 60%); solo lieve slide.
  const headerY = useTransform(scrollYProgress, [0, 1], [24, 0])

  if (disabled) {
    return (
      <div ref={ref} className={className}>
        {header}
        {children}
      </div>
    )
  }

  return (
    <div ref={ref} className={className} style={{ perspective: '1200px' }}>
      {header != null && (
        <motion.div style={{ y: headerY }} className="mb-4">
          {header}
        </motion.div>
      )}
      <motion.div data-testid="cscroll-card" style={{ rotateX, scale, transformOrigin: 'top center' }}>
        {children}
      </motion.div>
    </div>
  )
}
