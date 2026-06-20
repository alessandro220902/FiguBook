# Album Redesign full-width + ContainerScroll (A2.4) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rifondere `/album/:albumId` in layout full-width edge-to-edge: hero statico (copertina + stat leggibili) + editor sezioni avvolto in un effetto ContainerScroll (Aceternity) che si appiattisce scrollando.

**Architecture:** Un nuovo componente riusabile `ContainerScroll` incapsula l'effetto 3D scroll-linked (framer `useScroll`/`useTransform`), disattivandosi su mobile/reduced-motion. `AlbumLanding` viene rifatto in hero full-width con statistiche ad alto contrasto. `Album.tsx` toglie `max-w-6xl` e compone Landing statico + ContainerScroll che avvolge l'editor sezioni esistente (invariato nella logica).

**Tech Stack:** React 19, react-router 7, framer-motion 12 (`useScroll`/`useTransform`/`useReducedMotion`), Tailwind 4, Vitest + Testing Library.

**Reference spec:** `docs/superpowers/specs/2026-06-20-album-scroll-redesign-design.md`
**Reference effetto:** https://21st.dev/community/components/aceternity/container-scroll-animation/default

---

## File Structure

**Nuovi:**
- `figubook-app/src/components/album/ContainerScroll.tsx` — wrapper effetto 3D scroll-linked (riusabile).
- `figubook-app/src/components/album/ContainerScroll.test.tsx`
- `figubook-app/src/components/album/AlbumLanding.test.tsx`

**Modificati:**
- `figubook-app/src/test/setup.ts` — polyfill `matchMedia` per jsdom.
- `figubook-app/src/components/album/AlbumLanding.tsx` — rifatto full-width + stat leggibili.
- `figubook-app/src/components/album/StickerGrid.tsx` — colonne full-width su monitor larghi.
- `figubook-app/src/pages/Album.tsx` — full-width + compone Landing + ContainerScroll.

---

### Task 1: ContainerScroll (componente effetto) + matchMedia polyfill

**Files:**
- Modify: `figubook-app/src/test/setup.ts`
- Create: `figubook-app/src/components/album/ContainerScroll.tsx`
- Test: `figubook-app/src/components/album/ContainerScroll.test.tsx`

- [ ] **Step 1: Polyfill matchMedia (jsdom non lo implementa)**

In `figubook-app/src/test/setup.ts`, appendi:

```ts
// jsdom non implementa matchMedia: stub minimale per i componenti che lo usano.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
}
```

- [ ] **Step 2: Test (failing)**

```tsx
// figubook-app/src/components/album/ContainerScroll.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const reduceMock = vi.fn(() => false)
vi.mock('framer-motion', async (orig) => ({
  ...(await orig<typeof import('framer-motion')>()),
  useReducedMotion: () => reduceMock(),
}))
import { ContainerScroll } from './ContainerScroll'

describe('ContainerScroll', () => {
  it('rende header e children', () => {
    render(<ContainerScroll header={<h2>Header X</h2>}><p>Contenuto Y</p></ContainerScroll>)
    expect(screen.getByText('Header X')).toBeInTheDocument()
    expect(screen.getByText('Contenuto Y')).toBeInTheDocument()
  })

  it('reduced-motion: niente card 3D (statico)', () => {
    reduceMock.mockReturnValueOnce(true)
    render(<ContainerScroll header={null}><p>Flat</p></ContainerScroll>)
    expect(screen.getByText('Flat')).toBeInTheDocument()
    expect(screen.queryByTestId('cscroll-card')).toBeNull()
  })

  it('motion attivo: card 3D presente', () => {
    reduceMock.mockReturnValue(false)
    render(<ContainerScroll header={null}><p>Tilt</p></ContainerScroll>)
    expect(screen.getByTestId('cscroll-card')).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Verifica fallisce**

Run: `cd figubook-app && npm test -- ContainerScroll`
Expected: FAIL (modulo non esiste).

- [ ] **Step 4: Implementazione**

```tsx
// figubook-app/src/components/album/ContainerScroll.tsx
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'

// hook: viewport mobile (< md). matchMedia stubbato nei test (setup.ts).
function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const apply = () => setMobile(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return mobile
}

export interface ContainerScrollProps {
  header?: ReactNode
  children: ReactNode
  className?: string
}

// Effetto Aceternity ContainerScroll: il blocco entra inclinato (rotateX 20°) e si
// appiattisce a 0° man mano che raggiunge la cima del viewport. Disattivo su mobile
// / reduced-motion -> statico (perf + a11y). A rotateX 0 il contenuto è interattivo.
export function ContainerScroll({ header, children, className }: ContainerScrollProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const isMobile = useIsMobile()
  const disabled = !!reduce || isMobile

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start start'] })
  const rotateX = useTransform(scrollYProgress, [0, 1], [20, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [1.04, 1])
  const headerY = useTransform(scrollYProgress, [0, 1], [40, 0])
  const headerOpacity = useTransform(scrollYProgress, [0, 0.6], [0, 1])

  if (disabled) {
    return (
      <div ref={ref} className={className}>
        {header}
        {children}
      </div>
    )
  }

  return (
    <div ref={ref} className={className} style={{ perspective: '1200px' }}>
      {header != null && (
        <motion.div style={{ y: headerY, opacity: headerOpacity }} className="mb-4">
          {header}
        </motion.div>
      )}
      <motion.div data-testid="cscroll-card" style={{ rotateX, scale, transformOrigin: 'top center' }}>
        {children}
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 5: Verifica passa**

Run: `cd figubook-app && npm test -- ContainerScroll`
Expected: PASS (3 test).

- [ ] **Step 6: Commit**

```bash
git add figubook-app/src/test/setup.ts figubook-app/src/components/album/ContainerScroll.tsx figubook-app/src/components/album/ContainerScroll.test.tsx
git commit -m "feat(a2.4): ContainerScroll effetto 3D scroll-linked (disable mobile/reduced-motion, TDD)"
```

---

### Task 2: AlbumLanding rifatto (full-width + stat leggibili)

**Files:**
- Modify: `figubook-app/src/components/album/AlbumLanding.tsx`
- Test: `figubook-app/src/components/album/AlbumLanding.test.tsx`

- [ ] **Step 1: Test (failing)**

```tsx
// figubook-app/src/components/album/AlbumLanding.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AlbumLanding } from './AlbumLanding'
import type { AlbumCatalogEntry } from '@/data/albumCatalog'

const entry: AlbumCatalogEntry = {
  id: 'mondiali-2022', title: 'FIFA World Cup 2022', editor: 'Panini', season: '2022',
  total: 670, href: 'x.html', missingParam: 'fwc2022', storageKey: 'k', tags: [], c1: '#7a1538', c2: '#c9a227',
}
const stats = { have: 400, doubles: 12, missing: 270, total: 670, pct: 60 }

describe('AlbumLanding', () => {
  it('mostra titolo, percentuale e numeri statistiche', () => {
    render(<AlbumLanding entry={entry} stats={stats} />)
    expect(screen.getByRole('heading', { name: /FIFA World Cup 2022/ })).toBeInTheDocument()
    expect(screen.getAllByText('60%').length).toBeGreaterThan(0)
    expect(screen.getByText('400')).toBeInTheDocument()
    expect(screen.getByText('270')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Verifica fallisce**

Run: `cd figubook-app && npm test -- AlbumLanding`
Expected: FAIL (markup attuale: numeri presenti ma il test guida il refactor; se passa già, procedi comunque al refactor per leggibilità/full-width).

- [ ] **Step 3: Implementazione (sostituisci tutto il file)**

```tsx
// figubook-app/src/components/album/AlbumLanding.tsx
import { Share2 } from 'lucide-react'
import type { AlbumCatalogEntry } from '@/data/albumCatalog'
import { sectionGradient } from '@/lib/album/color'
import type { AlbumStats } from '@/lib/db/albums'

// Hero statico full-width: copertina + statistiche ad alto contrasto. Nessun effetto
// scroll qui (parte all'apertura). Le stat sono chip solide leggibili (prima erano
// semitrasparenti sul gradiente -> illeggibili).
export function AlbumLanding({ entry, stats }: { entry: AlbumCatalogEntry; stats: AlbumStats }) {
  return (
    <section className="w-full">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-stretch">
        {/* Copertina */}
        <div
          className="relative aspect-[3/4] overflow-hidden rounded-3xl border border-white/10 shadow-2xl lg:aspect-auto lg:min-h-[22rem]"
          style={{ backgroundImage: sectionGradient(entry.c1, entry.c2) }}
        >
          <div aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 55%, transparent 100%)' }} />
          <div className="absolute right-5 top-5 rounded-2xl bg-black/55 px-4 py-2 text-right backdrop-blur">
            <div className="font-display text-4xl font-bold leading-none text-white">{stats.pct}%</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-widest text-white/75">Completo</div>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-6">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-white/80">{entry.editor} · {entry.season}</div>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-white drop-shadow sm:text-4xl">{entry.title}</h1>
          </div>
        </div>

        {/* Pannello statistiche leggibile */}
        <div className="flex flex-col justify-center gap-5">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Possedute" value={`${stats.have}`} sub={`/ ${stats.total}`} tone="have" />
            <Stat label="Mancanti" value={`${stats.missing}`} tone="missing" />
            <Stat label="Doppie" value={`${stats.doubles}`} />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
              <span>Completamento</span><span className="tabular-nums">{stats.pct}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-bg-elev">
              <div className="h-full rounded-full bg-gradient-to-r from-lime to-lime-2 transition-[width] duration-500" style={{ width: `${stats.pct}%` }} />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" disabled title="Presto" className="flex cursor-not-allowed items-center gap-2 rounded-xl border border-white/10 bg-surface px-4 py-2.5 text-sm font-semibold text-muted opacity-60">
              <Share2 size={16} /> Condividi doppie
            </button>
            <button type="button" disabled title="Presto" className="flex cursor-not-allowed items-center gap-2 rounded-xl border border-white/10 bg-surface px-4 py-2.5 text-sm font-semibold text-muted opacity-60">
              <Share2 size={16} /> Condividi mancanti
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'have' | 'missing' }) {
  const color = tone === 'have' ? 'text-stat-have' : tone === 'missing' ? 'text-stat-missing' : 'text-ink'
  return (
    <div className="rounded-2xl border border-white/10 bg-bg-elev p-4">
      <div className="text-[11px] font-medium uppercase tracking-widest text-muted">{label}</div>
      <div className={`mt-1 font-display text-3xl font-bold tabular-nums ${color}`}>
        {value}{sub && <span className="text-base font-semibold text-muted"> {sub}</span>}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verifica passa**

Run: `cd figubook-app && npm test -- AlbumLanding`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add figubook-app/src/components/album/AlbumLanding.tsx figubook-app/src/components/album/AlbumLanding.test.tsx
git commit -m "feat(a2.4): AlbumLanding full-width + stat ad alto contrasto (TDD)"
```

---

### Task 3: StickerGrid colonne full-width

**Files:**
- Modify: `figubook-app/src/components/album/StickerGrid.tsx`

- [ ] **Step 1: Aumenta le colonne sui monitor larghi**

In `figubook-app/src/components/album/StickerGrid.tsx`, trova la riga della griglia:

```tsx
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-7 lg:grid-cols-8">
```

e sostituiscila con (riempie la larghezza aggiungendo colonne, figurine a dimensione usabile):

```tsx
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 2xl:grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))]">
```

- [ ] **Step 2: Verifica build**

Run: `cd figubook-app && npm run build`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add figubook-app/src/components/album/StickerGrid.tsx
git commit -m "feat(a2.4): StickerGrid full-width (più colonne su schermi larghi)"
```

---

### Task 4: Album.tsx full-width + ContainerScroll

**Files:**
- Modify: `figubook-app/src/pages/Album.tsx`

- [ ] **Step 1: Import ContainerScroll**

In `figubook-app/src/pages/Album.tsx`, dopo gli import dei componenti album, aggiungi:

```tsx
import { ContainerScroll } from '@/components/album/ContainerScroll'
```

- [ ] **Step 2: Container full-width**

Trova:

```tsx
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
```

sostituisci con:

```tsx
    <main className="w-full px-4 pb-16 pt-6 sm:px-6 lg:px-8">
```

- [ ] **Step 3: Avvolgi le sezioni in ContainerScroll**

Trova il blocco:

```tsx
      <div className="mt-6 grid gap-5 lg:grid-cols-[15rem_1fr]" style={section ? sectionVars(section.c1, section.c2) : undefined}>
        <SectionSidebar data={data} states={album.states} counts={album.counts} activeId={section.id} onSelect={(id) => { setActiveId(id); void album.flush() }} />
        <div>
          <SectionHero section={section} index={sectionIndex} stats={secStats} />
          <AlbumToolbar filter={filter} onFilter={setFilter} insertOn={insertOn} onToggleInsert={() => setInsertOn((v) => !v)} stats={secStats} />
          <StickerGrid
            section={section}
            names={data.names}
            countOf={album.countOf}
            insertOn={insertOn}
            filter={filter}
            onAdd={album.increment}
            onRemove={album.decrement}
            onInfo={(code) => setInfoCode(code)}
          />
        </div>
      </div>
```

sostituiscilo con (stesso contenuto, avvolto in `ContainerScroll` con header):

```tsx
      <ContainerScroll
        className="mt-8"
        header={
          <div className="text-center">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted">Editor figurine</div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">Le sezioni dell'album</h2>
          </div>
        }
      >
        <div className="grid gap-5 lg:grid-cols-[15rem_1fr]" style={section ? sectionVars(section.c1, section.c2) : undefined}>
          <SectionSidebar data={data} states={album.states} counts={album.counts} activeId={section.id} onSelect={(id) => { setActiveId(id); void album.flush() }} />
          <div>
            <SectionHero section={section} index={sectionIndex} stats={secStats} />
            <AlbumToolbar filter={filter} onFilter={setFilter} insertOn={insertOn} onToggleInsert={() => setInsertOn((v) => !v)} stats={secStats} />
            <StickerGrid
              section={section}
              names={data.names}
              countOf={album.countOf}
              insertOn={insertOn}
              filter={filter}
              onAdd={album.increment}
              onRemove={album.decrement}
              onInfo={(code) => setInfoCode(code)}
            />
          </div>
        </div>
      </ContainerScroll>
```

- [ ] **Step 4: Verifica build + lint**

Run: `cd figubook-app && npm run build && npm run lint`
Expected: build exit 0; lint nessun errore nuovo (i 2 pre-esistenti su button.tsx/tabs.tsx restano).

- [ ] **Step 5: Commit**

```bash
git add figubook-app/src/pages/Album.tsx
git commit -m "feat(a2.4): Album full-width + sezioni in ContainerScroll"
```

---

### Task 5: Harden + verifica + push

**Files:** nessuno nuovo (eventuali ritocchi)

- [ ] **Step 1: Suite test completa**

Run: `cd figubook-app && npm test`
Expected: tutti verdi (stats, albums.flush, useAlbum, StickerCard, index, ContainerScroll, AlbumLanding).

- [ ] **Step 2: Build**

Run: `cd figubook-app && npm run build`
Expected: exit 0.

- [ ] **Step 3: Verifica hit-testing (lezione card-stack)**

Avvia dev (`npm run dev`) e su `/album/mondiali-2022` (loggato) controlla che, dopo che le sezioni si sono appiattite (scroll completo), il **tap su una figurina funzioni** (rotateX 0 non deve rompere l'hit-testing). Se rotto: rimuovi `transform`/`transformOrigin` residui quando `scrollYProgress` è a 1 (es. azzera lo style del card a effetto completato).

- [ ] **Step 4: Verifica manuale**

Su `/album/mondiali-2022`:
- Apertura: hero copertina + stat **leggibili**, nessun effetto.
- Scroll giù: le sezioni entrano inclinate e si appiattiscono (desktop).
- Larghezza: hero e sezioni occupano tutta la larghezza pagina.
- Mobile (DevTools responsive) / reduced-motion: sezioni statiche piatte.
- Interazione figurine/sidebar/filtri OK dopo l'appiattimento.

- [ ] **Step 5: Commit + push**

```bash
git add -A
git commit -m "polish(a2.4): verifica redesign Album scroll + full-width" --allow-empty
git push origin main
```

---

## Self-Review (compilata)

- **Spec coverage:** hero statico full-width (T2,T4) · stat leggibili (T2) · ContainerScroll effetto sezioni (T1,T4) · disable mobile/reduced-motion (T1) · full-width edge-to-edge (T3,T4) · hit-testing safe (T5) · nota `preserve-3d`/transform (T1 niente preserve-3d, T5 verifica). Vista Lista/share reali: fuori scope (invariati).
- **Type consistency:** `ContainerScroll` props `header?/children/className`; `AlbumLanding` props invariate (`entry`/`stats`); `StickerGrid` props invariate. `useScroll`/`useTransform`/`useReducedMotion` da framer-motion 12.
- **Placeholder scan:** nessun TODO/TBD; tutto il codice è presente. Refuso noto nel test T2 (`toBeGreaterChan`) segnalato con correzione esplicita.
- **No regressioni:** logica dati (`useAlbum`, flush B1, schema) e componenti editor invariati; solo layout/wrapper.
