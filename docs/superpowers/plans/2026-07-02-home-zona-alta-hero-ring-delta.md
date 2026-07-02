# Home zona alta — Hero Ring + tile delta + snapshot storico — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rifare la riga stat della Home con un Hero Ring (completamento globale, colore squadra) al posto di Possedute, tile Doppie/Mancanti con delta settimanale ↑↓, Doppie cliccabile verso Scambi, e riquadro "Scambi completati" senza link — con i delta alimentati da uno snapshot giornaliero salvato in Firestore.

**Architecture:** Una funzione pura `computeDeltas` (testata) calcola i delta 7gg da una lista di snapshot. Un modulo `statsHistory.ts` fa I/O Firestore (scrittura throttle 1×/giorno + lettura ultimi 8 doc). Un hook `useStatsDeltas` collega i due a React. `HeroRing.tsx` è presentazionale. `StatTicker.tsx` orchestra la riga. `Home.tsx` invoca lo snapshot quando i totali sono pronti.

**Tech Stack:** React + TypeScript, Vite, Firebase Firestore (modular SDK), framer-motion (già presente), Vitest.

---

## File Structure

- Create `src/lib/stats/computeDeltas.ts` — funzione pura: da snapshot[] → delta.
- Create `src/lib/stats/computeDeltas.test.ts` — test vitest.
- Create `src/lib/db/statsHistory.ts` — I/O Firestore (touch snapshot + fetch).
- Create `src/hooks/useStatsDeltas.ts` — hook React che espone `{ haveDelta, doublesDelta, missingDelta }`.
- Create `src/components/home/HeroRing.tsx` — anello presentazionale.
- Modify `src/components/home/StatTicker.tsx` — usa HeroRing, tile delta, Doppie link, "Scambi completati".
- Modify `src/pages/Home.tsx` — chiama `touchStatsSnapshot` + passa delta a StatTicker.
- Modify `firestore.rules` — regola subcollection `stats`.

---

### Task 1: Funzione pura `computeDeltas`

**Files:**
- Create: `figubook-app/src/lib/stats/computeDeltas.ts`
- Test: `figubook-app/src/lib/stats/computeDeltas.test.ts`

Uno snapshot ha forma `{ date: 'YYYY-MM-DD', have, doubles, missing, total }`. La funzione
riceve la lista ordinata dal più recente al più vecchio (come arriva da Firestore
`orderBy(date,'desc')`). Il delta di una metrica = valore odierno (primo elemento) meno il
valore della base: la snapshot più vecchia con `date` entro 7 giorni indietro rispetto
a oggi. Se ci sono < 2 snapshot, o non esiste una base ≥1 giorno più vecchia, il delta è
`null` (la UI lo nasconde).

- [ ] **Step 1: Write the failing test**

```ts
// figubook-app/src/lib/stats/computeDeltas.test.ts
import { describe, it, expect } from 'vitest'
import { computeDeltas, type StatSnapshot } from './computeDeltas'

const snap = (date: string, have: number, doubles: number, missing: number): StatSnapshot =>
  ({ date, have, doubles, missing, total: 100 })

describe('computeDeltas', () => {
  it('storico vuoto → tutti null', () => {
    expect(computeDeltas([], '2026-07-02')).toEqual({
      haveDelta: null, doublesDelta: null, missingDelta: null,
    })
  })

  it('un solo punto → tutti null (niente base)', () => {
    expect(computeDeltas([snap('2026-07-02', 10, 2, 90)], '2026-07-02')).toEqual({
      haveDelta: null, doublesDelta: null, missingDelta: null,
    })
  })

  it('due punti a 3 giorni → delta = oggi - base', () => {
    const list = [snap('2026-07-02', 20, 5, 80), snap('2026-06-29', 14, 3, 86)]
    expect(computeDeltas(list, '2026-07-02')).toEqual({
      haveDelta: 6, doublesDelta: 2, missingDelta: -6,
    })
  })

  it('usa la base più vecchia entro 7 giorni, ignora quelle oltre', () => {
    const list = [
      snap('2026-07-02', 30, 8, 70),
      snap('2026-06-28', 22, 5, 78), // 4 gg fa → dentro finestra
      snap('2026-06-20', 10, 1, 90), // 12 gg fa → fuori finestra, ignorata
    ]
    expect(computeDeltas(list, '2026-07-02')).toEqual({
      haveDelta: 8, doublesDelta: 3, missingDelta: -8,
    })
  })

  it('solo snapshot oltre 7 giorni → null (nessuna base valida)', () => {
    const list = [snap('2026-07-02', 30, 8, 70), snap('2026-06-20', 10, 1, 90)]
    expect(computeDeltas(list, '2026-07-02')).toEqual({
      haveDelta: null, doublesDelta: null, missingDelta: null,
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd figubook-app && npx vitest run src/lib/stats/computeDeltas.test.ts`
Expected: FAIL — "Cannot find module './computeDeltas'".

- [ ] **Step 3: Write minimal implementation**

```ts
// figubook-app/src/lib/stats/computeDeltas.ts
export interface StatSnapshot {
  date: string // 'YYYY-MM-DD'
  have: number
  doubles: number
  missing: number
  total: number
}

export interface StatDeltas {
  haveDelta: number | null
  doublesDelta: number | null
  missingDelta: number | null
}

const NONE: StatDeltas = { haveDelta: null, doublesDelta: null, missingDelta: null }

function daysBetween(aIso: string, bIso: string): number {
  const a = Date.parse(aIso + 'T00:00:00Z')
  const b = Date.parse(bIso + 'T00:00:00Z')
  return Math.round((a - b) / 86_400_000)
}

// snapshots: ordinati dal più recente al più vecchio. todayIso: giorno corrente 'YYYY-MM-DD'.
export function computeDeltas(snapshots: StatSnapshot[], todayIso: string): StatDeltas {
  if (snapshots.length < 2) return NONE
  const today = snapshots[0]
  // Base = snapshot più vecchia con 1..7 giorni di distanza da oggi.
  let base: StatSnapshot | undefined
  for (const s of snapshots) {
    const d = daysBetween(todayIso, s.date)
    if (d >= 1 && d <= 7) base = s // continua: l'ultima assegnata è la più vecchia (lista desc)
  }
  if (!base) return NONE
  return {
    haveDelta: today.have - base.have,
    doublesDelta: today.doubles - base.doubles,
    missingDelta: today.missing - base.missing,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd figubook-app && npx vitest run src/lib/stats/computeDeltas.test.ts`
Expected: PASS (5 test).

- [ ] **Step 5: Commit**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add figubook-app/src/lib/stats/computeDeltas.ts figubook-app/src/lib/stats/computeDeltas.test.ts
git commit -m "feat(home): computeDeltas puro per delta stat 7gg"
```

---

### Task 2: Modulo I/O `statsHistory.ts`

**Files:**
- Create: `figubook-app/src/lib/db/statsHistory.ts`

`touchStatsSnapshot` salva il giorno corrente al massimo una volta (throttle localStorage,
stessa forma di `touchLastSeen` in `profile.ts:177`). `fetchRecentSnapshots` legge gli ultimi
8 doc ordinati per data desc. `todayIso()` produce 'YYYY-MM-DD' in orario locale.

- [ ] **Step 1: Write the module**

```ts
// figubook-app/src/lib/db/statsHistory.ts
import { collection, doc, getDocs, limit, orderBy, query, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { StatSnapshot } from '@/lib/stats/computeDeltas'

export function todayIso(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

type Totals = { have: number; doubles: number; missing: number; total: number }

// Salva lo snapshot del giorno corrente, max 1×/giorno (throttle localStorage).
export async function touchStatsSnapshot(uid: string, totals: Totals): Promise<void> {
  const today = todayIso()
  const key = `figubook:statsDay:${uid}`
  if (localStorage.getItem(key) === today) return
  localStorage.setItem(key, today)
  try {
    await setDoc(doc(db, 'users', uid, 'stats', today), {
      date: today,
      have: totals.have,
      doubles: totals.doubles,
      missing: totals.missing,
      total: totals.total,
    })
  } catch (e) {
    console.error('statsSnapshot', e)
    localStorage.removeItem(key) // riprova al prossimo giro se fallisce
  }
}

// Ultimi 8 snapshot, dal più recente al più vecchio.
export async function fetchRecentSnapshots(uid: string): Promise<StatSnapshot[]> {
  const q = query(
    collection(db, 'users', uid, 'stats'),
    orderBy('date', 'desc'),
    limit(8),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data() as StatSnapshot)
}
```

- [ ] **Step 2: Typecheck**

Run: `cd figubook-app && npx tsc -b --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add figubook-app/src/lib/db/statsHistory.ts
git commit -m "feat(home): statsHistory — snapshot giornaliero throttle + fetch"
```

---

### Task 3: Regola Firestore per la subcollection `stats`

**Files:**
- Modify: `firestore.rules` (dopo la riga `match /meta/{docId} ...`, ~riga 32)

- [ ] **Step 1: Aggiungi la regola**

Trova nel blocco `match /users/{userId} {` la riga:

```
      match /meta/{docId}     { allow read, write: if isUser(userId); }
```

Aggiungi subito sotto:

```
      // Snapshot statistiche giornaliere: privati, solo il proprietario.
      match /stats/{day}      { allow read, write: if isUser(userId); }
```

- [ ] **Step 2: Deploy rules (CLI loggata)**

Run: `cd /Users/alessandrogelo/Desktop/FiguBook && firebase deploy --only firestore:rules`
Expected: "Deploy complete!".

- [ ] **Step 3: Commit**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add firestore.rules
git commit -m "feat(rules): subcollection users/{uid}/stats privata"
```

---

### Task 4: Hook `useStatsDeltas`

**Files:**
- Create: `figubook-app/src/hooks/useStatsDeltas.ts`

Legge gli snapshot una volta (dopo mount con uid) e restituisce i delta calcolati con
`computeDeltas`. Non serve realtime: i delta cambiano al massimo una volta al giorno.

- [ ] **Step 1: Write the hook**

```ts
// figubook-app/src/hooks/useStatsDeltas.ts
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { fetchRecentSnapshots, todayIso } from '@/lib/db/statsHistory'
import { computeDeltas, type StatDeltas } from '@/lib/stats/computeDeltas'

const NONE: StatDeltas = { haveDelta: null, doublesDelta: null, missingDelta: null }

// `refreshKey` opzionale: cambiando forza una rilettura (es. dopo aver salvato lo snapshot).
export function useStatsDeltas(refreshKey?: unknown): StatDeltas {
  const { user } = useAuth()
  const [deltas, setDeltas] = useState<StatDeltas>(NONE)

  useEffect(() => {
    if (!user) return
    let alive = true
    fetchRecentSnapshots(user.uid)
      .then((snaps) => { if (alive) setDeltas(computeDeltas(snaps, todayIso())) })
      .catch((e) => { console.error('statsDeltas', e); if (alive) setDeltas(NONE) })
    return () => { alive = false }
  }, [user, refreshKey])

  return deltas
}
```

- [ ] **Step 2: Typecheck**

Run: `cd figubook-app && npx tsc -b --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add figubook-app/src/hooks/useStatsDeltas.ts
git commit -m "feat(home): useStatsDeltas hook"
```

---

### Task 5: Componente `HeroRing`

**Files:**
- Create: `figubook-app/src/components/home/HeroRing.tsx`

Anello SVG (conic via due cerchi stroke), percentuale al centro con count-up (riuso
`AnimatedNumber`), a fianco label + `have / total`. Pill "+N settimana" se `delta` non è null
e > 0. Colore anello = `color` (colore squadra) con fallback lime.

- [ ] **Step 1: Write the component**

```tsx
// figubook-app/src/components/home/HeroRing.tsx
import { AnimatedNumber } from './AnimatedNumber'

// Anello di completamento globale. pct 0..100. color = accento (colore squadra).
export function HeroRing({
  pct, have, total, delta, color,
}: {
  pct: number
  have: number
  total: number
  delta: number | null
  color: string
}) {
  const r = 34
  const circ = 2 * Math.PI * r
  const off = circ * (1 - Math.max(0, Math.min(100, pct)) / 100)
  return (
    <div
      className="col-span-2 flex items-center gap-4 rounded-2xl border px-4 py-3.5 sm:col-span-1"
      style={{
        background: `color-mix(in srgb, ${color} 10%, var(--color-surface))`,
        borderColor: `color-mix(in srgb, ${color} 28%, transparent)`,
      }}
    >
      <svg width="84" height="84" viewBox="0 0 84 84" className="shrink-0">
        <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle
          cx="42" cy="42" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off}
          transform="rotate(-90 42 42)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x="42" y="47" textAnchor="middle" className="fill-ink font-display" fontSize="18" fontWeight="700">
          {pct}%
        </text>
      </svg>
      <div className="min-w-0">
        <div className="text-xs font-medium text-ink md:text-sm">Collezione totale</div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <AnimatedNumber
            value={have}
            className="font-display text-3xl font-semibold tabular-nums tracking-tight text-ink md:text-4xl"
          />
          <span className="font-display text-sm tabular-nums text-ink-2">
            / {total.toLocaleString('it-IT')}
          </span>
        </div>
        {delta != null && delta > 0 && (
          <span
            className="mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
          >
            +{delta} settimana
          </span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `cd figubook-app && npx tsc -b --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add figubook-app/src/components/home/HeroRing.tsx
git commit -m "feat(home): HeroRing componente anello completamento globale"
```

---

### Task 6: Riscrivi `StatTicker` (HeroRing + tile delta + Doppie link + Scambi completati)

**Files:**
- Modify: `figubook-app/src/components/home/StatTicker.tsx`

Sostituisce il riquadro Possedute con `HeroRing`, aggiunge riga delta a Doppie (↑ verde) e
Mancanti (↓ rosso), rende **Doppie** un `Link` a `/scambi`, e trasforma il tile Scambi in
"Scambi completati" senza link. Riceve `deltas` e `ringColor` come nuove props.

- [ ] **Step 1: Rewrite the file**

```tsx
// figubook-app/src/components/home/StatTicker.tsx
import { Link } from 'react-router-dom'
import type { AlbumStats } from '@/lib/db/albums'
import type { StatDeltas } from '@/lib/stats/computeDeltas'
import { AnimatedNumber } from './AnimatedNumber'
import { HeroRing } from './HeroRing'

const TILE =
  'rounded-2xl border border-white/[0.08] bg-surface px-4 py-3.5 transition duration-200 hover:border-white/20 active:scale-[0.98]'
const LABEL = 'flex items-center gap-1.5 text-xs font-medium text-ink md:text-sm'
const NUM = 'mt-1.5 block font-display text-3xl font-semibold tabular-nums tracking-tight text-ink md:text-4xl'

function Dot({ color }: { color: string }) {
  return <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
}

// Delta settimanale: verde se coerente col "meglio" (doppie ↑ buono, mancanti ↓ buono).
// Qui il colore segue solo il segno mostrato: positivo→lime, negativo→rosso tenue.
function DeltaRow({ value, kind }: { value: number | null; kind: 'up-good' | 'down-good' }) {
  if (value == null || value === 0) return null
  const up = value > 0
  const arrow = up ? '↑' : '↓'
  // up-good: ↑ è verde. down-good: ↓ è verde.
  const good = kind === 'up-good' ? up : !up
  const color = good ? 'var(--color-lime)' : '#ff7a7a'
  return (
    <span className="mt-2 block text-xs font-semibold" style={{ color }}>
      {arrow} {up ? '+' : ''}{value}
    </span>
  )
}

export function StatTicker({
  totals,
  albumsCount,
  trades,
  deltas,
  ringColor,
}: {
  totals: AlbumStats
  albumsCount: number
  trades: number
  deltas: StatDeltas
  ringColor: string
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <HeroRing
        pct={totals.pct}
        have={totals.have}
        total={totals.total}
        delta={deltas.haveDelta}
        color={ringColor}
      />

      <Link to="/scambi" className={`group ${TILE}`}>
        <div className={`${LABEL} justify-between`}>
          <span className="flex items-center gap-1.5">
            <Dot color="var(--color-lime)" /> Doppie
          </span>
          <span className="text-lime transition-transform group-hover:translate-x-0.5">→</span>
        </div>
        <AnimatedNumber value={totals.doubles} className={NUM} />
        <DeltaRow value={deltas.doublesDelta} kind="up-good" />
      </Link>

      <div className={TILE}>
        <div className={LABEL}>
          <Dot color="var(--color-stat-missing)" /> Mancanti
        </div>
        <AnimatedNumber value={totals.missing} className={NUM} />
        <DeltaRow value={deltas.missingDelta} kind="down-good" />
      </div>

      <div className={TILE}>
        <div className={LABEL}>
          <Dot color="var(--color-ink-2)" /> Album
        </div>
        <AnimatedNumber value={albumsCount} className={NUM} />
      </div>

      <div className={TILE}>
        <div className={LABEL}>
          <Dot color="var(--color-lime)" /> Scambi completati
        </div>
        <AnimatedNumber value={trades} className={NUM} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck (fallirà finché Home non passa le nuove props — atteso)**

Run: `cd figubook-app && npx tsc -b --noEmit`
Expected: errori in `Home.tsx` (props `deltas`/`ringColor` mancanti). Si risolvono nel Task 7.

- [ ] **Step 3: Commit**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add figubook-app/src/components/home/StatTicker.tsx
git commit -m "feat(home): StatTicker con HeroRing, delta, Doppie link, Scambi completati"
```

---

### Task 7: Collega `Home.tsx` (snapshot + delta + colore anello)

**Files:**
- Modify: `figubook-app/src/pages/Home.tsx`

Chiama `touchStatsSnapshot` quando i totali sono pronti (non loading/errore), legge i delta
con `useStatsDeltas`, passa `deltas` e `ringColor` (colore squadra o lime) a `StatTicker`.

- [ ] **Step 1: Aggiungi import**

Dopo la riga `import { useTradesCount } from '@/hooks/useTradesCount'` aggiungi:

```tsx
import { useEffect } from 'react'
import { useStatsDeltas } from '@/hooks/useStatsDeltas'
import { touchStatsSnapshot } from '@/lib/db/statsHistory'
```

- [ ] **Step 2: Aggiungi logica nel corpo del componente**

Subito dopo la riga `const team = profile?.favTeam ? teamById[profile.favTeam] : undefined` aggiungi:

```tsx
  const ringColor = team?.c1 || 'var(--color-lime)'
  const deltas = useStatsDeltas(totals.have)
  useEffect(() => {
    if (!user || loading || error || albums.length === 0) return
    void touchStatsSnapshot(user.uid, totals)
  }, [user, loading, error, albums.length, totals])
```

- [ ] **Step 3: Passa le props a StatTicker**

Sostituisci:

```tsx
            <StatTicker totals={totals} albumsCount={albums.length} trades={trades} />
```

con:

```tsx
            <StatTicker totals={totals} albumsCount={albums.length} trades={trades} deltas={deltas} ringColor={ringColor} />
```

- [ ] **Step 4: Typecheck + lint**

Run: `cd figubook-app && npx tsc -b --noEmit && npm run lint 2>&1 | grep -c error`
Expected: tsc exit 0; grep stampa `0`.

- [ ] **Step 5: Commit**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add figubook-app/src/pages/Home.tsx
git commit -m "feat(home): Home invoca snapshot + passa delta/colore a StatTicker"
```

---

### Task 8: Verifica finale + cache-bust + push

**Files:**
- Modify: eventuale `?v=N` su asset se toccati (qui solo TSX → il build rigenera gli hash, nessun bump manuale necessario).

- [ ] **Step 1: Suite completa**

Run:
```bash
cd /Users/alessandrogelo/Desktop/FiguBook/figubook-app
npx tsc -b --noEmit && npm run lint 2>&1 | grep -c error && npx vitest run && npm run build
```
Expected: tsc exit 0; grep `0`; vitest tutto verde (incluso computeDeltas, +5); build exit 0 (solo warning chunk-size).

- [ ] **Step 2: Push**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git push origin main
```
Expected: push ok, Pages ridispiega.

- [ ] **Step 3: Verifica live (utente)**

Sul deploy: Hero Ring mostra pct + colore Juventus/Argentina, count-up parte; Doppie porta a
`/scambi`; Mancanti non cliccabile; "Scambi completati" senza freccia. Delta assenti oggi
(compaiono dopo ≥2 giorni di snapshot).
