# Grafico doppie/nuove + torta drill-down Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere un secondo grafico (barre doppie-rosse / nuove-verdi per giorno) commutabile con quello attuale, e una torta drill-down per album al click su un giorno.

**Architecture:** Lo snapshot giornaliero `stats/{date}` viene esteso con un breakdown per album (`albums: {id:{have,doubles}}`). Un modulo puro `dailyDoublesSeries` calcola i delta giornalieri (aggregati e per album) dagli snapshot. Un `ChartPanel` gestisce il toggle tra `InsertedChart` (esistente) e `DoublesChart` (nuovo, recharts BarChart), e apre `DayAlbumPie` (recharts PieChart in overlay) al click su una barra.

**Tech Stack:** React, recharts, Firestore, Vitest.

---

## File Structure

- `src/lib/stats/computeDeltas.ts` — estendere `StatSnapshot` col campo `albums?`
- `src/lib/db/statsHistory.ts` — `touchStatsSnapshot` accetta il per-album + guard su doubles
- `src/components/layout/AppLayout.tsx` — passa il per-album a `touchStatsSnapshot`
- `src/lib/stats/dailyDoubles.ts` (+ test) — modulo puro serie doppie/nuove per giorno/album
- `src/hooks/useDoublesSeries.ts` — hook che legge gli snapshot e produce la serie
- `src/components/home/DoublesChart.tsx` — bar chart ② (doppie rosse, nuove verdi), click→giorno
- `src/components/home/DayAlbumPie.tsx` — torta drill-down per album (overlay + legenda + tooltip)
- `src/components/home/ChartPanel.tsx` — toggle + rende ①/② + gestisce il modal torta
- `src/pages/Home.tsx` — sostituisce `<InsertedChart>` con `<ChartPanel>`

---

## Task 1: Estendere StatSnapshot + snapshot per-album

**Files:**
- Modify: `src/lib/stats/computeDeltas.ts`
- Modify: `src/lib/db/statsHistory.ts`
- Modify: `src/components/layout/AppLayout.tsx`

- [ ] **Step 1: Aggiungi il campo `albums` a `StatSnapshot`**

In `src/lib/stats/computeDeltas.ts`, nell'interfaccia `StatSnapshot` (che ha già `date`, `have`, `doubles`, `missing`, `total`), aggiungi in fondo ai campi:

```ts
  // Breakdown per album del giorno (presente solo dai giorni dopo l'attivazione).
  albums?: Record<string, { have: number; doubles: number }>
```

- [ ] **Step 2: Aggiorna `touchStatsSnapshot` (per-album + guard doubles)**

In `src/lib/db/statsHistory.ts`, sostituisci l'intera funzione `touchStatsSnapshot` con:

```ts
export async function touchStatsSnapshot(
  uid: string,
  totals: Totals,
  perAlbum: Record<string, { have: number; doubles: number }> = {},
): Promise<void> {
  const today = todayIso()
  const key = `figubook:statsDay:${uid}`
  // Guard su have E doubles: registra anche i giorni di sole doppie (have invariato).
  const marker = `${today}:${totals.have}:${totals.doubles}`
  if (localStorage.getItem(key) === marker) return
  localStorage.setItem(key, marker)
  try {
    await setDoc(doc(db, 'users', uid, 'stats', today), {
      date: today,
      have: totals.have,
      doubles: totals.doubles,
      missing: totals.missing,
      total: totals.total,
      albums: perAlbum,
    })
  } catch (e) {
    console.error('statsSnapshot', e)
    localStorage.removeItem(key) // riprova al prossimo giro se fallisce
  }
}
```

- [ ] **Step 3: Passa il per-album da AppLayout**

In `src/components/layout/AppLayout.tsx`, l'effetto attuale è:

```tsx
  useEffect(() => {
    if (!user || loading || error || albums.length === 0) return
    void touchStatsSnapshot(user.uid, totals)
  }, [user, loading, error, albums.length, totals])
```

Sostituiscilo con (costruisce il map per-album da `albums`, ognuno con `id`/`have`/`doubles`):

```tsx
  useEffect(() => {
    if (!user || loading || error || albums.length === 0) return
    const perAlbum = Object.fromEntries(albums.map((a) => [a.id, { have: a.have, doubles: a.doubles }]))
    void touchStatsSnapshot(user.uid, totals, perAlbum)
  }, [user, loading, error, albums, totals])
```

- [ ] **Step 4: Typecheck + build**

Run: `cd figubook-app && npx tsc -b --noEmit && npm run build`
Expected: exit 0 (solo warning preesistente INEFFECTIVE_DYNAMIC_IMPORT).

- [ ] **Step 5: Commit**

```bash
git add figubook-app/src/lib/stats/computeDeltas.ts figubook-app/src/lib/db/statsHistory.ts figubook-app/src/components/layout/AppLayout.tsx
git commit -m "feat(stats): snapshot giornaliero per album + guard su doubles"
```

---

## Task 2: Modulo puro `dailyDoublesSeries`

**Files:**
- Create: `src/lib/stats/dailyDoubles.ts`
- Test: `src/lib/stats/dailyDoubles.test.ts`

- [ ] **Step 1: Scrivi il test che fallisce**

Crea `src/lib/stats/dailyDoubles.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { dailyDoublesSeries } from './dailyDoubles'
import type { StatSnapshot } from './computeDeltas'

const snap = (date: string, have: number, doubles: number, albums?: StatSnapshot['albums']): StatSnapshot => ({
  date, have, doubles, missing: 0, total: 0, albums,
})

describe('dailyDoublesSeries', () => {
  it('serie 7 giorni: delta nuove/doppie e per album', () => {
    const snaps: StatSnapshot[] = [
      snap('2025-12-19', 10, 2, { 'calciatori-25-26': { have: 10, doubles: 2 } }),
      snap('2025-12-20', 27, 5, { 'calciatori-25-26': { have: 25, doubles: 4 }, 'mondiali-2026': { have: 2, doubles: 1 } }),
    ]
    const out = dailyDoublesSeries(snaps, '2025-12-20')
    expect(out).toHaveLength(7)
    const day = out[out.length - 1]
    expect(day.date).toBe('2025-12-20')
    expect(day.nuove).toBe(17) // 27 - 10
    expect(day.doppie).toBe(3) // 5 - 2
    expect(day.perAlbum['calciatori-25-26']).toEqual({ nuove: 15, doppie: 2 })
    expect(day.perAlbum['mondiali-2026']).toEqual({ nuove: 2, doppie: 1 })
  })
  it('giorno senza snapshot = zeri, nessun perAlbum', () => {
    const out = dailyDoublesSeries([snap('2025-12-20', 5, 0)], '2025-12-20')
    const empty = out[0]
    expect(empty.nuove).toBe(0)
    expect(empty.doppie).toBe(0)
    expect(empty.perAlbum).toEqual({})
  })
  it('delta negativi (rimozioni) clampati a 0', () => {
    const snaps = [snap('2025-12-19', 30, 9), snap('2025-12-20', 20, 4)]
    const day = dailyDoublesSeries(snaps, '2025-12-20').at(-1)!
    expect(day.nuove).toBe(0)
    expect(day.doppie).toBe(0)
  })
})
```

- [ ] **Step 2: Esegui il test per vederlo fallire**

Run: `cd figubook-app && npx vitest run src/lib/stats/dailyDoubles.test.ts`
Expected: FAIL — modulo mancante.

- [ ] **Step 3: Implementa `dailyDoubles.ts`**

Crea `src/lib/stats/dailyDoubles.ts`:

```ts
import type { StatSnapshot } from './computeDeltas'

export interface DayDoublesPoint {
  date: string // 'YYYY-MM-DD'
  nuove: number
  doppie: number
  perAlbum: Record<string, { nuove: number; doppie: number }>
}

function todayMinus(todayIso: string, n: number): string {
  const t = Date.parse(todayIso + 'T00:00:00Z')
  const d = new Date(t - n * 86_400_000)
  return d.toISOString().slice(0, 10)
}

// Serie rolling 7 giorni (vecchio→oggi). Per ogni giorno con snapshot: delta vs
// ultimo snapshot precedente esistente, aggregato (have/doubles) e per album.
export function dailyDoublesSeries(snapshots: StatSnapshot[], todayIso: string): DayDoublesPoint[] {
  const byDate = new Map(snapshots.map((s) => [s.date, s]))
  const asc = [...snapshots].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  const out: DayDoublesPoint[] = []
  for (let i = 6; i >= 0; i--) {
    const date = todayMinus(todayIso, i)
    const snap = byDate.get(date)
    if (!snap) {
      out.push({ date, nuove: 0, doppie: 0, perAlbum: {} })
      continue
    }
    let prev: StatSnapshot | undefined
    for (const s of asc) {
      if (s.date < date) prev = s
      else break
    }
    const nuove = Math.max(0, prev ? snap.have - prev.have : 0)
    const doppie = Math.max(0, prev ? snap.doubles - prev.doubles : 0)
    const perAlbum: Record<string, { nuove: number; doppie: number }> = {}
    const cur = snap.albums ?? {}
    const before = prev?.albums ?? {}
    for (const id of Object.keys(cur)) {
      const c = cur[id]
      const b = before[id] ?? { have: 0, doubles: 0 }
      const n = Math.max(0, c.have - b.have)
      const d = Math.max(0, c.doubles - b.doubles)
      if (n > 0 || d > 0) perAlbum[id] = { nuove: n, doppie: d }
    }
    out.push({ date, nuove, doppie, perAlbum })
  }
  return out
}
```

- [ ] **Step 4: Esegui il test per verificarlo verde**

Run: `cd figubook-app && npx vitest run src/lib/stats/dailyDoubles.test.ts`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git add figubook-app/src/lib/stats/dailyDoubles.ts figubook-app/src/lib/stats/dailyDoubles.test.ts
git commit -m "feat(stats): dailyDoublesSeries (delta nuove/doppie per giorno e album)"
```

---

## Task 3: Hook `useDoublesSeries`

**Files:**
- Create: `src/hooks/useDoublesSeries.ts`

- [ ] **Step 1: Implementa l'hook (mirror di useInsertedSeries)**

Crea `src/hooks/useDoublesSeries.ts`:

```ts
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { fetchRecentSnapshots, todayIso } from '@/lib/db/statsHistory'
import { dailyDoublesSeries, type DayDoublesPoint } from '@/lib/stats/dailyDoubles'

// Serie doppie/nuove per giorno (rolling 7gg). Legge fino a 14 snapshot per
// coprire la finestra anche con giorni saltati. `refreshKey` forza rilettura.
export function useDoublesSeries(refreshKey?: unknown): DayDoublesPoint[] {
  const { user } = useAuth()
  const [series, setSeries] = useState<DayDoublesPoint[]>([])

  useEffect(() => {
    if (!user) return
    let alive = true
    fetchRecentSnapshots(user.uid, 14)
      .then((snaps) => { if (alive) setSeries(dailyDoublesSeries(snaps, todayIso())) })
      .catch((e) => { console.error('doublesSeries', e); if (alive) setSeries([]) })
    return () => { alive = false }
  }, [user, refreshKey])

  return series
}
```

- [ ] **Step 2: Typecheck**

Run: `cd figubook-app && npx tsc -b --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add figubook-app/src/hooks/useDoublesSeries.ts
git commit -m "feat(stats): hook useDoublesSeries"
```

---

## Task 4: DoublesChart (bar chart ②)

**Files:**
- Create: `src/components/home/DoublesChart.tsx`

- [ ] **Step 1: Implementa il grafico a barre**

Crea `src/components/home/DoublesChart.tsx`:

```tsx
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DayDoublesPoint } from '@/lib/stats/dailyDoubles'

const GREEN = 'var(--color-lime)' // "nuove" — segue il tema scoped (oro su .home-gold)
const RED = 'var(--color-stat-missing)' // "doppie"
const WD3 = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']

function wd3(iso: string): string {
  return WD3[new Date(iso + 'T00:00:00Z').getUTCDay()]
}

function DoublesTooltip({ active, payload }: { active?: boolean; payload?: { payload: DayDoublesPoint }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border border-white/10 bg-bg-elev px-3 py-2 text-sm shadow-xl">
      <p className="font-semibold text-ink">{new Date(d.date + 'T00:00:00Z').toLocaleDateString('it-IT')}</p>
      <p className="text-ink-2"><span className="text-lime">●</span> {d.nuove} nuove</p>
      <p className="text-ink-2"><span className="text-stat-missing">●</span> {d.doppie} doppie</p>
      <p className="mt-1 text-xs text-ink-2">Clicca per il dettaglio per album</p>
    </div>
  )
}

// Grafico ②: due barre per giorno — nuove (verde) e doppie (rosso).
// Click su una barra → onSelectDay(date) (apre la torta del giorno).
export function DoublesChart({
  series, onSelectDay,
}: {
  series: DayDoublesPoint[]
  onSelectDay: (date: string) => void
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={series}
          barCategoryGap="20%"
          onClick={(e) => { const d = e?.activeLabel; if (typeof d === 'string') onSelectDay(d) }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink-2)" strokeOpacity={0.15} vertical={false} />
          <XAxis dataKey="date" tickFormatter={wd3} tick={{ fill: 'var(--color-ink-2)', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: 'var(--color-ink-2)', fontSize: 12 }} axisLine={false} tickLine={false} width={28} />
          <Tooltip cursor={{ fill: 'var(--color-ink-2)', fillOpacity: 0.08 }} content={<DoublesTooltip />} />
          <Bar dataKey="nuove" fill={GREEN} radius={[3, 3, 0, 0]} cursor="pointer" />
          <Bar dataKey="doppie" fill={RED} radius={[3, 3, 0, 0]} cursor="pointer" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck + build**

Run: `cd figubook-app && npx tsc -b --noEmit && npm run build`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add figubook-app/src/components/home/DoublesChart.tsx
git commit -m "feat(home): DoublesChart bar chart nuove/doppie per giorno"
```

---

## Task 5: DayAlbumPie (torta drill-down)

**Files:**
- Create: `src/components/home/DayAlbumPie.tsx`

- [ ] **Step 1: Implementa la torta in overlay**

Crea `src/components/home/DayAlbumPie.tsx`:

```tsx
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { X } from 'lucide-react'
import { albumById } from '@/data/albumCatalog'
import type { DayDoublesPoint } from '@/lib/stats/dailyDoubles'

interface Slice {
  id: string
  name: string
  value: number // totale aggiunte del giorno per album (nuove + doppie)
  nuove: number
  doppie: number
  color: string
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: { payload: Slice }[] }) {
  if (!active || !payload?.length) return null
  const s = payload[0].payload
  return (
    <div className="rounded-lg border border-white/10 bg-bg-elev px-3 py-2 text-sm shadow-xl">
      <p className="font-semibold text-ink">{s.name}</p>
      <p className="text-ink-2">{s.doppie} doppie · {s.nuove} nuove</p>
    </div>
  )
}

// Overlay: torta delle aggiunte di un giorno divise per album (legenda a destra).
export function DayAlbumPie({ day, onClose }: { day: DayDoublesPoint; onClose: () => void }) {
  const slices: Slice[] = Object.entries(day.perAlbum).map(([id, v]) => ({
    id,
    name: albumById[id]?.title ?? id,
    value: v.nuove + v.doppie,
    nuove: v.nuove,
    doppie: v.doppie,
    color: albumById[id]?.c1 ?? '#888',
  }))
  const title = new Date(day.date + 'T00:00:00Z').toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Chiudi" className="grid h-8 w-8 place-items-center rounded-full text-ink-2 hover:bg-white/10 hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        {slices.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-2">Nessun dettaglio per album per questo giorno.</p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={slices} dataKey="value" nameKey="name" cx="40%" cy="50%" outerRadius={90}>
                  {slices.map((s) => <Cell key={s.id} fill={s.color} />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" wrapperStyle={{ fontSize: 13, color: 'var(--color-ink)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck + build**

Run: `cd figubook-app && npx tsc -b --noEmit && npm run build`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add figubook-app/src/components/home/DayAlbumPie.tsx
git commit -m "feat(home): DayAlbumPie torta per album al click sul giorno"
```

---

## Task 6: ChartPanel (toggle) + wiring in Home

**Files:**
- Create: `src/components/home/ChartPanel.tsx`
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: Implementa il ChartPanel**

Crea `src/components/home/ChartPanel.tsx`:

```tsx
import { useState } from 'react'
import { useInsertedSeries } from '@/hooks/useInsertedSeries'
import { useDoublesSeries } from '@/hooks/useDoublesSeries'
import { InsertedChart } from '@/components/home/InsertedChart'
import { DoublesChart } from '@/components/home/DoublesChart'
import { DayAlbumPie } from '@/components/home/DayAlbumPie'
import type { DayDoublesPoint } from '@/lib/stats/dailyDoubles'

const TABS = [
  { key: 'aggiunte', label: 'Aggiunte' },
  { key: 'doppie', label: 'Doppie e nuove' },
] as const

// Sezione grafico con toggle: ① aggiunte (area) / ② doppie-nuove (barre + torta).
export function ChartPanel({ refreshKey }: { refreshKey?: unknown }) {
  const [view, setView] = useState<'aggiunte' | 'doppie'>('aggiunte')
  const [day, setDay] = useState<DayDoublesPoint | null>(null)
  const inserted = useInsertedSeries(refreshKey)
  const doubles = useDoublesSeries(refreshKey)

  return (
    <div>
      <div className="mb-3 inline-flex rounded-full border border-white/10 bg-surface/60 p-0.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setView(t.key)}
            className={
              'cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ' +
              (view === t.key ? 'bg-lime text-lime-ink' : 'text-ink-2 hover:text-ink')
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === 'aggiunte' ? (
        <InsertedChart series={inserted} />
      ) : (
        <DoublesChart series={doubles} onSelectDay={(d) => setDay(doubles.find((x) => x.date === d) ?? null)} />
      )}

      {day && <DayAlbumPie day={day} onClose={() => setDay(null)} />}
    </div>
  )
}
```

- [ ] **Step 2: Wire in Home.tsx**

In `src/pages/Home.tsx`:
- Aggiungi import: `import { ChartPanel } from '@/components/home/ChartPanel'`
- Rimuovi l'import ora inutile `import { InsertedChart } from '@/components/home/InsertedChart'` e `import { useInsertedSeries } from '@/hooks/useInsertedSeries'`
- Rimuovi la riga `const insertedSeries = useInsertedSeries(totals.have)`
- Sostituisci il blocco:
  ```tsx
  <div className="hidden lg:block">
    <InsertedChart series={insertedSeries} />
  </div>
  ```
  con:
  ```tsx
  <div className="hidden lg:block">
    <ChartPanel refreshKey={`${totals.have}:${totals.doubles}`} />
  </div>
  ```

- [ ] **Step 3: Typecheck + build**

Run: `cd figubook-app && npx tsc -b --noEmit && npm run build`
Expected: exit 0 (nessun import orfano: se tsc segnala `insertedSeries`/`InsertedChart` inutilizzati, rimuovili).

- [ ] **Step 4: Commit**

```bash
git add figubook-app/src/components/home/ChartPanel.tsx figubook-app/src/pages/Home.tsx
git commit -m "feat(home): ChartPanel con toggle aggiunte/doppie + torta drill-down"
```

---

## Task 7: Verifica end-to-end + push

**Files:** nessuno

- [ ] **Step 1: Suite test**

Run: `cd figubook-app && npx vitest run src/lib/stats/dailyDoubles.test.ts`
Expected: PASS.

- [ ] **Step 2: Push**

```bash
git push origin main
```

- [ ] **Step 3: Verifica manuale (dopo deploy Pages)**

1. In due album diversi, segna alcune figurine come "have" e alcune come "double".
2. Torna in Home → sezione grafico → toggle **"Doppie e nuove"** → barre verde (nuove) + rosso (doppie) per oggi.
3. Click sulla barra di oggi → **torta** con le fette per album, legenda a destra coi titoli, hover fetta → "N doppie · M nuove".
4. Toggle **"Aggiunte"** → torna il grafico ad area originale, invariato.
5. (Console Firebase) `users/{uid}/stats/{oggi}` ha il campo `albums: {…}`.

---

## Note

- Limite noto: il breakdown per album (e quindi la torta) esiste **solo dai giorni dopo il deploy**;
  gli snapshot storici restano aggregati. Barra di un giorno senza `perAlbum` → torta con messaggio
  "Nessun dettaglio per album".
- `git add` con path espliciti (mai `-A` da root).
- Cache-bust non necessario: build Vite hashed (deploy via Actions).
