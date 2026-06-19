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

  const cardWidth = Math.max(260, Math.min(Math.round(w * 0.86), 520))
  const cardHeight = Math.max(196, Math.round(cardWidth * 0.52))
  const compact = cardWidth < 320
  const items: Item[] = ordered.map((a) => ({ id: a.id, title: a.entry.title, a }))

  return (
    <div ref={wrapRef} className="relative">
      {/* cornice morbida: il vuoto laterale legge come margine, non come buco */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[78%] w-[94%] -translate-x-1/2 -translate-y-1/2 rounded-[44px]"
        style={{ background: 'radial-gradient(60% 60% at 50% 50%, rgba(255,255,255,0.025) 0%, transparent 72%)' }}
      />
      <CardStack<Item>
        items={items}
        cardWidth={cardWidth}
        cardHeight={cardHeight}
        overlap={0.66}
        autoAdvance
        intervalMs={4500}
        pauseOnHover
        renderCard={(it) => <DeckCard a={it.a} compact={compact} />}
      />
    </div>
  )
}

function DeckCard({ a, compact }: { a: PerAlbumStats; compact: boolean }) {
  const { entry } = a
  return (
    <div
      className="relative h-full"
      style={{ background: `linear-gradient(145deg, ${entry.c1} 0%, ${entry.c2} 100%)` }}
    >
      {/*
        Scrim contrasto: scurisce le fasce alta e bassa (dove sta il testo) e lascia
        viva la zona centrale. Garantisce testo bianco ≥4.5:1 anche su album chiari
        (giallo/chartreuse/oro) senza appiattire l'identità colore dell'album.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.10) 26%, transparent 50%, rgba(0,0,0,0.20) 72%, rgba(0,0,0,0.46) 100%)',
        }}
      />

      <div className={`relative flex h-full flex-col justify-between ${compact ? 'p-4' : 'p-6'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-[11px] text-white/85">
              {entry.editor} · {entry.season}
            </div>
            <h3
              className={`mt-1 truncate font-semibold tracking-tight text-white ${compact ? 'text-xl' : 'text-2xl'}`}
            >
              {entry.title}
            </h3>
          </div>
          <div
            className={`shrink-0 font-semibold tabular-nums text-white ${compact ? 'text-2xl' : 'text-3xl'}`}
          >
            {a.pct}%
          </div>
        </div>

        <div>
          <div className="h-2 overflow-hidden rounded-full bg-black/30">
            <div className="h-full rounded-full bg-white" style={{ width: `${Math.max(2, a.pct)}%` }} />
          </div>
          <div className={`mt-4 flex items-end justify-between gap-3 ${compact ? 'flex-wrap' : ''}`}>
            <dl className={`flex text-white ${compact ? 'gap-4' : 'gap-6'}`}>
              <div>
                <dt className="text-[11px] text-white/85">Possedute</dt>
                <dd className="text-lg font-medium tabular-nums">
                  {a.have}
                  <span className="text-sm text-white/75"> / {a.total}</span>
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-white/85">Mancanti</dt>
                <dd className="text-lg font-medium tabular-nums">{a.missing}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-white/85">Doppie</dt>
                <dd className="text-lg font-medium tabular-nums">{a.doubles}</dd>
              </div>
            </dl>
            <Link
              to="/album"
              className={`grid shrink-0 place-items-center rounded-lg bg-white px-4 text-sm font-medium text-black transition-transform duration-150 hover:-translate-y-px ${compact ? 'min-h-11 w-full' : 'min-h-11'}`}
            >
              Apri →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
