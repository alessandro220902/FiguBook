import { useEffect, useState, type ReactNode } from 'react'

// Arc Gallery Hero (adattato da @thanh/arc-gallery-hero-component, 21st.dev).
// Card immagini disposte a ventaglio ad arco sopra titolo+sottotitolo+azioni.
// Colori Midnight Gold: fondo trasparente (lascia il gradiente della Landing),
// bordo card oro tenue via --card-hair, testo su token.

type ArcGalleryHeroProps = {
  images: string[]
  badge?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  startAngle?: number
  endAngle?: number
  radiusLg?: number
  radiusMd?: number
  radiusSm?: number
  cardSizeLg?: number
  cardSizeMd?: number
  cardSizeSm?: number
  className?: string
}

export function ArcGalleryHero({
  images,
  badge,
  title,
  subtitle,
  actions,
  startAngle = 20,
  endAngle = 160,
  radiusLg = 360,
  radiusMd = 290,
  radiusSm = 190,
  cardSizeLg = 100,
  cardSizeMd = 84,
  cardSizeSm = 64,
  className = '',
}: ArcGalleryHeroProps) {
  const [dim, setDim] = useState({ radius: radiusLg, cardSize: cardSizeLg })

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth
      if (w < 640) setDim({ radius: radiusSm, cardSize: cardSizeSm })
      else if (w < 1024) setDim({ radius: radiusMd, cardSize: cardSizeMd })
      else setDim({ radius: radiusLg, cardSize: cardSizeLg })
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [radiusLg, radiusMd, radiusSm, cardSizeLg, cardSizeMd, cardSizeSm])

  const count = Math.max(images.length, 2)
  const step = (endAngle - startAngle) / (count - 1)

  return (
    <section className={`relative overflow-hidden ${className}`}>
      {/* Contenitore arco: geometria del ventaglio */}
      <div className="relative mx-auto" style={{ width: '100%', height: dim.radius * 0.92 }}>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          {images.map((src, i) => {
            const angle = startAngle + step * i
            const rad = (angle * Math.PI) / 180
            const x = Math.cos(rad) * dim.radius
            const y = Math.sin(rad) * dim.radius
            return (
              <div
                key={i}
                className="animate-arc-in absolute opacity-0"
                style={{
                  width: dim.cardSize,
                  height: dim.cardSize,
                  left: `calc(50% + ${x}px)`,
                  bottom: `${y}px`,
                  transform: 'translate(-50%, 50%)',
                  animationDelay: `${i * 90}ms`,
                  animationFillMode: 'forwards',
                  zIndex: count - i,
                }}
              >
                <div
                  className="h-full w-full overflow-hidden rounded-2xl border border-[color:var(--card-hair)] bg-bg-elev shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)] transition-transform duration-300 hover:scale-[1.06]"
                  style={{ transform: `rotate(${angle / 4}deg)` }}
                >
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    draggable={false}
                    className="block h-full w-full object-cover"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Contenuto sotto l'arco */}
      <div className="relative z-10 -mt-24 flex justify-center px-6 md:-mt-28 lg:-mt-32">
        <div
          className="animate-arc-fade max-w-2xl text-center opacity-0"
          style={{ animationDelay: '760ms', animationFillMode: 'forwards' }}
        >
          {badge && (
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-lime/30 bg-lime/[0.08] px-4 py-1.5 text-[13px] font-semibold text-lime">
              {badge}
            </div>
          )}
          <h1 className="text-balance text-[clamp(2.1rem,5vw,3.4rem)] font-bold leading-[1.0] tracking-[-0.02em] text-ink">
            {title}
          </h1>
          {subtitle && (
            <p className="mx-auto mt-6 max-w-[46ch] text-[17px] leading-relaxed text-ink-2">{subtitle}</p>
          )}
          {actions && <div className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">{actions}</div>}
        </div>
      </div>

      <style>{`
        @keyframes arc-in {
          from { opacity: 0; transform: translate(-50%, 62%); }
          to   { opacity: 1; transform: translate(-50%, 50%); }
        }
        @keyframes arc-fade {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-arc-in { animation: arc-in 0.8s ease-out; }
        .animate-arc-fade { animation: arc-fade 0.8s ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .animate-arc-in, .animate-arc-fade { animation: none; opacity: 1; }
        }
      `}</style>
    </section>
  )
}
