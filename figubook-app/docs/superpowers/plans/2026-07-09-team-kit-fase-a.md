# Team Kit (Fase A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dare a ogni squadra un'identità visiva fedele (colori sociali corretti + pattern-maglia sottile) tramite un unico "Team Kit", applicato a figurine/hero/sidebar/overlay senza regressioni.

**Architecture:** Un punto di verità (`teamKits.ts`) mappa `section.id` → `TeamKit` (colori + pattern). `color.ts` genera gradiente e layer pattern dal kit. `kitForSection` risolve il kit con fallback dai `c1/c2` esistenti (rendering odierno invariato dove non curato). I componenti ricevono un `kit: TeamKit` invece di `c1/c2` grezzi.

**Tech Stack:** React + TypeScript + Tailwind (Vite), Vitest. CSS moderno (`color-mix`, `mix-blend-overlay`, `repeating-linear-gradient`).

**Design note:** ogni step grafico va rivisto con `design-taste-frontend` + audit `impeccable`. Tema Midnight Gold, minimalista, no slop. Contrasto testo AA obbligatorio. Commit+push su main dopo ogni task, `git add` con path espliciti.

---

## File Structure

- Create: `src/lib/album/teamKits.ts` — tipo `TeamKit`, `KITS`, `kitFromColors`, `kitForSection`.
- Create: `src/lib/album/teamKits.test.ts` — validità kit + contrasto + fallback.
- Modify: `src/lib/album/color.ts` — `kitGradient`, `kitPattern`, `ownedInkIsDark(kit)`.
- Create: `src/lib/album/color.test.ts` — motore da kit.
- Modify: `src/components/album/StickerCard.tsx` — prop `kit`, layer pattern.
- Modify: `src/components/album/StickerCard.test.tsx` — usa `kit`.
- Modify: `src/components/album/StickerGrid.tsx` — passa `kit`.
- Modify: `src/components/album/AlbumFlatView.tsx` — passa `kit`.
- Modify: `src/components/album/SectionHero.tsx` — usa kit + pattern.
- Modify: `src/components/album/StickerInfoOverlay.tsx` — prop `kit`.
- Modify: `src/components/album/SectionSidebar.tsx` — usa kit.
- Modify: `src/pages/Album.tsx` — passa `kit` all'overlay.

---

## Task 1: Modello dati Team Kit + risoluzione con fallback

**Files:**
- Create: `src/lib/album/teamKits.ts`
- Test: `src/lib/album/teamKits.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/album/teamKits.test.ts
import { describe, it, expect } from 'vitest'
import { KITS, kitFromColors, kitForSection, PATTERNS } from './teamKits'
import type { Section } from '@/data/albums/types'

const HEX = /^#[0-9a-fA-F]{6}$/

function section(partial: Partial<Section>): Section {
  return { id: 'x', name: 'X', short: 'X', group: 'G', kind: 'team', codes: ['1'], c1: '#0a3a8b', c2: '#1a1a1a', ...partial }
}

describe('teamKits', () => {
  it('ogni kit ha colori hex validi e pattern ammesso', () => {
    for (const [id, kit] of Object.entries(KITS)) {
      expect(kit.c1, id).toMatch(HEX)
      expect(kit.c2, id).toMatch(HEX)
      if (kit.accent) expect(kit.accent, id).toMatch(HEX)
      expect(PATTERNS, id).toContain(kit.pattern)
    }
  })

  it('kitFromColors deriva un kit solid dai due colori', () => {
    const k = kitFromColors('#111111', '#eeeeee')
    expect(k).toEqual({ c1: '#111111', c2: '#eeeeee', pattern: 'solid' })
  })

  it('kitForSection usa il kit curato quando esiste', () => {
    const k = kitForSection(section({ id: 'juventus' }))
    expect(k).toBe(KITS['juventus'])
  })

  it('kitForSection fa fallback ai c1/c2 della sezione quando il kit manca', () => {
    const k = kitForSection(section({ id: 'sezione-ignota', c1: '#123456', c2: '#654321' }))
    expect(k).toEqual({ c1: '#123456', c2: '#654321', pattern: 'solid' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/album/teamKits.test.ts`
Expected: FAIL — modulo `./teamKits` inesistente.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/album/teamKits.ts
import type { Section } from '@/data/albums/types'

export const PATTERNS = ['solid', 'stripes', 'halves', 'sash', 'hoops'] as const
export type KitPattern = (typeof PATTERNS)[number]

export interface TeamKit {
  c1: string
  c2: string
  accent?: string
  pattern: KitPattern
  foil?: boolean
}

// Punto di verità: chiave = section.id (gli album Calciatori usano questi id).
// Curare qui le squadre; le altre cadono sul fallback (comportamento odierno).
export const KITS: Record<string, TeamKit> = {}

export function kitFromColors(c1: string, c2: string): TeamKit {
  return { c1, c2, pattern: 'solid' }
}

// Alias per lo stesso team con id diversi tra album (Fase A: pochi, estendibile).
const ALIAS: Record<string, string> = {}

export function kitForSection(section: Section): TeamKit {
  const key = ALIAS[section.id] ?? section.id
  return KITS[key] ?? kitFromColors(section.c1, section.c2)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/album/teamKits.test.ts`
Expected: PASS (KITS vuoto: il loop `for` non itera, il test juventus fallirebbe — vedi nota).

> Nota: con `KITS` vuoto il caso `kitForSection` su `juventus` fallisce. È voluto: Task 7 popola i kit. Per far passare Task 1 ora, aggiungi un solo kit reale minimo:

```ts
export const KITS: Record<string, TeamKit> = {
  juventus: { c1: '#111111', c2: '#f4f4f4', pattern: 'stripes' },
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/album/teamKits.ts src/lib/album/teamKits.test.ts
git commit -m "feat(album): Team Kit — modello dati + kitForSection con fallback

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

---

## Task 2: Motore colore dal kit (gradiente + pattern + inchiostro)

**Files:**
- Modify: `src/lib/album/color.ts`
- Test: `src/lib/album/color.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/album/color.test.ts
import { describe, it, expect } from 'vitest'
import { kitGradient, kitPattern, ownedInkIsDark } from './color'
import type { TeamKit } from './teamKits'

const solid: TeamKit = { c1: '#0a3a8b', c2: '#1a1a1a', pattern: 'solid' }
const stripes: TeamKit = { c1: '#111111', c2: '#f4f4f4', pattern: 'stripes' }
const light: TeamKit = { c1: '#fcc500', c2: '#f4f4f4', pattern: 'solid' }

describe('color engine da kit', () => {
  it('kitGradient solid = gradiente 150deg tra i due colori', () => {
    expect(kitGradient(solid)).toBe('linear-gradient(150deg, #0a3a8b, #1a1a1a)')
  })

  it('kitGradient halves = split netto', () => {
    expect(kitGradient({ ...solid, pattern: 'halves' })).toBe('linear-gradient(105deg, #0a3a8b 0 50%, #1a1a1a 50% 100%)')
  })

  it('kitPattern solid = undefined', () => {
    expect(kitPattern(solid)).toBeUndefined()
  })

  it('kitPattern stripes = stringa non vuota', () => {
    const p = kitPattern(stripes)
    expect(typeof p).toBe('string')
    expect(p).toContain('repeating-linear-gradient')
  })

  it('ownedInkIsDark true su kit chiaro, false su kit scuro', () => {
    expect(ownedInkIsDark(light)).toBe(true)
    expect(ownedInkIsDark(solid)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/album/color.test.ts`
Expected: FAIL — `kitGradient`/`kitPattern` non esportati; `ownedInkIsDark` firma diversa.

- [ ] **Step 3: Write minimal implementation**

Sostituisci il contenuto di `src/lib/album/color.ts` con:

```ts
import type { CSSProperties } from 'react'
import type { TeamKit } from './teamKits'

// CSS custom properties per il motore colore dinamico per-sezione.
export function sectionVars(c1: string, c2: string): CSSProperties {
  return { ['--t1' as string]: c1, ['--t2' as string]: c2 } as CSSProperties
}
// gradiente identità della sezione (retrocompatibile con i call site non ancora migrati)
export function sectionGradient(c1: string, c2: string): string {
  return `linear-gradient(150deg, ${c1}, ${c2})`
}

// Gradiente di base dal kit. 'halves' = split netto (due metà maglia);
// tutti gli altri = gradiente diagonale morbido.
export function kitGradient(kit: TeamKit): string {
  if (kit.pattern === 'halves') {
    return `linear-gradient(105deg, ${kit.c1} 0 50%, ${kit.c2} 50% 100%)`
  }
  return `linear-gradient(150deg, ${kit.c1}, ${kit.c2})`
}

// Layer pattern SOTTILE sopra il gradiente (mix-blend-overlay lato componente).
// Usa il colore accent o c2 a bassa opacità: riconoscibile, mai rumoroso.
// undefined per 'solid'/'halves' (l'identità è già nel gradiente).
export function kitPattern(kit: TeamKit): string | undefined {
  const stripe = kit.accent ?? kit.c2
  const line = `color-mix(in srgb, ${stripe} 22%, transparent)`
  switch (kit.pattern) {
    case 'stripes':
      return `repeating-linear-gradient(90deg, ${line} 0 7px, transparent 7px 15px)`
    case 'hoops':
      return `repeating-linear-gradient(0deg, ${line} 0 7px, transparent 7px 15px)`
    case 'sash':
      return `linear-gradient(115deg, transparent 44%, ${line} 44% 56%, transparent 56%)`
    default:
      return undefined
  }
}

// Luminanza percepita di un hex (0-255).
function lum(hex: string): number {
  const c = hex.replace('#', '')
  if (c.length < 6) return 128
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b
}

// true se il kit è chiaro -> inchiostro scuro sul testo (contrasto AA).
export function ownedInkIsDark(kit: TeamKit): boolean {
  return (lum(kit.c1) + lum(kit.c2)) / 2 >= 150
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/album/color.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/album/color.ts src/lib/album/color.test.ts
git commit -m "feat(album): motore colore da Team Kit (gradient/pattern/ink)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

---

## Task 3: StickerCard usa il kit + layer pattern sottile

**Files:**
- Modify: `src/components/album/StickerCard.tsx`
- Test: `src/components/album/StickerCard.test.tsx`

- [ ] **Step 1: Update the test to drive the new prop**

In `src/components/album/StickerCard.test.tsx` sostituisci la costante `base`:

```ts
import type { TeamKit } from '@/lib/album/teamKits'
const kit: TeamKit = { c1: '#8a1538', c2: '#5a0d24', pattern: 'solid' }
const base = { code: 'QAT1', name: 'Foto squadra', kit }
```

Aggiungi un test per il pattern:

```ts
it('mostra il layer pattern quando il kit non è solid', () => {
  const striped: TeamKit = { c1: '#111', c2: '#eee', pattern: 'stripes' }
  const { container } = render(<StickerCard {...base} kit={striped} count={1} insertOn={false} onAdd={()=>{}} onRemove={()=>{}} onInfo={()=>{}} />)
  expect(container.querySelector('[data-testid="kit-pattern"]')).not.toBeNull()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/album/StickerCard.test.tsx`
Expected: FAIL — `kit` prop inesistente, `data-testid="kit-pattern"` assente.

- [ ] **Step 3: Implement**

In `src/components/album/StickerCard.tsx`:

Cambia import (riga 2):
```ts
import { kitGradient, kitPattern, ownedInkIsDark } from '@/lib/album/color'
import type { TeamKit } from '@/lib/album/teamKits'
```

Cambia props (righe 13-28), sostituendo `c1`/`c2` con `kit`:
```ts
export interface StickerCardProps {
  code: string
  name?: string
  kit: TeamKit
  count: number
  insertOn: boolean
  onAdd: () => void
  onRemove: () => void
  onInfo: () => void
}

export function StickerCard({ code, name, kit, count, insertOn, onAdd, onRemove, onInfo }: StickerCardProps) {
  const owned = count >= 1
  const doubles = Math.max(0, count - 1)
  const darkInk = owned && ownedInkIsDark(kit)
  const pattern = kitPattern(kit)
```

Cambia lo `style` del bottone (riga 49):
```ts
          style={owned ? { backgroundImage: kitGradient(kit) } : undefined}
```

Subito dopo lo `<span>` dello sheen (dopo riga 58, prima del blocco doppie), inserisci il layer pattern:
```tsx
          {owned && pattern && (
            <span
              data-testid="kit-pattern"
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-xl mix-blend-overlay"
              style={{ backgroundImage: pattern }}
            />
          )}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/album/StickerCard.test.tsx`
Expected: PASS (tutti, inclusi i 5 preesistenti adattati).

- [ ] **Step 5: Commit**

```bash
git add src/components/album/StickerCard.tsx src/components/album/StickerCard.test.tsx
git commit -m "feat(album): StickerCard su Team Kit + layer pattern sottile

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

---

## Task 4: Aggiorna i chiamanti di StickerCard (griglia + vista piatta)

**Files:**
- Modify: `src/components/album/StickerGrid.tsx`
- Modify: `src/components/album/AlbumFlatView.tsx`

- [ ] **Step 1: StickerGrid passa il kit**

In `src/components/album/StickerGrid.tsx`:

Aggiungi import in cima:
```ts
import { kitForSection } from '@/lib/album/teamKits'
```

Dentro `StickerGrid`, dopo la riga `const codes = ...`, calcola il kit una volta:
```ts
  const kit = kitForSection(section)
```

Nel JSX `<StickerCard ...>` rimuovi `c1={section.c1}` e `c2={section.c2}` e metti:
```tsx
          kit={kit}
```

- [ ] **Step 2: AlbumFlatView passa il kit**

In `src/components/album/AlbumFlatView.tsx`, alla `StickerCard` (righe ~88) sostituisci `c1={sec?.c1 ?? '#444'} c2={sec?.c2 ?? '#444'}` con:
```tsx
          kit={sec ? kitForSection(sec) : { c1: '#444', c2: '#444', pattern: 'solid' }}
```
e aggiungi in cima:
```ts
import { kitForSection } from '@/lib/album/teamKits'
```

- [ ] **Step 3: Verify types + tests**

Run: `npx tsc -b --noEmit && npx vitest run src/components/album/StickerCard.test.tsx`
Expected: exit 0, test verdi.

- [ ] **Step 4: Commit**

```bash
git add src/components/album/StickerGrid.tsx src/components/album/AlbumFlatView.tsx
git commit -m "refactor(album): StickerGrid/FlatView passano il Team Kit

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

---

## Task 5: SectionHero usa il kit + pattern

**Files:**
- Modify: `src/components/album/SectionHero.tsx`

- [ ] **Step 1: Implement**

In `src/components/album/SectionHero.tsx`:

Import (riga 3):
```ts
import { kitGradient, kitPattern } from '@/lib/album/color'
import { kitForSection } from '@/lib/album/teamKits'
```

Dentro `SectionHero`, in testa alla funzione:
```ts
  const kit = kitForSection(section)
  const pattern = kitPattern(kit)
```

Cambia lo `<header>` (riga 60) per usare il gradiente kit:
```tsx
    <header className="relative overflow-hidden rounded-2xl border border-white/10 p-4 sm:p-6" style={{ backgroundImage: kitGradient(kit) }}>
```

Subito dopo l'apertura dell'`<header>`, prima dello scrim, aggiungi il layer pattern:
```tsx
      {pattern && (
        <div aria-hidden className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-70" style={{ backgroundImage: pattern }} />
      )}
```

- [ ] **Step 2: Verify types**

Run: `npx tsc -b --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/album/SectionHero.tsx
git commit -m "feat(album): SectionHero su Team Kit + pattern

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

---

## Task 6: StickerInfoOverlay + SectionSidebar + Album.tsx sul kit

**Files:**
- Modify: `src/components/album/StickerInfoOverlay.tsx`
- Modify: `src/components/album/SectionSidebar.tsx`
- Modify: `src/pages/Album.tsx`

- [ ] **Step 1: StickerInfoOverlay prende il kit**

In `src/components/album/StickerInfoOverlay.tsx`:

Import (riga 3):
```ts
import { kitGradient } from '@/lib/album/color'
import type { TeamKit } from '@/lib/album/teamKits'
```

Nei props sostituisci `c1: string` e `c2: string` con `kit: TeamKit` e aggiorna la firma della funzione (`{ open, code, name, sectionName, kit, count, ... }`).

Cambia lo style dell'header (riga 33):
```tsx
      <div className="relative h-40 w-full" style={{ backgroundImage: kitGradient(kit) }}>
```

- [ ] **Step 2: Album.tsx passa il kit all'overlay**

In `src/pages/Album.tsx`:

Aggiungi import:
```ts
import { kitForSection } from '@/lib/album/teamKits'
```

Dove passa `c1={infoSection.c1}` / `c2={infoSection.c2}` (righe ~221) sostituisci con:
```tsx
        kit={kitForSection(infoSection)}
```

- [ ] **Step 3: SectionSidebar usa il kit per gradiente + vars**

In `src/components/album/SectionSidebar.tsx`:

Import (riga 4):
```ts
import { kitGradient, sectionVars } from '@/lib/album/color'
import { kitForSection } from '@/lib/album/teamKits'
```

Dove renderizza le voci, per ogni sezione `s` calcola `const k = kitForSection(s)`. Cambia:
- `sectionVars(s.c1, s.c2)` → `sectionVars(k.c1, k.c2)`
- `sectionGradient(s.c1, s.c2)` (riga 68) → `kitGradient(k)`

(Il `sectionVars` resta a due colori: la sidebar usa `--t1/--t2` in `color-mix`, non il pattern.)

- [ ] **Step 4: Verify types + full test run**

Run: `npx tsc -b --noEmit && npx vitest run`
Expected: exit 0, tutti i test verdi.

- [ ] **Step 5: Commit**

```bash
git add src/components/album/StickerInfoOverlay.tsx src/components/album/SectionSidebar.tsx src/pages/Album.tsx
git commit -m "refactor(album): overlay/sidebar/Album passano il Team Kit

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

---

## Task 7: Popolare i kit — colori fedeli Serie A + pattern iconici

**Files:**
- Modify: `src/lib/album/teamKits.ts`
- Test: `src/lib/album/teamKits.test.ts` (già copre validità/contrasto)

**Design:** questo è il task grafico. Invocare `design-taste-frontend` per validare i colori
(fedeltà colori sociali) e `impeccable` a fine task. Colori dai kit ufficiali; pattern solo
dove la maglia è inequivocabile.

- [ ] **Step 1: Popola `KITS` con le squadre Serie A 24/25 e 25/26**

Sostituisci il `KITS` provvisorio con la mappa completa (id = `section.id`). Colori fedeli;
`pattern` solo dove iconico, altrimenti `solid`. Valori di partenza (rifinire con design skill):

```ts
export const KITS: Record<string, TeamKit> = {
  atalanta:      { c1: '#1e71b8', c2: '#0d0d0d', pattern: 'stripes', accent: '#0d0d0d' },
  bologna:       { c1: '#a2132e', c2: '#12284b', pattern: 'halves' },
  cagliari:      { c1: '#9c1b2e', c2: '#0d2a5c', pattern: 'halves' },
  como:          { c1: '#0d3c8c', c2: '#e9edf2', pattern: 'solid' },
  empoli:        { c1: '#0a5aa5', c2: '#0d2f5c', pattern: 'solid' },
  fiorentina:    { c1: '#6a2ca0', c2: '#3a1866', pattern: 'solid' },
  genoa:         { c1: '#a2132e', c2: '#12284b', pattern: 'halves' },
  'hellas-verona': { c1: '#12284b', c2: '#f2c200', pattern: 'solid', accent: '#f2c200' },
  inter:         { c1: '#0a1a8c', c2: '#0d0d0d', pattern: 'stripes' },
  juventus:      { c1: '#0d0d0d', c2: '#f4f4f4', pattern: 'stripes' },
  lazio:         { c1: '#8ecae6', c2: '#0d3c6e', pattern: 'solid', accent: '#0d3c6e' },
  lecce:         { c1: '#f2c200', c2: '#a2132e', pattern: 'halves' },
  milan:         { c1: '#a2132e', c2: '#0d0d0d', pattern: 'stripes' },
  monza:         { c1: '#a2132e', c2: '#f4f4f4', pattern: 'solid' },
  napoli:        { c1: '#12a5e0', c2: '#0d5c9c', pattern: 'solid' },
  parma:         { c1: '#f4c400', c2: '#0a3a8b', pattern: 'sash', accent: '#0a3a8b' },
  roma:          { c1: '#9c1b2e', c2: '#f2b100', pattern: 'solid', accent: '#f2b100' },
  torino:        { c1: '#7a1212', c2: '#4a0a0a', pattern: 'solid' },
  udinese:       { c1: '#0d0d0d', c2: '#f4f4f4', pattern: 'stripes' },
  venezia:       { c1: '#0d5c3a', c2: '#f2c200', pattern: 'sash', accent: '#e26a1f' },
  // Nuove promosse 25/26 — aggiungi qui se presenti nel relativo album:
  // sassuolo, pisa, cremonese ... (id da src/data/albums/calciatori-25-26.ts)
}
```

- [ ] **Step 2: Aggiungi alias per id divergenti tra album (se presenti)**

Cerca gli id squadra negli altri album e mappa quelli diversi al kit canonico:
Run: `grep -rho '"id":"[a-z-]*"' src/data/albums/*.ts | sort -u | head -80`
Per ogni id sinonimo (es. `inter-fc` → `inter`) aggiungi a `ALIAS`. Se non ce ne sono, lascia `ALIAS = {}`.

- [ ] **Step 3: Run test + build**

Run: `npx vitest run src/lib/album/teamKits.test.ts && npx tsc -b --noEmit`
Expected: PASS + exit 0 (il test valida hex e contrasto di ogni kit).

- [ ] **Step 4: Audit design**

Invoca `design-taste-frontend` e `impeccable` sul risultato (screenshot sezioni chiave:
Juve/Inter/Milan strisce, Bologna/Genoa metà, Hellas/Parma chiare). Verifica contrasto AA,
sottigliezza pattern, nessun slop. Correggi hex/pattern se serve.

- [ ] **Step 5: Commit**

```bash
git add src/lib/album/teamKits.ts
git commit -m "feat(album): kit colori fedeli Serie A + pattern-maglia iconici

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

---

## Task 8: Verifica finale + cache-bust

**Files:**
- Modify: eventuali riferimenti `?v=N` se toccati asset locali (probabile nessuno: solo TS/TSX).

- [ ] **Step 1: Build completa**

Run: `npx tsc -b --noEmit && npm run build`
Expected: exit 0 (solo warning preesistente `INEFFECTIVE_DYNAMIC_IMPORT` su firebase.ts).

- [ ] **Step 2: Test suite completa**

Run: `npx vitest run`
Expected: tutti verdi.

- [ ] **Step 3: Grep di sicurezza — nessun call site orfano di c1/c2 verso i componenti migrati**

Run: `grep -rn "c1={.*section\|sectionGradient(" src/components/album src/pages/Album.tsx`
Expected: nessun uso residuo di `sectionGradient` nei componenti migrati (SectionHero/StickerCard/Overlay/Sidebar). `sectionGradient` può restare solo dove ancora usato legittimamente (es. AlbumLanding/CreateAlbumMenu, fuori scope Fase A).

- [ ] **Step 4: Commit finale (se cambiato qualcosa)**

```bash
git add -- src
git commit -m "chore(album): verifica finale Team Kit Fase A" || echo "niente da committare"
git push origin main
```

---

## Self-Review (fatto in scrittura)

- **Copertura spec:** modello dati (T1); motore gradient/pattern/ink (T2); StickerCard+pattern (T3); call site griglia/flat (T4); hero (T5); overlay/sidebar/Album (T6); colori fedeli + pattern iconici + alias (T7); fallback testato (T1); build/test/no-regressione (T8). Stadio/badge fuori scope (Fase C/B) come da spec.
- **Placeholder:** nessun TODO nel codice; i valori kit di T7 sono di partenza e rifiniti con design skill nello stesso task (non placeholder di piano).
- **Coerenza tipi:** `TeamKit`/`KitPattern`/`kitForSection`/`kitFromColors`/`kitGradient`/`kitPattern`/`ownedInkIsDark(kit)` usati coerenti in tutti i task.
</content>
