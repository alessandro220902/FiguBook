import * as React from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'

// Card-stack sfogliabile (adattato da 21st ruixenui/card-stack):
// tolto next/link + icona lucide, dots in stile FiguBook, render generico via renderCard.

function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(' ')
}

export type CardStackItem = {
  id: string | number
  title: string
}

export type CardStackProps<T extends CardStackItem> = {
  items: T[]
  initialIndex?: number
  maxVisible?: number
  cardWidth?: number
  cardHeight?: number
  overlap?: number
  spreadDeg?: number
  perspectivePx?: number
  depthPx?: number
  tiltXDeg?: number
  activeLiftPx?: number
  activeScale?: number
  inactiveScale?: number
  springStiffness?: number
  springDamping?: number
  loop?: boolean
  autoAdvance?: boolean
  intervalMs?: number
  pauseOnHover?: boolean
  showDots?: boolean
  showArrows?: boolean
  className?: string
  onChangeIndex?: (index: number, item: T) => void
  renderCard?: (item: T, state: { active: boolean }) => React.ReactNode
}

function wrapIndex(n: number, len: number) {
  if (len <= 0) return 0
  return ((n % len) + len) % len
}

function signedOffset(i: number, active: number, len: number, loop: boolean) {
  const raw = i - active
  if (!loop || len <= 1) return raw
  const alt = raw > 0 ? raw - len : raw + len
  return Math.abs(alt) < Math.abs(raw) ? alt : raw
}

export function CardStack<T extends CardStackItem>({
  items,
  initialIndex = 0,
  maxVisible = 5,
  cardWidth = 460,
  cardHeight = 280,
  overlap = 0.62,
  spreadDeg = 13,
  perspectivePx = 1100,
  depthPx = 110,
  tiltXDeg = 6,
  activeLiftPx = 14,
  activeScale = 1.02,
  inactiveScale = 0.94,
  springStiffness = 300,
  springDamping = 30,
  loop = true,
  autoAdvance = false,
  intervalMs = 4500,
  pauseOnHover = true,
  showDots = true,
  showArrows = true,
  className,
  onChangeIndex,
  renderCard,
}: CardStackProps<T>) {
  const reduceMotion = useReducedMotion()
  const len = items.length
  const [active, setActive] = React.useState(() => wrapIndex(initialIndex, len))
  const [hovering, setHovering] = React.useState(false)
  const [userPaused, setUserPaused] = React.useState(false)

  // active normalizzato in render (no setState-in-effect se items cambiano).
  const activeIdx = wrapIndex(active, len)

  React.useEffect(() => {
    if (!len) return
    onChangeIndex?.(activeIdx, items[activeIdx]!)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx])

  const maxOffset = Math.max(0, Math.floor(maxVisible / 2))
  const cardSpacing = Math.max(10, Math.round(cardWidth * (1 - overlap)))
  const stepDeg = maxOffset > 0 ? spreadDeg / maxOffset : 0

  const next = React.useCallback(() => {
    if (!len) return
    setActive((a) => wrapIndex(a + 1, len))
  }, [len])

  const prev = React.useCallback(() => {
    if (!len) return
    setActive((a) => wrapIndex(a - 1, len))
  }, [len])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') prev()
    if (e.key === 'ArrowRight') next()
  }

  // Pausa effettiva: hover (mouse) o toggle esplicito. WCAG 2.2.2 — il contenuto in
  // movimento deve poter essere fermato, garantito dal bottone pausa/play.
  // NB: niente pausa-su-focus: un tap su freccia/dot lascia il focus lì e bloccherebbe
  // l'autoplay per sempre (regressione mobile).
  const autoPlaying = autoAdvance && !reduceMotion && !userPaused
  const paused = (pauseOnHover && hovering) || userPaused

  React.useEffect(() => {
    if (!autoPlaying || !len || paused) return
    const id = window.setInterval(() => {
      if (loop || activeIdx < len - 1) next()
    }, Math.max(700, intervalMs))
    return () => window.clearInterval(id)
  }, [autoPlaying, intervalMs, paused, len, loop, activeIdx, next])

  if (!len) return null

  return (
    <div
      className={cn('w-full', className)}
      role="group"
      aria-roledescription="carosello"
      aria-label="Mazzo album"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Annuncio screen-reader: l'album attivo cambia senza spostare il focus. */}
      <div aria-live="polite" className="sr-only">
        {items[activeIdx]?.title} — {activeIdx + 1} di {len}
      </div>

      <div
        className="relative w-full"
        style={{ height: cardHeight + 150 }}
        tabIndex={0}
        role="group"
        aria-roledescription="diapositiva"
        aria-label={`${items[activeIdx]?.title} (${activeIdx + 1} di ${len})`}
        onKeyDown={onKeyDown}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ perspective: `${perspectivePx}px` }}
        >
          <AnimatePresence initial={false}>
            {items.map((item, i) => {
              const off = signedOffset(i, activeIdx, len, loop)
              const abs = Math.abs(off)
              if (abs > maxOffset) return null

              const rotateZ = off * stepDeg
              const x = off * cardSpacing
              const y = 0
              const z = -abs * depthPx
              const isActive = off === 0
              const scale = isActive ? activeScale : inactiveScale
              const lift = isActive ? -activeLiftPx : 0
              const rotateX = isActive ? 0 : tiltXDeg
              const zIndex = 100 - abs

              const dragProps = isActive
                ? {
                    drag: 'x' as const,
                    dragConstraints: { left: 0, right: 0 },
                    dragElastic: 0.18,
                    onDragEnd: (
                      _e: unknown,
                      info: { offset: { x: number }; velocity: { x: number } },
                    ) => {
                      if (reduceMotion) return
                      const threshold = Math.min(160, cardWidth * 0.22)
                      if (info.offset.x > threshold || info.velocity.x > 650) prev()
                      else if (info.offset.x < -threshold || info.velocity.x < -650) next()
                    },
                  }
                : {}

              return (
                <motion.div
                  key={item.id}
                  className={cn(
                    'absolute overflow-hidden rounded-2xl border border-white/10 shadow-xl will-change-transform select-none',
                    isActive ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
                  )}
                  style={{ width: cardWidth, height: cardHeight, zIndex, transformStyle: 'preserve-3d' }}
                  initial={reduceMotion ? false : { opacity: 0, x, y: y + 30, rotateZ, rotateX, scale }}
                  animate={{ opacity: 1, x, y: y + lift, rotateZ, rotateX, scale }}
                  transition={{ type: 'spring', stiffness: springStiffness, damping: springDamping }}
                  onClick={() => setActive(i)}
                  {...dragProps}
                >
                  <div
                    className="h-full w-full"
                    style={{ transform: `translateZ(${z}px)`, transformStyle: 'preserve-3d' }}
                  >
                    {renderCard?.(item, { active: isActive })}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {showArrows && len > 1 ? (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Album precedente"
              className="absolute left-1 top-1/2 z-[120] grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-bg-elev/80 text-ink-2 backdrop-blur-sm transition-colors hover:border-white/25 hover:text-ink"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Album successivo"
              className="absolute right-1 top-1/2 z-[120] grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-bg-elev/80 text-ink-2 backdrop-blur-sm transition-colors hover:border-white/25 hover:text-ink"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        ) : null}
      </div>

      {showDots ? (
        <div className="relative z-[120] mt-5 flex items-center justify-center gap-2 py-2">
          {autoAdvance && !reduceMotion && len > 1 ? (
            <button
              type="button"
              onClick={() => setUserPaused((p) => !p)}
              aria-label={userPaused ? 'Riprendi rotazione automatica' : 'Metti in pausa la rotazione'}
              aria-pressed={userPaused}
              className="relative mr-1 grid h-7 w-7 place-items-center rounded-full text-ink-2 transition-colors after:absolute after:-inset-2 after:content-[''] hover:bg-white/10 hover:text-ink"
            >
              {userPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            </button>
          ) : null}
          {items.map((it, idx) => (
            <button
              key={it.id}
              onClick={() => setActive(idx)}
              aria-label={`Vai a ${it.title}`}
              className={cn(
                "relative h-2 rounded-full transition-all duration-200 after:absolute after:-inset-2.5 after:content-['']",
                idx === activeIdx ? 'w-5 bg-lime' : 'w-2 bg-white/20 hover:bg-white/35',
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
