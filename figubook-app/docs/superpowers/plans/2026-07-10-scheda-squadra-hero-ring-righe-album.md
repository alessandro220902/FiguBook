# Scheda squadra — hero ring + righe album azionabili — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Ring di completamento squadra nell'hero (riempie il vuoto a destra) + righe album con mini-barra colorata, cliccabili verso l'album, ordinate per % desc.

**Architecture:** Nuovo `TeamHeroRing` (SVG bianco, no card, sta sul gradiente). `Squadra.tsx` monta il ring nell'header quando la squadra è nei tuoi album, e riscrive la lista `appearsIn` come `Link` con barra, ordinata per pct desc.

**Tech Stack:** React + TS + Vite, Vitest (jsdom) + @testing-library/react. `pctColor` e `Link` già importati in Squadra.tsx.

Spec: `docs/superpowers/specs/2026-07-10-scheda-squadra-hero-ring-righe-album-design.md`

---

## Task 1: componente `TeamHeroRing`

**Files:**
- Create: `src/components/album/TeamHeroRing.tsx`
- Test: `src/components/album/TeamHeroRing.test.tsx`

- [ ] **Step 1: Scrivere i test**

Create `src/components/album/TeamHeroRing.test.tsx`:
```tsx
import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { TeamHeroRing } from './TeamHeroRing'

afterEach(cleanup)

describe('TeamHeroRing', () => {
  it('mostra la percentuale e have/total', () => {
    const { container, getByText } = render(<TeamHeroRing pct={72} have={79} total={110} />)
    expect(container.querySelector('svg')).not.toBeNull()
    expect(getByText('72%')).not.toBeNull()
    expect(getByText(/79/)).not.toBeNull()
    expect(getByText(/110/)).not.toBeNull()
  })
})
```

- [ ] **Step 2: Eseguire i test per vederli fallire**

Run: `npx vitest run src/components/album/TeamHeroRing.test.tsx`
Expected: FAIL — modulo inesistente.

- [ ] **Step 3: Implementare il componente**

Create `src/components/album/TeamHeroRing.tsx`:
```tsx
// Anello completamento squadra, pensato per stare SUL gradiente hero (no card).
// Arco bianco per leggibilità su qualsiasi colore squadra.
export function TeamHeroRing({
  pct,
  have,
  total,
}: {
  pct: number
  have: number
  total: number
}) {
  const r = 34
  const circ = 2 * Math.PI * r
  const off = circ * (1 - Math.max(0, Math.min(100, pct)) / 100)
  return (
    <div className="flex shrink-0 flex-col items-center drop-shadow-md">
      <svg width="84" height="84" viewBox="0 0 84 84">
        <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="8" />
        <circle
          cx="42" cy="42" r={r} fill="none" stroke="#ffffff" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off}
          transform="rotate(-90 42 42)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x="42" y="47" textAnchor="middle" className="font-display" fontSize="18" fontWeight="700" fill="#ffffff">
          {pct}%
        </text>
      </svg>
      <div className="mt-1 font-mono text-[11px] tabular-nums text-white/80">
        {have} / {total}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Eseguire i test per vederli passare**

Run: `npx vitest run src/components/album/TeamHeroRing.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/album/TeamHeroRing.tsx src/components/album/TeamHeroRing.test.tsx
git commit -m "feat(album): TeamHeroRing — anello completamento squadra per hero"
```

---

## Task 2: `Squadra.tsx` — ring nell'header + righe album come Link con barra

**Files:**
- Modify: `src/pages/Squadra.tsx`

- [ ] **Step 1: Import del ring**

Aggiungere sotto gli import esistenti (dopo `import { TeamCrest } ...`):
```tsx
import { TeamHeroRing } from '@/components/album/TeamHeroRing'
```

- [ ] **Step 2: Ring nell'header**

Sostituire il blocco header interno:
```tsx
        <div className="relative z-10 flex items-center gap-4">
          <TeamCrest
            c1={kit.c1}
            c2={kit.c2}
            accent={kit.accent}
            pattern={kit.pattern}
            className="h-16 w-16 drop-shadow-md sm:h-20 sm:w-20"
          />
          <h1 className="font-display text-3xl font-bold tracking-tight text-white drop-shadow-sm sm:text-4xl">{teamDisplayName(id)}</h1>
        </div>
```
con:
```tsx
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <TeamCrest
              c1={kit.c1}
              c2={kit.c2}
              accent={kit.accent}
              pattern={kit.pattern}
              className="h-16 w-16 drop-shadow-md sm:h-20 sm:w-20"
            />
            <h1 className="font-display text-3xl font-bold tracking-tight text-white drop-shadow-sm sm:text-4xl">{teamDisplayName(id)}</h1>
          </div>
          {!progress.loading && progress.total > 0 && (
            <TeamHeroRing pct={progress.pct} have={progress.have} total={progress.total} />
          )}
        </div>
```

- [ ] **Step 3: Righe album come Link con barra, ordinate per pct desc**

Sostituire l'attuale `<ul>` della lista appearsIn:
```tsx
            <ul className="mt-4 space-y-1">
              {progress.appearsIn.map((x) => (
                <li key={`${x.albumId}-${x.sectionName}`} className="flex items-center justify-between type-body text-ink-2">
                  <span className="truncate">{x.albumTitle}</span>
                  <span className="shrink-0 font-mono text-xs">{x.pct}%</span>
                </li>
              ))}
            </ul>
```
con:
```tsx
            <ul className="mt-4 space-y-0.5">
              {[...progress.appearsIn].sort((a, b) => b.pct - a.pct).map((x) => (
                <li key={`${x.albumId}-${x.sectionName}`}>
                  <Link
                    to={`/album/${x.albumId}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.03]"
                  >
                    <span className="type-body min-w-0 flex-shrink truncate text-ink-2">{x.albumTitle}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/30">
                      <span className="block h-full rounded-full" style={{ width: `${Math.max(2, x.pct)}%`, background: pctColor(x.pct) }} />
                    </span>
                    <span className="shrink-0 font-mono text-xs text-ink-2">{x.pct}%</span>
                  </Link>
                </li>
              ))}
            </ul>
```
(`Link` e `pctColor` sono già importati in cima al file.)

- [ ] **Step 4: Verifica tipi + build**

Run: `npx tsc -b --noEmit` (exit 0), poi `npm run build` (exit 0; warning INEFFECTIVE_DYNAMIC_IMPORT su firebase.ts atteso).

- [ ] **Step 5: Commit**

```bash
git add src/pages/Squadra.tsx
git commit -m "feat(album): scheda squadra — ring nell'hero + righe album cliccabili con barra"
```

---

## Task 3: Verifica finale + push

- [ ] **Step 1: Suite mirata**

Run: `npx vitest run src/components/album/TeamHeroRing.test.tsx src/components/TeamCrest.test.tsx src/lib/album/teamProgress.test.ts`
Expected: tutti PASS.

- [ ] **Step 2: Typecheck + build**

Run: `npx tsc -b --noEmit` (exit 0) e `npm run build` (exit 0).

- [ ] **Step 3: Push**

```bash
git push origin main
```

- [ ] **Step 4: Verifica live (manuale, founder)**

`/squadra/atalanta`: ring 72% bianco a destra dell'hero; righe album con barra
colorata, cliccabili (→ album), ordinate 100%→0%. Squadra non posseduta: hero senza
ring, nessun vuoto forzato.

---

## Note

- Cache-bust non serve (solo sorgenti Vite, hash automatico).
- `git add` con path espliciti (mai `-A` da root — memory).
