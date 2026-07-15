# Albo d'Oro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere alla Community la sezione **Albo d'Oro** — punteggio a due assi (Collezionista/Scambista), classifiche filtrabili (Nazionale/Città/Squadra/Amici), stagioni mensili — con sub-navbar Amici·Gruppi·Albo d'Oro.

**Architecture:** Il punteggio è calcolato **derivato dallo stato attuale** (completamento album + scambi completati + inviti + amicizie), non da un log eventi → semplice e a prova di cheat. Un modulo puro `scoring.ts` (testabile) vive nelle Cloud Functions; una callable `leaderboard` ricalcola live lo score del chiamante + gli scope locali (piccoli insiemi) e ordina gli `scores/{uid}` salvati per il nazionale. Il client mostra stat-tiles + podio top-3 + lista rankings, riadattati dai riferimenti Trophy.so nel design system FiguBook.

**Tech Stack:** React + react-router-dom + Tailwind (app); Firebase Functions v2 (`onCall`, europe-west1, `getFirestore()`); Firestore; vitest.

**Spec:** `figubook-app/docs/superpowers/specs/2026-07-15-community-albo-doro-design.md`

**Fuori scope (v1):** ricompense/avatar stagionali, Gruppi, storico vincitori stagioni (→ v1.1), trigger Firestore on-event.

---

## File Structure

**Cloud Functions (`functions/src/`)**
- `albo/pointValues.ts` — costanti punteggio (tarabili). Create.
- `albo/scoring.ts` — logica pura: `scoreCollezionista`, `scoreScambista`, `computeAxes`. Create.
- `albo/scoring.test.ts` — unit test del modulo puro. Create.
- `albo/albumTotals.ts` — mappa `albumId → total` (duplicato minimo del catalogo app). Create.
- `albo/rank.ts` — logica pura ordinamento/rank/posizione `me`. Create.
- `albo/rank.test.ts` — test. Create.
- `leaderboard.ts` — callable `leaderboard`: raccoglie input per uid, chiama `scoring`, persiste `scores/{uid}`, risolve scope, ordina. Create.
- `leaderboard.test.ts` — test della raccolta scope + integrazione (con Firestore mockato leggero, come `nearbyCollectors.test.ts`). Create.
- `index.ts` — esporta `leaderboard`. Modify.

**App (`figubook-app/src/`)**
- `pages/Community.tsx` — diventa shell con sub-navbar + `<Outlet/>` o render per tab. Modify.
- `pages/community/Amici.tsx` — contenuto attuale di Community spostato qui. Create.
- `pages/community/Gruppi.tsx` — placeholder "Presto". Create.
- `pages/community/AlboDoro.tsx` — vista classifica. Create.
- `components/community/CommunityTabs.tsx` — pill tabs. Create.
- `components/community/LeaderboardPodium.tsx` — podio top-3. Create.
- `components/community/LeaderboardRow.tsx` — riga lista rankings. Create.
- `components/community/ScoreTiles.tsx` — stat-tiles header (Punti/Posizione). Create.
- `hooks/useLeaderboard.ts` — chiama la callable, gestisce loading/scope/asse/paginazione. Create.
- `lib/functions/leaderboard.ts` — wrapper client `httpsCallable`. Create.
- `App.tsx` — route figlie `/community`, `/community/gruppi`, `/community/albo-doro`. Modify.

**Firestore config (`/`)**
- `firestore.rules` — `scores` (lettura chiusa al client; scrittura solo admin). Modify.
- `firestore.indexes.json` — indici `scores` per scope. Modify.

---

## Task 1: Costanti e mappa totali album (Functions)

**Files:**
- Create: `functions/src/albo/pointValues.ts`
- Create: `functions/src/albo/albumTotals.ts`

- [ ] **Step 1: Crea `pointValues.ts`**

```ts
// functions/src/albo/pointValues.ts
// Valori punteggio Albo d'Oro. Tarabili senza toccare la logica.
export const PT = {
  albumComplete: 50,        // album al 100%
  milestone: 5,             // per soglia 25/50/75% superata
  albumStarted: 2,          // >=1 figurina in un album
  perSticker: 0.1,          // per figurina posseduta
  derbyBonusFactor: 0.5,    // extra sulle figurine della squadra del cuore (×1.5 => +0.5*perSticker*teamHave)
  tradeCompleted: 5,        // scambio completato con partner diverso
  newPartner: 3,            // primo scambio con un nuovo partner
  invite: 20,               // amico invitato iscritto
  friendship: 1,            // amicizia accettata
  activeDay: 1,             // giorno di attività
  profileComplete: 5,       // una tantum
} as const
```

- [ ] **Step 2: Crea `albumTotals.ts`** (allineato a `figubook-app/src/data/albumCatalog.ts`)

```ts
// functions/src/albo/albumTotals.ts
// Duplicato minimo dei totali catalogo (le functions non importano l'app).
// Fonte: figubook-app/src/data/albumCatalog.ts — tenere allineato.
export const ALBUM_TOTALS: Record<string, number> = {
  'calciatori-25-26': 784,
  'calciatori-24-25': 886,
  'calciatori-23-24': 816,
  'calciatori-22-23': 739,
  'mondiali-2026': 992,
  'mondiali-2022': 670,
  'calb-25-26': 440,
  'adrenalyn-25-26': 728,
  'match-attax-ucl': 584,
}
export function totalOf(albumId: string): number {
  return ALBUM_TOTALS[albumId] ?? 0
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add functions/src/albo/pointValues.ts functions/src/albo/albumTotals.ts
git commit -m "feat(albo): point values + album totals map"
```

> NB: verificare in fase 1 che i totali sopra coincidano con `albumCatalog.ts` (nuovi album vanno aggiunti in entrambi).

---

## Task 2: Modulo scoring puro (Functions)

**Files:**
- Create: `functions/src/albo/scoring.ts`
- Test: `functions/src/albo/scoring.test.ts`

Modello input (derivato dallo stato, già-calcolato dal caller):
- `albums: { albumId, have, total, teamHave, baselineHave }[]` — `teamHave` = figurine in sezioni squadra del cuore; `baselineHave` = figurine possedute all'INIZIO del mese corrente (per il reset stagionale del Collezionista). All-time ignora `baselineHave`; stagionale usa il delta `have - baselineHave`.
- `trades: { partner, at }[]` — scambi completati (uno per proposta completata).
- `invites: { at }[]`, `friendshipsAt: number[]`, `activeDays: string[]`, `profileComplete: boolean`.
- `sinceMs?: number` — se presente, filtra gli eventi al mese corrente (stagionale). Gli album passano già i valori corretti (all-time o delta-mese) a monte.

- [ ] **Step 1: Scrivi i test (falliscono)**

```ts
// functions/src/albo/scoring.test.ts
import { describe, it, expect } from 'vitest'
import { scoreCollezionista, scoreCollezionistaSeasonal, scoreScambista, computeAxes } from './scoring.js'

describe('scoreCollezionista', () => {
  it('album al 100% => 50 + 3 soglie(15) + started(2) + 0.1*total', () => {
    const s = scoreCollezionista([{ albumId: 'a', have: 100, total: 100, teamHave: 0 }])
    // 50 + 5*3 + 2 + 0.1*100 = 50+15+2+10 = 77
    expect(s).toBe(77)
  })
  it('album al 30% => started + soglia25 + 0.1*have', () => {
    const s = scoreCollezionista([{ albumId: 'a', have: 30, total: 100, teamHave: 0 }])
    // started 2 + milestone25 5 + 0.1*30(3) = 10
    expect(s).toBe(10)
  })
  it('album vuoto => 0', () => {
    expect(scoreCollezionista([{ albumId: 'a', have: 0, total: 100, teamHave: 0 }])).toBe(0)
  })
  it('derby: +0.5*0.1*teamHave extra', () => {
    const s = scoreCollezionista([{ albumId: 'a', have: 50, total: 100, teamHave: 20 }])
    // started2 + m25(5)+m50(5)=10 => 12 ; +0.1*50=5 =>17 ; derby +0.5*0.1*20=1 =>18
    expect(s).toBe(18)
  })
})

describe('scoreCollezionistaSeasonal (delta dal baseline mese)', () => {
  it('nessun progresso nel mese => 0', () => {
    const s = scoreCollezionistaSeasonal([{ albumId: 'a', have: 50, total: 100, teamHave: 0, baselineHave: 50 }])
    expect(s).toBe(0)
  })
  it('album iniziato nel mese (baseline 0) => started + soglie superate nel mese + 0.1*delta', () => {
    const s = scoreCollezionistaSeasonal([{ albumId: 'a', have: 30, total: 100, teamHave: 0, baselineHave: 0 }])
    // started2 + m25(5) + 0.1*30(3) = 10
    expect(s).toBe(10)
  })
  it('completato nel mese (baseline 60) => complete50 + soglia75 + 0.1*40', () => {
    const s = scoreCollezionistaSeasonal([{ albumId: 'a', have: 100, total: 100, teamHave: 0, baselineHave: 60 }])
    // baseline pct 60 => 75%(5) e 100%(complete 50) crossate ; +0.1*(100-60)=4 => 59
    expect(s).toBe(59)
  })
})

describe('scoreScambista', () => {
  it('conta scambi, partner distinti, inviti, amicizie, giorni, profilo', () => {
    const s = scoreScambista({
      trades: [{ partner: 'x', at: 1 }, { partner: 'x', at: 2 }, { partner: 'y', at: 3 }],
      invites: [{ at: 1 }, { at: 2 }],
      friendshipsAt: [1, 2, 3],
      activeDays: ['2026-07-01', '2026-07-02'],
      profileComplete: true,
    })
    // scambi 3*5=15 ; partner distinti {x,y}=2*3=6 ; inviti 2*20=40 ; amic 3*1=3 ; giorni 2*1=2 ; profilo 5
    // = 15+6+40+3+2+5 = 71
    expect(s).toBe(71)
  })
  it('profilo incompleto non dà i 5 punti', () => {
    const s = scoreScambista({ trades: [], invites: [], friendshipsAt: [], activeDays: [], profileComplete: false })
    expect(s).toBe(0)
  })
})

describe('computeAxes', () => {
  it('totale = collezionista + scambista', () => {
    const a = computeAxes({
      albums: [{ albumId: 'a', have: 100, total: 100, teamHave: 0 }],
      trades: [], invites: [], friendshipsAt: [], activeDays: [], profileComplete: false,
    })
    expect(a.collezionista).toBe(77)
    expect(a.scambista).toBe(0)
    expect(a.totale).toBe(77)
  })
  it('sinceMs filtra gli eventi al mese', () => {
    const a = computeAxes({
      albums: [],
      trades: [{ partner: 'x', at: 100 }, { partner: 'y', at: 5000 }],
      invites: [{ at: 100 }, { at: 5000 }],
      friendshipsAt: [100, 5000],
      activeDays: ['2026-06-30', '2026-07-01'],
      profileComplete: false,
    }, 1000)
    // solo eventi con at>=1000: 1 scambio(5)+1 partner(3)+1 invito(20)+1 amic(1) = 29
    // activeDays con sinceMs: filtra per data >= mese? qui contiamo tutti i giorni passati => vedi impl
    expect(a.scambista).toBeGreaterThanOrEqual(29)
  })
})
```

- [ ] **Step 2: Esegui i test → falliscono**

Run: `cd /Users/alessandrogelo/Desktop/FiguBook/functions && npx vitest run src/albo/scoring.test.ts`
Expected: FAIL ("Cannot find module './scoring.js'").

- [ ] **Step 3: Implementa `scoring.ts`**

```ts
// functions/src/albo/scoring.ts
import { PT } from './pointValues.js'

export interface AlbumInput { albumId: string; have: number; total: number; teamHave: number; baselineHave?: number }
export interface TradeInput { partner: string; at: number }
export interface ScambistaInput {
  trades: TradeInput[]
  invites: { at: number }[]
  friendshipsAt: number[]
  activeDays: string[]
  profileComplete: boolean
}
export interface ScoringInput extends ScambistaInput { albums: AlbumInput[] }
export interface Axes { collezionista: number; scambista: number; totale: number }

const round1 = (n: number): number => Math.round(n * 10) / 10

export function scoreCollezionista(albums: AlbumInput[]): number {
  let pts = 0
  for (const a of albums) {
    if (a.have <= 0 || a.total <= 0) continue
    pts += PT.albumStarted
    const pct = Math.min(100, (a.have / a.total) * 100)
    if (pct >= 25) pts += PT.milestone
    if (pct >= 50) pts += PT.milestone
    if (pct >= 75) pts += PT.milestone
    if (a.have >= a.total) pts += PT.albumComplete
    pts += PT.perSticker * a.have
    pts += PT.derbyBonusFactor * PT.perSticker * a.teamHave
  }
  return round1(pts)
}

const pctOf = (have: number, total: number): number => (total > 0 ? Math.min(100, (have / total) * 100) : 0)

// Punti Collezionista guadagnati NEL MESE: delta figurine + soglie/completamento CROSSATE nel mese.
export function scoreCollezionistaSeasonal(albums: AlbumInput[]): number {
  let pts = 0
  for (const a of albums) {
    const base = a.baselineHave ?? 0
    if (a.total <= 0) continue
    const delta = Math.max(0, a.have - base)
    if (delta === 0 && !(base === 0 && a.have === 0)) {
      // nessun progresso: salta (ma se anche il baseline era >0 e nulla è cambiato, 0)
    }
    if (base === 0 && a.have > 0) pts += PT.albumStarted
    const basePct = pctOf(base, a.total)
    const curPct = pctOf(a.have, a.total)
    for (const thr of [25, 50, 75]) if (basePct < thr && curPct >= thr) pts += PT.milestone
    if (base < a.total && a.have >= a.total) pts += PT.albumComplete
    pts += PT.perSticker * delta
    pts += PT.derbyBonusFactor * PT.perSticker * a.teamHave // derby v1 disattivato (teamHave=0)
  }
  return round1(pts)
}

export function scoreScambista(i: ScambistaInput): number {
  const distinctPartners = new Set(i.trades.map((t) => t.partner)).size
  let pts = 0
  pts += PT.tradeCompleted * i.trades.length
  pts += PT.newPartner * distinctPartners
  pts += PT.invite * i.invites.length
  pts += PT.friendship * i.friendshipsAt.length
  pts += PT.activeDay * i.activeDays.length
  if (i.profileComplete) pts += PT.profileComplete
  return round1(pts)
}

// sinceMs: se presente, considera solo eventi con at>=sinceMs e giorni con ISO>=mese.
export function computeAxes(input: ScoringInput, sinceMs?: number): Axes {
  const sinceIso = sinceMs !== undefined ? isoOf(sinceMs) : undefined
  const trades = sinceMs === undefined ? input.trades : input.trades.filter((t) => t.at >= sinceMs)
  const invites = sinceMs === undefined ? input.invites : input.invites.filter((x) => x.at >= sinceMs)
  const friendshipsAt = sinceMs === undefined ? input.friendshipsAt : input.friendshipsAt.filter((a) => a >= sinceMs)
  const activeDays = sinceIso === undefined ? input.activeDays : input.activeDays.filter((d) => d >= sinceIso)
  const collezionista = sinceMs === undefined ? scoreCollezionista(input.albums) : scoreCollezionistaSeasonal(input.albums)
  const scambista = scoreScambista({ trades, invites, friendshipsAt, activeDays, profileComplete: input.profileComplete })
  return { collezionista, scambista, totale: round1(collezionista + scambista) }
}

function isoOf(ms: number): string {
  const d = new Date(ms)
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${d.getUTCFullYear()}-${m}-${day}`
}
```

- [ ] **Step 4: Esegui i test → passano**

Run: `cd /Users/alessandrogelo/Desktop/FiguBook/functions && npx vitest run src/albo/scoring.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add functions/src/albo/scoring.ts functions/src/albo/scoring.test.ts
git commit -m "feat(albo): pure scoring module (two axes + seasonal) with tests"
```

---

## Task 3: Logica rank pura (Functions)

**Files:**
- Create: `functions/src/albo/rank.ts`
- Test: `functions/src/albo/rank.test.ts`

- [ ] **Step 1: Scrivi i test (falliscono)**

```ts
// functions/src/albo/rank.test.ts
import { describe, it, expect } from 'vitest'
import { rankByAxis, type ScoreRow } from './rank.js'

const rows: ScoreRow[] = [
  { uid: 'a', totale: 10, collezionista: 4, scambista: 6 },
  { uid: 'b', totale: 30, collezionista: 30, scambista: 0 },
  { uid: 'c', totale: 20, collezionista: 5, scambista: 15 },
] as ScoreRow[]

describe('rankByAxis', () => {
  it('ordina desc per totale e assegna rank 1-based', () => {
    const r = rankByAxis(rows, 'totale', 10)
    expect(r.map((x) => x.uid)).toEqual(['b', 'c', 'a'])
    expect(r.map((x) => x.rank)).toEqual([1, 2, 3])
  })
  it('ordina per asse scambista', () => {
    const r = rankByAxis(rows, 'scambista', 10)
    expect(r.map((x) => x.uid)).toEqual(['c', 'a', 'b'])
  })
  it('taglia a limit', () => {
    expect(rankByAxis(rows, 'totale', 2).length).toBe(2)
  })
})
```

- [ ] **Step 2: Esegui → FAIL**

Run: `cd /Users/alessandrogelo/Desktop/FiguBook/functions && npx vitest run src/albo/rank.test.ts`
Expected: FAIL (modulo mancante).

- [ ] **Step 3: Implementa `rank.ts`**

```ts
// functions/src/albo/rank.ts
export type Axis = 'totale' | 'collezionista' | 'scambista'

export interface ScoreRow {
  uid: string
  username?: string
  avatarId?: string
  favTeam?: string
  citta?: string
  totale: number
  collezionista: number
  scambista: number
}
export interface RankedRow extends ScoreRow { rank: number; value: number }

export function rankByAxis(rows: ScoreRow[], axis: Axis, limit: number): RankedRow[] {
  return [...rows]
    .map((r) => ({ ...r, value: r[axis] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map((r, i) => ({ ...r, rank: i + 1 }))
}
```

- [ ] **Step 4: Esegui → PASS**

Run: `cd /Users/alessandrogelo/Desktop/FiguBook/functions && npx vitest run src/albo/rank.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add functions/src/albo/rank.ts functions/src/albo/rank.test.ts
git commit -m "feat(albo): pure rank/sort module with tests"
```

---

## Task 4: Raccolta input per-utente (Functions)

Legge i dati grezzi di un uid da Firestore e li trasforma in `ScoringInput`. Isolato per testarlo con un `Firestore` finto (pattern `nearbyCollectors.test.ts`).

**Files:**
- Create: `functions/src/albo/collect.ts`
- Test: `functions/src/albo/collect.test.ts`

- [ ] **Step 1: Scrivi i test (falliscono)**

```ts
// functions/src/albo/collect.test.ts
import { describe, it, expect } from 'vitest'
import { tradesFromProposals, albumsFromDocs, baselineHaveOf } from './collect.js'

describe('tradesFromProposals', () => {
  it('tiene solo completed dove uid è participant, mappa partner+at', () => {
    const docs = [
      { participants: ['me', 'x'], status: 'completed', updatedAt: 5 },
      { participants: ['me', 'y'], status: 'pending', updatedAt: 6 },
      { participants: ['a', 'b'], status: 'completed', updatedAt: 7 },
    ]
    const t = tradesFromProposals(docs as any, 'me')
    expect(t).toEqual([{ partner: 'x', at: 5 }])
  })
})

describe('albumsFromDocs', () => {
  it('conta have dallo schema states e prende total dal catalogo', () => {
    const docs = [{ id: 'calb-25-26', states: { '1': 'have', '2': 'double', '3': 'have' }, counts: {} }]
    const a = albumsFromDocs(docs as any, () => 440, () => 0)
    expect(a[0].have).toBe(3)
    expect(a[0].total).toBe(440)
  })
})

describe('baselineHaveOf', () => {
  it('prende gli have dallo snapshot più vecchio del mese', () => {
    const docs = [
      { id: '2026-06-30', albums: { a: { have: 5 } } },
      { id: '2026-07-03', albums: { a: { have: 20 }, b: { have: 4 } } },
      { id: '2026-07-10', albums: { a: { have: 40 } } },
    ]
    expect(baselineHaveOf(docs as any, '2026-07-01')).toEqual({ a: 20, b: 4 })
  })
  it('nessuno snapshot nel mese => mappa vuota', () => {
    expect(baselineHaveOf([{ id: '2026-06-30', albums: { a: { have: 5 } } }] as any, '2026-07-01')).toEqual({})
  })
})
```

- [ ] **Step 2: Esegui → FAIL**

Run: `cd /Users/alessandrogelo/Desktop/FiguBook/functions && npx vitest run src/albo/collect.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementa `collect.ts`**

```ts
// functions/src/albo/collect.ts
import type { Firestore } from 'firebase-admin/firestore'
import type { AlbumInput, ScoringInput } from './scoring.js'
import { totalOf } from './albumTotals.js'

interface ProposalDoc { participants: string[]; status: string; updatedAt: number }
interface AlbumDocRaw { id: string; states: Record<string, string>; counts: Record<string, number> }

export function tradesFromProposals(docs: ProposalDoc[], uid: string): { partner: string; at: number }[] {
  return docs
    .filter((d) => d.status === 'completed' && d.participants.includes(uid))
    .map((d) => ({ partner: d.participants.find((p) => p !== uid) ?? uid, at: d.updatedAt ?? 0 }))
}

// teamHaveOf(albumId, states) => figurine possedute nelle sezioni della squadra del cuore.
export function albumsFromDocs(
  docs: AlbumDocRaw[],
  totalFn: (id: string) => number,
  teamHaveFn: (id: string, states: Record<string, string>) => number,
): AlbumInput[] {
  return docs.map((d) => {
    let have = 0
    for (const code of Object.keys(d.states || {})) {
      const s = d.states[code]
      if (s === 'have' || s === 'double') have++
    }
    return { albumId: d.id, have, total: totalFn(d.id), teamHave: teamHaveFn(d.id, d.states || {}) }
  })
}

// Legge tutti i dati grezzi di un utente e costruisce ScoringInput.
// profileComplete e favTeam arrivano dal profilo; activeDays dagli snapshot stats.
// Estrae la mappa baselineHave (albumId -> have) dallo snapshot stats più vecchio del mese corrente.
// Lo snapshot ha campo `albums: { [albumId]: { have, doubles } }`. Se nessuno snapshot nel mese, mappa vuota.
export function baselineHaveOf(
  statsDocs: { id: string; albums?: Record<string, { have: number }> }[],
  monthStartIso: string,
): Record<string, number> {
  const inMonth = statsDocs.filter((d) => d.id >= monthStartIso).sort((a, b) => a.id.localeCompare(b.id))
  const first = inMonth[0]
  if (!first?.albums) return {}
  const out: Record<string, number> = {}
  for (const [id, v] of Object.entries(first.albums)) out[id] = v.have ?? 0
  return out
}

export async function collectScoringInput(
  db: Firestore,
  uid: string,
  opts: { favTeam?: string; profileComplete: boolean; monthStartIso: string },
): Promise<ScoringInput> {
  const [albumsSnap, propsSnap, invitesSnap, friendsSnap, statsSnap] = await Promise.all([
    db.collection('users').doc(uid).collection('albums').get(),
    db.collection('proposals').where('participants', 'array-contains', uid).get(),
    db.collection('invites').where('inviterUid', '==', uid).get(),
    db.collection('friendships').where('users', 'array-contains', uid).get(),
    db.collection('users').doc(uid).collection('stats').get(),
  ])

  const statsDocs = statsSnap.docs.map((d) => ({ id: d.id, albums: d.data().albums as Record<string, { have: number }> | undefined }))
  const baseline = baselineHaveOf(statsDocs, opts.monthStartIso)

  const albumDocs: AlbumDocRaw[] = albumsSnap.docs
    .filter((d) => d.id !== '_my-albums')
    .map((d) => ({ id: d.id, states: d.data().states || {}, counts: d.data().counts || {} }))
  const albums = albumsFromDocs(albumDocs, totalOf, () => 0) // teamHave v1: 0 (derby follow-up, Task 4b)
    .map((a) => ({ ...a, baselineHave: baseline[a.albumId] ?? 0 }))

  const trades = tradesFromProposals(
    propsSnap.docs.map((d) => d.data() as ProposalDoc), uid,
  )
  const invites = invitesSnap.docs.map((d) => ({ at: (d.data().at as number) ?? 0 }))
  const friendshipsAt = friendsSnap.docs.map((d) => (d.data().createdAt as number) ?? 0)
  const activeDays = statsDocs.map((d) => d.id) // doc id = ISO giorno

  return { albums, trades, invites, friendshipsAt, activeDays, profileComplete: opts.profileComplete }
}
```

> **Task 4b (derby, nota):** in v1 `teamHave` è 0 (derby disattivato) finché non si porta lato functions la logica sezioni-squadra (`teamProgress`/`teamIdentity` dell'app). Il derby è un **enhancement**: attivarlo è un task separato che duplica `canonicalTeamId` + indice sezioni nelle functions. Non blocca v1. Segnare come follow-up nel roadmap memory.

- [ ] **Step 4: Esegui → PASS**

Run: `cd /Users/alessandrogelo/Desktop/FiguBook/functions && npx vitest run src/albo/collect.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add functions/src/albo/collect.ts functions/src/albo/collect.test.ts
git commit -m "feat(albo): per-user scoring input collection from Firestore"
```

---

## Task 5: Callable `leaderboard` (Functions)

**Files:**
- Create: `functions/src/leaderboard.ts`
- Test: `functions/src/leaderboard.test.ts`
- Modify: `functions/src/index.ts`

Comportamento:
1. Autenticazione richiesta.
2. Ricalcola lo score del chiamante (all-time + stagione) e scrive `scores/{me}`.
3. Risolve l'insieme scope: `nazionale` (query `scores` ordinati), `citta`/`squadra` (query `scores` per campo), `amici` (uid amici del chiamante).
4. Per scope locali, ricalcola live i membri (piccoli insiemi) prima di ordinare; per nazionale usa gli `scores` salvati.
5. Ordina con `rankByAxis`, ritorna `{ rows, me, hasMore }`.

`season = 'YYYY-MM'` calcolato dal timestamp corrente. `sinceMs` = inizio mese UTC.

- [ ] **Step 1: Scrivi i test della parte pura di supporto (falliscono)**

```ts
// functions/src/leaderboard.test.ts
import { describe, it, expect } from 'vitest'
import { seasonOf, monthStartMs, scopeQueryField } from './leaderboard.js'

describe('seasonOf / monthStartMs', () => {
  it('season = YYYY-MM in UTC', () => {
    expect(seasonOf(Date.UTC(2026, 6, 15))).toBe('2026-07')
  })
  it('monthStartMs = primo istante del mese UTC', () => {
    expect(monthStartMs(Date.UTC(2026, 6, 15, 12))).toBe(Date.UTC(2026, 6, 1))
  })
})

describe('scopeQueryField', () => {
  it('mappa scope a campo scores', () => {
    expect(scopeQueryField('citta')).toBe('citta')
    expect(scopeQueryField('squadra')).toBe('favTeam')
    expect(scopeQueryField('nazionale')).toBeNull()
    expect(scopeQueryField('amici')).toBeNull()
  })
})
```

- [ ] **Step 2: Esegui → FAIL**

Run: `cd /Users/alessandrogelo/Desktop/FiguBook/functions && npx vitest run src/leaderboard.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementa `leaderboard.ts`**

```ts
// functions/src/leaderboard.ts
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { computeAxes } from './albo/scoring.js'
import { collectScoringInput } from './albo/collect.js'
import { rankByAxis, type Axis, type ScoreRow } from './albo/rank.js'

export type Scope = 'nazionale' | 'citta' | 'squadra' | 'amici'

export function seasonOf(ms: number): string {
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
export function monthStartMs(ms: number): number {
  const d = new Date(ms)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)
}
export function scopeQueryField(scope: Scope): 'citta' | 'favTeam' | null {
  if (scope === 'citta') return 'citta'
  if (scope === 'squadra') return 'favTeam'
  return null
}

interface PublicMeta { username?: string; avatarId?: string; favTeam?: string; citta?: string; isPublic?: boolean }

async function publicMetaOf(db: Firestore, uid: string): Promise<PublicMeta> {
  const snap = await db.collection('publicProfiles').doc(uid).get()
  return snap.exists ? (snap.data() as PublicMeta) : {}
}
async function profileOf(db: Firestore, uid: string): Promise<{ favTeam?: string; profileComplete: boolean }> {
  const snap = await db.collection('users').doc(uid).get()
  const p = snap.exists ? snap.data()! : {}
  const profileComplete = Boolean(p.citta && p.cap && p.favTeam && p.avatarId)
  return { favTeam: p.favTeam as string | undefined, profileComplete }
}

// Ricalcola e persiste scores/{uid}; ritorna la ScoreRow (stagione corrente).
export async function recomputeAndStore(db: Firestore, uid: string, now: number): Promise<ScoreRow> {
  const [meta, prof] = await Promise.all([publicMetaOf(db, uid), profileOf(db, uid)])
  const startMs = monthStartMs(now)
  const monthStartIso = new Date(startMs).toISOString().slice(0, 10)
  const input = await collectScoringInput(db, uid, { favTeam: prof.favTeam, profileComplete: prof.profileComplete, monthStartIso })
  const season = computeAxes(input, startMs)
  const allTime = computeAxes(input)
  const row: ScoreRow = {
    uid, username: meta.username, avatarId: meta.avatarId, favTeam: meta.favTeam, citta: meta.citta,
    totale: season.totale, collezionista: season.collezionista, scambista: season.scambista,
  }
  await db.collection('scores').doc(uid).set({
    ...row,
    isPublic: meta.isPublic ?? false,
    collezionistaAllTime: allTime.collezionista,
    scambistaAllTime: allTime.scambista,
    totaleAllTime: allTime.totale,
    season: seasonOf(now),
    updatedAt: now,
  }, { merge: true })
  return row
}

async function scopeMemberUids(db: Firestore, scope: Scope, me: ScoreRow, meUid: string): Promise<string[] | null> {
  if (scope === 'nazionale') return null // usa scores salvati
  if (scope === 'amici') {
    const snap = await db.collection('friendships').where('users', 'array-contains', meUid).get()
    const uids = new Set<string>()
    snap.docs.forEach((d) => (d.data().users as string[]).forEach((u) => u !== meUid && uids.add(u)))
    uids.add(meUid)
    return [...uids]
  }
  const field = scopeQueryField(scope)!
  const value = field === 'citta' ? me.citta : me.favTeam
  if (!value) return [meUid]
  const snap = await db.collection('scores').where(field, '==', value).where('isPublic', '==', true).limit(200).get()
  const uids = new Set<string>(snap.docs.map((d) => d.id))
  uids.add(meUid)
  return [...uids]
}

export const leaderboard = onCall({ region: 'europe-west1' }, async (req) => {
  const uid = req.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Login richiesto.')
  const now = Date.now()
  const axis: Axis = (req.data?.axis as Axis) ?? 'totale'
  const scope: Scope = (req.data?.scope as Scope) ?? 'nazionale'
  const limit = Math.min(50, Math.max(3, Number(req.data?.limit ?? 20)))
  const db = getFirestore()

  const meRow = await recomputeAndStore(db, uid, now)

  let rows: ScoreRow[]
  const members = await scopeMemberUids(db, scope, meRow, uid)
  if (members === null) {
    // nazionale: scores salvati, pubblici, ordinati per asse
    const snap = await db.collection('scores').where('isPublic', '==', true).orderBy(axis, 'desc').limit(limit + 1).get()
    rows = snap.docs.map((d) => d.data() as ScoreRow)
  } else {
    // scope locale: ricalcola live i membri (esclusi già-freschi = solo il chiamante)
    const others = members.filter((u) => u !== uid)
    const fresh = await Promise.all(others.map((u) => recomputeAndStore(db, u, now)))
    rows = [meRow, ...fresh]
  }

  const ranked = rankByAxis(rows, axis, limit)
  const meRanked = ranked.find((r) => r.uid === uid)
    ?? { ...meRow, value: meRow[axis], rank: rankByAxis(rows, axis, rows.length).findIndex((r) => r.uid === uid) + 1 }
  return { rows: ranked, me: meRanked, hasMore: rows.length > limit, season: seasonOf(now) }
})
```

- [ ] **Step 4: Esegui → PASS**

Run: `cd /Users/alessandrogelo/Desktop/FiguBook/functions && npx vitest run src/leaderboard.test.ts`
Expected: PASS.

- [ ] **Step 5: Esporta in `index.ts`**

In `functions/src/index.ts`, dopo la riga `export { nearbyCollectors } from './nearbyCollectors.js'`, aggiungi:

```ts
export { leaderboard } from './leaderboard.js'
```

- [ ] **Step 6: Build + tutti i test functions**

Run: `cd /Users/alessandrogelo/Desktop/FiguBook/functions && npm run build && npx vitest run`
Expected: build exit 0; tutti i test PASS.

- [ ] **Step 7: Commit**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add functions/src/leaderboard.ts functions/src/leaderboard.test.ts functions/src/index.ts
git commit -m "feat(albo): leaderboard callable (recompute + scope resolve + rank)"
```

---

## Task 6: Regole e indici Firestore

**Files:**
- Modify: `firestore.rules`
- Modify: `firestore.indexes.json`

- [ ] **Step 1: Aggiungi regole `scores` (lettura chiusa al client, scrittura solo admin)**

In `firestore.rules`, dentro `match /databases/{database}/documents {`, aggiungi:

```
match /scores/{uid} {
  allow read: if false;   // solo la callable leaderboard (admin) legge/scrive
  allow write: if false;
}
```

- [ ] **Step 2: Aggiungi indici**

In `firestore.indexes.json`, nell'array `indexes`, aggiungi tre indici compositi per `scores`:

```json
{ "collectionGroup": "scores", "queryScope": "COLLECTION", "fields": [
  { "fieldPath": "isPublic", "order": "ASCENDING" }, { "fieldPath": "totale", "order": "DESCENDING" } ] },
{ "collectionGroup": "scores", "queryScope": "COLLECTION", "fields": [
  { "fieldPath": "isPublic", "order": "ASCENDING" }, { "fieldPath": "collezionista", "order": "DESCENDING" } ] },
{ "collectionGroup": "scores", "queryScope": "COLLECTION", "fields": [
  { "fieldPath": "isPublic", "order": "ASCENDING" }, { "fieldPath": "scambista", "order": "DESCENDING" } ] },
{ "collectionGroup": "scores", "queryScope": "COLLECTION", "fields": [
  { "fieldPath": "citta", "order": "ASCENDING" }, { "fieldPath": "isPublic", "order": "ASCENDING" } ] },
{ "collectionGroup": "scores", "queryScope": "COLLECTION", "fields": [
  { "fieldPath": "favTeam", "order": "ASCENDING" }, { "fieldPath": "isPublic", "order": "ASCENDING" } ] }
```

- [ ] **Step 3: Commit** (deploy avviene con la feature completa, Task 12)

```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add firestore.rules firestore.indexes.json
git commit -m "feat(albo): firestore rules + indexes for scores collection"
```

---

## Task 7: Wrapper client callable

**Files:**
- Create: `figubook-app/src/lib/functions/leaderboard.ts`

- [ ] **Step 1: Guarda un wrapper esistente per il pattern**

Run: `ls /Users/alessandrogelo/Desktop/FiguBook/figubook-app/src/lib/functions && sed -n '1,40p' /Users/alessandrogelo/Desktop/FiguBook/figubook-app/src/lib/functions/*.ts | head -40`
Expected: vedere come si costruisce `httpsCallable` (region europe-west1) nel progetto.

- [ ] **Step 2: Implementa il wrapper** (adatta l'import di `functions`/region al pattern trovato)

```ts
// figubook-app/src/lib/functions/leaderboard.ts
import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '@/lib/firebase'

export type Scope = 'nazionale' | 'citta' | 'squadra' | 'amici'
export type Axis = 'totale' | 'collezionista' | 'scambista'

export interface RankedRow {
  uid: string; username?: string; avatarId?: string; favTeam?: string; citta?: string
  totale: number; collezionista: number; scambista: number; rank: number; value: number
}
export interface LeaderboardResult { rows: RankedRow[]; me: RankedRow; hasMore: boolean; season: string }

export async function fetchLeaderboard(scope: Scope, axis: Axis, limit = 20): Promise<LeaderboardResult> {
  const fns = getFunctions(app, 'europe-west1')
  const call = httpsCallable<{ scope: Scope; axis: Axis; limit: number }, LeaderboardResult>(fns, 'leaderboard')
  const res = await call({ scope, axis, limit })
  return res.data
}
```

- [ ] **Step 3: Typecheck**

Run: `cd /Users/alessandrogelo/Desktop/FiguBook/figubook-app && npx tsc -b --noEmit`
Expected: exit 0 (correggere l'import `app`/`firebase` se il progetto esporta diversamente — verificare `src/lib/firebase.ts`).

- [ ] **Step 4: Commit**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add figubook-app/src/lib/functions/leaderboard.ts
git commit -m "feat(albo): client wrapper for leaderboard callable"
```

---

## Task 8: Hook `useLeaderboard`

**Files:**
- Create: `figubook-app/src/hooks/useLeaderboard.ts`

- [ ] **Step 1: Implementa l'hook**

```ts
// figubook-app/src/hooks/useLeaderboard.ts
import { useEffect, useState } from 'react'
import { fetchLeaderboard, type Scope, type Axis, type LeaderboardResult } from '@/lib/functions/leaderboard'
import { useAuth } from '@/hooks/useAuth'

export function useLeaderboard(scope: Scope, axis: Axis) {
  const { user } = useAuth()
  const [data, setData] = useState<LeaderboardResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!user) return
    let alive = true
    setLoading(true)
    setError(false)
    fetchLeaderboard(scope, axis)
      .then((r) => { if (alive) setData(r) })
      .catch((e) => { console.error('leaderboard', e); if (alive) setError(true) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [user, scope, axis])

  return { data, loading, error }
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/alessandrogelo/Desktop/FiguBook/figubook-app && npx tsc -b --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add figubook-app/src/hooks/useLeaderboard.ts
git commit -m "feat(albo): useLeaderboard hook"
```

---

## Task 9: Sub-navbar Community + estrazione tab Amici

Sposta il contenuto attuale di `Community.tsx` in `pages/community/Amici.tsx`; `Community.tsx` diventa shell con tabs + `<Outlet/>`; aggiunge route figlie.

**Files:**
- Create: `figubook-app/src/components/community/CommunityTabs.tsx`
- Create: `figubook-app/src/pages/community/Amici.tsx`
- Create: `figubook-app/src/pages/community/Gruppi.tsx`
- Modify: `figubook-app/src/pages/Community.tsx`
- Modify: `figubook-app/src/App.tsx`

- [ ] **Step 1: Crea `CommunityTabs.tsx`**

```tsx
// figubook-app/src/components/community/CommunityTabs.tsx
import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/community', label: 'Amici', end: true },
  { to: '/community/gruppi', label: 'Gruppi', end: false },
  { to: '/community/albo-doro', label: "Albo d'Oro", end: false },
]

export function CommunityTabs() {
  return (
    <div className="mt-6 flex gap-2 overflow-x-auto">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) =>
            `whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              isActive ? 'bg-lime text-lime-ink' : 'border border-white/[0.1] text-ink-2 hover:border-white/25 hover:text-ink'
            }`
          }
        >
          {t.label}
        </NavLink>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Crea `pages/community/Amici.tsx`** — sposta qui il corpo attuale di `Community.tsx`

Copia l'intero contenuto attuale di `figubook-app/src/pages/Community.tsx` (dal file oggi in repo) in `pages/community/Amici.tsx`, rinominando `export default function Community()` in `export default function Amici()`. Correggi i path relativi degli import (da `@/...` restano invariati). Rimuovi il wrapper `<div className="mx-auto w-full max-w-[88rem]">` esterno e l'header "Il mondo di FiguBook" + bottone invito: quelli si spostano nella shell (Step 4). Mantieni: richieste, ricerca, blocco amici/collezionisti.

- [ ] **Step 3: Crea `pages/community/Gruppi.tsx`** (placeholder)

```tsx
// figubook-app/src/pages/community/Gruppi.tsx
import { FadeIn } from '@/components/home/FadeIn'

export default function Gruppi() {
  return (
    <FadeIn>
      <div className="mt-8 max-w-2xl rounded-2xl border border-white/[0.08] bg-surface/40 p-6">
        <p className="type-body text-ink">Gruppi in arrivo.</p>
        <p className="mt-1 text-sm text-ink-2">Presto potrai creare club, unirti a gruppi di collezionisti e sfidarti in classifiche di gruppo.</p>
      </div>
    </FadeIn>
  )
}
```

- [ ] **Step 4: Riscrivi `Community.tsx` come shell**

```tsx
// figubook-app/src/pages/Community.tsx
import { Outlet } from 'react-router-dom'
import { FadeIn } from '@/components/home/FadeIn'
import { CommunityTabs } from '@/components/community/CommunityTabs'
import { useProfile } from '@/hooks/useProfile'
import { useInviteCount } from '@/hooks/useInviteCount'
import { useState } from 'react'

export default function Community() {
  const { profile } = useProfile()
  const inviteCount = useInviteCount()
  const [copied, setCopied] = useState(false)
  const shareInvite = async () => {
    const uname = profile?.username
    if (!uname) return
    const url = `${window.location.origin}/FiguBook/app/invita/${uname}`
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {}
  }
  return (
    <div className="mx-auto w-full max-w-[88rem]">
      <FadeIn>
        <h1 className="type-h1 text-ink">Il mondo di FiguBook</h1>
        <p className="type-body mt-1.5 text-ink-2">
          {inviteCount > 0 ? `Hai invitato ${inviteCount} ${inviteCount === 1 ? 'amico' : 'amici'}.` : 'Invita i tuoi amici e trova collezionisti vicini.'}
        </p>
        <button
          onClick={shareInvite}
          className="group mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-lime px-5 py-2.5 font-semibold text-lime-ink transition-opacity hover:opacity-90"
        >
          {copied ? 'Link copiato!' : 'Invita un amico'}
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </button>
      </FadeIn>
      <CommunityTabs />
      <Outlet />
    </div>
  )
}
```

> Rimuovi da `Amici.tsx` (Step 2) l'header/CTA invito ora duplicati nella shell.

- [ ] **Step 5: Route figlie in `App.tsx`**

Sostituisci la riga `<Route path="/community" element={<Community />} />` con un route annidato. Aggiungi gli import in cima:

```tsx
import Amici from '@/pages/community/Amici'
import Gruppi from '@/pages/community/Gruppi'
import AlboDoro from '@/pages/community/AlboDoro'
```

E il blocco route:

```tsx
<Route path="/community" element={<Community />}>
  <Route index element={<Amici />} />
  <Route path="gruppi" element={<Gruppi />} />
  <Route path="albo-doro" element={<AlboDoro />} />
</Route>
```

> `AlboDoro` viene creato nel Task 11; per far compilare ora, crea un file stub `pages/community/AlboDoro.tsx` con `export default function AlboDoro(){ return null }` e completalo poi.

- [ ] **Step 6: Typecheck + build**

Run: `cd /Users/alessandrogelo/Desktop/FiguBook/figubook-app && npx tsc -b --noEmit && npm run build`
Expected: exit 0.

- [ ] **Step 7: Verifica live (browser)** — apri `/community`, vedi tabs; Amici mostra il contenuto di prima; Gruppi mostra placeholder; naviga tra le tab (URL cambia, back funziona).

- [ ] **Step 8: Commit**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add figubook-app/src/components/community/CommunityTabs.tsx figubook-app/src/pages/community/ figubook-app/src/pages/Community.tsx figubook-app/src/App.tsx
git commit -m "feat(community): sub-navbar tabs (Amici/Gruppi/Albo d'Oro) + route split"
```

---

## Task 10: Componenti UI classifica (presentazionali)

**Files:**
- Create: `figubook-app/src/components/community/ScoreTiles.tsx`
- Create: `figubook-app/src/components/community/LeaderboardRow.tsx`
- Create: `figubook-app/src/components/community/LeaderboardPodium.tsx`

- [ ] **Step 1: `ScoreTiles.tsx`** (header status, riadatta stat-tiles Doppy nel tema)

```tsx
// figubook-app/src/components/community/ScoreTiles.tsx
import { Trophy, Medal } from 'lucide-react'

export function ScoreTiles({ punti, posizione }: { punti: number; posizione: number }) {
  const tiles = [
    { icon: Trophy, value: Math.round(punti), label: 'Punti stagione' },
    { icon: Medal, value: `#${posizione}`, label: 'Posizione' },
  ]
  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      {tiles.map((t, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-surface/40 px-4 py-4">
          <t.icon className="h-8 w-8 shrink-0 text-lime" />
          <div className="min-w-0">
            <p className="text-2xl font-bold text-ink">{t.value}</p>
            <p className="text-sm text-ink-2">{t.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: `LeaderboardRow.tsx`** (riga lista, riusa Avatar + TeamCrest come PersonRow)

```tsx
// figubook-app/src/components/community/LeaderboardRow.tsx
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/Avatar'
import { TeamCrest } from '@/components/TeamCrest'
import { teamById } from '@/lib/teams'
import type { RankedRow } from '@/lib/functions/leaderboard'

export function LeaderboardRow({ r, highlight }: { r: RankedRow; highlight?: boolean }) {
  const team = r.favTeam ? teamById[r.favTeam] : undefined
  const city = r.citta ? r.citta.replace(/\s*\(.*\)$/, '') : ''
  return (
    <Link
      to={`/u/${r.username}`}
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${
        highlight ? 'border-lime/60 bg-lime/[0.06]' : 'border-white/[0.08] bg-surface/40 hover:border-white/20'
      }`}
    >
      <span className="w-6 shrink-0 text-center text-sm font-semibold text-ink-2">{r.rank}</span>
      <Avatar id={r.avatarId} name={r.username ?? ''} className="h-10 w-10 shrink-0 overflow-hidden rounded-full" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-ink">{r.username}</p>
        {city && <p className="truncate text-sm text-ink-2">{city}</p>}
      </div>
      {team && <TeamCrest teamId={team.id} c1={team.c1} c2={team.c2} className="h-6 w-[18px] shrink-0" />}
      <span className="shrink-0 text-sm font-bold text-ink">{Math.round(r.value)}</span>
    </Link>
  )
}
```

- [ ] **Step 3: `LeaderboardPodium.tsx`** (top-3, riferimento Trophy.so riscritto)

```tsx
// figubook-app/src/components/community/LeaderboardPodium.tsx
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/Avatar'
import type { RankedRow } from '@/lib/functions/leaderboard'

const ORDER = [1, 0, 2] // 2° | 1° | 3°
const H = ['h-20', 'h-28', 'h-16']

export function LeaderboardPodium({ top }: { top: RankedRow[] }) {
  const slots = ORDER.map((i) => top[i]).filter(Boolean)
  if (slots.length === 0) return null
  return (
    <div className="mt-4 flex items-end justify-center gap-3">
      {ORDER.map((idx, pos) => {
        const r = top[idx]
        if (!r) return <div key={pos} className="w-24" />
        return (
          <Link key={pos} to={`/u/${r.username}`} className="flex w-24 flex-col items-center">
            <Avatar id={r.avatarId} name={r.username ?? ''} className="mb-2 h-14 w-14 overflow-hidden rounded-full" />
            <p className="mb-1 max-w-full truncate text-center text-sm font-medium text-ink">{r.username}</p>
            <div className={`flex w-full ${H[pos]} flex-col items-center justify-start rounded-t-xl border border-white/[0.08] bg-surface/60 pt-2`}>
              <span className="text-lg font-bold text-lime">#{r.rank}</span>
              <span className="text-sm font-semibold text-ink">{Math.round(r.value)}</span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Typecheck**

Run: `cd /Users/alessandrogelo/Desktop/FiguBook/figubook-app && npx tsc -b --noEmit`
Expected: exit 0. (Se `teamById`/`Avatar`/`TeamCrest` hanno firme diverse, allinea agli import usati in `Community.tsx` attuale — sono gli stessi di `PersonRow`.)

- [ ] **Step 5: Commit**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add figubook-app/src/components/community/ScoreTiles.tsx figubook-app/src/components/community/LeaderboardRow.tsx figubook-app/src/components/community/LeaderboardPodium.tsx
git commit -m "feat(albo): leaderboard UI components (tiles, row, podium)"
```

---

## Task 11: Pagina Albo d'Oro (assemblaggio)

**Files:**
- Modify (da stub): `figubook-app/src/pages/community/AlboDoro.tsx`

- [ ] **Step 1: Implementa la pagina**

```tsx
// figubook-app/src/pages/community/AlboDoro.tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FadeIn } from '@/components/home/FadeIn'
import { useProfile } from '@/hooks/useProfile'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { ScoreTiles } from '@/components/community/ScoreTiles'
import { LeaderboardPodium } from '@/components/community/LeaderboardPodium'
import { LeaderboardRow } from '@/components/community/LeaderboardRow'
import type { Scope, Axis } from '@/lib/functions/leaderboard'

const SCOPES: { key: Scope; label: string }[] = [
  { key: 'nazionale', label: 'Nazionale' },
  { key: 'citta', label: 'Città' },
  { key: 'squadra', label: 'Squadra' },
  { key: 'amici', label: 'Amici' },
]
const AXES: { key: Axis; label: string }[] = [
  { key: 'totale', label: 'Totale' },
  { key: 'collezionista', label: 'Collezionista' },
  { key: 'scambista', label: 'Scambista' },
]

function Pills<T extends string>({ items, active, onPick }: { items: { key: T; label: string }[]; active: T; onPick: (k: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => onPick(it.key)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
            active === it.key ? 'bg-lime text-lime-ink' : 'border border-white/[0.1] text-ink-2 hover:border-white/25 hover:text-ink'
          }`}
        >{it.label}</button>
      ))}
    </div>
  )
}

export default function AlboDoro() {
  const { profile } = useProfile()
  const [scope, setScope] = useState<Scope>('nazionale')
  const [axis, setAxis] = useState<Axis>('totale')
  const { data, loading, error } = useLeaderboard(scope, axis)

  const profileIncomplete = !profile?.citta && !profile?.favTeam

  return (
    <FadeIn>
      <div className="mt-6 max-w-3xl">
        {data?.me && <ScoreTiles punti={data.me.value} posizione={data.me.rank} />}

        <div className="mt-6 space-y-3">
          <Pills items={SCOPES} active={scope} onPick={setScope} />
          <Pills items={AXES} active={axis} onPick={setAxis} />
        </div>

        {data?.season && <p className="mt-4 text-sm text-ink-2">Stagione {data.season}</p>}

        {loading && !data ? (
          <div className="mt-4 space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[62px] animate-pulse rounded-2xl border border-white/[0.06] bg-surface/40" />
            ))}
          </div>
        ) : error ? (
          <p className="mt-4 text-sm text-ink-2">Classifica non disponibile ora. Riprova.</p>
        ) : profileIncomplete && (scope === 'citta' || scope === 'squadra') ? (
          <Link to="/profilo" className="group mt-4 block rounded-2xl border border-white/[0.08] bg-surface/40 p-5 transition-colors hover:border-white/20">
            <p className="type-body text-ink">Completa il tuo profilo</p>
            <p className="mt-1 text-sm text-ink-2">Aggiungi comune e squadra per entrare nelle classifiche di zona e squadra.</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-lime">Vai al profilo →</span>
          </Link>
        ) : data && data.rows.length > 0 ? (
          <>
            <LeaderboardPodium top={data.rows.slice(0, 3)} />
            <div className="mt-4 space-y-2">
              {data.rows.slice(3).map((r) => (
                <LeaderboardRow key={r.uid} r={r} highlight={r.uid === data.me.uid} />
              ))}
            </div>
          </>
        ) : (
          <p className="mt-4 text-sm text-ink-2">Ancora nessuno in classifica qui. Completa album e scambi per comparire.</p>
        )}
      </div>
    </FadeIn>
  )
}
```

- [ ] **Step 2: Typecheck + build**

Run: `cd /Users/alessandrogelo/Desktop/FiguBook/figubook-app && npx tsc -b --noEmit && npm run build`
Expected: exit 0 (solo warning noto INEFFECTIVE_DYNAMIC_IMPORT accettabile).

- [ ] **Step 3: Commit**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add figubook-app/src/pages/community/AlboDoro.tsx
git commit -m "feat(albo): Albo d'Oro page (tiles, filters, podium, rankings)"
```

---

## Task 12: Deploy + verifica live end-to-end

- [ ] **Step 1: Assicura il predeploy build delle functions** — verifica in `firebase.json` che esista l'hook `predeploy: npm run build` per functions (aggiunto in Fase 2). Se manca, aggiungilo.

- [ ] **Step 2: Deploy functions + rules + indici**

Run: `cd /Users/alessandrogelo/Desktop/FiguBook && firebase deploy --only functions:leaderboard,firestore:rules,firestore:indexes`
Expected: deploy OK; l'indice può richiedere qualche minuto per lo stato "Enabled".

- [ ] **Step 3: Verifica log function** (nessun crash tipo Fase 1)

Run: `firebase functions:log --only leaderboard`
Expected: chiamate senza errori `admin.firestore is not a function` / `getFirestore`.

- [ ] **Step 4: Verifica live (browser, loggato)**
  - `/community/albo-doro` carica; stat-tiles mostrano i tuoi punti+posizione.
  - Switch scope Nazionale/Città/Squadra/Amici e asse Totale/Collezionista/Scambista aggiornano la lista.
  - Il tuo score riflette album completati/scambi reali (apri un album, aggiungi figurine, ricarica Albo d'Oro → punti Collezionista salgono).
  - Riga propria evidenziata; podio mostra i top-3.
  - Con un secondo account nello stesso comune/squadra → compaiono entrambi nello scope locale.

- [ ] **Step 5: Full test suite (non regressione)**

Run: `cd /Users/alessandrogelo/Desktop/FiguBook/functions && npx vitest run` — tutti PASS.
Run: `cd /Users/alessandrogelo/Desktop/FiguBook/figubook-app && npx tsc -b --noEmit && npm run build` — exit 0.
Nota: `AlbumList.test.tsx` (3 fail preesistenti) NON è regressione di questo lavoro.

- [ ] **Step 6: Commit finale (se firebase.json toccato) + push**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add -A && git commit -m "chore(albo): deploy config for leaderboard" || true
git push
```

---

## Self-Review — coperture spec

- Sub-navbar Amici·Gruppi·Albo d'Oro → Task 9. ✓
- Punteggio due assi + Totale + valori → Task 1-2. ✓
- Derby ×1.5 → Task 2 (formula) + Task 4b (attivazione teamHave = follow-up; v1 disattivato). ⚠ Documentato come follow-up.
- Stagioni mensili con RESET PIENO (opzione B) → Task 2 (`scoreCollezionistaSeasonal` su delta baseline) + Task 4 (`baselineHaveOf` da snapshot stats inizio mese) + Task 5 (`monthStartMs`/`monthStartIso`). ✓ Sia Collezionista sia Scambista resettano col mese.
- Anti-grinding (partner distinti, no farming) → Task 2 (`distinctPartners`) + modello derivato. ✓
- Classifiche Nazionale/Città/Squadra/Amici → Task 5 (`scopeMemberUids`). ✓
- Freschezza "al secondo" scope locali → Task 5 (recompute live membri). ✓
- Podio + lista + stat-tiles → Task 10-11. ✓
- Privacy `isPublic` fuori classifiche pubbliche → Task 5 (query `isPublic==true`) + Task 6 (rules). ✓
- Ricompense / Gruppi / storico vincitori → fuori v1. ✓

**Reset stagionale (opzione B — scelta dal founder):** entrambi gli assi resettano col mese. Collezionista stagionale = delta dal baseline di inizio mese (`baselineHaveOf` legge lo snapshot `users/{uid}/stats` più vecchio del mese). **Limite noto:** se un utente non ha snapshot stats nel mese corrente (non ha aperto l'app / non ha aggiunto figurine dal 1°), il baseline è vuoto → il suo Collezionista stagionale parte dal completamento corrente (delta 0 finché non aggiunge). Accettabile: gli snapshot si creano automaticamente all'uso (`statsHistory.touchStatsSnapshot`). Lo **storico vincitori stagioni** resta v1.1.
