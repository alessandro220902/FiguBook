import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CardStack, type CardStackItem } from '@/components/ui/card-stack'
import type { PerAlbumStats } from '@/lib/db/albums'

type Item = CardStackItem & { a: PerAlbumStats }

// Mazzo album: card-stack a tutto colore album, stat complete, auto-rotazione.
export function AlbumDeck({ albums }: { albums: PerAlbumStats[] }) {
  const ordered = [...albums].sort((a, b) => a.missing - b.missing)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(460)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => setW(Math.round(entries[0].contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  if (!ordered.length) return null

  const cardWidth = Math.max(240, Math.min(Math.round(w * 0.82), 480))
  const cardHeight = Math.round(cardWidth * 0.6)
  const items: Item[] = ordered.map((a) => ({ id: a.id, title: a.entry.title, a }))

  return (
    <div ref={wrapRef} className="overflow-hidden">
      <CardStack<Item>
        items={items}
        cardWidth={cardWidth}
        cardHeight={cardHeight}
        autoAdvance
        intervalMs={4500}
        pauseOnHover
        renderCard={(it) => <DeckCard a={it.a} />}
      />
    </div>
  )
}

function DeckCard({ a }: { a: PerAlbumStats }) {
  const { entry } = a
  return (
    <div
      className="flex h-full flex-col justify-between p-6"
      style={{ background: `linear-gradient(145deg, ${entry.c1} 0%, ${entry.c2} 100%)` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-widest text-white/70">
            {entry.editor} · {entry.season}
          </div>
          <h3 className="mt-1 truncate text-2xl font-semibold tracking-tight text-white drop-shadow-sm">
            {entry.title}
          </h3>
        </div>
        <div className="shrink-0 text-3xl font-semibold tabular-nums text-white drop-shadow-sm">
          {a.pct}%
        </div>
      </div>

      <div>
        <div className="h-2 overflow-hidden rounded-full bg-black/25">
          <div className="h-full rounded-full bg-white/90" style={{ width: `${Math.max(2, a.pct)}%` }} />
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
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
            className="shrink-0 rounded-lg bg-white/95 px-3.5 py-2 text-sm font-medium text-black transition-transform duration-150 hover:-translate-y-px"
          >
            Apri →
          </Link>
        </div>
      </div>
    </div>
  )
}
