# Scambi Fase 1.5 + Fase 2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Alla conferma di uno scambio aggiornare in automatico l'album di chi conferma (1.5); aggiungere rating a stelle + recensioni post-scambio con reputazione mostrata su match/profilo (2).

**Architecture:** Logica pura testabile per il calcolo dei nuovi conteggi album; wrapper in confirmProposal legge l'album una volta e fa un unico flush. Recensioni in `users/{toUid}/feedback/{proposalId}` (regole già esistenti); reputazione letta on-demand con cache client.

**Tech Stack:** React + TS + Vite, Firebase Firestore, Tailwind, Vitest.

**Convenzioni:** alias `@`→`src`; commenti IT concisi; builder puro testato + wrapper Firestore sottile; test `*.test.ts(x)` accanto al sorgente; commit path espliciti (NO `git add -A`), NO push tra i task (push a fine piano). Branch: `feat/scambi-fase2`.

---

## Task 1: Logica pura applyTradeToAlbum

**Files:** Create `figubook-app/src/lib/trade/applyTradeToAlbum.ts` + `.test.ts`

- [ ] **Step 1 — test** `figubook-app/src/lib/trade/applyTradeToAlbum.test.ts`
```ts
import { describe, it, expect } from 'vitest'
import { applyTradeToAlbum } from './applyTradeToAlbum'

describe('applyTradeToAlbum', () => {
  it('receive: +1 sui conteggi correnti', () => {
    const states = { '5': 'have' }        // 5 posseduta singola
    const counts = {}
    const out = applyTradeToAlbum(states, counts, { give: [], receive: ['5', '9'] })
    expect(out['5']).toBe(2)  // singola -> doppia
    expect(out['9']).toBe(1)  // mancante -> posseduta
  })
  it('give: -1 con floor a 0', () => {
    const states = { '5': 'double', '9': 'have' }
    const counts = { '5': 3 }
    const out = applyTradeToAlbum(states, counts, { give: ['5', '9'], receive: [] })
    expect(out['5']).toBe(2)  // 3 -> 2
    expect(out['9']).toBe(0)  // 1 -> 0 (mancante)
  })
  it('stesso codice in give e receive si compensa', () => {
    const states = { '7': 'have' }
    const out = applyTradeToAlbum(states, {}, { give: ['7'], receive: ['7'] })
    expect(out['7']).toBe(1)  // 1 -1 +1 = 1
  })
})
```

- [ ] **Step 2** — `cd figubook-app && npx vitest run src/lib/trade/applyTradeToAlbum.test.ts` → FAIL.

- [ ] **Step 3 — impl** `figubook-app/src/lib/trade/applyTradeToAlbum.ts`
```ts
import { counterOf } from '@/lib/album/stats'

// Dato lo stato album e uno scambio, ritorna i NUOVI conteggi assoluti (code->count)
// per i soli codici toccati. receive = +1, give = -1 (floor 0). Da passare a flushAlbumCounts.
export function applyTradeToAlbum(
  states: Record<string, string>,
  counts: Record<string, number>,
  trade: { give: string[]; receive: string[] },
): Record<string, number> {
  const out: Record<string, number> = {}
  const cur = (code: string) => (code in out ? out[code] : counterOf(code, states, counts))
  for (const code of trade.receive) out[code] = cur(code) + 1
  for (const code of trade.give) out[code] = Math.max(0, cur(code) - 1)
  return out
}
```

- [ ] **Step 4** — run test → PASS (3).
- [ ] **Step 5 — commit**
```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add figubook-app/src/lib/trade/applyTradeToAlbum.ts figubook-app/src/lib/trade/applyTradeToAlbum.test.ts
git commit -m "feat(scambi): logica pura applyTradeToAlbum"
```

---

## Task 2: confirmProposal applica l'album

**Files:** Modify `figubook-app/src/lib/db/proposals.ts`

- [ ] **Step 1 — leggi** `proposals.ts`: `confirmProposal(p: Proposal, uid: string)` esiste. Aggiungi l'applicazione all'album dell'utente `uid` PRIMA (o dopo) dell'update stato. La proposta ha `albumId`, `give`, `receive`. Da `uid`, `receive` è ciò che l'utente riceve, `give` ciò che dà.

- [ ] **Step 2 — impl**: in `proposals.ts` aggiungi import e una funzione helper, poi chiamala in `confirmProposal`.
```ts
import { subscribeAlbum, flushAlbumCounts } from '@/lib/db/albums'
import { applyTradeToAlbum } from '@/lib/trade/applyTradeToAlbum'

// Applica lo scambio all'album di chi conferma (una lettura + un flush).
async function applyToMyAlbum(uid: string, p: Proposal): Promise<void> {
  await new Promise<void>((resolve) => {
    const unsub = subscribeAlbum(uid, p.albumId, async (d) => {
      unsub()
      const deltas = applyTradeToAlbum(d.states, d.counts, { give: p.give, receive: p.receive })
      try { await flushAlbumCounts(uid, p.albumId, deltas) } catch (e) { console.error('apply trade', e) }
      resolve()
    })
  })
}
```
E dentro `confirmProposal`, prima dell'updateDoc, aggiungi:
```ts
  await applyToMyAlbum(uid, p)
```
(Nota: `flushAlbumCounts` è già importato? Se sì non duplicare l'import; se `AlbumDoc` fornisce `counts`, ok — cb riceve `{states, counts}`.)

- [ ] **Step 3** — `cd figubook-app && npx tsc -b --noEmit && npx vitest run src/lib/db/proposals.test.ts` → verde (i test helper esistenti restano validi).
- [ ] **Step 4 — commit**
```bash
git add figubook-app/src/lib/db/proposals.ts
git commit -m "feat(scambi): conferma applica lo scambio al proprio album"
```

---

## Task 3: Modulo feedback (recensioni + rating)

**Files:** Create `figubook-app/src/lib/db/feedback.ts` + `.test.ts`

- [ ] **Step 1 — test** (parte pura: aggregazione media) `figubook-app/src/lib/db/feedback.test.ts`
```ts
import { describe, it, expect } from 'vitest'
import { aggregateRating } from './feedback'

describe('aggregateRating', () => {
  it('media e conteggio', () => {
    expect(aggregateRating([{ rating: 5 }, { rating: 4 }, { rating: 3 }])).toEqual({ avg: 4, count: 3 })
  })
  it('vuoto -> avg 0 count 0', () => {
    expect(aggregateRating([])).toEqual({ avg: 0, count: 0 })
  })
})
```

- [ ] **Step 2** — run → FAIL.

- [ ] **Step 3 — impl** `figubook-app/src/lib/db/feedback.ts`
```ts
import { collection, doc, getDocs, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface Review {
  id: string
  fromUid: string
  proposalId: string
  rating: number
  comment: string
  createdAt: number
}
export interface Rating { avg: number; count: number }

// Parte pura: media arrotondata a 1 decimale + conteggio.
export function aggregateRating(items: { rating: number }[]): Rating {
  if (items.length === 0) return { avg: 0, count: 0 }
  const sum = items.reduce((n, r) => n + r.rating, 0)
  return { avg: Math.round((sum / items.length) * 10) / 10, count: items.length }
}

// Scrive/aggiorna la recensione (id = proposalId) nel profilo del recensito.
export async function createReview(
  toUid: string, proposalId: string, fromUid: string, rating: number, comment: string,
): Promise<void> {
  await setDoc(doc(db, 'users', toUid, 'feedback', proposalId), {
    fromUid, proposalId, rating, comment, createdAt: Date.now(),
  })
}

// Recensioni ricevute da un utente (one-shot).
export async function getReviews(uid: string): Promise<Review[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'feedback'))
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Review, 'id'>) }))
}

// Reputazione di un utente (letta on-demand).
export async function getRating(uid: string): Promise<Rating> {
  return aggregateRating(await getReviews(uid))
}

// Live delle recensioni ricevute (per il profilo).
export function subscribeReviews(uid: string, cb: (r: Review[]) => void): () => void {
  return onSnapshot(
    collection(db, 'users', uid, 'feedback'),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Review, 'id'>) }))),
    (err) => { console.error('reviews', err); cb([]) },
  )
}
```

- [ ] **Step 4** — run test → PASS; `npx tsc -b --noEmit` → 0.
- [ ] **Step 5 — commit**
```bash
git add figubook-app/src/lib/db/feedback.ts figubook-app/src/lib/db/feedback.test.ts
git commit -m "feat(scambi): modulo feedback (recensioni + rating)"
```

---

## Task 4: Componente StarRating

**Files:** Create `figubook-app/src/components/trade/StarRating.tsx`

- [ ] **Step 1 — impl**
```tsx
import { Star } from 'lucide-react'

interface Props {
  value: number
  onChange?: (v: number) => void   // se presente: input; altrimenti display
  size?: number
}

// Stelle: display (media) o input (selezione 1-5) se onChange è passato.
export function StarRating({ value, onChange, size = 18 }: Props) {
  const stars = [1, 2, 3, 4, 5]
  return (
    <div className="flex items-center gap-0.5">
      {stars.map((s) => {
        const filled = s <= Math.round(value)
        const cls = filled ? 'fill-lime text-lime' : 'text-white/25'
        return onChange ? (
          <button key={s} type="button" aria-label={`${s} stelle`} onClick={() => onChange(s)} className="transition-transform active:scale-90">
            <Star style={{ width: size, height: size }} className={cls} />
          </button>
        ) : (
          <Star key={s} style={{ width: size, height: size }} className={cls} />
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2** — `cd figubook-app && npx tsc -b --noEmit` → 0.
- [ ] **Step 3 — commit**
```bash
git add figubook-app/src/components/trade/StarRating.tsx
git commit -m "feat(scambi): StarRating (display + input)"
```

---

## Task 5: Componente ReviewDialog

**Files:** Create `figubook-app/src/components/trade/ReviewDialog.tsx`

- [ ] **Step 1 — impl** (stelle obbligatorie, testo facoltativo ≤500)
```tsx
import { useState } from 'react'
import { StarRating } from './StarRating'

interface Props {
  username: string
  onSubmit: (rating: number, comment: string) => void
  onCancel: () => void
}

export function ReviewDialog({ username, onSubmit, onCancel }: Props) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-card p-5">
      <div className="font-semibold text-ink">Recensisci {username}</div>
      <StarRating value={rating} onChange={setRating} size={28} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, 500))}
        placeholder="Com'è andato lo scambio? (facoltativo)"
        rows={3}
        className="w-full resize-none rounded-xl border border-white/12 bg-white/[0.03] p-3 text-sm text-ink outline-none focus:border-lime/50"
      />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-xl border border-white/15 px-4 py-2 text-ink">Annulla</button>
        <button
          disabled={rating === 0}
          onClick={() => onSubmit(rating, comment.trim())}
          className="rounded-xl bg-lime px-4 py-2 font-semibold text-black disabled:opacity-40"
        >
          Invia recensione
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2** — `npx tsc -b --noEmit` → 0.
- [ ] **Step 3 — commit**
```bash
git add figubook-app/src/components/trade/ReviewDialog.tsx
git commit -m "feat(scambi): ReviewDialog (stelle + testo)"
```

---

## Task 6: "Lascia recensione" in ScambiMiei

**Files:** Modify `figubook-app/src/pages/ScambiMiei.tsx`

- [ ] **Step 1 — leggi** ScambiMiei. Per le proposte `completed`, mostra "Lascia recensione" (apre ReviewDialog inline) se non già recensita, altrimenti "Recensione inviata".
- [ ] **Step 2 — impl**: aggiungi stato per quale proposta si sta recensendo e il set delle già recensite dall'utente corrente.
```tsx
import { useState, useEffect } from 'react'
import { createReview, getReviews } from '@/lib/db/feedback'
import { ReviewDialog } from '@/components/trade/ReviewDialog'
// dato uid e la proposta p, l'altro utente:
const other = (p: Proposal) => (p.fromUid === uid ? p.toUid : p.fromUid)
// set proposte già recensite da me: le mie review le ho scritte nel feedback dell'ALTRO,
// quindi non le leggo facilmente. Semplificazione: traccia localmente dopo l'invio + prova a
// leggere per ogni completed la review nel profilo dell'altro con doc id == p.id (fromUid==uid).
```
Per sapere se ho già recensito una proposta: leggo `getReviews(other(p))` e verifico se esiste
review con `id === p.id && fromUid === uid`. Implementa un effetto che, per le proposte completed,
popola un `Set<string>` `reviewedProposalIds`.
```tsx
const [reviewed, setReviewed] = useState<Set<string>>(new Set())
const [reviewing, setReviewing] = useState<Proposal | null>(null)
useEffect(() => {
  const completed = list.filter((p) => p.status === 'completed')
  let cancelled = false
  ;(async () => {
    const done = new Set<string>()
    for (const p of completed) {
      const revs = await getReviews(other(p))
      if (revs.some((r) => r.id === p.id && r.fromUid === uid)) done.add(p.id)
    }
    if (!cancelled) setReviewed(done)
  })()
  return () => { cancelled = true }
}, [list, uid])

async function submitReview(p: Proposal, rating: number, comment: string) {
  await createReview(other(p), p.id, uid, rating, comment)
  setReviewed((s) => new Set(s).add(p.id))
  setReviewing(null)
}
```
Nel render di ogni proposta `completed`:
```tsx
{p.status === 'completed' && (
  reviewed.has(p.id)
    ? <span className="text-sm text-muted-foreground">Recensione inviata</span>
    : <button onClick={() => setReviewing(p)} className="rounded-xl px-3 py-1 bg-lime text-black font-semibold">Lascia recensione</button>
)}
{reviewing?.id === p.id && (
  <div className="mt-3">
    <ReviewDialog username={/* username dell'altro, vedi sotto */ other(p)} onSubmit={(r, c) => submitReview(p, r, c)} onCancel={() => setReviewing(null)} />
  </div>
)}
```
Per lo username dell'altro: usa `getPublicByUid(other(p))` per risolvere il nome (facoltativo;
in mancanza mostra l'uid). Se semplice, passa lo username risolto in una mappa.

- [ ] **Step 3** — `npx tsc -b --noEmit && npm run build` → 0.
- [ ] **Step 4 — commit**
```bash
git add figubook-app/src/pages/ScambiMiei.tsx
git commit -m "feat(scambi): lascia recensione su scambi completati"
```

---

## Task 7: Rating su MatchCard + filtro ★ reale

**Files:** Modify `figubook-app/src/components/trade/MatchCard.tsx`, `figubook-app/src/pages/Scambi.tsx`, `figubook-app/src/components/trade/FilterChips.tsx`

- [ ] **Step 1 — MatchCard**: aggiungi prop `rating?: { avg: number; count: number }`. Mostra sotto/accanto username: se `count>0` → `<StarRating value={avg} size={14}/> avg (count)`, altrimenti `Nuovo`.
- [ ] **Step 2 — Scambi.tsx**: nel calcolo delle Row, dopo `getPublicByUid`, chiama `getRating(e.uid)` (import da `@/lib/db/feedback`) e salva `rating` nella Row. Passa `rating` a `<MatchCard>`. Usa una cache locale `Map<string, Rating>` per non rileggere lo stesso uid.
- [ ] **Step 3 — FilterChips**: aggiungi terza chip `★ 4+` che setta `filters.minStars` (estendi `TradeFilters` con `minStars: boolean`). In Scambi, nel `visible` useMemo, se `filters.minStars` filtra `r.rating?.avg >= 4`.
```ts
// TradeFilters
export interface TradeFilters { reciprocal: boolean; nearMe: boolean; minStars: boolean }
```
Aggiorna lo stato iniziale in Scambi: `{ reciprocal: true, nearMe: false, minStars: false }`.
- [ ] **Step 4** — `npx tsc -b --noEmit && npm run build` → 0.
- [ ] **Step 5 — commit**
```bash
git add figubook-app/src/components/trade/MatchCard.tsx figubook-app/src/components/trade/FilterChips.tsx figubook-app/src/pages/Scambi.tsx
git commit -m "feat(scambi): rating su MatchCard + filtro stelle reale"
```

---

## Task 8: Reputazione + recensioni su Profilo pubblico

**Files:** Modify `figubook-app/src/pages/ProfiloPubblico.tsx`

- [ ] **Step 1 — leggi** ProfiloPubblico per capire come ottiene l'uid del profilo mostrato.
- [ ] **Step 2 — impl**: sottoscrivi le recensioni ricevute e mostra un blocco reputazione + lista.
```tsx
import { useEffect, useState } from 'react'
import { subscribeReviews, aggregateRating, type Review } from '@/lib/db/feedback'
import { StarRating } from '@/components/trade/StarRating'
// dato profileUid:
const [reviews, setReviews] = useState<Review[]>([])
useEffect(() => profileUid ? subscribeReviews(profileUid, setReviews) : undefined, [profileUid])
const rating = aggregateRating(reviews)
```
Render (posiziona in modo coerente con lo stile della pagina):
```tsx
{rating.count > 0 ? (
  <div className="flex items-center gap-2">
    <StarRating value={rating.avg} size={16} />
    <span className="text-sm text-ink">{rating.avg} · {rating.count} recensioni</span>
  </div>
) : <span className="text-sm text-muted-foreground">Nessuna recensione</span>}
{/* lista */}
{reviews.map((r) => (
  <div key={r.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
    <StarRating value={r.rating} size={14} />
    {r.comment && <p className="mt-1 text-sm text-ink">{r.comment}</p>}
  </div>
))}
```
Adatta ai nomi/stili reali della pagina.

- [ ] **Step 3** — `npx tsc -b --noEmit && npm run build && npx vitest run` → tutto verde.
- [ ] **Step 4 — commit**
```bash
git add figubook-app/src/pages/ProfiloPubblico.tsx
git commit -m "feat(scambi): reputazione e recensioni su profilo pubblico"
```

---

## Task 9: Verifica finale + push

- [ ] **Step 1** — `cd figubook-app && npx tsc -b --noEmit && npm run lint 2>&1 | grep -c error ; npx vitest run ; npm run build` → tsc ok, lint 0, test verdi, build ok.
- [ ] **Step 2 — push**
```bash
cd /Users/alessandrogelo/Desktop/FiguBook && git push origin feat/scambi-fase2
```
(Poi merge su main via finishing-a-development-branch.)

---

## Self-Review
- Copertura spec: 1.5 album update (T1,T2); recensioni dati (T3); UI recensione (T4,T5,T6);
  rating su match + filtro (T7); reputazione profilo (T8). Regole feedback già esistenti — nessuna
  modifica rules necessaria.
- Placeholder: nessuno; codice concreto in ogni step.
- Type consistency: `Rating {avg,count}`, `Review`, `TradeFilters` con `minStars`, `applyTradeToAlbum`
  firma coerente tra task. `createReview(toUid, proposalId, fromUid, rating, comment)` usata in T6.
- Nota: T6 "già recensito" legge le review dell'altro utente e cerca `id===p.id && fromUid===uid`.
