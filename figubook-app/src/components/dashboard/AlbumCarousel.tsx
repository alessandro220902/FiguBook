import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import type { PerAlbumStats } from '@/lib/db/albums'
import { CompletionRing } from './CompletionRing'

// hex -> rgba con alpha (per il tint del colore album).
function tint(hex: string, a: number): string {
  const h = hex.replace('#', '')
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(f, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

// Carosello album: una slide per album (ordinati per piu' vicino a chiudere),
// ognuna col colore dell'album. Auto-scroll + pallini cliccabili come il login.
export function AlbumCarousel({ albums }: { albums: PerAlbumStats[] }) {
  const ordered = [...albums].sort((a, b) => a.missing - b.missing)
  const [idx, setIdx] = useState(0)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce || ordered.length <= 1) return
    const t = window.setInterval(() => setIdx((i) => (i + 1) % ordered.length), 5000)
    return () => window.clearInterval(t)
  }, [reduce, ordered.length])

  if (!ordered.length) return null
  const a = ordered[Math.min(idx, ordered.length - 1)]
  const { entry } = a

  return (
    <div
      className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] p-6"
      style={{
        background: `radial-gradient(130% 130% at 0% 0%, ${tint(entry.c1, 0.22)} 0%, transparent 58%), var(--color-surface)`,
      }}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-ink-2">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: entry.c1 }} />
        Più vicino a chiudere
      </div>

      <motion.div
        key={a.id}
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mt-4 flex items-center gap-5"
      >
        <div className="shrink-0">
          <CompletionRing pct={a.pct} size={96} color={entry.c1} track="rgba(255,255,255,0.18)" />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-xl font-medium tracking-tight text-ink sm:text-2xl">
            {entry.title}
          </h3>
          <p className="mt-1 text-sm text-ink-2">
            Ti mancano{' '}
            <span className="font-medium tabular-nums text-ink">{a.missing}</span> figurine
          </p>
          <div className="mt-3 flex gap-5 text-[13px] tabular-nums text-muted">
            <span>
              <span className="text-ink-2">{a.missing}</span> mancanti
            </span>
            <span>
              <span className="text-ink-2">{a.doubles}</span> doppie
            </span>
            <span>
              <span className="text-ink-2">{a.have}</span>/{a.total}
            </span>
          </div>
        </div>
      </motion.div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-1.5">
          {ordered.map((al, i) => (
            <button
              key={al.id}
              onClick={() => setIdx(i)}
              aria-label={`Album ${i + 1}: ${al.entry.title}`}
              className={
                'h-2 rounded-full transition-all duration-200 ' +
                (i === idx ? 'w-5 bg-lime' : 'w-2 bg-white/15 hover:bg-white/30')
              }
            />
          ))}
        </div>
        <Link to="/album" className="text-sm font-medium text-lime">
          Apri →
        </Link>
      </div>
    </div>
  )
}
