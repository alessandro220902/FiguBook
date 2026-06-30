# Scambi Fase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Costruire il loop di scambio 1:1 globale di FiguBook: pubblicazione inventario per-album, discovery con match reciproco, composizione manuale della proposta, gestione e conferma bilaterale.

**Architecture:** Indice pubblico per-album (`tradeIndex/{albumId}/users/{uid}`) con doubles/missing derivati dall'album. La pagina Scambi legge solo gli utenti dell'album scelto e calcola il match lato client (logica pura testabile). Le proposte vivono in `proposals/{id}` con conferma bilaterale forzata dalle regole Firestore. Estetica via skill design in coda.

**Tech Stack:** React + TypeScript + Vite, Firebase Firestore (serverless), Tailwind, Vitest, react-router-dom.

**Nota deviazione spec:** il rating/recensioni è Fase 2 → in Fase 1 niente campo `rating` nell'indice né chip `★ 4+`. Chip Fase 1 = `Reciproci` (default on) + `Vicino a me` (città). Il resto segue lo spec `docs/superpowers/specs/2026-06-30-scambi-fase1-design.md`.

**Convenzioni codice esistenti (rispettarle):**
- Alias import `@` → `src` (es. `@/lib/firebase`).
- Commenti in italiano, sintetici.
- Pattern "builder puro testato + wrapper Firestore sottile non testato" (vedi `lib/db/albums.ts`).
- Test: Vitest, file `*.test.ts(x)` accanto al sorgente. Run: `npx vitest run <path>`.
- Notifiche: `addDoc(collection(db,'users',toUid,'notifications'), { fromUid, type, title, icon, href, read:false, at })` (vedi `lib/db/friends.ts`).

---

## File Structure

- Create `src/lib/trade/match.ts` — logica pura: deriva inventario da album, calcola match.
- Create `src/lib/trade/match.test.ts` — test della logica pura.
- Create `src/lib/db/tradeIndex.ts` — pubblica/rimuove/sottoscrive l'indice per-album.
- Create `src/lib/db/tradeIndex.test.ts` — test dei builder puri.
- Create `src/lib/db/trade.ts` — opt-in album scambiabili (`meta/trade`) + sync indice.
- Create `src/lib/db/proposals.ts` — create/subscribe/update proposte + helper transizioni.
- Create `src/lib/db/proposals.test.ts` — test helper transizioni puri.
- Create `src/pages/Scambi.tsx` — discovery (sostituisce il placeholder).
- Create `src/components/trade/AlbumPicker.tsx` — scelta album (card visive).
- Create `src/components/trade/MatchCard.tsx` — card utente match (OFFRI/RICEVI/completi%).
- Create `src/components/trade/FilterChips.tsx` — chip live (Reciproci, Vicino a me).
- Create `src/components/trade/ComponiScambio.tsx` — due liste manuali + invio.
- Create `src/pages/ScambiMiei.tsx` — gestione proposte (tab In arrivo/Inviate).
- Modify `src/App.tsx` — rotta `/scambi/miei`.
- Modify `src/lib/db/albums.ts` — hook di sync indice nel flush (album opted-in).
- Modify `firestore.rules` — regole `tradeIndex`, `proposals`, `meta/trade`.

---

## Task 1: Logica pura del match

**Files:**
- Create: `src/lib/trade/match.ts`
- Test: `src/lib/trade/match.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/trade/match.test.ts
import { describe, it, expect } from 'vitest'
import { deriveInventory, computeMatch } from './match'

describe('deriveInventory', () => {
  it('estrae doubles e missing da states su tutti i codici album', () => {
    const allCodes = ['1', '2', '3', '4']
    const states = { '1': 'have', '2': 'double', '3': 'double' } // 4 mai toccato
    const inv = deriveInventory(allCodes, states)
    expect(inv.doubles.sort()).toEqual(['2', '3'])
    expect(inv.missing).toEqual(['4'])
  })
})

describe('computeMatch', () => {
  it('calcola receive (sue doubles ∩ mie missing) e give (mie doubles ∩ sue missing)', () => {
    const me = { doubles: ['10', '11'], missing: ['20', '21'] }
    const them = { doubles: ['20', '99'], missing: ['10', '88'] }
    const m = computeMatch(me, them, 100)
    expect(m.receive).toEqual(['20'])      // loro hanno 20, a me manca
    expect(m.give).toEqual(['10'])         // io ho 10, a loro manca
    expect(m.receiveCount).toBe(1)
    expect(m.giveCount).toBe(1)
    expect(m.completionPct).toBe(1)        // 1 nuova carta su 100 totali = 1%
  })

  it('reciproco falso se una direzione è vuota', () => {
    const me = { doubles: [], missing: ['20'] }
    const them = { doubles: ['20'], missing: ['77'] }
    const m = computeMatch(me, them, 50)
    expect(m.reciprocal).toBe(false)
    expect(m.receiveCount).toBe(1)
    expect(m.giveCount).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd figubook-app && npx vitest run src/lib/trade/match.test.ts`
Expected: FAIL — `Failed to resolve import './match'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/trade/match.ts
export interface Inventory {
  doubles: string[]
  missing: string[]
}

export interface MatchResult {
  receive: string[]      // codici che ricevo (sue doubles ∩ mie missing)
  give: string[]         // codici che do (mie doubles ∩ sue missing)
  receiveCount: number
  giveCount: number
  reciprocal: boolean    // entrambe le direzioni > 0
  completionPct: number  // % album completato se ricevo tutte le receive
}

// doubles = codici con state 'double'; missing = codici album mai 'have'/'double'.
export function deriveInventory(allCodes: string[], states: Record<string, string>): Inventory {
  const doubles: string[] = []
  const missing: string[] = []
  for (const code of allCodes) {
    const s = states[code]
    if (s === 'double') doubles.push(code)
    if (s !== 'have' && s !== 'double') missing.push(code)
  }
  return { doubles, missing }
}

export function computeMatch(me: Inventory, them: Inventory, albumTotal: number): MatchResult {
  const myMissing = new Set(me.missing)
  const theirMissing = new Set(them.missing)
  const receive = them.doubles.filter((c) => myMissing.has(c))
  const give = me.doubles.filter((c) => theirMissing.has(c))
  const completionPct = albumTotal > 0 ? Math.round((receive.length / albumTotal) * 100) : 0
  return {
    receive,
    give,
    receiveCount: receive.length,
    giveCount: give.length,
    reciprocal: receive.length > 0 && give.length > 0,
    completionPct,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd figubook-app && npx vitest run src/lib/trade/match.test.ts`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git add figubook-app/src/lib/trade/match.ts figubook-app/src/lib/trade/match.test.ts
git commit -m "feat(scambi): logica pura match (deriveInventory + computeMatch)"
```

---

## Task 2: Helper "tutti i codici di un album"

**Files:**
- Create: `src/lib/trade/albumCodes.ts`
- Test: `src/lib/trade/albumCodes.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/trade/albumCodes.test.ts
import { describe, it, expect } from 'vitest'
import { allCodesFromSections } from './albumCodes'

describe('allCodesFromSections', () => {
  it('concatena i codici di tutte le sezioni in ordine', () => {
    const data = {
      sections: [
        { id: 'a', codes: ['1', '2'] },
        { id: 'b', codes: ['3'] },
      ],
    } as any
    expect(allCodesFromSections(data)).toEqual(['1', '2', '3'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd figubook-app && npx vitest run src/lib/trade/albumCodes.test.ts`
Expected: FAIL — import non risolto.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/trade/albumCodes.ts
import type { AlbumData } from '@/data/albums/types'

// Tutti i codici figurina di un album, in ordine di sezione.
export function allCodesFromSections(data: AlbumData): string[] {
  return data.sections.flatMap((s) => s.codes)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd figubook-app && npx vitest run src/lib/trade/albumCodes.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add figubook-app/src/lib/trade/albumCodes.ts figubook-app/src/lib/trade/albumCodes.test.ts
git commit -m "feat(scambi): helper allCodesFromSections"
```

---

## Task 3: Builder doc indice + modulo tradeIndex

**Files:**
- Create: `src/lib/db/tradeIndex.ts`
- Test: `src/lib/db/tradeIndex.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/db/tradeIndex.test.ts
import { describe, it, expect } from 'vitest'
import { buildIndexDoc } from './tradeIndex'

describe('buildIndexDoc', () => {
  it('costruisce il doc indice con doubles/missing/citta/updatedAt', () => {
    const d = buildIndexDoc({ doubles: ['2'], missing: ['4'] }, 'Roma', 123)
    expect(d.doubles).toEqual(['2'])
    expect(d.missing).toEqual(['4'])
    expect(d.citta).toBe('Roma')
    expect(d.updatedAt).toBe(123)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd figubook-app && npx vitest run src/lib/db/tradeIndex.test.ts`
Expected: FAIL — import non risolto.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/db/tradeIndex.ts
import { doc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Inventory } from '@/lib/trade/match'

export interface TradeIndexDoc {
  doubles: string[]
  missing: string[]
  citta: string
  updatedAt: number
}

export interface TradeIndexEntry extends TradeIndexDoc {
  uid: string
}

// Builder puro (testabile).
export function buildIndexDoc(inv: Inventory, citta: string, now: number): TradeIndexDoc {
  return { doubles: inv.doubles, missing: inv.missing, citta, updatedAt: now }
}

function indexRef(albumId: string, uid: string) {
  return doc(db, 'tradeIndex', albumId, 'users', uid)
}

// Pubblica/aggiorna il mio inventario per un album.
export async function publishIndex(
  albumId: string,
  uid: string,
  inv: Inventory,
  citta: string,
): Promise<void> {
  await setDoc(indexRef(albumId, uid), buildIndexDoc(inv, citta, Date.now()))
}

// Rimuove il mio inventario per un album (opt-out).
export async function removeIndex(albumId: string, uid: string): Promise<void> {
  await deleteDoc(indexRef(albumId, uid))
}

// Legge tutti gli utenti che offrono scambi su un album (escluso me).
export async function fetchIndexUsers(albumId: string, meUid: string): Promise<TradeIndexEntry[]> {
  const snap = await getDocs(collection(db, 'tradeIndex', albumId, 'users'))
  return snap.docs
    .filter((d) => d.id !== meUid)
    .map((d) => ({ uid: d.id, ...(d.data() as TradeIndexDoc) }))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd figubook-app && npx vitest run src/lib/db/tradeIndex.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add figubook-app/src/lib/db/tradeIndex.ts figubook-app/src/lib/db/tradeIndex.test.ts
git commit -m "feat(scambi): modulo tradeIndex (publish/remove/fetch)"
```

---

## Task 4: Opt-in album scambiabili (meta/trade) + sync

**Files:**
- Create: `src/lib/db/trade.ts`

- [ ] **Step 1: Write implementation (nessun test: solo wrapper Firestore + composizione)**

```ts
// src/lib/db/trade.ts
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { loadAlbumData } from '@/data/albums'
import { subscribeAlbum } from '@/lib/db/albums'
import { allCodesFromSections } from '@/lib/trade/albumCodes'
import { deriveInventory } from '@/lib/trade/match'
import { publishIndex, removeIndex } from '@/lib/db/tradeIndex'

function tradeMetaRef(uid: string) {
  return doc(db, 'users', uid, 'meta', 'trade')
}

// Sottoscrive gli album resi scambiabili dall'utente.
export function subscribeTradeAlbums(uid: string, cb: (ids: string[]) => void): () => void {
  return onSnapshot(
    tradeMetaRef(uid),
    (snap) => cb((snap.exists() ? (snap.data().tradeAlbums as string[]) : []) ?? []),
    (err) => {
      console.error('trade albums', err)
      cb([])
    },
  )
}

// Attiva/disattiva uno scambio per un album e sincronizza l'indice una tantum.
export async function setTradeAlbum(
  uid: string,
  albumId: string,
  enabled: boolean,
  current: string[],
  citta: string,
): Promise<void> {
  const next = enabled
    ? Array.from(new Set([...current, albumId]))
    : current.filter((a) => a !== albumId)
  await setDoc(tradeMetaRef(uid), { tradeAlbums: next }, { merge: true })
  if (enabled) {
    await syncIndexForAlbum(uid, albumId, citta)
  } else {
    await removeIndex(albumId, uid)
  }
}

// Ricalcola e pubblica l'indice per un album leggendo l'album doc una volta.
export async function syncIndexForAlbum(uid: string, albumId: string, citta: string): Promise<void> {
  const data = await loadAlbumData(albumId)
  if (!data) return
  const allCodes = allCodesFromSections(data)
  await new Promise<void>((resolve) => {
    const unsub = subscribeAlbum(uid, albumId, async (d) => {
      unsub()
      const inv = deriveInventory(allCodes, d.states)
      await publishIndex(albumId, uid, inv, citta)
      resolve()
    })
  })
}
```

- [ ] **Step 2: Typecheck**

Run: `cd figubook-app && npx tsc -b --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add figubook-app/src/lib/db/trade.ts
git commit -m "feat(scambi): opt-in album scambiabili + sync indice"
```

---

## Task 5: Helper transizioni proposta (puro) + modulo proposals

**Files:**
- Create: `src/lib/db/proposals.ts`
- Test: `src/lib/db/proposals.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/db/proposals.test.ts
import { describe, it, expect } from 'vitest'
import { addConfirmation, isCompleted } from './proposals'

describe('addConfirmation', () => {
  it('aggiunge un uid a confirmedBy senza duplicati', () => {
    expect(addConfirmation(['a'], 'b').sort()).toEqual(['a', 'b'])
    expect(addConfirmation(['a'], 'a')).toEqual(['a'])
  })
})

describe('isCompleted', () => {
  it('completo solo se entrambi i partecipanti hanno confermato', () => {
    expect(isCompleted(['a', 'b'], ['a'])).toBe(false)
    expect(isCompleted(['a', 'b'], ['a', 'b'])).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd figubook-app && npx vitest run src/lib/db/proposals.test.ts`
Expected: FAIL — import non risolto.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/db/proposals.ts
import {
  addDoc, collection, doc, onSnapshot, query, updateDoc, where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export type ProposalStatus = 'pending' | 'accepted' | 'completed' | 'declined'

export interface Proposal {
  id: string
  participants: string[]
  fromUid: string
  toUid: string
  albumId: string
  give: string[]
  receive: string[]
  status: ProposalStatus
  confirmedBy: string[]
  createdAt: number
  updatedAt: number
}

// --- helper puri (testabili) ---
export function addConfirmation(confirmedBy: string[], uid: string): string[] {
  return confirmedBy.includes(uid) ? confirmedBy : [...confirmedBy, uid]
}
export function isCompleted(participants: string[], confirmedBy: string[]): boolean {
  return participants.every((p) => confirmedBy.includes(p))
}

// --- wrapper Firestore ---
export async function createProposal(
  fromUid: string, toUid: string, albumId: string, give: string[], receive: string[],
): Promise<void> {
  const now = Date.now()
  await addDoc(collection(db, 'proposals'), {
    participants: [fromUid, toUid],
    fromUid, toUid, albumId, give, receive,
    status: 'pending', confirmedBy: [], createdAt: now, updatedAt: now,
  })
}

export function subscribeMyProposals(uid: string, cb: (p: Proposal[]) => void): () => void {
  const q = query(collection(db, 'proposals'), where('participants', 'array-contains', uid))
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Proposal, 'id'>) }))),
    (err) => { console.error('proposals', err); cb([]) },
  )
}

export async function acceptProposal(id: string): Promise<void> {
  await updateDoc(doc(db, 'proposals', id), { status: 'accepted', updatedAt: Date.now() })
}
export async function declineProposal(id: string): Promise<void> {
  await updateDoc(doc(db, 'proposals', id), { status: 'declined', updatedAt: Date.now() })
}

// Conferma "scambio fatto"; passa a completed se entrambi hanno confermato.
export async function confirmProposal(p: Proposal, uid: string): Promise<void> {
  const confirmedBy = addConfirmation(p.confirmedBy, uid)
  const status: ProposalStatus = isCompleted(p.participants, confirmedBy) ? 'completed' : p.status
  await updateDoc(doc(db, 'proposals', p.id), { confirmedBy, status, updatedAt: Date.now() })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd figubook-app && npx vitest run src/lib/db/proposals.test.ts`
Expected: PASS (2 blocchi).

- [ ] **Step 5: Commit**

```bash
git add figubook-app/src/lib/db/proposals.ts figubook-app/src/lib/db/proposals.test.ts
git commit -m "feat(scambi): modulo proposals + helper conferma bilaterale"
```

---

## Task 6: Regole Firestore (tradeIndex, proposals, meta/trade)

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: Aggiungi le regole prima di "Tutto il resto: negato di default."**

```
    // ── Indice scambi per-album ───────────────────────────────────────────
    match /tradeIndex/{albumId}/users/{uid} {
      allow read: if signedIn();
      allow write: if isUser(uid);   // pubblichi solo il tuo inventario
    }

    // ── Proposte di scambio (Fase 1) ──────────────────────────────────────
    match /proposals/{proposalId} {
      allow read: if signedIn() && request.auth.uid in resource.data.participants;
      allow create: if verified()
        && request.resource.data.fromUid == request.auth.uid
        && request.auth.uid in request.resource.data.participants
        && request.resource.data.status == 'pending'
        && request.resource.data.confirmedBy.size() == 0;
      allow update: if signedIn()
        && request.auth.uid in resource.data.participants
        && request.resource.data.participants == resource.data.participants
        && request.resource.data.albumId == resource.data.albumId
        && request.resource.data.createdAt == resource.data.createdAt
        && request.resource.data.confirmedBy.hasOnly(resource.data.participants)
        && (request.resource.data.status != 'completed'
            || request.resource.data.confirmedBy.hasAll(resource.data.participants));
      allow delete: if false;
    }
```

Nota: `meta/trade` è già coperto dalla regola esistente `match /meta/{docId} { allow read, write: if isUser(userId); }` (riga ~32). Non aggiungere nulla per meta.

- [ ] **Step 2: Deploy regole**

Run: `cd /Users/alessandrogelo/Desktop/FiguBook && firebase deploy --only firestore:rules`
Expected: "Deploy complete!".

- [ ] **Step 3: Commit**

```bash
git add firestore.rules
git commit -m "feat(scambi): regole tradeIndex + proposals (conferma bilaterale)"
```

---

## Task 7: Componente FilterChips

**Files:**
- Create: `src/components/trade/FilterChips.tsx`

- [ ] **Step 1: Implementazione**

```tsx
// src/components/trade/FilterChips.tsx
export interface TradeFilters {
  reciprocal: boolean
  nearMe: boolean
}

interface Props {
  filters: TradeFilters
  onChange: (f: TradeFilters) => void
}

const base =
  'rounded-full px-3 py-1 text-sm border transition select-none cursor-pointer'

export function FilterChips({ filters, onChange }: Props) {
  const chip = (active: boolean) =>
    active
      ? `${base} border-lime bg-lime/15 text-lime`
      : `${base} border-white/15 text-muted-foreground hover:border-white/30`
  return (
    <div className="flex flex-wrap gap-2">
      <button
        className={chip(filters.reciprocal)}
        onClick={() => onChange({ ...filters, reciprocal: !filters.reciprocal })}
      >
        Reciproci
      </button>
      <button
        className={chip(filters.nearMe)}
        onClick={() => onChange({ ...filters, nearMe: !filters.nearMe })}
      >
        Vicino a me
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `cd figubook-app && npx tsc -b --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add figubook-app/src/components/trade/FilterChips.tsx
git commit -m "feat(scambi): FilterChips (Reciproci + Vicino a me)"
```

---

## Task 8: Componente MatchCard

**Files:**
- Create: `src/components/trade/MatchCard.tsx`

- [ ] **Step 1: Implementazione**

```tsx
// src/components/trade/MatchCard.tsx
import type { MatchResult } from '@/lib/trade/match'

interface Props {
  username: string
  citta: string
  match: MatchResult
  onCompose: () => void
}

export function MatchCard({ username, citta, match, onCompose }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="font-semibold">{username}</div>
        {citta && <div className="text-sm text-muted-foreground">{citta}</div>}
      </div>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl bg-white/[0.04] py-2">
          <div className="text-2xl font-bold text-lime">{match.receiveCount}</div>
          <div className="text-xs text-muted-foreground">RICEVI</div>
        </div>
        <div className="rounded-xl bg-white/[0.04] py-2">
          <div className="text-2xl font-bold">{match.giveCount}</div>
          <div className="text-xs text-muted-foreground">OFFRI</div>
        </div>
      </div>
      <div className="text-xs text-muted-foreground text-center">
        Completi +{match.completionPct}% dell'album
      </div>
      <button
        onClick={onCompose}
        className="rounded-xl bg-lime text-black font-semibold py-2 hover:opacity-90 transition"
      >
        Componi scambio
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `cd figubook-app && npx tsc -b --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add figubook-app/src/components/trade/MatchCard.tsx
git commit -m "feat(scambi): MatchCard (RICEVI/OFFRI/completi%)"
```

---

## Task 9: Componente ComponiScambio

**Files:**
- Create: `src/components/trade/ComponiScambio.tsx`

- [ ] **Step 1: Implementazione**

```tsx
// src/components/trade/ComponiScambio.tsx
import { useState } from 'react'

interface Props {
  username: string
  albumNames: Record<string, string>   // code -> nome figurina
  receiveCodes: string[]               // sue doubles ∩ mie missing
  giveCodes: string[]                  // mie doubles ∩ sue missing
  onSend: (give: string[], receive: string[]) => void
  onCancel: () => void
}

function useSelection(initial: string[]) {
  const [sel, setSel] = useState<Set<string>>(new Set(initial))
  const toggle = (c: string) =>
    setSel((s) => {
      const n = new Set(s)
      n.has(c) ? n.delete(c) : n.add(c)
      return n
    })
  return { sel, toggle }
}

export function ComponiScambio({
  username, albumNames, receiveCodes, giveCodes, onSend, onCancel,
}: Props) {
  const recv = useSelection(receiveCodes)
  const give = useSelection(giveCodes)
  const label = (c: string) => albumNames[c] ?? c

  const List = ({ codes, state }: { codes: string[]; state: ReturnType<typeof useSelection> }) => (
    <div className="flex flex-col gap-1 max-h-72 overflow-auto">
      {codes.length === 0 && <div className="text-sm text-muted-foreground">Niente qui.</div>}
      {codes.map((c) => (
        <label key={c} className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-white/[0.04] cursor-pointer">
          <input type="checkbox" checked={state.sel.has(c)} onChange={() => state.toggle(c)} />
          <span className="text-sm"><span className="text-muted-foreground">#{c}</span> {label(c)}</span>
        </label>
      ))}
    </div>
  )

  return (
    <div className="rounded-2xl border border-white/10 bg-card p-4 flex flex-col gap-4">
      <div className="font-semibold">Scambio con {username}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm font-medium text-lime mb-2">Ricevi</div>
          <List codes={receiveCodes} state={recv} />
        </div>
        <div>
          <div className="text-sm font-medium mb-2">Dai</div>
          <List codes={giveCodes} state={give} />
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        Ricevi {recv.sel.size} · Dai {give.sel.size}
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="rounded-xl px-4 py-2 border border-white/15">Annulla</button>
        <button
          disabled={recv.sel.size === 0 && give.sel.size === 0}
          onClick={() => onSend([...give.sel], [...recv.sel])}
          className="rounded-xl px-4 py-2 bg-lime text-black font-semibold disabled:opacity-40"
        >
          Invia proposta
        </button>
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
git add figubook-app/src/components/trade/ComponiScambio.tsx
git commit -m "feat(scambi): ComponiScambio (due liste manuali + invio)"
```

---

## Task 10: Pagina Scambi (discovery)

**Files:**
- Modify (overwrite): `src/pages/Scambi.tsx`

**Contesto auth:** ricavare l'uid corrente con `requireUid()` da `@/lib/firebase` dentro effetti, oppure usare l'hook auth esistente. Verificare come le altre pagine (es. `Profilo.tsx`) ottengono `uid`/`citta` e seguire lo stesso pattern.

- [ ] **Step 1: Implementazione**

```tsx
// src/pages/Scambi.tsx
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { requireUid } from '@/lib/firebase'
import { subscribeTradeAlbums } from '@/lib/db/trade'
import { fetchIndexUsers, type TradeIndexEntry } from '@/lib/db/tradeIndex'
import { subscribeAlbum } from '@/lib/db/albums'
import { loadAlbumData } from '@/data/albums'
import { allCodesFromSections } from '@/lib/trade/albumCodes'
import { deriveInventory, computeMatch, type Inventory } from '@/lib/trade/match'
import { albumById } from '@/data/albumCatalog'
import { getPublicByUid } from '@/lib/db/publicProfiles'
import { createProposal } from '@/lib/db/proposals'
import { FilterChips, type TradeFilters } from '@/components/trade/FilterChips'
import { MatchCard } from '@/components/trade/MatchCard'
import { ComponiScambio } from '@/components/trade/ComponiScambio'

interface Row {
  entry: TradeIndexEntry
  username: string
  match: ReturnType<typeof computeMatch>
}

export default function Scambi() {
  const uid = requireUid()
  const [tradeAlbums, setTradeAlbums] = useState<string[]>([])
  const [albumId, setAlbumId] = useState<string | null>(null)
  const [myInv, setMyInv] = useState<Inventory | null>(null)
  const [names, setNames] = useState<Record<string, string>>({})
  const [rows, setRows] = useState<Row[]>([])
  const [filters, setFilters] = useState<TradeFilters>({ reciprocal: true, nearMe: false })
  const [composing, setComposing] = useState<Row | null>(null)
  const [myCitta, setMyCitta] = useState('')

  useEffect(() => subscribeTradeAlbums(uid, setTradeAlbums), [uid])
  useEffect(() => { getPublicByUid(uid).then((p) => setMyCitta(p?.citta ?? '')) }, [uid])

  // Carica il mio inventario + nomi dell'album scelto.
  useEffect(() => {
    if (!albumId) return
    let unsub = () => {}
    loadAlbumData(albumId).then((data) => {
      if (!data) return
      const allCodes = allCodesFromSections(data)
      setNames(data.names ?? {})
      unsub = subscribeAlbum(uid, albumId, (d) => setMyInv(deriveInventory(allCodes, d.states)))
    })
    return () => unsub()
  }, [albumId, uid])

  // Calcola i match leggendo l'indice dell'album.
  useEffect(() => {
    if (!albumId || !myInv) return
    const total = albumById[albumId]?.total ?? 0
    fetchIndexUsers(albumId, uid).then(async (entries) => {
      const out: Row[] = []
      for (const e of entries) {
        const match = computeMatch(myInv, { doubles: e.doubles, missing: e.missing }, total)
        const p = await getPublicByUid(e.uid)
        out.push({ entry: e, username: p?.username ?? 'utente', match })
      }
      setRows(out)
    })
  }, [albumId, myInv, uid])

  const visible = useMemo(() => {
    return rows
      .filter((r) => (filters.reciprocal ? r.match.reciprocal : r.match.receiveCount + r.match.giveCount > 0))
      .filter((r) => (filters.nearMe ? r.entry.citta && r.entry.citta === myCitta : true))
      .sort((a, b) =>
        b.match.receiveCount + b.match.giveCount - (a.match.receiveCount + a.match.giveCount))
  }, [rows, filters, myCitta])

  async function handleSend(row: Row, give: string[], receive: string[]) {
    await createProposal(uid, row.entry.uid, albumId!, give, receive)
    // notifica al destinatario
    const { addDoc, collection } = await import('firebase/firestore')
    const { db } = await import('@/lib/firebase')
    await addDoc(collection(db, 'users', row.entry.uid, 'notifications'), {
      fromUid: uid, type: 'trade', title: 'Hai ricevuto una proposta di scambio',
      icon: '🔄', href: '/scambi/miei', read: false, at: Date.now(),
    })
    setComposing(null)
  }

  // --- Stato: scelta album ---
  if (!albumId) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-1">Scambi</h1>
        <p className="text-muted-foreground mb-6">Scegli un album per trovare scambi.</p>
        {tradeAlbums.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nessun album attivo per gli scambi. Attivali da{' '}
            <Link to="/album" className="text-lime underline">i tuoi album</Link>.
          </p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {tradeAlbums.map((id) => (
            <button
              key={id}
              onClick={() => setAlbumId(id)}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:border-lime/40 transition"
            >
              <div className="font-semibold">{albumById[id]?.title ?? id}</div>
              <div className="text-xs text-muted-foreground">{albumById[id]?.season}</div>
            </button>
          ))}
        </div>
      </main>
    )
  }

  // --- Stato: discovery ---
  return (
    <main className="max-w-5xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setAlbumId(null)} className="text-sm text-muted-foreground">← Album</button>
        <h1 className="text-2xl font-bold">{albumById[albumId]?.title}</h1>
        <Link to="/scambi/miei" className="ml-auto text-sm text-lime underline">I miei scambi</Link>
      </div>
      <div className="mb-4"><FilterChips filters={filters} onChange={setFilters} /></div>
      {composing ? (
        <ComponiScambio
          username={composing.username}
          albumNames={names}
          receiveCodes={composing.match.receive}
          giveCodes={composing.match.give}
          onSend={(g, r) => handleSend(composing, g, r)}
          onCancel={() => setComposing(null)}
        />
      ) : visible.length === 0 ? (
        <p className="text-muted-foreground">Nessuno scambio disponibile per ora.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visible.map((r) => (
            <MatchCard
              key={r.entry.uid}
              username={r.username}
              citta={r.entry.citta}
              match={r.match}
              onCompose={() => setComposing(r)}
            />
          ))}
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Typecheck + build**

Run: `cd figubook-app && npx tsc -b --noEmit && npm run build`
Expected: exit 0 (solo warning chunk-size).

- [ ] **Step 3: Commit**

```bash
git add figubook-app/src/pages/Scambi.tsx
git commit -m "feat(scambi): pagina discovery (album-first + match + componi)"
```

---

## Task 11: Pagina ScambiMiei (gestione proposte)

**Files:**
- Create: `src/pages/ScambiMiei.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Implementazione pagina**

```tsx
// src/pages/ScambiMiei.tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { requireUid } from '@/lib/firebase'
import {
  subscribeMyProposals, acceptProposal, declineProposal, confirmProposal, type Proposal,
} from '@/lib/db/proposals'

export default function ScambiMiei() {
  const uid = requireUid()
  const [tab, setTab] = useState<'in' | 'out'>('in')
  const [list, setList] = useState<Proposal[]>([])

  useEffect(() => subscribeMyProposals(uid, setList), [uid])

  const incoming = list.filter((p) => p.toUid === uid)
  const outgoing = list.filter((p) => p.fromUid === uid)
  const shown = tab === 'in' ? incoming : outgoing

  const statusLabel = (p: Proposal) =>
    p.status === 'completed' ? 'Completato'
    : p.status === 'declined' ? 'Rifiutato'
    : p.status === 'accepted'
      ? (p.confirmedBy.includes(uid) ? 'In attesa che l\'altro confermi' : 'Accettato — conferma quando fatto')
      : 'In attesa'

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/scambi" className="text-sm text-muted-foreground">← Scambi</Link>
        <h1 className="text-2xl font-bold">I miei scambi</h1>
      </div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('in')} className={`px-3 py-1 rounded-full ${tab==='in'?'bg-lime text-black':'border border-white/15'}`}>In arrivo</button>
        <button onClick={() => setTab('out')} className={`px-3 py-1 rounded-full ${tab==='out'?'bg-lime text-black':'border border-white/15'}`}>Inviate</button>
      </div>
      {shown.length === 0 && <p className="text-muted-foreground">Niente qui.</p>}
      <div className="flex flex-col gap-3">
        {shown.map((p) => (
          <div key={p.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-sm text-muted-foreground mb-2">{statusLabel(p)}</div>
            <div className="text-sm">Ricevi {p.receive.length} · Dai {p.give.length}</div>
            <div className="flex gap-2 mt-3">
              {tab === 'in' && p.status === 'pending' && (
                <>
                  <button onClick={() => acceptProposal(p.id)} className="rounded-xl px-3 py-1 bg-lime text-black font-semibold">Accetta</button>
                  <button onClick={() => declineProposal(p.id)} className="rounded-xl px-3 py-1 border border-white/15">Rifiuta</button>
                </>
              )}
              {p.status === 'accepted' && !p.confirmedBy.includes(uid) && (
                <button onClick={() => confirmProposal(p, uid)} className="rounded-xl px-3 py-1 bg-lime text-black font-semibold">Conferma scambio fatto</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Aggiungi la rotta in `src/App.tsx`**

Dopo la riga `<Route path="/scambi" element={<Scambi />} />` aggiungi:

```tsx
        <Route path="/scambi/miei" element={<ScambiMiei />} />
```

E in cima al file, accanto agli altri import di pagine:

```tsx
import ScambiMiei from '@/pages/ScambiMiei'
```

(Verifica lo stile di import delle altre pagine in `App.tsx` e usa lo stesso — default import.)

- [ ] **Step 3: Typecheck + build**

Run: `cd figubook-app && npx tsc -b --noEmit && npm run build`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add figubook-app/src/pages/ScambiMiei.tsx figubook-app/src/App.tsx
git commit -m "feat(scambi): pagina I miei scambi + rotta /scambi/miei"
```

---

## Task 12: Sync indice al flush album (per album opted-in)

**Files:**
- Modify: `src/lib/db/albums.ts` (funzione `flushAlbumCounts`)

**Obiettivo:** dopo che l'utente modifica un album che ha reso scambiabile, l'indice si aggiorna. Per non accoppiare `albums.ts` a `trade.ts`, esporre un hook opzionale.

- [ ] **Step 1: Aggiungi un callback di post-flush opzionale**

In `src/lib/db/albums.ts`, dopo `flushAlbumCounts`, aggiungi:

```ts
// Hook opzionale chiamato dopo ogni flush riuscito (usato dal layer scambi per
// risincronizzare l'indice solo se l'album è opted-in). Disaccoppia albums<->trade.
type FlushHook = (uid: string, albumId: string) => void
let afterFlush: FlushHook | null = null
export function setAfterFlushHook(fn: FlushHook | null) { afterFlush = fn }
```

E dentro `flushAlbumCounts`, subito dopo `await setDoc(...)`:

```ts
  if (afterFlush) afterFlush(uid, albumId)
```

- [ ] **Step 2: Registra l'hook all'avvio app**

In `src/App.tsx` (dentro il componente, in un `useEffect` montaggio), registra:

```tsx
import { useEffect } from 'react'
import { setAfterFlushHook } from '@/lib/db/albums'
import { subscribeTradeAlbums, syncIndexForAlbum } from '@/lib/db/trade'
import { getPublicByUid } from '@/lib/db/publicProfiles'
import { auth } from '@/lib/firebase'

// dentro il componente App:
useEffect(() => {
  let tradeAlbums: string[] = []
  const u = auth.currentUser?.uid
  if (!u) return
  const unsub = subscribeTradeAlbums(u, (ids) => { tradeAlbums = ids })
  setAfterFlushHook(async (uid, albumId) => {
    if (!tradeAlbums.includes(albumId)) return
    const p = await getPublicByUid(uid)
    syncIndexForAlbum(uid, albumId, p?.citta ?? '')
  })
  return () => { unsub(); setAfterFlushHook(null) }
}, [])
```

(Adatta al punto giusto del componente `App`; se `App` non ha accesso a `user`, usa il pattern auth già presente nel file.)

- [ ] **Step 3: Typecheck + build + test completo**

Run: `cd figubook-app && npx tsc -b --noEmit && npm run build && npx vitest run`
Expected: tutto verde.

- [ ] **Step 4: Commit**

```bash
git add figubook-app/src/lib/db/albums.ts figubook-app/src/App.tsx
git commit -m "feat(scambi): risync indice al flush per album opted-in"
```

---

## Task 13: Attivazione scambi dall'album (opt-in UI)

**Files:**
- Modify: il menu album esistente `src/components/album/AlbumMenu.tsx` (o la pagina `src/pages/Album.tsx`)

**Obiettivo:** un toggle "Rendi scambiabile questo album" che chiama `setTradeAlbum`.

- [ ] **Step 1: Esplora il menu album**

Run: `cd figubook-app && sed -n '1,80p' src/components/album/AlbumMenu.tsx`
Individua dove aggiungere una voce/azione coerente con lo stile esistente.

- [ ] **Step 2: Aggiungi la voce toggle**

Usa `subscribeTradeAlbums` per lo stato e `setTradeAlbum(uid, albumId, enabled, current, citta)` per cambiare. Esempio di handler (adatta al componente reale):

```tsx
import { useEffect, useState } from 'react'
import { requireUid } from '@/lib/firebase'
import { subscribeTradeAlbums, setTradeAlbum } from '@/lib/db/trade'
import { getPublicByUid } from '@/lib/db/publicProfiles'

// dentro il componente, dato `albumId`:
const uid = requireUid()
const [tradeAlbums, setTradeAlbums] = useState<string[]>([])
useEffect(() => subscribeTradeAlbums(uid, setTradeAlbums), [uid])
const enabled = tradeAlbums.includes(albumId)
async function toggleTrade() {
  const p = await getPublicByUid(uid)
  await setTradeAlbum(uid, albumId, !enabled, tradeAlbums, p?.citta ?? '')
}
// render: <button onClick={toggleTrade}>{enabled ? 'Disattiva scambi' : 'Rendi scambiabile'}</button>
```

- [ ] **Step 3: Typecheck + build**

Run: `cd figubook-app && npx tsc -b --noEmit && npm run build`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add figubook-app/src/components/album/AlbumMenu.tsx
git commit -m "feat(scambi): toggle attiva scambi dall'album"
```

---

## Task 14: Rifinitura estetica (skill design)

**Files:**
- Touch: `src/pages/Scambi.tsx`, `src/pages/ScambiMiei.tsx`, `src/components/trade/*`

- [ ] **Step 1: Invoca le skill estetiche**

Richiama (come da preferenze utente in memory): `impeccable`, `taste-skill`/`taste-skill:taste-skill`, `frontend-design:frontend-design`. Applica al flusso Scambi: gerarchia, spaziature, stati vuoti, card, micro-interazioni. Carattere minimalista Geist, niente slop IA. Rispetta i token (`text-muted-foreground`, non `text-muted`) e `:focus-visible` (vedi memory).

- [ ] **Step 2: Verifica build + lint**

Run: `cd figubook-app && npx tsc -b --noEmit && npm run lint 2>&1 | grep -c error && npm run build`
Expected: tsc 0, lint error count 0, build ok.

- [ ] **Step 3: Bump cache-bust se toccati asset locali**

(Vedi memory [[cache-bust-assets]]: se modifichi js/css locali referenziati con `?v=N`, incrementa N.)

- [ ] **Step 4: Commit**

```bash
git add figubook-app/src
git commit -m "style(scambi): rifinitura estetica flusso scambi"
```

---

## Task 15: Verifica end-to-end manuale + push

- [ ] **Step 1: Test manuale sul sito live**

1. Apri due account (o browser+incognito) su `.../FiguBook/app/`.
2. Account A: album con doppie, "Rendi scambiabile".
3. Account B: stesso album con mancanti che A ha doppie, "Rendi scambiabile".
4. B → Scambi → scegli album → A compare con RICEVI/OFFRI → Componi → Invia.
5. A → notifica → I miei scambi → In arrivo → Accetta.
6. Entrambi → Conferma scambio fatto → stato Completato.

- [ ] **Step 2: Verifica suite completa**

Run: `cd figubook-app && npx tsc -b --noEmit && npm run lint 2>&1 | grep -c error && npx vitest run && npm run build`
Expected: tutto verde.

- [ ] **Step 3: Push finale**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook && git push origin main
```

---

## Self-Review (esito)

- **Spec coverage:** opt-in (T4,T13), indice per-album (T3,T12), discovery album-first+chip (T7,T10), match reciproco default (T1,T10), componi manuale (T9,T10), gestione proposte+conferma bilaterale (T5,T11), notifiche (T10,T11), regole sicurezza (T6). Rating/recensioni esplicitamente differiti a Fase 2 (deviazione dichiarata). Geo-distanza e gruppi fuori scope come da spec.
- **Placeholder:** nessuno; ogni step ha codice o comando concreto.
- **Type consistency:** `Inventory`, `MatchResult`, `TradeIndexEntry`, `Proposal`, `TradeFilters` usati coerentemente tra i task; firme `setTradeAlbum`/`syncIndexForAlbum`/`createProposal`/`confirmProposal` allineate tra modulo e chiamanti.
- **Nota integrazione:** i Task 10/12/13 assumono il pattern auth reale del progetto (`requireUid()` / hook). Verificare in `Profilo.tsx`/`App.tsx` e adattare se l'uid arriva da context invece che da `requireUid()`.
