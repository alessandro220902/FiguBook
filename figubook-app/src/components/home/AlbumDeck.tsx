import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import type { PerAlbumStats } from '@/lib/db/albums'
import { STAT_COLORS } from './statColors'

const INTERVAL_MS = 4500
const NAME_H = 44

type Status = 'active' | 'prev' | 'next' | 'hidden'

// distanza ciclica con segno (per il loop)
function signedDist(i: number, active: number, len: number) {
  let d = i - active
  if (d > len / 2) d -= len
  if (d < -len / 2) d += len
  return d
}

function statusOf(i: number, active: number, len: number): Status {
  const d = signedDist(i, active, len)
  if (d === 0) return 'active'
  if (d === -1) return 'prev'
  if (d === 1) return 'next'
  return 'hidden'
}

// Deck album (feature-carousel split): colonna nomi a sinistra + copertine
// coverflow a destra, entrambe sopra lo sfondo app (niente cornice/pannelli).
// Scorri/tocca i nomi e cambia la copertina. Autoplay (pausa su hover desktop).
// La copertina attiva si apre col tap.
export function AlbumDeck({ albums }: { albums: PerAlbumStats[] }) {
  const ordered = useMemo(() => [...albums].sort((a, b) => a.missing - b.missing), [albums])
  const len = ordered.length
  const wrapRef = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(460)
  const [active, setActive] = useState(0)
  const [hover, setHover] = useState(false)
  const reduce = useReducedMotion()
  const navigate = useNavigate()
  const movedRef = useRef(0)

  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((e) => setW(Math.round(e[0].contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const goTo = useCallback((i: number) => setActive(((i % len) + len) % len), [len])
  const next = useCallback(() => setActive((a) => (a + 1) % len), [len])

  useEffect(() => {
    if (len < 2 || hover) return
    const t = setInterval(next, INTERVAL_MS)
    return () => clearInterval(t)
  }, [len, hover, next])

  if (!len) return null

  const leftW = Math.max(120, Math.round(w * 0.4))
  const rightW = Math.max(150, w - leftW)
  const cardWidth = Math.max(150, Math.min(Math.round(rightW * 0.86), 340))
  const cardHeight = Math.round(cardWidth * 1.12)
  const delta = Math.min(44, Math.round(rightW * 0.12))
  const panelH = Math.round(cardHeight * 1.12)
  const compact = cardWidth < 240
  const spring = reduce
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 260, damping: 25, mass: 0.8 }
  const nameSpring = reduce
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 90, damping: 22, mass: 1 }

  return (
    <div ref={wrapRef} className="relative overflow-x-clip">
      <div
        className="flex items-stretch gap-3"
        style={{ height: panelH }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {/* Metà nomi: sopra lo sfondo app, lista verticale con attivo al centro */}
        <div className="relative overflow-hidden" style={{ width: leftW }} aria-label="Album">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2">
            {ordered.map((a, i) => {
              const d = signedDist(i, active, len)
              const on = d === 0
              return (
                <motion.div
                  key={a.id}
                  className="absolute inset-x-0 flex justify-start"
                  style={{ height: NAME_H }}
                  initial={false}
                  animate={{ y: d * NAME_H, opacity: Math.max(0, 1 - Math.abs(d) * 0.3) }}
                  transition={nameSpring}
                >
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={a.entry.title}
                    aria-current={on ? 'true' : undefined}
                    className={[
                      'w-full truncate rounded-full border px-3 py-2 text-left text-xs font-semibold uppercase tracking-tight transition-colors',
                      on
                        ? 'border-lime text-lime'
                        : 'border-white/10 bg-bg-elev text-ink-2 hover:text-ink',
                    ].join(' ')}
                  >
                    {a.entry.title}
                  </button>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Metà copertine: sopra lo sfondo app, stack coverflow (prev/active/next) */}
        <div className="relative flex flex-1 items-center justify-center">
          {ordered.map((a, i) => {
            const st = statusOf(i, active, len)
            const isActive = st === 'active'
            const x = st === 'prev' ? -delta : st === 'next' ? delta : 0
            const scale = isActive ? 1 : st === 'hidden' ? 0.7 : 0.86
            const opacity = isActive ? 1 : st === 'hidden' ? 0 : 0.45
            const rotate = st === 'prev' ? -3 : st === 'next' ? 3 : 0
            const z = isActive ? 20 : st === 'hidden' ? 0 : 10
            return (
              <motion.div
                key={a.id}
                className="absolute"
                style={{ width: cardWidth, height: cardHeight, zIndex: z }}
                initial={false}
                animate={{ x, scale, opacity, rotate }}
                transition={spring}
                drag={isActive ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                onPointerDown={() => { movedRef.current = 0 }}
                onDrag={(_, info) => { movedRef.current = Math.abs(info.offset.x) }}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -40) next()
                  else if (info.offset.x > 40) goTo(active - 1)
                }}
              >
                <CoverCard
                  a={a}
                  compact={compact}
                  active={isActive}
                  onActivate={() => goTo(i)}
                  onOpen={() => { if (movedRef.current < 8) navigate(`/album/${a.id}`) }}
                />
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function CoverCard({
  a, compact, active, onActivate, onOpen,
}: {
  a: PerAlbumStats
  compact: boolean
  active: boolean
  onActivate: () => void
  onOpen: () => void
}) {
  const { entry } = a
  const complete = a.pct >= 100
  return (
    <button
      type="button"
      onClick={() => (active ? onOpen() : onActivate())}
      aria-label={active ? `Apri ${entry.title}` : `Vai a ${entry.title}`}
      className="relative block h-full w-full overflow-hidden rounded-[1.5rem] text-left shadow-[0_18px_40px_-20px_rgba(0,0,0,0.8)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
      style={{ background: `linear-gradient(150deg, ${entry.c1} 0%, ${entry.c2} 100%)` }}
    >
      {entry.cover && <img src={entry.cover} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-contain" />}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.06) 40%, transparent 58%, rgba(0,0,0,0.50) 100%)' }}
      />
      <span className={`relative flex h-full flex-col justify-between ${compact ? 'p-3' : 'p-4'}`}>
        <span className="flex items-start justify-end">
          <span className={`font-display font-semibold tabular-nums text-white ${compact ? 'text-2xl' : 'text-3xl'}`}>{a.pct}%</span>
        </span>

        <span className="block">
          <span className={`mb-2 block truncate font-display font-semibold leading-tight tracking-tight text-white ${compact ? 'text-base' : 'text-xl'}`}>
            {entry.title}
          </span>
          <span className="block h-1.5 overflow-hidden rounded-full bg-black/30">
            <span
              className="block h-full rounded-full"
              style={{ width: `${Math.max(2, a.pct)}%`, background: complete ? STAT_COLORS.gold : '#ffffff' }}
            />
          </span>
          <span className="mt-2 flex items-end gap-4 text-white">
            <span className="block">
              <span className="block text-[10px] text-white/80">Possedute</span>
              <span className={`font-display font-semibold tabular-nums ${compact ? 'text-base' : 'text-lg'}`}>
                {a.have}<span className="text-xs text-white/75"> / {a.total}</span>
              </span>
            </span>
            <span className="block">
              <span className="block text-[10px] text-white/80">Doppie</span>
              <span className={`font-display font-semibold tabular-nums ${compact ? 'text-base' : 'text-lg'}`}>{a.doubles}</span>
            </span>
          </span>
        </span>
      </span>
    </button>
  )
}
