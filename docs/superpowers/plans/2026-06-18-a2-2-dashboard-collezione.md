# A2.2 — Dashboard cruscotto + layer lettura album/stat — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Leggere album+figurine da Firestore (live, sola lettura) e ridisegnare la Dashboard come cruscotto scuro denso con anelli/stat reali rosso-verde.

**Architecture:** Layer dati `lib/db/albums.ts` (subscribe onSnapshot + `computeStats` pura) → hook `useCollection` (aggrega per-album + totali, gestisce listener) → componenti dashboard piccoli e isolati (`CompletionRing`, `StatTicker`, `AlbumStatCard`, `ClosestAlbumCard`). Coerente col pattern notifiche già in repo.

**Tech Stack:** React 19 + TS, Vite 8, Tailwind v4, Firebase Firestore (modular SDK), recharts (nuovo), vitest (nuovo, solo logica pura), framer-motion/lucide già presenti.

**Spec:** `docs/superpowers/specs/2026-06-18-a2-2-dashboard-collezione-design.md`

**Convenzioni repo (da rispettare):** import alias `@/...`; gate uid via `useAuth`/`requireUid` (B4); totale album dal catalogo, mai `window.*` (B13); colori stat semantici rosso=mancanti/verde=possedute/lime=doppie; caselle figurina NON toccate qui ([[figubook-figurine-cards-neutral]] resta per A2.3). Commit+push dopo ogni task ([[push-after-update]]).

## File Structure

- Create `figubook-app/src/lib/db/albums.ts` — tipi `AlbumStats`/`AlbumDoc`/`PerAlbumStats`, `computeStats` (pura), `aggregate` (pura), `subscribeMyAlbumIds`, `subscribeAlbum`.
- Create `figubook-app/src/lib/db/albums.test.ts` — unit test vitest di `computeStats`/`aggregate`.
- Create `figubook-app/src/hooks/useCollection.ts` — hook live: `{ albums, totals, loading }`.
- Create `figubook-app/src/components/dashboard/statColors.ts` — palette stat (unica fonte hex).
- Create `figubook-app/src/components/dashboard/CompletionRing.tsx` — anello recharts + % al centro.
- Create `figubook-app/src/components/dashboard/StatTicker.tsx` — riga tile cruscotto.
- Create `figubook-app/src/components/dashboard/AlbumStatCard.tsx` — card album con anello.
- Create `figubook-app/src/components/dashboard/ClosestAlbumCard.tsx` — album più vicino a chiudere.
- Modify `figubook-app/src/pages/Dashboard.tsx` — cablaggio + empty/loading state.
- Modify `figubook-app/src/index.css` — token `--color-stat-have`/`--color-stat-missing`.
- Modify `figubook-app/package.json` + Create `figubook-app/vitest.config.ts` — recharts + vitest.

**Checkpoint review (skill requesting-code-review):** dopo Task 4 (dati), dopo Task 8 (UI), dopo Task 9 (cablaggio).

---

### Task 1: Dipendenze + token colore + infra test

**Files:**
- Modify: `figubook-app/package.json` (via npm)
- Create: `figubook-app/vitest.config.ts`
- Modify: `figubook-app/src/index.css:9-23` (blocco `@theme`)
- Create: `figubook-app/src/components/dashboard/statColors.ts`

- [ ] **Step 1: Installa recharts + vitest**

Run (in `figubook-app/`):
```bash
npm install recharts && npm install -D vitest
```
Expected: aggiunge `recharts` a dependencies e `vitest` a devDependencies, exit 0.

- [ ] **Step 2: Aggiungi script test in package.json**

In `figubook-app/package.json`, dentro `"scripts"`, aggiungi dopo `"lint"`:
```json
    "test": "vitest run",
```

- [ ] **Step 3: Crea vitest.config.ts**

`figubook-app/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
```

- [ ] **Step 4: Aggiungi token colore stat in index.css**

In `figubook-app/src/index.css`, dentro il blocco `@theme { ... }` (dopo la riga `--color-gold: #e6b73c;`), aggiungi:
```css
  --color-stat-have: #3fb96b;    /* verde possedute */
  --color-stat-missing: #ff5b5b; /* rosso mancanti */
```

- [ ] **Step 5: Crea statColors.ts (fonte unica hex per recharts)**

`figubook-app/src/components/dashboard/statColors.ts`:
```ts
// Palette stat dashboard — unica fonte hex (recharts vuole stringhe, non var CSS).
// Allineata ai token --color-stat-* in index.css.
export const STAT_COLORS = {
  have: '#3fb96b',    // verde: possedute / completamento
  missing: '#ff5b5b', // rosso: mancanti
  double: '#c2f23d',  // lime: doppie
  track: '#1c2b24',   // traccia anello (sfondo scuro)
} as const
```

- [ ] **Step 6: Verifica build**

Run: `npm run build`
Expected: exit 0 (recharts risolto, nessun errore TS).

- [ ] **Step 7: Commit**

```bash
git add figubook-app/package.json figubook-app/package-lock.json figubook-app/vitest.config.ts figubook-app/src/index.css figubook-app/src/components/dashboard/statColors.ts
git commit -m "chore(a2.2): recharts + vitest + token stat colori"
git push
```

---

### Task 2: `computeStats` + `aggregate` (logica pura, TDD)

**Files:**
- Create: `figubook-app/src/lib/db/albums.ts`
- Test: `figubook-app/src/lib/db/albums.test.ts`

- [ ] **Step 1: Scrivi il test che fallisce**

`figubook-app/src/lib/db/albums.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { computeStats, aggregate } from './albums'

describe('computeStats', () => {
  it('conta have/doubles/missing/pct dal catalogo (calciatori-25-26 total=784)', () => {
    const states = { '1': 'have', '2': 'double', '3': 'have' }
    const counts = { '2': 3 } // doppia con 3 copie => 2 extra
    const s = computeStats('calciatori-25-26', states, counts)
    expect(s.have).toBe(3)       // 1,2,3 posseduti
    expect(s.doubles).toBe(2)    // (3-1) extra di '2'
    expect(s.total).toBe(784)
    expect(s.missing).toBe(781)
    expect(s.pct).toBe(0)        // round(3/784*100)=0
  })

  it('doppia senza counts vale 1 extra (default 2 copie)', () => {
    const s = computeStats('calciatori-25-26', { '1': 'double' }, {})
    expect(s.have).toBe(1)
    expect(s.doubles).toBe(1)
  })

  it('album fuori catalogo: total = numero di states', () => {
    const s = computeStats('ignoto', { '1': 'have', '2': 'have' }, {})
    expect(s.total).toBe(2)
    expect(s.pct).toBe(100)
  })
})

describe('aggregate', () => {
  it('somma i campi e ricalcola pct sull aggregato', () => {
    const a = aggregate([
      { have: 10, doubles: 2, missing: 90, total: 100, pct: 10 },
      { have: 30, doubles: 0, missing: 70, total: 100, pct: 30 },
    ])
    expect(a.have).toBe(40)
    expect(a.doubles).toBe(2)
    expect(a.missing).toBe(160)
    expect(a.total).toBe(200)
    expect(a.pct).toBe(20)
  })

  it('lista vuota: tutto 0, pct 0', () => {
    expect(aggregate([])).toEqual({ have: 0, doubles: 0, missing: 0, total: 0, pct: 0 })
  })
})
```

- [ ] **Step 2: Esegui il test, deve fallire**

Run: `npm run test`
Expected: FAIL — "Failed to resolve import './albums'" / `computeStats is not a function`.

- [ ] **Step 3: Implementa la logica pura in albums.ts**

`figubook-app/src/lib/db/albums.ts`:
```ts
import { albumById, type AlbumCatalogEntry } from '@/data/albumCatalog'

export interface AlbumStats {
  have: number
  doubles: number
  missing: number
  total: number
  pct: number
}

export interface AlbumDoc {
  states: Record<string, string>
  counts: Record<string, number>
}

export type PerAlbumStats = AlbumStats & { id: string; entry: AlbumCatalogEntry }

// Logica portata fedele da figubook-db.js:220 (getAlbumStats).
// Totale dal catalogo tipato (fix B13: niente window.STICKER_STATES/FB_STORAGE_KEY).
export function computeStats(
  albumId: string,
  states: Record<string, string>,
  counts: Record<string, number>,
): AlbumStats {
  let have = 0
  let doubles = 0
  for (const code of Object.keys(states)) {
    const s = states[code]
    if (s === 'have' || s === 'double') {
      have++
      if (s === 'double') doubles += (counts[code] || 2) - 1
    }
  }
  const total = albumById[albumId] ? albumById[albumId].total : Object.keys(states).length
  const missing = total - have
  const pct = total > 0 ? Math.round((have / total) * 100) : 0
  return { have, doubles, missing, total, pct }
}

export function aggregate(list: AlbumStats[]): AlbumStats {
  const have = list.reduce((n, s) => n + s.have, 0)
  const doubles = list.reduce((n, s) => n + s.doubles, 0)
  const missing = list.reduce((n, s) => n + s.missing, 0)
  const total = list.reduce((n, s) => n + s.total, 0)
  const pct = total > 0 ? Math.round((have / total) * 100) : 0
  return { have, doubles, missing, total, pct }
}
```

- [ ] **Step 4: Esegui il test, deve passare**

Run: `npm run test`
Expected: PASS (5 test verdi).

- [ ] **Step 5: Commit**

```bash
git add figubook-app/src/lib/db/albums.ts figubook-app/src/lib/db/albums.test.ts
git commit -m "feat(a2.2): computeStats + aggregate puri con test"
git push
```

---

### Task 3: Subscribe Firestore (ids + album doc)

**Files:**
- Modify: `figubook-app/src/lib/db/albums.ts` (append)

- [ ] **Step 1: Aggiungi le subscribe in fondo a albums.ts**

Append a `figubook-app/src/lib/db/albums.ts`:
```ts
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// onSnapshot live su users/{uid}/albums/_my-albums -> ids[]. Errore => [].
export function subscribeMyAlbumIds(
  uid: string,
  cb: (ids: string[]) => void,
): () => void {
  const ref = doc(db, 'users', uid, 'albums', '_my-albums')
  return onSnapshot(
    ref,
    (snap) => cb(snap.exists() ? ((snap.data().ids as string[]) ?? []) : []),
    (err) => {
      console.error('album ids', err)
      cb([])
    },
  )
}

// onSnapshot live sul doc album -> { states, counts }. Errore => vuoto.
export function subscribeAlbum(
  uid: string,
  albumId: string,
  cb: (d: AlbumDoc) => void,
): () => void {
  const ref = doc(db, 'users', uid, 'albums', albumId)
  return onSnapshot(
    ref,
    (snap) => {
      const data = snap.exists() ? snap.data() : {}
      cb({
        states: (data.states as Record<string, string>) ?? {},
        counts: (data.counts as Record<string, number>) ?? {},
      })
    },
    (err) => {
      console.error('album', albumId, err)
      cb({ states: {}, counts: {} })
    },
  )
}
```

NB: l'import statico di `firebase/firestore` va in cima al file con gli altri import — sposta `import { doc, onSnapshot } from 'firebase/firestore'` e `import { db } from '@/lib/firebase'` in testa al file (TS non permette import a metà file). Tienili sotto l'import esistente di `albumCatalog`.

- [ ] **Step 2: Verifica build**

Run: `npm run build`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add figubook-app/src/lib/db/albums.ts
git commit -m "feat(a2.2): subscribe live ids + album doc"
git push
```

---

### Task 4: Hook `useCollection`

**Files:**
- Create: `figubook-app/src/hooks/useCollection.ts`

- [ ] **Step 1: Crea l'hook**

`figubook-app/src/hooks/useCollection.ts`:
```ts
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { albumById } from '@/data/albumCatalog'
import {
  subscribeMyAlbumIds,
  subscribeAlbum,
  computeStats,
  aggregate,
  type AlbumStats,
  type PerAlbumStats,
} from '@/lib/db/albums'

const EMPTY: AlbumStats = { have: 0, doubles: 0, missing: 0, total: 0, pct: 0 }

export function useCollection(): {
  albums: PerAlbumStats[]
  totals: AlbumStats
  loading: boolean
} {
  const { user } = useAuth()
  const [ids, setIds] = useState<string[]>([])
  const [idsLoaded, setIdsLoaded] = useState(false)
  const [statsMap, setStatsMap] = useState<Record<string, AlbumStats>>({})

  // Lista album dell'utente (live).
  useEffect(() => {
    if (!user) {
      setIds([])
      setIdsLoaded(false)
      return
    }
    return subscribeMyAlbumIds(user.uid, (next) => {
      setIds(next)
      setIdsLoaded(true)
    })
  }, [user])

  // Un listener per album; cleanup su cambio lista/unmount (nessun orfano).
  useEffect(() => {
    if (!user) return
    const unsubs = ids.map((id) =>
      subscribeAlbum(user.uid, id, ({ states, counts }) =>
        setStatsMap((m) => ({ ...m, [id]: computeStats(id, states, counts) })),
      ),
    )
    return () => unsubs.forEach((u) => u())
  }, [user, ids])

  const albums: PerAlbumStats[] = ids
    .filter((id) => albumById[id])
    .map((id) => ({ id, entry: albumById[id], ...(statsMap[id] ?? EMPTY) }))

  const totals = aggregate(albums)
  const loading = !!user && (!idsLoaded || ids.some((id) => albumById[id] && !statsMap[id]))

  return { albums, totals, loading }
}
```

- [ ] **Step 2: Verifica build + lint**

Run: `npm run build && npm run lint`
Expected: build exit 0; lint solo i 2 error pre-esistenti (`button.tsx`, `tabs.tsx`), nessuno nuovo.

- [ ] **Step 3: Commit**

```bash
git add figubook-app/src/hooks/useCollection.ts
git commit -m "feat(a2.2): hook useCollection live (per-album + totali)"
git push
```

- [ ] **Step 4: CHECKPOINT REVIEW 1 (layer dati)**

Invoca la skill `superpowers:requesting-code-review` sul diff dei Task 1-4. Sistema eventuali rilievi prima dell'UI.

---

### Task 5: `CompletionRing`

**Files:**
- Create: `figubook-app/src/components/dashboard/CompletionRing.tsx`

- [ ] **Step 1: Crea il componente**

`figubook-app/src/components/dashboard/CompletionRing.tsx`:
```tsx
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'
import { STAT_COLORS } from './statColors'

// Anello completamento: arco verde proporzionale a pct, % al centro.
// Pattern da 21st stats-2 (RadialBarChart + PolarAngleAxis).
export function CompletionRing({
  pct,
  size = 120,
  color = STAT_COLORS.have,
}: {
  pct: number
  size?: number
  color?: string
}) {
  const data = [{ value: pct }]
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <RadialBarChart
        width={size}
        height={size}
        innerRadius="72%"
        outerRadius="100%"
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar
          dataKey="value"
          cornerRadius={size}
          fill={color}
          background={{ fill: STAT_COLORS.track }}
        />
      </RadialBarChart>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-mono text-2xl font-bold text-ink">{pct}%</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verifica build**

Run: `npm run build`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add figubook-app/src/components/dashboard/CompletionRing.tsx
git commit -m "feat(a2.2): CompletionRing recharts"
git push
```

---

### Task 6: `StatTicker`

**Files:**
- Create: `figubook-app/src/components/dashboard/StatTicker.tsx`

- [ ] **Step 1: Crea il componente**

`figubook-app/src/components/dashboard/StatTicker.tsx`:
```tsx
import type { AlbumStats } from '@/lib/db/albums'

// Riga tile cruscotto. Rosso/verde semantico-di-stato. NIENTE frecce trend (no storico).
export function StatTicker({ totals }: { totals: AlbumStats }) {
  const tiles: { label: string; value: string | number; color: string }[] = [
    { label: 'Possedute', value: totals.have, color: 'var(--color-stat-have)' },
    { label: 'Mancanti', value: totals.missing, color: 'var(--color-stat-missing)' },
    { label: 'Doppie', value: totals.doubles, color: 'var(--color-lime)' },
    { label: 'Completamento', value: `${totals.pct}%`, color: 'var(--color-stat-have)' },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="rounded-xl border border-white/8 bg-bg-elev px-4 py-3"
        >
          <div className="font-mono text-3xl font-bold" style={{ color: t.color }}>
            {t.value}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted">
            {t.label}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verifica build**

Run: `npm run build`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add figubook-app/src/components/dashboard/StatTicker.tsx
git commit -m "feat(a2.2): StatTicker riga cruscotto"
git push
```

---

### Task 7: `AlbumStatCard`

**Files:**
- Create: `figubook-app/src/components/dashboard/AlbumStatCard.tsx`

- [ ] **Step 1: Crea il componente**

`figubook-app/src/components/dashboard/AlbumStatCard.tsx`:
```tsx
import type { PerAlbumStats } from '@/lib/db/albums'
import { CompletionRing } from './CompletionRing'

// Card album: anello completamento + "have di total" + doppie/mancanti.
export function AlbumStatCard({ a }: { a: PerAlbumStats }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/8 bg-bg-elev p-4">
      <CompletionRing pct={a.pct} size={84} />
      <div className="min-w-0">
        <div className="truncate font-display text-lg font-semibold text-ink">
          {a.entry.title}
        </div>
        <div className="mt-0.5 font-mono text-sm text-ink-2">
          {a.have} di {a.total}
        </div>
        <div className="mt-1 flex gap-3 font-mono text-[11px] text-muted">
          <span style={{ color: 'var(--color-stat-missing)' }}>{a.missing} mancanti</span>
          <span style={{ color: 'var(--color-lime)' }}>{a.doubles} doppie</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verifica build**

Run: `npm run build`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add figubook-app/src/components/dashboard/AlbumStatCard.tsx
git commit -m "feat(a2.2): AlbumStatCard con anello"
git push
```

---

### Task 8: `ClosestAlbumCard`

**Files:**
- Create: `figubook-app/src/components/dashboard/ClosestAlbumCard.tsx`

- [ ] **Step 1: Crea il componente**

`figubook-app/src/components/dashboard/ClosestAlbumCard.tsx`:
```tsx
import { Link } from 'react-router-dom'
import type { PerAlbumStats } from '@/lib/db/albums'

// Album dove manca meno (missing>0). Spinge all'azione. CTA -> /album (lista).
export function ClosestAlbumCard({ albums }: { albums: PerAlbumStats[] }) {
  const closest = albums
    .filter((a) => a.missing > 0)
    .sort((x, y) => x.missing - y.missing)[0]
  if (!closest) return null
  return (
    <div className="rounded-xl border border-white/8 bg-pitch p-5">
      <div className="font-mono text-[10px] uppercase tracking-widest text-pitch-ink/80">
        Più vicino a chiudere
      </div>
      <div className="mt-2 font-display text-2xl font-bold text-pitch-ink">
        Ti mancano {closest.missing} a {closest.entry.title}
      </div>
      <Link
        to="/album"
        className="mt-3 inline-block rounded-lg bg-lime px-4 py-2 font-mono text-sm font-semibold text-lime-ink"
      >
        Apri →
      </Link>
    </div>
  )
}
```

- [ ] **Step 2: Verifica build**

Run: `npm run build`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add figubook-app/src/components/dashboard/ClosestAlbumCard.tsx
git commit -m "feat(a2.2): ClosestAlbumCard"
git push
```

- [ ] **Step 4: CHECKPOINT REVIEW 2 (componenti UI)**

Invoca `superpowers:requesting-code-review` sul diff dei Task 5-8. Sistema rilievi prima del cablaggio.

---

### Task 9: Cabla la Dashboard (loading + empty + griglia)

**Files:**
- Modify: `figubook-app/src/pages/Dashboard.tsx` (riscrittura completa)

- [ ] **Step 1: Riscrivi Dashboard.tsx**

`figubook-app/src/pages/Dashboard.tsx`:
```tsx
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCollection } from '@/hooks/useCollection'
import { StatTicker } from '@/components/dashboard/StatTicker'
import { CompletionRing } from '@/components/dashboard/CompletionRing'
import { AlbumStatCard } from '@/components/dashboard/AlbumStatCard'
import { ClosestAlbumCard } from '@/components/dashboard/ClosestAlbumCard'

export default function Dashboard() {
  const { user } = useAuth()
  const { albums, totals, loading } = useCollection()
  const name = user?.displayName?.trim() || user?.email?.split('@')[0] || 'collezionista'

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded bg-bg-elev" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-bg-elev" />
          ))}
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-ink">
        Ciao, <span className="text-lime">{name}</span>
      </h1>

      {albums.length === 0 ? (
        <div className="mt-8 grid place-items-center rounded-2xl border border-white/8 bg-bg-elev p-12 text-center">
          <div className="font-display text-2xl font-bold text-ink">
            Nessun album ancora
          </div>
          <div className="mt-1 text-ink-2">Aggiungi il primo per vedere i tuoi progressi.</div>
          <Link
            to="/album"
            className="mt-4 rounded-lg bg-lime px-5 py-2.5 font-mono text-sm font-semibold text-lime-ink"
          >
            Aggiungi il primo album
          </Link>
        </div>
      ) : (
        <>
          <section className="mt-6">
            <StatTicker totals={totals} />
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="grid place-items-center rounded-2xl border border-white/8 bg-bg-elev p-6">
              <CompletionRing pct={totals.pct} size={160} />
              <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                Completamento totale
              </div>
            </div>
            <ClosestAlbumCard albums={albums} />
          </section>

          <section className="mt-8">
            <h2 className="font-display text-xl font-bold text-ink">I tuoi album</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {albums.map((a) => (
                <AlbumStatCard key={a.id} a={a} />
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Verifica build + lint + test**

Run: `npm run build && npm run lint && npm run test`
Expected: build exit 0; lint solo i 2 error pre-esistenti; test 5 verdi.

- [ ] **Step 3: Commit**

```bash
git add figubook-app/src/pages/Dashboard.tsx
git commit -m "feat(a2.2): dashboard cruscotto cablata (live + empty + loading)"
git push
```

- [ ] **Step 4: CHECKPOINT REVIEW 3 (finale)**

Invoca `superpowers:requesting-code-review` sul diff completo A2.2. Poi verifica live (deploy Actions ~1-2 min): `/app/dashboard` con album → ticker + anello + card reali; senza album → empty-state; modifica album dal sito vecchio → si riflette live.

---

## Self-Review

**Copertura spec:** layer dati (`albums.ts` Task 2-3) ✓; hook (`useCollection` Task 4) ✓; `StatTicker`/`CompletionRing`/`AlbumStatCard`/`ClosestAlbumCard` (Task 5-9) ✓; empty-state (Task 9) ✓; widget scambi esclusi ✓; recharts dep (Task 1) ✓; fix B13/B4/B8 rispettati ✓; 3 checkpoint review ✓.

**Placeholder:** nessun TBD/TODO; ogni step ha codice o comando reale.

**Coerenza tipi:** `AlbumStats`/`AlbumDoc`/`PerAlbumStats` definiti in Task 2, usati identici in Task 3-9; `computeStats(albumId, states, counts)` e `aggregate(list)` firma stabile; `STAT_COLORS` chiavi `have/missing/double/track` coerenti tra Task 1/5; `useCollection()` ritorna `{ albums, totals, loading }` usato uguale in Dashboard.

**Note:** niente test runner pre-esistente → vitest introdotto (Task 1) solo per logica pura; subscribe/hook/UI verificati via build+lint+live (no DOM test infra, fuori scope). Rotta per-album non esiste → CTA verso `/album` lista (corretto per ora). Storico/recap/▲▼ e editing griglia/store ottimistico = A2.3.
```
