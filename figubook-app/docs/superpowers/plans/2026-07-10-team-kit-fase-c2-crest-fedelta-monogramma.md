# Team Kit Fase C2 — crest fedeltà colori + monogramma — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La scheda `/squadra/:teamId` usa il kit curato (colori fedeli + pattern maglia) e un crest con monogramma a 1 lettera, coerente con l'hero in-album.

**Architecture:** `aggregateTeamProgress` espone la prima `Section` che matcha la squadra; `useTeamProgress` ne ricava il `TeamKit` curato con `kitForSection` (fallback ai colori generati). `TeamCrest` riceve props additive opzionali (`pattern/accent/monogram`) — default = comportamento attuale, nessuna regressione sugli 8 chip esistenti. `Squadra.tsx` passa kit curato + iniziale.

**Tech Stack:** React + TypeScript + Vite, Vitest (jsdom) + @testing-library/react.

Spec: `docs/superpowers/specs/2026-07-10-team-kit-fase-c2-crest-fedelta-monogramma-design.md`

---

## File Structure

- `src/lib/album/teamProgress.ts` — aggiunge `matchedSection?: Section` al risultato.
- `src/lib/album/teamProgress.test.ts` — test per il nuovo campo.
- `src/hooks/useTeamProgress.ts` — espone `kit?: TeamKit` derivato da `matchedSection`.
- `src/components/TeamCrest.tsx` — props additive + pattern SVG + monogramma.
- `src/components/TeamCrest.test.tsx` — nuovo, render test.
- `src/pages/Squadra.tsx` — usa `progress.kit` per hero e crest.

---

## Task 1: `aggregateTeamProgress` espone la sezione matchata

**Files:**
- Modify: `src/lib/album/teamProgress.ts`
- Test: `src/lib/album/teamProgress.test.ts`

- [ ] **Step 1: Aggiungere il test del nuovo campo**

In `src/lib/album/teamProgress.test.ts`, dentro il `describe('aggregateTeamProgress', ...)`, aggiungere:

```ts
  it('espone la prima sezione che matcha come matchedSection', () => {
    const albums: AlbumForTeam[] = [
      { albumId: 'a1', albumTitle: 'Cal 25/26', sections: [interSec(['I1','I2']), otherSec],
        states: {}, counts: {} },
    ]
    const p = aggregateTeamProgress(albums, 'inter')
    expect(p.matchedSection?.id).toBe('inter')
  })

  it('matchedSection undefined se il team non compare', () => {
    const p = aggregateTeamProgress([], 'inter')
    expect(p.matchedSection).toBeUndefined()
  })
```

- [ ] **Step 2: Eseguire i test per vederli fallire**

Run: `npx vitest run src/lib/album/teamProgress.test.ts`
Expected: FAIL — `matchedSection` non esiste sul risultato.

- [ ] **Step 3: Implementare il campo**

In `src/lib/album/teamProgress.ts`:

Aggiungere al type il campo:
```ts
export interface TeamProgressResult {
  have: number
  total: number
  pct: number
  appearsIn: { albumId: string; albumTitle: string; sectionName: string; pct: number }[]
  matchedSection?: Section
}
```

Nel corpo di `aggregateTeamProgress`, dichiarare prima del loop:
```ts
  let matchedSection: Section | undefined
```
Dentro il loop, subito dopo il `continue` guard, catturare la prima:
```ts
      if (s.kind !== 'team' || canonicalTeamId(s) !== canonicalId) continue
      if (!matchedSection) matchedSection = s
```
E nel return:
```ts
  return { have, total, pct, appearsIn, matchedSection }
```

- [ ] **Step 4: Eseguire i test per vederli passare**

Run: `npx vitest run src/lib/album/teamProgress.test.ts`
Expected: PASS (tutti, incluso il test esistente `total 0 e lista vuota` — `toEqual` ignora le proprietà `undefined`).

- [ ] **Step 5: Commit**

```bash
git add src/lib/album/teamProgress.ts src/lib/album/teamProgress.test.ts
git commit -m "feat(album): aggregateTeamProgress espone matchedSection"
```

---

## Task 2: `useTeamProgress` espone il kit curato

**Files:**
- Modify: `src/hooks/useTeamProgress.ts`

Nessun test unità nuovo (hook con subscription Firestore; la logica pura è in Task 1). Verifica via tsc/build in Task 5.

- [ ] **Step 1: Import del resolver kit**

In cima a `src/hooks/useTeamProgress.ts`, aggiungere agli import esistenti:
```ts
import { kitForSection, type TeamKit } from '@/lib/album/teamKits'
```

- [ ] **Step 2: Estendere l'interfaccia esposta**

Modificare:
```ts
export interface TeamProgress extends TeamProgressResult {
  loading: boolean
  kit?: TeamKit
}
```

- [ ] **Step 3: Derivare e restituire il kit**

Alla fine della funzione, sostituire il return:
```ts
  const loading = !!user && (!idsLoaded || ids.some((id) => albumById[id] && (!sectionsMap[id] || !dataMap[id])))
  return { ...result, loading }
```
con:
```ts
  const loading = !!user && (!idsLoaded || ids.some((id) => albumById[id] && (!sectionsMap[id] || !dataMap[id])))
  const kit = result.matchedSection ? kitForSection(result.matchedSection) : undefined
  return { ...result, loading, kit }
```

- [ ] **Step 4: Verifica tipi**

Run: `npx tsc -b --noEmit`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useTeamProgress.ts
git commit -m "feat(album): useTeamProgress espone il kit curato del team"
```

---

## Task 3: `TeamCrest` — props additive, pattern SVG, monogramma

**Files:**
- Modify: `src/components/TeamCrest.tsx`
- Test: `src/components/TeamCrest.test.tsx` (create)

- [ ] **Step 1: Scrivere i test di render**

Create `src/components/TeamCrest.test.tsx`:

```tsx
import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { TeamCrest } from './TeamCrest'

afterEach(cleanup)

describe('TeamCrest', () => {
  it('senza monogram non disegna testo (default retro-compatibile)', () => {
    const { container } = render(<TeamCrest c1="#000" c2="#fff" />)
    expect(container.querySelector('text')).toBeNull()
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('con monogram disegna la lettera', () => {
    const { container } = render(<TeamCrest c1="#000" c2="#fff" monogram="A" />)
    expect(container.querySelector('text')?.textContent).toBe('A')
  })

  it('pattern stripes disegna piu righe verticali', () => {
    const { container } = render(<TeamCrest c1="#1e71b8" c2="#000000" pattern="stripes" />)
    // stripes = piu di 2 rect (le righe), oltre allo scudo
    expect(container.querySelectorAll('rect').length).toBeGreaterThan(2)
  })

  it('pattern sash disegna una banda diagonale (path in piu oltre al contorno)', () => {
    const { container } = render(<TeamCrest c1="#12386b" c2="#fff" accent="#e30613" pattern="sash" />)
    // scudo bordo + clip path + banda = almeno 2 path
    expect(container.querySelectorAll('path').length).toBeGreaterThanOrEqual(2)
  })
})
```

- [ ] **Step 2: Eseguire i test per vederli fallire**

Run: `npx vitest run src/components/TeamCrest.test.tsx`
Expected: FAIL — props `monogram`/`pattern` non gestite, nessun `text`.

- [ ] **Step 3: Riscrivere il componente**

Sostituire l'intero `src/components/TeamCrest.tsx`:

```tsx
import { useId } from 'react'
import type { KitPattern } from '@/lib/album/teamKits'
import { inkForKit, DARK_INK, LIGHT_INK } from '@/lib/album/color'

const SHIELD = 'M12 1 L23 4 V14 C23 21 18 25 12 27 C6 25 1 21 1 14 V4 Z'

// Stemma astratto a 2 colori (colori sociali). NIENTE logo ufficiale (copyright club):
// scudo con pattern maglia + monogramma opzionale a 1 lettera.
export function TeamCrest({
  c1,
  c2,
  accent,
  pattern = 'halves',
  monogram,
  className,
}: {
  c1: string
  c2: string
  accent?: string
  pattern?: KitPattern
  monogram?: string
  className?: string
}) {
  const uid = useId().replace(/:/g, '')
  const clip = `url(#sh-${uid})`
  const ink = inkForKit({ c1, c2, accent, pattern }).isDark ? DARK_INK : LIGHT_INK

  return (
    <svg viewBox="0 0 24 28" className={className} aria-hidden>
      <defs>
        <clipPath id={`sh-${uid}`}>
          <path d={SHIELD} />
        </clipPath>
      </defs>
      <g clipPath={clip}>
        <PatternFill pattern={pattern} c1={c1} c2={c2} accent={accent} />
      </g>
      <path d={SHIELD} fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="1" />
      {monogram && (
        <text
          x="12"
          y="15"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="Times New Roman, Georgia, serif"
          fontWeight="700"
          fontSize="12"
          fill={ink}
          style={{ paintOrder: 'stroke' }}
        >
          {monogram}
        </text>
      )}
    </svg>
  )
}

function PatternFill({
  pattern,
  c1,
  c2,
  accent,
}: {
  pattern: KitPattern
  c1: string
  c2: string
  accent?: string
}) {
  switch (pattern) {
    case 'stripes': {
      // righe verticali c1/c2 alternate (larghezza 3 su 24)
      const bars = []
      for (let x = 0; x < 24; x += 3) {
        bars.push(<rect key={x} x={x} y="0" width="3" height="28" fill={(x / 3) % 2 === 0 ? c1 : c2} />)
      }
      return <>{bars}</>
    }
    case 'hoops': {
      // righe orizzontali c1/c2 alternate
      const bars = []
      for (let y = 0; y < 28; y += 3.5) {
        bars.push(<rect key={y} x="0" y={y} width="24" height="3.5" fill={(Math.round(y / 3.5)) % 2 === 0 ? c1 : c2} />)
      }
      return <>{bars}</>
    }
    case 'sash':
      return (
        <>
          <rect x="0" y="0" width="24" height="28" fill={c1} />
          <path d="M-4 22 L18 -4 L26 -4 L4 22 Z" fill={accent ?? c2} />
        </>
      )
    case 'halves':
      return (
        <>
          <rect x="0" y="0" width="12" height="28" fill={c1} />
          <rect x="12" y="0" width="12" height="28" fill={c2} />
        </>
      )
    default: // solid
      return <rect x="0" y="0" width="24" height="28" fill={c1} />
  }
}
```

- [ ] **Step 4: Eseguire i test per vederli passare**

Run: `npx vitest run src/components/TeamCrest.test.tsx`
Expected: PASS (4 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/TeamCrest.tsx src/components/TeamCrest.test.tsx
git commit -m "feat(album): TeamCrest con pattern maglia SVG + monogramma"
```

---

## Task 4: `Squadra.tsx` usa il kit curato + monogramma

**Files:**
- Modify: `src/pages/Squadra.tsx`

- [ ] **Step 1: Usare il kit curato dal progress**

In `src/pages/Squadra.tsx`, sostituire:
```tsx
  const kit = kitFromColors(team.c1, team.c2)
```
con:
```tsx
  const kit = progress.kit ?? kitFromColors(team.c1, team.c2)
```
(la riga `const progress = useTeamProgress(id)` è già sopra; `kitFromColors` è già importato.)

- [ ] **Step 2: Passare pattern + monogramma al crest**

Sostituire nell'header:
```tsx
          <TeamCrest c1={team.c1} c2={team.c2} className="h-16 w-16 drop-shadow-md sm:h-20 sm:w-20" />
```
con:
```tsx
          <TeamCrest
            c1={kit.c1}
            c2={kit.c2}
            accent={kit.accent}
            pattern={kit.pattern}
            monogram={teamDisplayName(id).charAt(0).toUpperCase()}
            className="h-16 w-16 drop-shadow-md sm:h-20 sm:w-20"
          />
```

- [ ] **Step 3: Verifica tipi + build**

Run: `npx tsc -b --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Squadra.tsx
git commit -m "feat(album): scheda squadra usa kit curato + crest monogramma"
```

---

## Task 5: Verifica finale + push

**Files:** nessuna modifica di codice (solo verifica e push).

- [ ] **Step 1: Suite mirata**

Run: `npx vitest run src/lib/album/teamProgress.test.ts src/components/TeamCrest.test.tsx src/lib/album/teamIdentity.test.ts src/data/teamFacts.test.ts`
Expected: tutti PASS.

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b --noEmit`
Expected: exit 0.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: exit 0 (solo warning preesistente INEFFECTIVE_DYNAMIC_IMPORT su firebase.ts).

- [ ] **Step 4: Push**

```bash
git push origin main
```

- [ ] **Step 5: Verifica live (manuale)**

Aprire `/squadra/atalanta`: crest a righe blu/nero con "A" centrata; hero blu/nero coerente con la sezione Atalanta in-album. Aprire una squadra non nei propri album: fallback colori generati, nessun crash.

---

## Note

- Cache-bust (`?v=N` su asset locali) NON serve: nessun `.js`/`.css` statico modificato, solo sorgenti buildati da Vite (hash automatico).
- `git add` con path espliciti (mai `-A` da root — memory).
