# Community Fase 2 "Suggeriti sempre-on" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendere "Collezionisti per te" una sezione sempre visibile sotto la lista amici, con "Mostra altri" che pagina i suggeriti escludendo i già-visti.

**Architecture:** La Cloud Function `nearbyCollectors` guadagna input `{ exclude, limit }` e output `{ uids, hasMore }`; la logica pura `rankCandidates` esclude gli uid già mostrati. Il client passa da fetch una-tantum a hook accumulatore (`useNearbyCollectors` con `loadMore`), e la pagina Community rende una sezione suggeriti permanente sotto gli amici.

**Tech Stack:** Firebase Functions v2 (onCall, `europe-west1`), Firestore `collectionGroup`, React + TypeScript, Vitest, Tailwind.

---

## File Structure

- `functions/src/nearbyCollectors.ts` — Modify. Nuova firma `rankCandidates` con `exclude`; handler legge/clampa `{ exclude, limit }`, ritorna `{ uids, hasMore }`.
- `functions/src/nearbyCollectors.test.ts` — Modify. Aggiorna chiamate esistenti alla nuova firma + nuovi test `exclude`/`limit clamp`.
- `figubook-app/src/lib/functions/nearby.ts` — Modify. `fetchNearbyUids(exclude, limit)` → `{ uids, hasMore }`.
- `figubook-app/src/hooks/useNearbyCollectors.ts` — Modify. Accumulatore `{ people, hasMore, loading, loadMore }`.
- `figubook-app/src/hooks/useNearbyCollectors.test.ts` — Create. Test accumulo/dedup/loadMore/hasMore con `fetchNearbyUids` mockata.
- `figubook-app/src/pages/Community.tsx` — Modify. Sezione "Collezionisti per te" permanente + pannello 3-step condizionato.

---

## Task 1: Function — `rankCandidates` esclude i già-visti

**Files:**
- Modify: `functions/src/nearbyCollectors.ts:18-29`
- Test: `functions/src/nearbyCollectors.test.ts`

- [ ] **Step 1: Aggiorna i test esistenti alla nuova firma e aggiungi i nuovi**

La nuova firma inserisce `exclude` **prima** di `limit`:
`rankCandidates(me, cands, friends, blocked, exclude, limit)`. Le 4 chiamate
esistenti nel file passano `[]` come `exclude`. Sostituisci l'intero blocco
`describe('rankCandidates', ...)` con:

```ts
describe('rankCandidates', () => {
  it('ordina CAP prima di provincia prima di squadra', () => {
    const cands: C[] = [
      { uid: 'team', favTeam: 'inter', provincia: 'RM', cap: '00100', isPublic: true },
      { uid: 'prov', favTeam: 'milan', provincia: 'MI', cap: '20200', isPublic: true },
      { uid: 'cap', favTeam: 'milan', provincia: 'MI', cap: '20100', isPublic: true },
    ]
    const r = rankCandidates(me, cands, ['friendUid'], ['blockedUid'], [], 6)
    expect(r).toEqual(['cap', 'prov', 'team'])
  })
  it('esclude me, amici, bloccati e privati', () => {
    const cands: C[] = [
      { uid: 'me', cap: '20100', isPublic: true },
      { uid: 'friendUid', cap: '20100', isPublic: true },
      { uid: 'blockedUid', cap: '20100', isPublic: true },
      { uid: 'priv', cap: '20100', isPublic: false },
      { uid: 'ok', cap: '20100', isPublic: true },
    ]
    const r = rankCandidates(me, cands, ['friendUid'], ['blockedUid'], [], 6)
    expect(r).toEqual(['ok'])
  })
  it('rispetta il limite', () => {
    const cands: C[] = Array.from({ length: 10 }, (_, i) => ({
      uid: 'u' + i, favTeam: 'inter', isPublic: true,
    }))
    expect(rankCandidates(me, cands, [], [], [], 6)).toHaveLength(6)
  })
  it('nessun tier disponibile → vuoto', () => {
    const cands: C[] = [{ uid: 'x', favTeam: 'juve', provincia: 'TO', cap: '10100', isPublic: true }]
    expect(rankCandidates(me, cands, [], [], [], 6)).toEqual([])
  })
  it('exclude rimuove gli uid già mostrati', () => {
    const cands: C[] = [
      { uid: 'cap', cap: '20100', isPublic: true },
      { uid: 'prov', provincia: 'MI', isPublic: true },
    ]
    const r = rankCandidates(me, cands, [], [], ['cap'], 6)
    expect(r).toEqual(['prov'])
  })
  it('exclude si somma ad amici e bloccati', () => {
    const cands: C[] = [
      { uid: 'a', cap: '20100', isPublic: true },
      { uid: 'b', cap: '20100', isPublic: true },
      { uid: 'c', cap: '20100', isPublic: true },
    ]
    const r = rankCandidates(me, cands, ['a'], ['b'], ['c'], 6)
    expect(r).toEqual([])
  })
})
```

- [ ] **Step 2: Esegui i test, verifica fallimento**

Run: `cd functions && npx vitest run src/nearbyCollectors.test.ts`
Expected: FAIL — `rankCandidates` accetta 5 arg, i test ne passano 6 (l'ultimo `limit` finisce ignorato / tipo errato).

- [ ] **Step 3: Aggiungi il parametro `exclude` a `rankCandidates`**

In `functions/src/nearbyCollectors.ts`, sostituisci la funzione (righe 18-29):

```ts
export function rankCandidates(
  me: Me, cands: Cand[], friends: string[], blocked: string[],
  exclude: string[], limit: number,
): string[] {
  const excl = new Set<string>([me.uid, ...friends, ...blocked, ...exclude])
  return cands
    .filter((c) => c.isPublic && !excl.has(c.uid))
    .map((c) => ({ uid: c.uid, t: tier(me, c) }))
    .filter((x) => x.t >= 0)
    .sort((a, b) => a.t - b.t)
    .slice(0, limit)
    .map((x) => x.uid)
}
```

- [ ] **Step 4: Esegui i test, verifica passaggio**

Run: `cd functions && npx vitest run src/nearbyCollectors.test.ts`
Expected: PASS (6 test).

- [ ] **Step 5: Commit**

```bash
git add functions/src/nearbyCollectors.ts functions/src/nearbyCollectors.test.ts
git commit -m "feat(functions): rankCandidates esclude gli uid già mostrati"
```

---

## Task 2: Function — handler legge `{ exclude, limit }`, ritorna `{ uids, hasMore }`

**Files:**
- Modify: `functions/src/nearbyCollectors.ts:55-74`

Nota: l'handler `onCall` non è coperto da unit test in questo repo (solo la
logica pura lo è). La verifica è via `tsc` + review; la correttezza di `hasMore`
è già coperta indirettamente dal `limit` in Task 1.

- [ ] **Step 1: Riscrivi l'handler con clamp input e `hasMore`**

Sostituisci il blocco `export const nearbyCollectors = onCall(...)` (righe 55-74):

```ts
export const nearbyCollectors = onCall({ region: 'europe-west1' }, async (req) => {
  const uid = req.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Login richiesto')
  const db = admin.firestore()

  const data = (req.data as { exclude?: unknown; limit?: unknown }) ?? {}
  const exclude: string[] = Array.isArray(data.exclude)
    ? data.exclude.filter((x): x is string => typeof x === 'string')
    : []
  const rawLimit = typeof data.limit === 'number' ? data.limit : 6
  const limit = Math.min(12, Math.max(1, Math.floor(rawLimit)))

  const meSnap = await db.doc(`users/${uid}/meta/profile`).get()
  const mp = (meSnap.data() as any) ?? {}
  const me: Me = { uid, cap: mp.cap, provincia: mp.provincia, favTeam: mp.favTeam }
  const blocked: string[] = Array.isArray(mp.blocked) ? mp.blocked : []

  const frSnap = await db.collection('friendships').where('users', 'array-contains', uid).get()
  const friends: string[] = []
  for (const d of frSnap.docs) {
    const users: string[] = (d.data() as any).users ?? []
    for (const u of users) if (u !== uid) friends.push(u)
  }

  const cands = await fetchCandidates(db, me)
  const uids = rankCandidates(me, cands, friends, blocked, exclude, limit)
  return { uids, hasMore: uids.length === limit }
})
```

- [ ] **Step 2: Typecheck**

Run: `cd functions && npx tsc -b --noEmit`
Expected: exit 0.

- [ ] **Step 3: Suite function verde**

Run: `cd functions && npx vitest run`
Expected: PASS (tutti i test, incluso deleteAccountCascade).

- [ ] **Step 4: Commit**

```bash
git add functions/src/nearbyCollectors.ts
git commit -m "feat(functions): nearbyCollectors accetta exclude/limit e ritorna hasMore"
```

---

## Task 3: Client — `fetchNearbyUids(exclude, limit)` → `{ uids, hasMore }`

**Files:**
- Modify: `figubook-app/src/lib/functions/nearby.ts`

- [ ] **Step 1: Riscrivi `fetchNearbyUids`**

Sostituisci l'intero contenuto di `figubook-app/src/lib/functions/nearby.ts`:

```ts
// figubook-app/src/lib/functions/nearby.ts
import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '@/lib/firebase'

const fns = getFunctions(app, 'europe-west1')

type NearbyResult = { uids: string[]; hasMore: boolean }

// Ritorna un batch di uid vicini (CAP→provincia→squadra), escludendo i già-visti.
export async function fetchNearbyUids(
  exclude: string[], limit: number,
): Promise<NearbyResult> {
  const call = httpsCallable<{ exclude: string[]; limit: number }, NearbyResult>(
    fns, 'nearbyCollectors',
  )
  const res = await call({ exclude, limit })
  return { uids: res.data?.uids ?? [], hasMore: res.data?.hasMore ?? false }
}
```

- [ ] **Step 2: Typecheck (fallisce finché l'hook usa la vecchia firma)**

Run: `cd figubook-app && npx tsc -b --noEmit`
Expected: FAIL in `useNearbyCollectors.ts` (chiama `fetchNearbyUids()` senza arg). Verrà risolto in Task 4. Non committare da solo — procedi a Task 4 e committa insieme.

---

## Task 4: Client — `useNearbyCollectors` accumulatore paginato

**Files:**
- Modify: `figubook-app/src/hooks/useNearbyCollectors.ts`
- Test: `figubook-app/src/hooks/useNearbyCollectors.test.ts` (Create)

- [ ] **Step 1: Scrivi il test dell'hook**

Crea `figubook-app/src/hooks/useNearbyCollectors.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useNearbyCollectors } from './useNearbyCollectors'

vi.mock('@/lib/functions/nearby', () => ({ fetchNearbyUids: vi.fn() }))
vi.mock('@/lib/db/publicProfiles', () => ({ getPublicByUid: vi.fn() }))

import { fetchNearbyUids } from '@/lib/functions/nearby'
import { getPublicByUid } from '@/lib/db/publicProfiles'

const prof = (uid: string) => ({ uid, username: uid, avatarId: 0 }) as any

beforeEach(() => {
  vi.mocked(getPublicByUid).mockImplementation(async (uid: string) => prof(uid))
})

describe('useNearbyCollectors', () => {
  it('carica il primo batch al mount', async () => {
    vi.mocked(fetchNearbyUids).mockResolvedValueOnce({ uids: ['a', 'b'], hasMore: false })
    const { result } = renderHook(() => useNearbyCollectors())
    await waitFor(() => expect(result.current.people).toHaveLength(2))
    expect(result.current.people.map((p) => p.uid)).toEqual(['a', 'b'])
    expect(result.current.hasMore).toBe(false)
  })

  it('loadMore passa i seenUids come exclude e appende senza duplicati', async () => {
    vi.mocked(fetchNearbyUids)
      .mockResolvedValueOnce({ uids: ['a', 'b'], hasMore: true })
      .mockResolvedValueOnce({ uids: ['b', 'c'], hasMore: false })
    const { result } = renderHook(() => useNearbyCollectors())
    await waitFor(() => expect(result.current.people).toHaveLength(2))

    act(() => { result.current.loadMore() })
    await waitFor(() => expect(result.current.hasMore).toBe(false))

    // secondo fetch riceve i già-visti
    expect(vi.mocked(fetchNearbyUids).mock.calls[1][0]).toEqual(['a', 'b'])
    // 'b' duplicato non riappende
    expect(result.current.people.map((p) => p.uid)).toEqual(['a', 'b', 'c'])
  })

  it('loadMore è no-op quando hasMore è false', async () => {
    vi.mocked(fetchNearbyUids).mockResolvedValueOnce({ uids: ['a'], hasMore: false })
    const { result } = renderHook(() => useNearbyCollectors())
    await waitFor(() => expect(result.current.people).toHaveLength(1))

    act(() => { result.current.loadMore() })
    expect(vi.mocked(fetchNearbyUids)).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Esegui il test, verifica fallimento**

Run: `cd figubook-app && npx vitest run src/hooks/useNearbyCollectors.test.ts`
Expected: FAIL — l'hook attuale non espone `hasMore`/`loadMore` e non accumula.

- [ ] **Step 3: Riscrivi l'hook come accumulatore**

Sostituisci l'intero contenuto di `figubook-app/src/hooks/useNearbyCollectors.ts`:

```ts
// figubook-app/src/hooks/useNearbyCollectors.ts
import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchNearbyUids } from '@/lib/functions/nearby'
import { getPublicByUid } from '@/lib/db/publicProfiles'
import type { PublicProfile } from '@/lib/db/profile'

const PAGE = 6

// Suggeriti di prossimità paginati: primo batch al mount, loadMore per i successivi.
export function useNearbyCollectors(): {
  people: PublicProfile[]
  hasMore: boolean
  loading: boolean
  loadMore: () => void
} {
  const [people, setPeople] = useState<PublicProfile[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const seen = useRef<string[]>([])
  const seenSet = useRef<Set<string>>(new Set())
  const inFlight = useRef(false)

  const load = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    setLoading(true)
    try {
      const { uids, hasMore: more } = await fetchNearbyUids([...seen.current], PAGE)
      for (const u of uids) {
        if (!seenSet.current.has(u)) { seenSet.current.add(u); seen.current.push(u) }
      }
      const profs = await Promise.all(uids.map((u) => getPublicByUid(u)))
      const fresh = profs.filter((p): p is PublicProfile => !!p)
      setPeople((prev) => {
        const have = new Set(prev.map((p) => p.uid))
        return [...prev, ...fresh.filter((p) => !have.has(p.uid))]
      })
      setHasMore(more)
    } catch {
      setHasMore(false)
    } finally {
      inFlight.current = false
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const loadMore = useCallback(() => {
    if (!hasMore || inFlight.current) return
    load()
  }, [hasMore, load])

  return { people, hasMore, loading, loadMore }
}
```

- [ ] **Step 4: Esegui il test, verifica passaggio**

Run: `cd figubook-app && npx vitest run src/hooks/useNearbyCollectors.test.ts`
Expected: PASS (3 test).

- [ ] **Step 5: Typecheck (Community.tsx ancora vecchia firma → può fallire)**

Run: `cd figubook-app && npx tsc -b --noEmit`
Expected: FAIL in `Community.tsx` (`useNearbyCollectors(noFriends)` ora senza arg + destrutturazione diversa). Risolto in Task 5.

- [ ] **Step 6: Commit (lib + hook insieme, chiude il buco di tipi di Task 3)**

```bash
git add figubook-app/src/lib/functions/nearby.ts figubook-app/src/hooks/useNearbyCollectors.ts figubook-app/src/hooks/useNearbyCollectors.test.ts
git commit -m "feat(community): useNearbyCollectors accumulatore paginato con loadMore"
```

---

## Task 5: Pagina — sezione "Collezionisti per te" permanente

**Files:**
- Modify: `figubook-app/src/pages/Community.tsx`

- [ ] **Step 1: Aggiorna la chiamata all'hook**

In `figubook-app/src/pages/Community.tsx`, sostituisci le righe 45-46:

```tsx
  const noFriends = friends.length === 0
  const { people: nearby } = useNearbyCollectors(noFriends)
```

con:

```tsx
  const noFriends = friends.length === 0
  const { people: nearby, hasMore, loading: nearbyLoading, loadMore } = useNearbyCollectors()
```

- [ ] **Step 2: Sostituisci la sezione "I miei amici" con amici + suggeriti permanenti**

Sostituisci l'intero blocco `<FadeIn>` della sezione amici (righe 115-153, da
`<FadeIn>` contenente `<h2 ...>I miei amici</h2>` fino alla `</FadeIn>` di
chiusura prima di `</div>`) con:

```tsx
      {friends.length > 0 && (
        <FadeIn>
          <h2 className="type-h2 mt-8 text-ink">I miei amici</h2>
          <div className="mt-3 space-y-2">{friends.map((u) => <PersonRow key={u.uid} u={u} />)}</div>
        </FadeIn>
      )}

      {nearby.length > 0 && (
        <FadeIn>
          <h2 className="type-h2 mt-8 text-ink">Collezionisti per te</h2>
          <p className="mt-1 text-sm text-ink-2">Vicini a te per zona o squadra del cuore.</p>
          <div className="mt-3 space-y-2">{nearby.map((u) => <PersonRow key={u.uid} u={u} />)}</div>
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={nearbyLoading}
              className="group mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-white/30 disabled:opacity-50"
            >
              {nearbyLoading ? 'Carico…' : 'Mostra altri'}
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </button>
          )}
        </FadeIn>
      )}

      {friends.length === 0 && nearby.length === 0 && !nearbyLoading && (
        <FadeIn>
          <div className="mt-8 rounded-2xl border border-white/[0.08] bg-surface/40 p-5 sm:p-6">
            <p className="type-body text-ink">La tua cerchia è ancora vuota.</p>
            <p className="mt-1 text-sm text-ink-2">Bastano pochi passi per popolarla.</p>
            <ol className="mt-5 space-y-4">
              {[
                ['1', 'Invita i tuoi amici', 'Manda il tuo link: chi si iscrive entra nella tua cerchia.'],
                ['2', 'Trova collezionisti vicini', 'Appari qui quando altri della tua zona o squadra si iscrivono.'],
                ['3', 'Sblocca ricompense', 'Presto: più inviti e attività, più vantaggi in FiguBook.'],
              ].map(([n, title, desc]) => (
                <li key={n} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-semibold text-ink-2">{n}</span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium text-ink">{title}</p>
                    <p className="text-sm text-ink-2">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            <button
              onClick={shareInvite}
              className="group mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-lime px-5 py-2.5 font-semibold text-lime-ink transition-opacity hover:opacity-90"
            >
              {copied ? 'Link copiato!' : 'Invita un amico'}
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>
        </FadeIn>
      )}
```

Nota: `noFriends` resta usato solo se serve altrove; se ora è inutilizzato,
rimuovilo per non far fallire il lint `noUnusedLocals`.

- [ ] **Step 3: Typecheck**

Run: `cd figubook-app && npx tsc -b --noEmit`
Expected: exit 0.

- [ ] **Step 4: Build**

Run: `cd figubook-app && npm run build`
Expected: exit 0 (solo warning preesistente `INEFFECTIVE_DYNAMIC_IMPORT` accettato).

- [ ] **Step 5: Suite client verde (no regressioni)**

Run: `cd figubook-app && npx vitest run src/hooks/useNearbyCollectors.test.ts src/lib/geo/provincia.test.ts src/lib/db/invites.test.ts src/lib/invite/referrer.test.ts src/lib/db/profile.test.ts`
Expected: PASS. (`AlbumList.test.tsx` resta rotto da prima — non eseguirlo qui.)

- [ ] **Step 6: Commit**

```bash
git add figubook-app/src/pages/Community.tsx
git commit -m "feat(community): sezione Collezionisti per te permanente con Mostra altri"
```

---

## Task 6: Deploy function + verifica

**Files:** nessuno (deploy).

- [ ] **Step 1: Deploy `nearbyCollectors`**

Run: `firebase deploy --only functions:nearbyCollectors`
Expected: Deploy complete, function `europe-west1` aggiornata.

- [ ] **Step 2: Smoke manuale (founder)**

Apri Community loggato: la sezione "Collezionisti per te" appare sotto gli amici
(o al posto del vecchio empty-state). Se ci sono ≥6 candidati, "Mostra altri"
carica un batch nuovo senza ripetere le facce; sparisce quando finiscono.

- [ ] **Step 3: Commit finale (se restano modifiche non committate)**

Nessuna modifica di codice attesa qui — passo di sola verifica.

---

## Note di esecuzione

- **Ordine tipi tra i task**: `fetchNearbyUids` cambia firma in Task 3 ma
  l'hook che la consuma si aggiorna in Task 4; committa Task 3+4 insieme (il
  commit di Task 4 li copre entrambi) per non lasciare un commit che non typecheck.
- **`AlbumList.test.tsx`** è rotto da prima di questa fase (3 fail preesistenti):
  non è una regressione, non correggerlo in questo piano.
