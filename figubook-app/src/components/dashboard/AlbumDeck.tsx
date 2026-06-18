import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, type PanInfo } from 'framer-motion'
import type { PerAlbumStats } from '@/lib/db/albums'

// Mazzo di album sfogliabile: card a tutto colore dell'album con stat complete.
// Auto-advance (pausa su hover), drag/swipe, pallini cliccabili, reduced-motion safe.
export function AlbumDeck({ albums }: { albums: PerAlbumStats[] }) {
  const order = [...albums].sort((a, b) => a.missing - b.missing)
  const n = order.length
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const reduce = useReducedMotion()

  const go = (i: number) => setActive(((i % n) + n) % n)
  const next = () => go(active + 1)
  const prev = () => go(active - 1)

  useEffect(() => {
    if (reduce || paused || n <= 1) return
    const t = window.setInterval(() => setActive((a) => (a + 1) % n), 5000)
    return () => window.clearInterval(t)
  }, [reduce, paused, n])

  if (!n) return null

  const onDragEnd = (_e: unknown, info: PanInfo) => {
    if (info.offset.x < -60 || info.velocity.x < -350) next()
    else if (info.offset.x > 60 || info.velocity.x > 350) prev()
  }

  return (
    <div
      className="flex h-full flex-col"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative grow" style={{ minHeight: 232 }}>
        {order.map((a, i) => {
          const o = (i - active + n) % n // 0 = davanti
          const front = o === 0
          const layer =
            o === 0
              ? { scale: 1, y: 0, opacity: 1 }
              : o === 1
                ? { scale: 0.95, y: 16, opacity: 0.7 }
                : o === 2
                  ? { scale: 0.9, y: 30, opacity: 0.4 }
                  : { scale: 0.88, y: 30, opacity: 0 }
          return (
            <motion.div
              key={a.id}
              className={'absolute inset-0 ' + (front ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none')}
              style={{ zIndex: 40 - o }}
              animate={layer}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              drag={front && !reduce ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.5}
              onDragEnd={front ? onDragEnd : undefined}
            >
              <DeckCard a={a} />
            </motion.div>
          )
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-1.5">
          {order.map((a, i) => (
            <button
              key={a.id}
              onClick={() => go(i)}
              aria-label={`Album ${i + 1}: ${a.entry.title}`}
              className={
                'h-2 rounded-full transition-all duration-200 ' +
                (i === active ? 'w-5 bg-lime' : 'w-2 bg-white/20 hover:bg-white/35')
              }
            />
          ))}
        </div>
        <span className="font-mono text-[11px] tabular-nums text-muted">
          {active + 1} / {n}
        </span>
      </div>
    </div>
  )
}

function DeckCard({ a }: { a: PerAlbumStats }) {
  const { entry } = a
  return (
    <div
      className="relative flex h-full select-none flex-col justify-between overflow-hidden rounded-2xl p-6 shadow-xl shadow-black/40"
      style={{ background: `linear-gradient(145deg, ${entry.c1} 0%, ${entry.c2} 100%)` }}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-widest text-white/70">
            {entry.editor} · {entry.season}
          </div>
          <h3 className="mt-1 truncate text-2xl font-semibold tracking-tight text-white drop-shadow-sm">
            {entry.title}
          </h3>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-3xl font-semibold tabular-nums text-white drop-shadow-sm">{a.pct}%</div>
        </div>
      </div>

      <div>
        <div className="h-2 overflow-hidden rounded-full bg-black/25">
          <div className="h-full rounded-full bg-white/90" style={{ width: `${Math.max(2, a.pct)}%` }} />
        </div>
        <div className="mt-4 flex items-end justify-between">
          <dl className="flex gap-6 text-white">
            <div>
              <dt className="text-[11px] text-white/70">Possedute</dt>
              <dd className="text-lg font-medium tabular-nums">
                {a.have}
                <span className="text-sm text-white/60"> / {a.total}</span>
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-white/70">Mancanti</dt>
              <dd className="text-lg font-medium tabular-nums">{a.missing}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-white/70">Doppie</dt>
              <dd className="text-lg font-medium tabular-nums">{a.doubles}</dd>
            </div>
          </dl>
          <Link
            to="/album"
            className="rounded-lg bg-white/95 px-3.5 py-2 text-sm font-medium text-black transition-transform duration-150 hover:-translate-y-px"
          >
            Apri →
          </Link>
        </div>
      </div>
    </div>
  )
}
