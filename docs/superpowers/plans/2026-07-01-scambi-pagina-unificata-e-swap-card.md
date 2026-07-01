# Scambi — pagina unificata + swap-card + modifica proposta — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unificare la sezione Scambi in una pagina ("I miei scambi" + picker album + 3 sezioni proposte), con card in stile swap, dialog "Visualizza carte", e feature "Modifica proposta" / "Annulla scambio".

**Architecture:** Logica pura testabile isolata in `proposals.ts` (helper stato/turno) e `proposalView.ts` (mapping FROM/TO + conteggi). UI in `SwapCard` + `CardsDialog`, montati nella landing di `Scambi.tsx`. `ComponiScambio` esteso per la modalità edit. Rules estese per nuovi stati/campi. Nomi figurine risolti on-demand con cache.

**Tech Stack:** React 18, Vite, TypeScript, Firebase Firestore (modular SDK), Vitest, Tailwind, lucide-react, framer-motion (già in dep).

Spec: `docs/superpowers/specs/2026-07-01-scambi-pagina-unificata-e-swap-card-design.md`

---

## File Structure

- `src/lib/db/proposals.ts` — Modify: nuovi campi tipo `Proposal`, `createProposal` (set lastEditedBy/turnUid), + `updateProposalOffer`, `cancelProposal`, `otherParticipant`.
- `src/lib/trade/proposalView.ts` — Create (puro): `proposalView(p, meUid)` → FROM/TO uid, giveCount/receiveCount per pannello, flag azioni.
- `src/lib/trade/proposalView.test.ts` — Create.
- `src/components/trade/CardsDialog.tsx` — Create: dialog liste Dà/Riceve.
- `src/components/trade/SwapCard.tsx` — Create: card swap + azioni.
- `src/components/trade/ComponiScambio.tsx` — Modify: prop `initialGive`/`initialReceive`/`mode`.
- `src/pages/Scambi.tsx` — Modify: landing con 3 sezioni + logica modifica/annulla; titolo "I miei scambi".
- `src/pages/ScambiMiei.tsx` — Delete.
- `src/App.tsx` — Modify: rimuovere import + route `/scambi/miei`.
- `firestore.rules` — Modify: stati + campi update.

---

## Task 1: Modello proposta — nuovi campi e tipi

**Files:**
- Modify: `src/lib/db/proposals.ts`

- [ ] **Step 1: Estendere il tipo `Proposal` e `ProposalStatus`**

In `src/lib/db/proposals.ts`, sostituire la definizione di `ProposalStatus` e aggiungere i campi al type `Proposal`:

```ts
export type ProposalStatus = 'pending' | 'accepted' | 'completed' | 'declined' | 'cancelled'

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
  lastEditedBy: string
  turnUid: string
  createdAt: number
  updatedAt: number
}
```

- [ ] **Step 2: Set nuovi campi in `createProposal`**

Sostituire il body di `createProposal` per scrivere `lastEditedBy`/`turnUid`:

```ts
export async function createProposal(
  fromUid: string, toUid: string, albumId: string, give: string[], receive: string[],
): Promise<void> {
  const now = Date.now()
  await addDoc(collection(db, 'proposals'), {
    participants: [fromUid, toUid],
    fromUid, toUid, albumId, give, receive,
    status: 'pending', confirmedBy: [],
    lastEditedBy: fromUid, turnUid: toUid,
    createdAt: now, updatedAt: now,
  })
}
```

- [ ] **Step 3: Typecheck**

Run: `cd figubook-app && npx tsc -b --noEmit`
Expected: PASS (0 errori). Il campo mancante negli oggetti letti da Firestore è ok (cast `as Omit<Proposal,'id'>`).

- [ ] **Step 4: Commit**

```bash
git add figubook-app/src/lib/db/proposals.ts
git commit -m "feat(scambi): campi lastEditedBy/turnUid + stato cancelled su Proposal"
```

---

## Task 2: Helper `otherParticipant` + `updateProposalOffer` + `cancelProposal`

**Files:**
- Modify: `src/lib/db/proposals.ts`
- Test: `src/lib/db/proposals.test.ts`

- [ ] **Step 1: Test per `otherParticipant`**

Aggiungere in `src/lib/db/proposals.test.ts`:

```ts
import { otherParticipant } from './proposals'

describe('otherParticipant', () => {
  it('ritorna l\'altro partecipante', () => {
    expect(otherParticipant(['a', 'b'], 'a')).toBe('b')
    expect(otherParticipant(['a', 'b'], 'b')).toBe('a')
  })
})
```

- [ ] **Step 2: Run test, verifica fallimento**

Run: `cd figubook-app && npx vitest run src/lib/db/proposals.test.ts`
Expected: FAIL ("otherParticipant is not a function").

- [ ] **Step 3: Implementare gli helper**

In `src/lib/db/proposals.ts` aggiungere (dopo gli helper puri esistenti):

```ts
export function otherParticipant(participants: string[], uid: string): string {
  return participants.find((p) => p !== uid) ?? uid
}
```

E nei wrapper Firestore aggiungere:

```ts
// Modifica offerta (stesso doc): rimette in attesa e passa il turno all'altro.
export async function updateProposalOffer(
  p: Proposal, editorUid: string, give: string[], receive: string[],
): Promise<void> {
  await updateDoc(doc(db, 'proposals', p.id), {
    give, receive,
    status: 'pending', confirmedBy: [],
    lastEditedBy: editorUid,
    turnUid: otherParticipant(p.participants, editorUid),
    updatedAt: Date.now(),
  })
}

// Annulla proposta ancora in attesa (soft-cancel: rules vietano delete).
export async function cancelProposal(id: string): Promise<void> {
  await updateDoc(doc(db, 'proposals', id), { status: 'cancelled', updatedAt: Date.now() })
}
```

- [ ] **Step 4: Run test, verifica pass**

Run: `cd figubook-app && npx vitest run src/lib/db/proposals.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add figubook-app/src/lib/db/proposals.ts figubook-app/src/lib/db/proposals.test.ts
git commit -m "feat(scambi): updateProposalOffer + cancelProposal + otherParticipant"
```

---

## Task 3: Modulo puro `proposalView` (mapping FROM/TO)

**Files:**
- Create: `src/lib/trade/proposalView.ts`
- Test: `src/lib/trade/proposalView.test.ts`

Semantica: `give`/`receive` sono relativi a `fromUid` (`give` = ciò che fromUid cede, `receive` = ciò che fromUid riceve). FROM nella card = `lastEditedBy`. Dobbiamo derivare, per il pannello FROM e TO, quante/quali carte ciascuno cede.

- [ ] **Step 1: Scrivere il test**

Create `src/lib/trade/proposalView.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { proposalView } from './proposalView'
import type { Proposal } from '@/lib/db/proposals'

const base: Proposal = {
  id: 'p1', participants: ['A', 'B'], fromUid: 'A', toUid: 'B',
  albumId: 'adrenalyn-25-26', give: ['19', '20'], receive: ['1'],
  status: 'pending', confirmedBy: [], lastEditedBy: 'A', turnUid: 'B',
  createdAt: 0, updatedAt: 0,
}

describe('proposalView', () => {
  it('FROM = lastEditedBy, TO = altro; cede/riceve dal frame fromUid', () => {
    const v = proposalView(base, 'B')
    expect(v.fromUid).toBe('A')
    expect(v.toUid).toBe('B')
    // A (fromUid) cede give=[19,20], riceve receive=[1]
    expect(v.fromGives).toEqual(['19', '20'])
    expect(v.toGives).toEqual(['1'])
  })

  it('dopo contro-proposta di B: lastEditedBy=B -> FROM=B', () => {
    const counter: Proposal = { ...base, lastEditedBy: 'B', turnUid: 'A' }
    const v = proposalView(counter, 'A')
    expect(v.fromUid).toBe('B')
    expect(v.toUid).toBe('A')
    // give/receive restano frame fromUid=A: A cede give=[19,20]. B (FROM) cede receive=[1].
    expect(v.fromGives).toEqual(['1'])
    expect(v.toGives).toEqual(['19', '20'])
  })

  it('isMyTurn true solo se turnUid == me', () => {
    expect(proposalView(base, 'B').isMyTurn).toBe(true)
    expect(proposalView(base, 'A').isMyTurn).toBe(false)
  })
})
```

- [ ] **Step 2: Run test, verifica fallimento**

Run: `cd figubook-app && npx vitest run src/lib/trade/proposalView.test.ts`
Expected: FAIL ("Cannot find module './proposalView'").

- [ ] **Step 3: Implementare `proposalView`**

Create `src/lib/trade/proposalView.ts`:

```ts
import type { Proposal } from '@/lib/db/proposals'

export interface ProposalView {
  fromUid: string          // pannello sopra (chi ha mandato l'ultima versione)
  toUid: string            // pannello sotto
  fromGives: string[]      // carte che FROM cede
  toGives: string[]        // carte che TO cede
  isMyTurn: boolean        // tocca a me rispondere
}

// give/receive sono nel frame di p.fromUid: give = ciò che fromUid cede.
export function proposalView(p: Proposal, meUid: string): ProposalView {
  const from = p.lastEditedBy
  const to = p.participants.find((x) => x !== from) ?? p.toUid
  // Chi cede cosa, indipendente dalla prospettiva: fromUid cede p.give.
  const fromGives = from === p.fromUid ? p.give : p.receive
  const toGives = from === p.fromUid ? p.receive : p.give
  return { fromUid: from, toUid: to, fromGives, toGives, isMyTurn: p.turnUid === meUid }
}
```

- [ ] **Step 4: Run test, verifica pass**

Run: `cd figubook-app && npx vitest run src/lib/trade/proposalView.test.ts`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git add figubook-app/src/lib/trade/proposalView.ts figubook-app/src/lib/trade/proposalView.test.ts
git commit -m "feat(scambi): modulo puro proposalView (mapping FROM/TO + turno)"
```

---

## Task 4: `ComponiScambio` — modalità edit (precompilazione)

**Files:**
- Modify: `src/components/trade/ComponiScambio.tsx`

- [ ] **Step 1: Aggiungere prop e usarle**

In `Props` aggiungere:

```ts
  initialGive?: string[]
  initialReceive?: string[]
  mode?: 'create' | 'edit'
```

Nel componente, cambiare l'init di `useSelection` e la label:

```ts
export function ComponiScambio({
  username, albumNames, receiveCodes, giveCodes, onSend, onCancel, sending = false,
  initialGive = [], initialReceive = [], mode = 'create',
}: Props) {
  const recv = useSelection(initialReceive)
  const give = useSelection(initialGive)
```

E il testo del bottone invio:

```ts
            {sending ? 'Invio…' : mode === 'edit' ? 'Salva modifiche' : 'Invia proposta'}
```

- [ ] **Step 2: Typecheck**

Run: `cd figubook-app && npx tsc -b --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add figubook-app/src/components/trade/ComponiScambio.tsx
git commit -m "feat(scambi): ComponiScambio supporta modalità edit precompilata"
```

---

## Task 5: `CardsDialog` — dialog "Visualizza carte"

**Files:**
- Create: `src/components/trade/CardsDialog.tsx`

- [ ] **Step 1: Creare il componente**

Create `src/components/trade/CardsDialog.tsx`:

```tsx
import { X } from 'lucide-react'

interface Props {
  fromLabel: string          // es. "Alessandro22 dà"
  toLabel: string            // es. "yepes dà"
  fromCodes: string[]
  toCodes: string[]
  names: Record<string, string>
  onClose: () => void
}

function List({ label, codes, names }: { label: string; codes: string[]; names: Record<string, string> }) {
  return (
    <div>
      <div className="mb-2 text-sm font-semibold text-lime">{label} ({codes.length})</div>
      <div className="flex max-h-64 flex-col gap-0.5 overflow-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
        {codes.length === 0 && <div className="px-2 py-3 text-sm text-muted-foreground">Nessuna carta.</div>}
        {codes.map((c) => (
          <div key={c} className="rounded-lg px-2 py-1.5 text-sm">
            <span className="text-muted-foreground">#{c}</span> {names[c] ?? c}
          </div>
        ))}
      </div>
    </div>
  )
}

export function CardsDialog({ fromLabel, toLabel, fromCodes, toCodes, names, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-card p-5 shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Chiudi"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-white/12 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <h3 className="mb-4 font-display text-lg font-bold text-ink">Carte dello scambio</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <List label={fromLabel} codes={fromCodes} names={names} />
          <List label={toLabel} codes={toCodes} names={names} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `cd figubook-app && npx tsc -b --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add figubook-app/src/components/trade/CardsDialog.tsx
git commit -m "feat(scambi): CardsDialog per Visualizza carte"
```

---

## Task 6: `SwapCard` — card swap con pannelli FROM/TO e azioni

**Files:**
- Create: `src/components/trade/SwapCard.tsx`

Il componente è "presentational": riceve i dati risolti e callback; non tocca Firestore.

- [ ] **Step 1: Creare il componente**

Create `src/components/trade/SwapCard.tsx`:

```tsx
import { Link } from 'react-router-dom'
import { ArrowUpDown } from 'lucide-react'
import type { Proposal } from '@/lib/db/proposals'
import { proposalView } from '@/lib/trade/proposalView'

export interface Person { uid: string; username: string; rating?: number; avatar?: string }

interface Props {
  proposal: Proposal
  meUid: string
  people: Record<string, Person>       // uid -> profilo
  albumTitle: string
  albumCover?: string
  onViewCards: () => void
  actions: React.ReactNode             // bottoni footer (decisi dal parent per sezione)
  statusLabel: string
  statusClass: string
}

function Panel({ person, count, onViewCards }: { person?: Person; count: number; onViewCards: () => void }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5">
      <div className="flex items-center justify-between gap-2">
        <Link to={person ? `/u/${person.username}` : '#'} className="flex min-w-0 items-center gap-2 hover:underline">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-lime/15 text-xs font-bold text-lime">
            {(person?.username ?? '?').slice(0, 1).toUpperCase()}
          </span>
          <span className="truncate text-sm font-semibold text-ink">{person?.username ?? 'utente'}</span>
          {person?.rating != null && person.rating > 0 && (
            <span className="shrink-0 text-xs text-muted-foreground">⭐ {person.rating.toFixed(1)}</span>
          )}
        </Link>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Dà <span className="font-semibold text-ink">{count}</span> {count === 1 ? 'carta' : 'carte'}</span>
        <button onClick={onViewCards} className="text-xs font-semibold text-lime hover:underline">Visualizza →</button>
      </div>
    </div>
  )
}

export function SwapCard({
  proposal, meUid, people, albumTitle, albumCover, onViewCards, actions, statusLabel, statusClass,
}: Props) {
  const v = proposalView(proposal, meUid)
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-surface/40 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2.5">
        {albumCover
          ? <img src={albumCover} alt="" className="h-9 w-7 shrink-0 rounded object-cover" />
          : <div className="h-9 w-7 shrink-0 rounded bg-white/10" />}
        <span className="truncate text-sm font-semibold text-ink">{albumTitle}</span>
        <span className={'ml-auto shrink-0 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ' + statusClass}>
          {statusLabel}
        </span>
      </div>

      <div className="relative flex flex-col gap-1.5">
        <Panel person={people[v.fromUid]} count={v.fromGives.length} onViewCards={onViewCards} />
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/12 bg-card text-lime shadow-lg">
            <ArrowUpDown className="h-4 w-4" />
          </span>
        </div>
        <Panel person={people[v.toUid]} count={v.toGives.length} onViewCards={onViewCards} />
      </div>

      {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `cd figubook-app && npx tsc -b --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add figubook-app/src/components/trade/SwapCard.tsx
git commit -m "feat(scambi): SwapCard con pannelli FROM/TO e icona swap"
```

---

## Task 7: Landing Scambi — 3 sezioni, dati e azioni

**Files:**
- Modify: `src/pages/Scambi.tsx`

Questo task monta le 3 sezioni sotto il picker nella vista landing (`if (!albumId)`), gestisce sottoscrizione proposte, risoluzione nomi/persone, e i flussi modifica/annulla. Riusa gli helper dei task 1-3 e i componenti 5-6.

- [ ] **Step 1: Import e sottoscrizione proposte**

In cima a `Scambi.tsx` aggiungere import:

```ts
import {
  subscribeMyProposals, acceptProposal, declineProposal, confirmProposal,
  cancelProposal, updateProposalOffer, otherParticipant, type Proposal,
} from '@/lib/db/proposals'
import { proposalView } from '@/lib/trade/proposalView'
import { SwapCard, type Person } from '@/components/trade/SwapCard'
import { CardsDialog } from '@/components/trade/CardsDialog'
import { getPublicByUid } from '@/lib/db/publicProfiles'
import { getRating, getReviews, createReview } from '@/lib/db/feedback'
import { ReviewDialog } from '@/components/trade/ReviewDialog'
```

Dentro il componente, stato:

```ts
  const [props_, setProps_] = useState<Proposal[]>([])
  const [people, setPeople] = useState<Record<string, Person>>({})
  const [albumMeta, setAlbumMeta] = useState<Record<string, { title: string; cover?: string; names: Record<string, string> }>>({})
  const [viewing, setViewing] = useState<Proposal | null>(null)
  const [reviewed, setReviewed] = useState<Set<string>>(new Set())
  const [reviewing, setReviewing] = useState<Proposal | null>(null)
  const [editing, setEditing] = useState<Proposal | null>(null)

  useEffect(() => subscribeMyProposals(uid, setProps_), [uid])
```

- [ ] **Step 2: Risoluzione persone + album meta + recensioni fatte**

Aggiungere effect che carica profili/rating, meta album e set recensiti:

```ts
  useEffect(() => {
    let off = false
    ;(async () => {
      const uids = new Set<string>()
      const albums = new Set<string>()
      props_.forEach((p) => { p.participants.forEach((u) => uids.add(u)); albums.add(p.albumId) })
      const ppl: Record<string, Person> = { ...people }
      for (const u of uids) {
        if (ppl[u]) continue
        const pr = await getPublicByUid(u)
        const r = await getRating(u)
        ppl[u] = { uid: u, username: pr?.username ?? 'utente', rating: r.avg }
      }
      const meta = { ...albumMeta }
      for (const a of albums) {
        if (meta[a]) continue
        const data = await loadAlbumData(a)
        meta[a] = { title: albumById[a]?.title ?? a, cover: albumById[a]?.cover, names: data.names ?? {} }
      }
      // recensioni già lasciate da me sui completati
      const done = new Set<string>()
      for (const p of props_.filter((x) => x.status === 'completed')) {
        const ou = otherParticipant(p.participants, uid)
        const revs = await getReviews(ou)
        if (revs.some((r) => r.id === p.id && r.fromUid === uid)) done.add(p.id)
      }
      if (!off) { setPeople(ppl); setAlbumMeta(meta); setReviewed(done) }
    })()
    return () => { off = true }
  }, [props_, uid]) // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 3: Suddivisione in sezioni**

Aggiungere i derivati (prima del `return`):

```ts
  const active = props_.filter((p) => p.status !== 'declined' && p.status !== 'cancelled')
  const received = active.filter((p) => p.status === 'pending' && p.turnUid === uid)
  const sent = active.filter((p) => p.status === 'pending' && p.turnUid !== uid)
  const inProgress = active.filter((p) => p.status === 'accepted')
  const completed = active.filter((p) => p.status === 'completed')
```

- [ ] **Step 4: Helper stato label/classe (riuso da ScambiMiei)**

```ts
  const statusLabel = (p: Proposal) =>
    p.status === 'completed' ? 'Completato'
    : p.status === 'accepted' ? (p.confirmedBy.includes(uid) ? 'In attesa conferma' : 'Conferma quando fatto')
    : p.turnUid === uid ? 'Tocca a te' : 'In attesa di risposta'
  const statusClass = (p: Proposal) =>
    p.status === 'completed' ? 'border-lime/30 bg-lime/10 text-lime'
    : 'border-white/12 bg-white/[0.04] text-muted-foreground'
```

- [ ] **Step 5: Render sezioni sotto il picker**

Dentro il blocco `if (!albumId)`, cambiare il titolo `<h1>` in `I miei scambi`, e **dopo** la griglia album (prima della chiusura del div contenitore), inserire:

```tsx
        <Section title="Proposte ricevute" items={received} render={(p) => (
          <SwapCard key={p.id} proposal={p} meUid={uid} people={people}
            albumTitle={albumMeta[p.albumId]?.title ?? ''} albumCover={albumMeta[p.albumId]?.cover}
            onViewCards={() => setViewing(p)} statusLabel={statusLabel(p)} statusClass={statusClass(p)}
            actions={<>
              <button onClick={() => acceptProposal(p.id)} className={btnPrimary}>Accetta</button>
              <button onClick={() => declineProposal(p.id)} className={btnGhost}>Rifiuta</button>
              <button onClick={() => setEditing(p)} className={btnGhost}>Modifica proposta</button>
            </>} />
        )} />

        <Section title="Proposte inviate" items={sent} render={(p) => (
          <SwapCard key={p.id} proposal={p} meUid={uid} people={people}
            albumTitle={albumMeta[p.albumId]?.title ?? ''} albumCover={albumMeta[p.albumId]?.cover}
            onViewCards={() => setViewing(p)} statusLabel={statusLabel(p)} statusClass={statusClass(p)}
            actions={<>
              <button onClick={() => cancelProposal(p.id)} className={btnGhost}>Annulla scambio</button>
              <button onClick={() => setEditing(p)} className={btnGhost}>Modifica proposta</button>
            </>} />
        )} />

        <Section title="Scambi in corso" items={inProgress} render={(p) => (
          <SwapCard key={p.id} proposal={p} meUid={uid} people={people}
            albumTitle={albumMeta[p.albumId]?.title ?? ''} albumCover={albumMeta[p.albumId]?.cover}
            onViewCards={() => setViewing(p)} statusLabel={statusLabel(p)} statusClass={statusClass(p)}
            actions={!p.confirmedBy.includes(uid)
              ? <button onClick={() => confirmProposal(p, uid)} className={btnPrimary}>Conferma scambio fatto</button>
              : null} />
        )} />

        <Section title="Scambi completati" items={completed} render={(p) => (
          <SwapCard key={p.id} proposal={p} meUid={uid} people={people}
            albumTitle={albumMeta[p.albumId]?.title ?? ''} albumCover={albumMeta[p.albumId]?.cover}
            onViewCards={() => setViewing(p)} statusLabel={statusLabel(p)} statusClass={statusClass(p)}
            actions={reviewed.has(p.id)
              ? <span className="text-sm text-muted-foreground">Recensione inviata</span>
              : <button onClick={() => setReviewing(p)} className={btnPrimary}>Lascia recensione</button>} />
        )} />
```

- [ ] **Step 6: Componenti/costanti locali di supporto**

In cima al file (fuori dal componente) aggiungere le classi bottone e il `Section`:

```tsx
const btnPrimary = 'rounded-xl bg-lime px-3 py-1.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 active:scale-[0.98]'
const btnGhost = 'rounded-xl border border-white/15 px-3 py-1.5 text-sm text-ink transition-colors hover:bg-white/[0.05] active:scale-[0.98]'

function Section({ title, items, render }: { title: string; items: Proposal[]; render: (p: Proposal) => React.ReactNode }) {
  if (items.length === 0) return null
  return (
    <section className="mt-10">
      <h2 className="mb-3 font-display text-xl font-bold tracking-tight text-ink">{title} <span className="text-muted-foreground">({items.length})</span></h2>
      <div className="grid gap-3 sm:grid-cols-2">{items.map(render)}</div>
    </section>
  )
}
```

- [ ] **Step 7: Dialog Visualizza carte + Review + Modifica**

Prima della chiusura del blocco landing (dentro il div), montare i dialog:

```tsx
        {viewing && (() => {
          const v = proposalView(viewing, uid)
          const nm = albumMeta[viewing.albumId]?.names ?? {}
          return <CardsDialog
            fromLabel={`${people[v.fromUid]?.username ?? 'utente'} dà`}
            toLabel={`${people[v.toUid]?.username ?? 'utente'} dà`}
            fromCodes={v.fromGives} toCodes={v.toGives} names={nm}
            onClose={() => setViewing(null)} />
        })()}

        {reviewing && (
          <div className="fixed inset-0 z-50 grid place-items-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setReviewing(null)} />
            <div className="relative w-full max-w-md">
              <ReviewDialog
                username={people[otherParticipant(reviewing.participants, uid)]?.username ?? 'utente'}
                onSubmit={async (r, c) => {
                  await createReview(otherParticipant(reviewing.participants, uid), reviewing.id, uid, r, c)
                  setReviewed((s) => new Set(s).add(reviewing.id)); setReviewing(null)
                }}
                onCancel={() => setReviewing(null)} />
            </div>
          </div>
        )}

        {editing && (() => {
          const v = proposalView(editing, uid)
          const meta = albumMeta[editing.albumId]
          // In modifica, l'editor lavora dalla mia prospettiva: io divento lastEditedBy.
          // "give" nel frame fromUid: se io sono fromUid -> give=ciò che do; altrimenti receive.
          const iAmFrom = editing.fromUid === uid
          const myGiveInit = iAmFrom ? editing.give : editing.receive
          const myRecvInit = iAmFrom ? editing.receive : editing.give
          return (
            <div className="fixed inset-0 z-50 grid place-items-center overflow-auto p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditing(null)} />
              <div className="relative w-full max-w-2xl">
                <ComponiScambio
                  username={people[otherParticipant(editing.participants, uid)]?.username ?? 'utente'}
                  albumNames={meta?.names ?? {}}
                  receiveCodes={myRecvInit} giveCodes={myGiveInit}
                  initialReceive={myRecvInit} initialGive={myGiveInit}
                  mode="edit"
                  onCancel={() => setEditing(null)}
                  onSend={async (give, receive) => {
                    // Rimappa nel frame fromUid prima di salvare.
                    const g = iAmFrom ? give : receive
                    const r = iAmFrom ? receive : give
                    await updateProposalOffer(editing, uid, g, r)
                    setEditing(null)
                  }} />
              </div>
            </div>
          )
        })()}
```

Nota: in modifica i codici selezionabili sono limitati a quelli già presenti nella proposta (`receiveCodes`/`giveCodes` = init). Ampliare il set (aggiungere nuove carte) è fuori scope di questo task.

- [ ] **Step 8: Rimuovere il link "/scambi/miei" nella vista match**

Nella vista stato-2 (match), eliminare il `<Link to="/scambi/miei">I miei scambi</Link>` (righe ~194-199): non serve più.

- [ ] **Step 9: Typecheck + lint + test**

Run: `cd figubook-app && npx tsc -b --noEmit && npm run lint 2>&1 | grep -E "error|warning" | tail -3 && npx vitest run`
Expected: tsc PASS; 0 errori lint; tutti i test verdi.

- [ ] **Step 10: Commit**

```bash
git add figubook-app/src/pages/Scambi.tsx
git commit -m "feat(scambi): landing unificata con 3 sezioni swap-card + modifica/annulla"
```

---

## Task 8: Rimuovere pagina e route `/scambi/miei`

**Files:**
- Delete: `src/pages/ScambiMiei.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Rimuovere import e route in `App.tsx`**

Eliminare la riga `import ScambiMiei from '@/pages/ScambiMiei'` e la riga `<Route path="/scambi/miei" element={<ScambiMiei />} />`.

- [ ] **Step 2: Cancellare il file**

```bash
git rm figubook-app/src/pages/ScambiMiei.tsx
```

- [ ] **Step 3: Verificare nessun altro riferimento**

Run: `cd figubook-app && grep -rn "scambi/miei\|ScambiMiei" src/`
Expected: nessun risultato.

- [ ] **Step 4: Typecheck + build**

Run: `cd figubook-app && npx tsc -b --noEmit && npm run build`
Expected: PASS (solo warning chunk-size).

- [ ] **Step 5: Commit**

```bash
git add -A figubook-app/src/App.tsx figubook-app/src/pages/ScambiMiei.tsx
git commit -m "refactor(scambi): rimuovi pagina/route separata I miei scambi"
```

---

## Task 9: Firestore rules — stati e campi update

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: Consentire nuovi campi su update proposals**

Nel blocco `match /proposals/{proposalId}` (riga ~170), la regola `allow update` attuale vincola vari campi immutabili. Verificare che NON blocchi la scrittura di `lastEditedBy`/`turnUid`/`status='cancelled'`. La regola attuale controlla che `participants/fromUid/toUid/albumId/createdAt` restino invariati e vincola `confirmedBy`/`status='completed'`. `lastEditedBy`/`turnUid`/`cancelled` non sono vietati esplicitamente → già permessi. Aggiungere un vincolo di integrità esplicito subito dopo `request.resource.data.createdAt == resource.data.createdAt`:

```
        // I nuovi campi devono restare coerenti coi partecipanti
        && request.resource.data.lastEditedBy in resource.data.participants
        && request.resource.data.turnUid in resource.data.participants
```

- [ ] **Step 2: Verificare che il secondo blocco duplicato `match /proposals` (riga ~207) sia coerente**

Run: `grep -n "match /proposals" firestore.rules`
Se esistono due blocchi `match /proposals/{proposalId}`, consolidarli in uno solo (mantenere la versione completa con read/create/update/delete del blocco riga ~170 e rimuovere il duplicato riga ~207 se ridondante). Verificare a mano che le clausole `create` (verified + fromUid==auth.uid) restino presenti.

- [ ] **Step 3: Deploy rules**

Run: `cd /Users/alessandrogelo/Desktop/FiguBook && firebase deploy --only firestore:rules`
Expected: "Deploy complete!".

- [ ] **Step 4: Commit**

```bash
git add firestore.rules
git commit -m "feat(scambi): rules per lastEditedBy/turnUid/cancelled su proposals"
```

---

## Task 10: Notifiche eventi trattativa

**Files:**
- Modify: `src/pages/Scambi.tsx`

- [ ] **Step 1: Helper notifica**

In `Scambi.tsx` aggiungere un helper che scrive una notifica al destinatario (riuso pattern esistente `handleSend`):

```ts
  async function notify(toUid: string, title: string) {
    try {
      const { addDoc, collection } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase')
      await addDoc(collection(db, 'users', toUid, 'notifications'), {
        fromUid: uid, type: 'trade', title, icon: '🔄', href: '/scambi', read: false, at: Date.now(),
      })
    } catch (e) { console.error('notifica scambio', e) }
  }
```

- [ ] **Step 2: Emettere notifiche su modifica/accetta**

Nel `onSend` del blocco `editing`, dopo `updateProposalOffer`, aggiungere:

```ts
                    await notify(otherParticipant(editing.participants, uid), 'Proposta aggiornata')
```

Nel bottone Accetta della sezione ricevute, cambiare in:

```tsx
              <button onClick={async () => { await acceptProposal(p.id); await notify(otherParticipant(p.participants, uid), 'Proposta accettata') }} className={btnPrimary}>Accetta</button>
```

- [ ] **Step 3: Typecheck**

Run: `cd figubook-app && npx tsc -b --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add figubook-app/src/pages/Scambi.tsx
git commit -m "feat(scambi): notifiche su proposta modificata/accettata"
```

---

## Task 11: Cache-bust + verifica finale + push

**Files:**
- Modify: `figubook-app/index.html` (se applica bump `?v=N` — vedi memory cache-bust-assets)

- [ ] **Step 1: Suite completa**

Run: `cd figubook-app && npx tsc -b --noEmit && npm run lint 2>&1 | grep -c "error" && npx vitest run && npm run build`
Expected: tsc PASS; 0 errori; test verdi; build ok.

- [ ] **Step 2: E2e manuale a 2 account (incognito + normale)**

Checklist:
- [ ] Account A invia proposta ad album → compare in "Proposte inviate" di A con stato "In attesa di risposta".
- [ ] Account B vede in "Proposte ricevute" con "Tocca a te" → Accetta/Rifiuta/Modifica visibili.
- [ ] B preme "Modifica proposta" → editor precompilato → salva → torna a A come "ricevuta" (contro-proposta), B ora vede "In attesa di risposta".
- [ ] "Visualizza carte" mostra le liste corrette (nomi veri) per FROM e TO.
- [ ] A Accetta → entrambi vedono "Scambi in corso" → Conferma bilaterale → "Completato".
- [ ] "Lascia recensione" funziona; dopo, mostra "Recensione inviata".
- [ ] "Annulla scambio" su una inviata → sparisce dalle liste.

- [ ] **Step 3: Push**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook && git push origin main
```

---

## Self-review note (coperture spec)
- Struttura pagina (titolo/picker/3 sezioni) → Task 7.
- Swap-card FROM/TO + Visualizza carte → Task 5,6.
- Modifica proposta (stesso doc, turno) → Task 2,3,7,10.
- Annulla scambio (cancelled) → Task 1,2,7,9.
- Editor precompilato → Task 4.
- Nomi figurine on-demand + cache → Task 7 (albumMeta).
- Notifiche → Task 10.
- Rules stati/campi → Task 9.
- Rimozione route separata → Task 8.
