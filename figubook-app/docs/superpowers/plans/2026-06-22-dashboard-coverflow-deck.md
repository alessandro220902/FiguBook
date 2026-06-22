# Dashboard Coverflow Deck Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sostituire il carosello album della dashboard con l'effetto feature-carousel (3 card: prev/active/next), card centrale ridisegnata che entra tutta su mobile, tap-apre studiato.

**Architecture:** Riscrivo `AlbumDeck` con engine coverflow inline su framer-motion (già in repo): stato `active|prev|next|hidden` da diff normalizzato, transform spring. `DeckCard` con contenuto minimale (sfondo album, %, nome, Possedute/Totale + Doppie, barra). Elimino `CardStack` (orfano).

**Tech Stack:** React + TS, framer-motion v12, react-router (`useNavigate`), lucide-react, vitest + @testing-library + MemoryRouter.

---

### Task 1: Riscrivi AlbumDeck (engine coverflow + DeckCard)

**Files:**
- Modify (riscrittura completa): `src/components/dashboard/AlbumDeck.tsx`
- Test: `src/components/dashboard/AlbumDeck.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/dashboard/AlbumDeck.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AlbumDeck } from './AlbumDeck'
import type { PerAlbumStats } from '@/lib/db/albums'

function mk(id: string, title: string, missing: number): PerAlbumStats {
  return {
    id, pct: 60, have: 545, total: 886, missing, doubles: 205,
    entry: { id, title, editor: 'Panini', season: '24/25', c1: '#1b6fb8', c2: '#0a3d2e' },
  } as unknown as PerAlbumStats
}

function Loc() {
  const l = useLocation()
  return <div data-testid="loc">{l.pathname}</div>
}

function setup(albums: PerAlbumStats[]) {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <AlbumDeck albums={albums} />
      <Routes>
        <Route path="*" element={<Loc />} />
      </Routes>
    </MemoryRouter>,
  )
}

// ordine: sort per missing asc => [a(10), b(20), c(30)]
const albums = [mk('a', 'Alpha', 10), mk('b', 'Beta', 20), mk('c', 'Gamma', 30)]

describe('AlbumDeck', () => {
  it('renderizza tutte le card e la centrale mostra %, frazione e doppie', () => {
    setup(albums)
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.getByText('Gamma')).toBeInTheDocument()
    // card attiva (Alpha): % e frazione possedute/totale + doppie
    expect(screen.getAllByText('60%').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/545/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/886/).length).toBeGreaterThan(0)
  })

  it('tap sulla card attiva apre /album/:id', async () => {
    setup(albums)
    await userEvent.click(screen.getByRole('button', { name: /Apri Alpha/ }))
    expect(screen.getByTestId('loc')).toHaveTextContent('/album/a')
  })

  it('tap su card laterale la centra senza navigare', async () => {
    setup(albums)
    await userEvent.click(screen.getByRole('button', { name: /Vai a Beta/ }))
    expect(screen.getByTestId('loc')).toHaveTextContent('/dashboard')
  })

  it('dots: uno per album, click cambia attivo', async () => {
    setup(albums)
    const dots = screen.getAllByRole('button', { name: /^Mostra / })
    expect(dots).toHaveLength(3)
    await userEvent.click(dots[2])
    // ora Gamma attiva: il suo bottone card è "Apri Gamma"
    expect(screen.getByRole('button', { name: /Apri Gamma/ })).toBeInTheDocument()
  })

  it('bottone pausa alterna label', async () => {
    setup(albums)
    const btn = screen.getByRole('button', { name: 'Pausa' })
    await userEvent.click(btn)
    expect(screen.getByRole('button', { name: 'Riprendi' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/dashboard/AlbumDeck.test.tsx`
Expected: FAIL (la vecchia AlbumDeck non ha i nuovi ruoli/aria-label).

- [ ] **Step 3: Write implementation (riscrittura completa AlbumDeck.tsx)**

```tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Pause, Play } from 'lucide-react'
import type { PerAlbumStats } from '@/lib/db/albums'
import { STAT_COLORS } from './statColors'

const INTERVAL_MS = 4500

type Status = 'active' | 'prev' | 'next' | 'hidden'

function statusOf(i: number, active: number, len: number): Status {
  let d = i - active
  if (d > len / 2) d -= len
  if (d < -len / 2) d += len
  if (d === 0) return 'active'
  if (d === -1) return 'prev'
  if (d === 1) return 'next'
  return 'hidden'
}

// Carosello album: effetto feature-carousel (prev/active/next). Centro pieno,
// lati dietro e scalati => la card centrale entra tutta. Autoplay + pausa + dots.
export function AlbumDeck({ albums }: { albums: PerAlbumStats[] }) {
  const ordered = useMemo(() => [...albums].sort((a, b) => a.missing - b.missing), [albums])
  const len = ordered.length
  const wrapRef = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(460)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hover, setHover] = useState(false)
  const reduce = useReducedMotion()
  const navigate = useNavigate()
  const movedRef = useRef(0)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver((e) => setW(Math.round(e[0].contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const goTo = useCallback((i: number) => setActive(((i % len) + len) % len), [len])
  const next = useCallback(() => setActive((a) => (a + 1) % len), [len])

  useEffect(() => {
    if (len < 2 || paused || hover) return
    const t = setInterval(next, INTERVAL_MS)
    return () => clearInterval(t)
  }, [len, paused, hover, next])

  if (!len) return null

  const delta = Math.min(110, Math.round(w * 0.28))
  const cardWidth = Math.max(260, Math.min(Math.round(w * 0.82), 460))
  const compact = cardWidth < 340
  const cardHeight = Math.max(184, Math.round(cardWidth * 0.6))
  const spring = reduce
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 260, damping: 25, mass: 0.8 }

  return (
    <div ref={wrapRef} className="relative">
      <div
        className="relative mx-auto flex items-center justify-center"
        style={{ height: Math.round(cardHeight * 1.08) }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {ordered.map((a, i) => {
          const st = statusOf(i, active, len)
          const isActive = st === 'active'
          const x = st === 'prev' ? -delta : st === 'next' ? delta : 0
          const scale = isActive ? 1 : st === 'hidden' ? 0.7 : 0.85
          const opacity = isActive ? 1 : st === 'hidden' ? 0 : 0.4
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
              <DeckCard
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

      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? 'Riprendi' : 'Pausa'}
          className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-ink-2 transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
        >
          {paused ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}
        </button>
        <div className="flex items-center gap-1.5">
          {ordered.map((a, i) => {
            const on = i === active
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Mostra ${a.entry.title}`}
                aria-current={on ? 'true' : undefined}
                className={`h-1.5 rounded-full transition-all ${on ? 'w-5 bg-lime' : 'w-1.5 bg-white/25 hover:bg-white/40'}`}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

function DeckCard({
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
      className="relative block h-full w-full overflow-hidden rounded-[1.75rem] border border-white/10 text-left shadow-[0_18px_40px_-20px_rgba(0,0,0,0.7)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
      style={{ background: `linear-gradient(145deg, ${entry.c1} 0%, ${entry.c2} 100%)` }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.10) 38%, transparent 60%, rgba(0,0,0,0.40) 100%)' }}
      />
      <span className="relative flex h-full flex-col justify-between p-5">
        <span className="flex items-start justify-between gap-3">
          <span className={`min-w-0 truncate font-display font-semibold tracking-tight text-white ${compact ? 'text-2xl' : 'text-[28px] leading-tight'}`}>
            {entry.title}
          </span>
          <span className="shrink-0 font-display text-3xl font-semibold tabular-nums text-white">{a.pct}%</span>
        </span>

        <span className="block">
          <span className="block h-2 overflow-hidden rounded-full bg-black/30">
            <span
              className="block h-full rounded-full"
              style={{ width: `${Math.max(2, a.pct)}%`, background: complete ? STAT_COLORS.gold : '#ffffff' }}
            />
          </span>
          <span className="mt-3 flex items-end gap-6 text-white">
            <span className="block">
              <span className="block text-[11px] text-white/85">Possedute</span>
              <span className="font-display text-xl font-semibold tabular-nums">
                {a.have}<span className="text-sm text-white/75"> / {a.total}</span>
              </span>
            </span>
            <span className="block">
              <span className="block text-[11px] text-white/85">Doppie</span>
              <span className="font-display text-xl font-semibold tabular-nums">{a.doubles}</span>
            </span>
          </span>
        </span>
      </span>
    </button>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/dashboard/AlbumDeck.test.tsx`
Expected: PASS (5 test). Nota: in jsdom framer-motion non blocca i click delle card non attive via pointer-events, ma l'`onClick` distingue active/non-active via la prop `active`, quindi la logica resta corretta.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/AlbumDeck.tsx src/components/dashboard/AlbumDeck.test.tsx
git commit -m "feat(dashboard): AlbumDeck coverflow (effetto feature-carousel) + card ridisegnata"
```

---

### Task 2: Rimuovi CardStack orfano + verifica integrale

**Files:**
- Delete: `src/components/ui/card-stack.tsx`

- [ ] **Step 1: Conferma nessun consumer residuo**

Run: `grep -rn "card-stack\|CardStack" src`
Expected: nessun risultato (solo, eventualmente, il file stesso prima di cancellarlo).

- [ ] **Step 2: Cancella il file**

```bash
git rm src/components/ui/card-stack.tsx
```

- [ ] **Step 3: Verifica integrale**

Run: `npx tsc -b --noEmit && npx vitest run && npm run build && npm run lint`
Expected: tutto exit 0, suite verde.

- [ ] **Step 4: Impeccable**

Run: `node /Users/alessandrogelo/.claude/skills/impeccable/scripts/detect.mjs --json src/components/dashboard/AlbumDeck.tsx`
Expected: `[]`.

- [ ] **Step 5: Commit + push**

```bash
git add -A
git commit -m "chore(dashboard): rimuovi CardStack orfano dopo passaggio a coverflow"
git push origin main
```

---

## Self-Review

- **Spec coverage:** engine `active|prev|next|hidden` + transform (Task 1 statusOf + animate) · Δ responsivo + spring + reduce-motion (Task 1) · "entra tutto" via zIndex/scale + altezza card adeguata al contenuto minimale (Task 1 cardHeight) · card ridisegnata (% alto-dx, nome, Possedute/Totale + Doppie, barra) (DeckCard) · tap laterale centra / tap attiva apre con guard movedRef<8 (DeckCard onClick + onOpen) · swipe drag (onDragEnd) · autoplay/pausa/hover/dots invariati (Task 1) · elimino CardStack (Task 2). Coperto.
- **Placeholder scan:** nessun TODO/TBD; codice completo.
- **Type consistency:** `Status` unione coerente; `statusOf(i,active,len)`; `DeckCard` props `{a,compact,active,onActivate,onOpen}` usate identiche nel chiamante. `PerAlbumStats` campi `pct/have/total/missing/doubles/entry{title,c1,c2}` come nell'AlbumDeck attuale.
- **Note test:** drag-guard reale (no apertura durante swipe) non coperto da jsdom → verifica via probe Playwright mobile dopo Task 2.
