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
        className="absolute -left-24 top-[8%] h-[46vh] w-[46vh] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(200,169,110,0.16), transparent 70%)',
          transform: 'translate3d(0, calc(var(--sy, 0) * 0.15px), 0)',
        }}
      />
      <div
        className="absolute right-[-10%] top-[42%] h-[54vh] w-[54vh] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(220,192,136,0.12), transparent 70%)',
          transform: 'translate3d(0, calc(var(--sy, 0) * -0.08px), 0)',
        }}
      />
      <div
        className="absolute left-[30%] bottom-[6%] h-[40vh] w-[40vh] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(200,169,110,0.10), transparent 70%)',
          transform: 'translate3d(0, calc(var(--sy, 0) * 0.22px), 0)',
        }}
      />
    </div>
  )
}
