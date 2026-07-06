import { useEffect, useRef } from 'react'

// Parallax leggero scoped alla Landing: alcuni glow oro fissi dietro il contenuto
// derivano a velocita' diverse mentre si scorre -> senso di profondita'.
// Nessuna libreria, reduced-motion safe. Non tocca lo scroll della pagina.
export function ParallaxGlow() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        ref.current?.style.setProperty('--sy', String(window.scrollY))
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* ogni glow scorre a velocita' diversa: fattore piccolo = piu' lento = piu' profondo */}
      <div
        className="absolute -left-24 top-[6%] h-[52vh] w-[52vh] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(200,169,110,0.42), transparent 70%)',
          transform: 'translate3d(0, calc(var(--sy, 0) * 0.32px), 0)',
        }}
      />
      <div
        className="absolute right-[-12%] top-[40%] h-[60vh] w-[60vh] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(220,192,136,0.32), transparent 70%)',
          transform: 'translate3d(0, calc(var(--sy, 0) * -0.2px), 0)',
        }}
      />
      <div
        className="absolute left-[28%] bottom-[4%] h-[46vh] w-[46vh] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(200,169,110,0.28), transparent 70%)',
          transform: 'translate3d(0, calc(var(--sy, 0) * 0.5px), 0)',
        }}
      />
    </div>
  )
}
