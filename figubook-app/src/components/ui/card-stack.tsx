import * as React from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

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
  spreadDeg = 20,
  perspectivePx = 1100,
  depthPx = 110,
  tiltXDeg = 9,
  activeLiftPx = 16,
  activeScale = 1.02,
  inactiveScale = 0.94,
  springStiffness = 300,
  springDamping = 30,
  loop = true,
  autoAdvance = false,
  intervalMs = 4500,
  pauseOnHover = true,
  showDots = true,
  className,
  onChangeIndex,
  renderCard,
}: CardStackProps<T>) {
  const reduceMotion = useReducedMotion()
  const len = items.length
  const [active, setActive] = React.useState(() => wrapIndex(initialIndex, len))
  const [hovering, setHovering] = React.useState(false)

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

  React.useEffect(() => {
    if (!autoAdvance || reduceMotion || !len) return
    if (pauseOnHover && hovering) return
    const id = window.setInterval(() => {
      if (loop || activeIdx < len - 1) next()
    }, Math.max(700, intervalMs))
    return () => window.clearInterval(id)
  }, [autoAdvance, intervalMs, hovering, pauseOnHover, reduceMotion, len, loop, activeIdx, next])

  if (!len) return null

  return (
    <div
      className={cn('w-full', className)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div
        className="relative w-full"
        style={{ height: cardHeight + 56 }}
        tabIndex={0}
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
              const y = abs * 8
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
      </div>

      {showDots ? (
        <div className="mt-5 flex items-center justify-center gap-1.5">
          {items.map((it, idx) => (
            <button
              key={it.id}
              onClick={() => setActive(idx)}
              aria-label={`Vai a ${it.title}`}
              className={cn(
                'h-2 rounded-full transition-all duration-200',
                idx === activeIdx ? 'w-5 bg-lime' : 'w-2 bg-white/20 hover:bg-white/35',
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
