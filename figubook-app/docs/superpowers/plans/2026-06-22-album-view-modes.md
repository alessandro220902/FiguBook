# Album View Modes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere alla pagina dettaglio album una legenda a tab icon-only che commuta tra vista a sezioni (attuale), vista piatta paginata di tutte le figurine (filtri totali album), e un terzo tab disabilitato.

**Architecture:** Stato `view` in `Album.tsx` decide il corpo. Legenda riusa il primitive `ui/tabs.tsx` (base-ui) già in repo. Vista piatta è un componente nuovo che appiattisce tutte le sezioni, applica filtri totali e pagina a 60. Predicato filtro estratto in un modulo condiviso. Paginazione è un componente custom leggero (no HeroUI).

**Tech Stack:** React + TypeScript, Vite, Tailwind, `@base-ui/react` (tabs), `lucide-react`, `class-variance-authority`, vitest + @testing-library.

---

### Task 1: Estrai predicato filtro condiviso

**Files:**
- Create: `src/lib/album/filter.ts`
- Test: `src/lib/album/filter.test.ts`
- Modify: `src/components/album/StickerGrid.tsx` (rimuove `passes` locale, importa da lib)

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/album/filter.test.ts
import { describe, it, expect } from 'vitest'
import { passes, type Filter } from './filter'

describe('passes', () => {
  it('all: sempre true', () => {
    expect(passes('all', 0)).toBe(true)
    expect(passes('all', 5)).toBe(true)
  })
  it('missing: solo count 0', () => {
    expect(passes('missing', 0)).toBe(true)
    expect(passes('missing', 1)).toBe(false)
  })
  it('have: count >= 1', () => {
    expect(passes('have', 0)).toBe(false)
    expect(passes('have', 1)).toBe(true)
  })
  it('double: count >= 2', () => {
    expect(passes('double', 1)).toBe(false)
    expect(passes('double', 2)).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/album/filter.test.ts`
Expected: FAIL — cannot find module `./filter`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/album/filter.ts
export type Filter = 'all' | 'missing' | 'double' | 'have'

export function passes(filter: Filter, count: number): boolean {
  if (filter === 'all') return true
  if (filter === 'have') return count >= 1
  if (filter === 'missing') return count === 0
  if (filter === 'double') return count >= 2
  return true
}
```

- [ ] **Step 4: Refactor StickerGrid to use shared filter**

In `src/components/album/StickerGrid.tsx`: rimuovi il `type Filter` locale e la funzione `passes`. Sostituisci l'import in cima e ri-esporta `Filter` per i consumer esistenti:

```ts
import { StickerCard } from './StickerCard'
import type { Section } from '@/data/albums/types'
import { passes, type Filter } from '@/lib/album/filter'

export type { Filter }
```

Lascia invariato il resto del file (la chiamata `passes(filter, countOf(c))` continua a funzionare).

- [ ] **Step 5: Run tests + typecheck**

Run: `npx vitest run src/lib/album/filter.test.ts && npx tsc -b --noEmit`
Expected: PASS, exit 0. (Album.tsx e SectionHero importano `Filter` da `StickerGrid` — la re-export lo preserva.)

- [ ] **Step 6: Commit**

```bash
git add src/lib/album/filter.ts src/lib/album/filter.test.ts src/components/album/StickerGrid.tsx
git commit -m "refactor(album): estrai predicato filtro in lib/album/filter"
```

---

### Task 2: Componente Pagination custom

**Files:**
- Create: `src/components/ui/pagination.tsx`
- Test: `src/components/ui/pagination.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/ui/pagination.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from './pagination'

describe('Pagination', () => {
  it('rende un bottone per pagina + prev/next', () => {
    render(<Pagination page={1} totalPages={3} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Pagina 1' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Pagina 3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Precedente' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Successiva' })).not.toBeDisabled()
  })
  it('disabilita Successiva sull ultima pagina', () => {
    render(<Pagination page={3} totalPages={3} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Successiva' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Precedente' })).not.toBeDisabled()
  })
  it('click su numero chiama onChange con quella pagina', async () => {
    const onChange = vi.fn()
    render(<Pagination page={1} totalPages={3} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Pagina 2' }))
    expect(onChange).toHaveBeenCalledWith(2)
  })
  it('non rende nulla con una sola pagina', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onChange={() => {}} />)
    expect(container.firstChild).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ui/pagination.test.tsx`
Expected: FAIL — cannot find module `./pagination`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/components/ui/pagination.tsx
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

const btn =
  'inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-white/10 px-2 text-sm font-medium text-ink-2 transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime'

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Paginazione">
      <button type="button" className={btn} disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Precedente">
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </button>
      {pages.map((p) => {
        const on = p === page
        return (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-label={`Pagina ${p}`}
            aria-current={on ? 'page' : undefined}
            className={cn(btn, on && 'border-lime bg-lime text-lime-ink hover:text-lime-ink')}
          >
            {p}
          </button>
        )
      })}
      <button type="button" className={btn} disabled={page === totalPages} onClick={() => onChange(page + 1)} aria-label="Successiva">
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </nav>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ui/pagination.test.tsx`
Expected: PASS (4 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/pagination.tsx src/components/ui/pagination.test.tsx
git commit -m "feat(album): componente Pagination custom (token Album, lucide)"
```

---

### Task 3: Legenda AlbumViewTabs (icon-only, tab3 disabled)

**Files:**
- Create: `src/components/album/AlbumViewTabs.tsx`
- Test: `src/components/album/AlbumViewTabs.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/album/AlbumViewTabs.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AlbumViewTabs } from './AlbumViewTabs'

describe('AlbumViewTabs', () => {
  it('rende 3 tab, il terzo disabilitato', () => {
    render(<AlbumViewTabs value="sections" onChange={() => {}} />)
    expect(screen.getByRole('tab', { name: 'Vista a sezioni' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Tutte le figurine' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /in arrivo/i })).toBeDisabled()
  })
  it('click sul tab piatto chiama onChange("flat")', async () => {
    const onChange = vi.fn()
    render(<AlbumViewTabs value="sections" onChange={onChange} />)
    await userEvent.click(screen.getByRole('tab', { name: 'Tutte le figurine' }))
    expect(onChange).toHaveBeenCalledWith('flat')
  })
  it('il tab disabilitato non chiama onChange', async () => {
    const onChange = vi.fn()
    render(<AlbumViewTabs value="sections" onChange={onChange} />)
    await userEvent.click(screen.getByRole('tab', { name: /in arrivo/i }))
    expect(onChange).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/album/AlbumViewTabs.test.tsx`
Expected: FAIL — cannot find module `./AlbumViewTabs`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/components/album/AlbumViewTabs.tsx
import { LayoutGrid, Rows3, Sparkles } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type AlbumView = 'sections' | 'flat'

export interface AlbumViewTabsProps {
  value: AlbumView
  onChange: (view: AlbumView) => void
}

export function AlbumViewTabs({ value, onChange }: AlbumViewTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as AlbumView)}
      className="items-center"
    >
      <TabsList aria-label="Modalità vista album">
        <TabsTrigger value="sections" aria-label="Vista a sezioni" title="Vista a sezioni">
          <LayoutGrid aria-hidden />
        </TabsTrigger>
        <TabsTrigger value="flat" aria-label="Tutte le figurine" title="Tutte le figurine">
          <Rows3 aria-hidden />
        </TabsTrigger>
        <TabsTrigger value="more" disabled aria-label="In arrivo" title="In arrivo">
          <Sparkles aria-hidden />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/album/AlbumViewTabs.test.tsx`
Expected: PASS (3 test). Se base-ui non commuta col `disabled` ma onValueChange scatta, aggiungi guard: il tab `more` non è un `AlbumView` valido quindi `onChange` non lo riceve — verifica che il test del disabled passi; se base-ui emette comunque, filtra in `onValueChange` con `if (v === 'sections' || v === 'flat') onChange(v)`.

- [ ] **Step 5: Commit**

```bash
git add src/components/album/AlbumViewTabs.tsx src/components/album/AlbumViewTabs.test.tsx
git commit -m "feat(album): legenda AlbumViewTabs icon-only (tab3 disabled)"
```

---

### Task 4: Vista piatta paginata AlbumFlatView

**Files:**
- Create: `src/components/album/AlbumFlatView.tsx`
- Test: `src/components/album/AlbumFlatView.test.tsx`

Contratto props:

```ts
import type { AlbumData } from '@/data/albums/types'

export interface AlbumFlatViewProps {
  data: AlbumData
  countOf: (code: string) => number
  onAdd: (code: string) => void
  onRemove: (code: string) => void
  onInfo: (code: string) => void
  stats: { total: number; missing: number; doubles: number; have: number }
}
```

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/album/AlbumFlatView.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AlbumFlatView } from './AlbumFlatView'
import type { AlbumData } from '@/data/albums/types'

// 70 codici in 2 sezioni con colori diversi -> 2 pagine (60/pagina)
const codesA = Array.from({ length: 40 }, (_, i) => `A${i + 1}`)
const codesB = Array.from({ length: 30 }, (_, i) => `B${i + 1}`)
const data = {
  names: {},
  sections: [
    { id: 'a', name: 'Sez A', group: 'G', c1: '#111111', c2: '#222222', codes: codesA },
    { id: 'b', name: 'Sez B', group: 'G', c1: '#333333', c2: '#444444', codes: codesB },
  ],
} as unknown as AlbumData

const stats = { total: 70, missing: 70, doubles: 0, have: 0 }

describe('AlbumFlatView', () => {
  it('pagina 1 mostra 60 carte, pagina 2 le restanti 10', async () => {
    render(<AlbumFlatView data={data} stats={stats} countOf={() => 0} onAdd={() => {}} onRemove={() => {}} onInfo={() => {}} />)
    // 60 card-button (name pattern ^code) in pagina 1
    expect(screen.getByRole('button', { name: /^A1\b/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^B30\b/ })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Pagina 2' }))
    expect(screen.getByRole('button', { name: /^B30\b/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^A1\b/ })).toBeNull()
  })

  it('filtro Possedute riduce alle carte con count>=1 e resetta a pagina 1', async () => {
    render(
      <AlbumFlatView
        data={data}
        stats={stats}
        countOf={(c) => (c === 'A1' ? 1 : 0)}
        onAdd={() => {}}
        onRemove={() => {}}
        onInfo={() => {}}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Possedute/ }))
    expect(screen.getByRole('button', { name: /^A1\b/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^A2\b/ })).toBeNull()
    // una sola pagina ora -> niente bottone Pagina 2
    expect(screen.queryByRole('button', { name: 'Pagina 2' })).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/album/AlbumFlatView.test.tsx`
Expected: FAIL — cannot find module `./AlbumFlatView`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/components/album/AlbumFlatView.tsx
import { useMemo, useState } from 'react'
import type { AlbumData, Section } from '@/data/albums/types'
import { passes, type Filter } from '@/lib/album/filter'
import { StickerCard } from './StickerCard'
import { Pagination } from '@/components/ui/pagination'

const PAGE_SIZE = 60

export interface AlbumFlatViewProps {
  data: AlbumData
  countOf: (code: string) => number
  onAdd: (code: string) => void
  onRemove: (code: string) => void
  onInfo: (code: string) => void
  stats: { total: number; missing: number; doubles: number; have: number }
}

const TABS: { key: Filter; label: string; n: (s: AlbumFlatViewProps['stats']) => number }[] = [
  { key: 'all', label: 'Tutte', n: (s) => s.total },
  { key: 'missing', label: 'Mancanti', n: (s) => s.missing },
  { key: 'double', label: 'Doppie', n: (s) => s.doubles },
  { key: 'have', label: 'Possedute', n: (s) => s.have },
]

export function AlbumFlatView({ data, countOf, onAdd, onRemove, onInfo, stats }: AlbumFlatViewProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [insertOn, setInsertOn] = useState(false)
  const [page, setPage] = useState(1)

  // code -> sezione (per colore squadra della box)
  const sectionByCode = useMemo(() => {
    const m = new Map<string, Section>()
    for (const s of data.sections) for (const c of s.codes) m.set(c, s)
    return m
  }, [data])

  const allCodes = useMemo(() => data.sections.flatMap((s) => s.codes), [data])
  const filtered = useMemo(() => allCodes.filter((c) => passes(filter, countOf(c))), [allCodes, filter, countOf])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const slice = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  function changeFilter(f: Filter) {
    setFilter(f)
    setPage(1)
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => {
          const on = filter === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => changeFilter(t.key)}
              aria-pressed={on}
              className={[
                'inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime',
                on ? 'bg-bg-elev text-ink' : 'border border-white/10 text-ink-2 hover:text-ink',
              ].join(' ')}
            >
              {t.label}
              <span className={`tabular-nums text-xs ${on ? 'rounded-full bg-lime px-1.5 text-lime-ink' : 'text-ink-2/70'}`}>{t.n(stats)}</span>
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setInsertOn((v) => !v)}
          aria-pressed={insertOn}
          className={[
            'ml-auto inline-flex min-h-[44px] items-center rounded-full px-5 text-sm font-semibold transition-transform duration-150 ease-out active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime',
            insertOn ? 'bg-lime text-lime-ink' : 'border border-white/10 text-ink-2 hover:text-ink',
          ].join(' ')}
        >
          Inserimento rapido {insertOn ? 'ON' : 'OFF'}
        </button>
      </div>

      {slice.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Nessuna figurina in questo filtro.</p>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-[repeat(auto-fill,minmax(7rem,1fr))]">
          {slice.map((code) => {
            const sec = sectionByCode.get(code)
            return (
              <StickerCard
                key={code}
                code={code}
                name={data.names[code]}
                c1={sec?.c1 ?? '#444'}
                c2={sec?.c2 ?? '#222'}
                count={countOf(code)}
                insertOn={insertOn}
                onAdd={() => onAdd(code)}
                onRemove={() => onRemove(code)}
                onInfo={() => onInfo(code)}
              />
            )
          })}
        </div>
      )}

      <div className="mt-6">
        <Pagination page={current} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/album/AlbumFlatView.test.tsx`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/album/AlbumFlatView.tsx src/components/album/AlbumFlatView.test.tsx
git commit -m "feat(album): AlbumFlatView griglia piatta paginata con filtri totali"
```

---

### Task 5: Integra legenda + commutazione vista in Album.tsx

**Files:**
- Modify: `src/pages/Album.tsx`

- [ ] **Step 1: Aggiungi import e stato vista**

In `src/pages/Album.tsx`, aggiungi agli import:

```ts
import { AlbumViewTabs, type AlbumView } from '@/components/album/AlbumViewTabs'
import { AlbumFlatView } from '@/components/album/AlbumFlatView'
```

Dopo `const [filter, setFilter] = useState<Filter>('all')` aggiungi:

```ts
const [view, setView] = useState<AlbumView>('sections')
```

- [ ] **Step 2: Inserisci legenda sopra l'indice e commuta il corpo**

Sostituisci il blocco che va da `<h2 ...>Sezioni album</h2>` fino alla chiusura del `<div ref={panelRef} ...> ... </div>` con:

```tsx
<div className="mt-8 flex justify-center">
  <AlbumViewTabs value={view} onChange={setView} />
</div>

<h2 className="mt-6 text-center font-display text-2xl font-bold tracking-tight text-ink">
  {view === 'flat' ? 'Tutte le figurine' : 'Sezioni album'}
</h2>

{view === 'flat' ? (
  <AlbumFlatView
    data={data}
    stats={albumStats}
    countOf={album.countOf}
    onAdd={album.increment}
    onRemove={album.decrement}
    onInfo={(code) => setInfoCode(code)}
  />
) : (
  <div
    ref={panelRef}
    className="mt-4 grid scroll-mt-24 gap-5 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:grid-cols-[15rem_1fr]"
    style={section ? sectionVars(section.c1, section.c2) : undefined}
  >
    <SectionSidebar data={data} states={album.states} counts={album.counts} activeId={section.id} onSelect={selectSection} />
    <div className="flex min-h-0 min-w-0 flex-col">
      <SectionHero section={section} index={sectionIndex} stats={secStats} filter={filter} onFilter={setFilter} insertOn={insertOn} onToggleInsert={() => setInsertOn((v) => !v)} />
      <div ref={gridScrollRef} className="mt-4 min-h-0 flex-1 lg:overflow-y-auto">
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
  </div>
)}
```

Nota: `albumStats` (da `computeStats`) ha la forma `{ have, doubles, missing, total, pct }` — compatibile con la prop `stats` di `AlbumFlatView`.

- [ ] **Step 3: Verifica build + typecheck + test**

Run: `npx tsc -b --noEmit && npx vitest run && npm run build`
Expected: tutto exit 0, suite verde.

- [ ] **Step 4: Lint + impeccable**

Run: `npm run lint && node /Users/alessandrogelo/.claude/skills/impeccable/scripts/detect.mjs --json src/components/album/AlbumViewTabs.tsx src/components/album/AlbumFlatView.tsx src/components/ui/pagination.tsx src/pages/Album.tsx`
Expected: lint exit 0, detect `[]`.

- [ ] **Step 5: Cache-bust (se necessario)**

Se ci sono asset locali con `?v=N` toccati da questa modifica, bumpa la versione. (Vite hash automatico copre i bundle; verificare solo asset statici referenziati a mano.)

- [ ] **Step 6: Commit + push**

```bash
git add src/pages/Album.tsx
git commit -m "feat(album): integra legenda vista + commutazione sezioni/piatta"
git push origin main
```

---

## Self-Review

- **Spec coverage:** Tab1 invariato (Task 5 else-branch) · Tab2 vista piatta paginata + filtri totali + colore per-sezione + inserimento (Task 4) · Tab3 disabled (Task 3) · pagination 60/pagina custom (Task 2) · riuso ui/tabs (Task 3) · predicato condiviso (Task 1). Tutto coperto.
- **Placeholder scan:** nessun TODO/TBD; tutto il codice è completo.
- **Type consistency:** `Filter` unico in `lib/album/filter.ts`, re-export da `StickerGrid`. `AlbumView = 'sections' | 'flat'`. `stats` shape `{total,missing,doubles,have}` ⊆ `computeStats` return. `Pagination` props `{page,totalPages,onChange}` usate identiche in Task 2/4/5.
- **Fuori scope:** logica Tab3, persistenza vista — esclusi come da spec.
