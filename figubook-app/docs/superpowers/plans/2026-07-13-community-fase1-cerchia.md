# Community — Fase 1 "la cerchia" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trasformare la pagina Community da guscio-ricerca a "cerchia" viva: invito tracciato con attribuzione vera, gestione amici/richieste, e un teaser di collezionisti vicini (scala CAP→provincia→squadra) per battere il cold-start.

**Architecture:** Client React/Vite (figubook-app) + Firestore + una Cloud Function callable (`functions/`, europe-west1) per il match di prossimità server-side che tiene il CAP privato. Nuova collezione `invites/{invitedUid}` per l'attribuzione; nuovo campo privato `provincia` su `users/{uid}/meta/profile`. UI coerente con le altre sezioni (token `type-*`, card `rounded-2xl`, accento `lime`, azioni dirette con freccia animata).

**Tech Stack:** React 18, TypeScript, Firestore modular SDK, firebase-functions v2 (onCall), firebase-admin, Vitest.

**Riferimenti:** spec `docs/superpowers/specs/2026-07-13-community-fase1-cerchia-design.md`.

**Nota rules (adattamento allo spec):** `publicProfiles`/`usernames` richiedono `signedIn()`. La landing invito da sloggato NON legge avatar/squadra: mostra solo `@username` dall'URL + branding. L'arricchimento (avatar/team) resta ai flussi loggati.

**Nota struttura dati:** il profilo privato è `users/{uid}/meta/profile` (contiene `cap`, `favTeam`, `isPublic`, `blocked`, e vi aggiungeremo `provincia`). La Cloud Function usa Admin SDK (bypassa le rules) con `collectionGroup('meta')`.

---

## File Structure

**Client (figubook-app/src):**
- `lib/geo/provincia.ts` — CREATE: `provinciaOf(comune)` deriva la sigla provincia dal nome comune.
- `lib/db/profile.ts` — MODIFY: scrive `provincia` insieme a `citta`/`cap`.
- `lib/db/invites.ts` — CREATE: `writeInviteEdge`, `subscribeInviteCount`.
- `lib/db/friends.ts` — MODIFY: aggiunge `subscribeMyFriends` (elenco uid amici).
- `lib/invite/referrer.ts` — CREATE: persistenza referrer (localStorage, one-shot).
- `lib/functions/nearby.ts` — CREATE: wrapper callable `nearbyCollectors`.
- `hooks/useInviteCount.ts` — CREATE.
- `hooks/useMyFriends.ts` — CREATE (uid amici → publicProfiles).
- `hooks/useIncomingRequestProfiles.ts` — CREATE (fromUid → publicProfiles + azioni).
- `hooks/useNearbyCollectors.ts` — CREATE (chiama la function, risolve publicProfiles).
- `pages/InvitaLanding.tsx` — CREATE: rotta pubblica `/invita/:username`.
- `pages/Community.tsx` — MODIFY: pagina a sezioni.
- `lib/auth/register.ts` — MODIFY: consuma referrer e scrive `invites` edge.
- `App.tsx` — MODIFY: aggiunge rotta `/invita/:username`.

**Functions (functions/src):**
- `nearbyCollectors.ts` — CREATE: onCall handler + logica tier.
- `index.ts` — MODIFY: export `nearbyCollectors`.

**Regole/indici (root):**
- `firestore.rules` — MODIFY: blocco `invites/{invitedUid}`.
- `firestore.indexes.json` — MODIFY: collection-group `meta` su `cap`, `provincia`, `favTeam`.

---

## Task 1: Derivazione provincia dal comune

**Files:**
- Create: `figubook-app/src/lib/geo/provincia.ts`
- Test: `figubook-app/src/lib/geo/provincia.test.ts`

Il dataset `src/data/comuni-it.ts` esporta `COMUNI: [nome, siglaProvincia][]`. Costruiamo una mappa `nomeLower → sigla` una sola volta.

- [ ] **Step 1: Test che fallisce**

```ts
// figubook-app/src/lib/geo/provincia.test.ts
import { describe, it, expect } from 'vitest'
import { provinciaOf } from './provincia'

describe('provinciaOf', () => {
  it('ritorna la sigla per un comune noto (case-insensitive)', () => {
    // Milano esiste nel dataset con sigla MI
    expect(provinciaOf('Milano')).toBe('MI')
    expect(provinciaOf('  milano ')).toBe('MI')
  })
  it('ritorna stringa vuota per comune sconosciuto o vuoto', () => {
    expect(provinciaOf('Zzzznon-esiste')).toBe('')
    expect(provinciaOf('')).toBe('')
  })
})
```

- [ ] **Step 2: Verifica fallimento**

Run: `cd figubook-app && npx vitest run src/lib/geo/provincia.test.ts`
Expected: FAIL — "Cannot find module './provincia'".

- [ ] **Step 3: Implementazione minima**

```ts
// figubook-app/src/lib/geo/provincia.ts
import { COMUNI } from '@/data/comuni-it'

// Mappa nome-comune (lower) → sigla provincia. Primo match vince per omonimie.
const MAP: Map<string, string> = (() => {
  const m = new Map<string, string>()
  for (const [nome, prov] of COMUNI) {
    const k = nome.toLowerCase()
    if (!m.has(k)) m.set(k, prov)
  }
  return m
})()

// Ricava la sigla provincia dal nome comune. '' se sconosciuto/vuoto.
export function provinciaOf(comune: string): string {
  return MAP.get(comune.trim().toLowerCase()) ?? ''
}
```

Se `COMUNI` non è l'export corretto, aprire `src/data/comuni-it.ts` e usare il nome reale dell'array (tuple `[nome, prov]`).

- [ ] **Step 4: Verifica pass**

Run: `cd figubook-app && npx vitest run src/lib/geo/provincia.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add figubook-app/src/lib/geo/provincia.ts figubook-app/src/lib/geo/provincia.test.ts
git commit -m "feat(geo): provinciaOf deriva sigla provincia dal comune

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Salvare `provincia` sul profilo privato

**Files:**
- Modify: `figubook-app/src/lib/db/profile.ts`
- Test: `figubook-app/src/lib/db/profile.test.ts`

`provincia` è privata → va sul doc `users/{uid}/meta/profile` (NON su `publicProfiles`). Va scritta quando cambia `citta`. `citta` viene salvata in `saveAccount` (parte pubblica). Aggiungiamo la scrittura di `provincia` sul doc privato dentro lo stesso flusso.

Prima leggere `src/lib/db/profile.ts` per individuare `saveAccount` (scrive `citta` in `publicProfiles` + `users/{uid}/meta/profile`) e il tipo `ProfileDoc`.

- [ ] **Step 1: Aggiungere il campo al tipo**

In `ProfileDoc` (dopo `cap?`):

```ts
  // Sigla provincia derivata dal comune (privata, mai in publicProfiles).
  provincia?: string
```

- [ ] **Step 2: Test che fallisce**

Aggiungere in `figubook-app/src/lib/db/profile.test.ts` (adattare mock esistenti):

```ts
import { provinciaOf } from '@/lib/geo/provincia'

it('deriva provincia dal comune quando si salva citta', () => {
  expect(provinciaOf('Milano')).toBe('MI')
  // saveAccount deve includere provincia derivata nel patch privato.
  // (verifica via mock del setDoc sul doc meta/profile — vedi pattern esistente)
})
```

Se il test file usa mock di `firebase/firestore`, asserire che la chiamata `setDoc` verso `users/{uid}/meta/profile` includa `provincia: 'MI'` quando `citta==='Milano'`. Seguire lo stile dei test già presenti nel file.

- [ ] **Step 3: Verifica fallimento**

Run: `cd figubook-app && npx vitest run src/lib/db/profile.test.ts`
Expected: FAIL — `provincia` non presente nel patch.

- [ ] **Step 4: Implementazione**

In `saveAccount` (o dove viene persistito `citta` sul doc privato `users/{uid}/meta/profile`), aggiungere:

```ts
import { provinciaOf } from '@/lib/geo/provincia'
// ...
const provincia = provinciaOf(citta ?? '')
// nel setDoc verso users/{uid}/meta/profile aggiungere: provincia
```

Assicurarsi che il campo finisca SOLO nel doc privato, mai in `publicProfiles`.

- [ ] **Step 5: Verifica pass**

Run: `cd figubook-app && npx vitest run src/lib/db/profile.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add figubook-app/src/lib/db/profile.ts figubook-app/src/lib/db/profile.test.ts
git commit -m "feat(profile): salva provincia privata derivata dal comune

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Data layer inviti (`invites` edge + contatore)

**Files:**
- Create: `figubook-app/src/lib/db/invites.ts`
- Test: `figubook-app/src/lib/db/invites.test.ts`

Modello: `invites/{invitedUid} = { inviterUid, at }`, immutabile. Contatore invitante = query `where inviterUid == me`.

- [ ] **Step 1: Test che fallisce**

```ts
// figubook-app/src/lib/db/invites.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db, _c, id) => ({ id })),
  setDoc: vi.fn(async () => {}),
  collection: vi.fn(() => ({})),
  query: vi.fn((...a) => a),
  where: vi.fn((...a) => a),
  onSnapshot: vi.fn(),
}))
vi.mock('@/lib/firebase', () => ({ db: {} }))

import { setDoc } from 'firebase/firestore'
import { writeInviteEdge } from './invites'

describe('writeInviteEdge', () => {
  it('scrive invites/{invitedUid} = { inviterUid, at }', async () => {
    await writeInviteEdge('newUser', 'marcoUid')
    expect(setDoc).toHaveBeenCalledTimes(1)
    const [ref, data] = (setDoc as any).mock.calls[0]
    expect(ref.id).toBe('newUser')
    expect(data.inviterUid).toBe('marcoUid')
    expect(typeof data.at).toBe('number')
  })
  it('non scrive se inviterUid mancante', async () => {
    ;(setDoc as any).mockClear()
    await writeInviteEdge('newUser', '')
    expect(setDoc).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Verifica fallimento**

Run: `cd figubook-app && npx vitest run src/lib/db/invites.test.ts`
Expected: FAIL — modulo assente.

- [ ] **Step 3: Implementazione**

```ts
// figubook-app/src/lib/db/invites.ts
import { doc, setDoc, collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Edge immutabile: chi ha invitato il nuovo utente. Create-only lato client.
export async function writeInviteEdge(invitedUid: string, inviterUid: string): Promise<void> {
  if (!inviterUid || !invitedUid || invitedUid === inviterUid) return
  await setDoc(doc(db, 'invites', invitedUid), { inviterUid, at: Date.now() })
}

// Numero di persone che ho invitato (iscritte davvero), live.
export function subscribeInviteCount(me: string, cb: (n: number) => void): () => void {
  const q = query(collection(db, 'invites'), where('inviterUid', '==', me))
  return onSnapshot(q, (snap) => cb(snap.size), () => cb(0))
}
```

- [ ] **Step 4: Verifica pass**

Run: `cd figubook-app && npx vitest run src/lib/db/invites.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add figubook-app/src/lib/db/invites.ts figubook-app/src/lib/db/invites.test.ts
git commit -m "feat(invites): edge attribuzione + contatore live

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Regole Firestore per `invites`

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: Aggiungere il blocco** (dopo `match /friendships/{pid} { ... }`)

```
    // ── Attribuzione inviti: invites/{invitedUid} = { inviterUid, at } ─────
    match /invites/{invitedUid} {
      // Legge: l'invitato (proprio doc) o l'invitante (per contare i propri).
      allow read: if signedIn()
        && (request.auth.uid == invitedUid
            || request.auth.uid == resource.data.inviterUid);
      // Crea solo il nuovo utente, per sé, con inviterUid != sé, immutabile.
      allow create: if signedIn()
        && request.auth.uid == invitedUid
        && request.resource.data.inviterUid is string
        && request.resource.data.inviterUid.size() > 0
        && request.resource.data.inviterUid != invitedUid
        && request.resource.data.keys().hasOnly(['inviterUid', 'at']);
      allow update, delete: if false;
    }
```

Nota: la query `subscribeInviteCount` (`where inviterUid == me`) è coperta da `read` perché ogni doc restituito ha `resource.data.inviterUid == request.auth.uid`.

- [ ] **Step 2: Verifica sintassi + deploy rules**

Run: `firebase deploy --only firestore:rules`
Expected: `Deploy complete!` (CLI già loggata — vedi memoria firebase-cli-deploy).

- [ ] **Step 3: Commit**

```bash
git add firestore.rules
git commit -m "feat(rules): invites create-only self + read invitante/invitato

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Persistenza referrer (localStorage, one-shot)

**Files:**
- Create: `figubook-app/src/lib/invite/referrer.ts`
- Test: `figubook-app/src/lib/invite/referrer.test.ts`

- [ ] **Step 1: Test che fallisce**

```ts
// figubook-app/src/lib/invite/referrer.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { rememberReferrer, consumeReferrer, peekReferrer } from './referrer'

beforeEach(() => localStorage.clear())

describe('referrer', () => {
  it('salva e legge lo username referrer (lower, trim)', () => {
    rememberReferrer('  Marco ')
    expect(peekReferrer()).toBe('marco')
  })
  it('consume ritorna e cancella (one-shot)', () => {
    rememberReferrer('marco')
    expect(consumeReferrer()).toBe('marco')
    expect(peekReferrer()).toBe(null)
  })
  it('ignora referrer vuoto', () => {
    rememberReferrer('   ')
    expect(peekReferrer()).toBe(null)
  })
})
```

- [ ] **Step 2: Verifica fallimento**

Run: `cd figubook-app && npx vitest run src/lib/invite/referrer.test.ts`
Expected: FAIL — modulo assente.

- [ ] **Step 3: Implementazione**

```ts
// figubook-app/src/lib/invite/referrer.ts
const KEY = 'figubook.invitedBy'

// Salva lo username dell'invitante (normalizzato). No-op se vuoto.
export function rememberReferrer(username: string): void {
  const u = username.trim().toLowerCase()
  if (u) localStorage.setItem(KEY, u)
}

// Legge senza cancellare. null se assente.
export function peekReferrer(): string | null {
  return localStorage.getItem(KEY) || null
}

// Legge e cancella (one-shot, dopo l'attribuzione a registrazione).
export function consumeReferrer(): string | null {
  const v = peekReferrer()
  if (v) localStorage.removeItem(KEY)
  return v
}
```

- [ ] **Step 4: Verifica pass**

Run: `cd figubook-app && npx vitest run src/lib/invite/referrer.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add figubook-app/src/lib/invite/referrer.ts figubook-app/src/lib/invite/referrer.test.ts
git commit -m "feat(invite): persistenza referrer one-shot in localStorage

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Attribuzione a registrazione

**Files:**
- Modify: `figubook-app/src/lib/auth/register.ts`

Dopo la creazione riuscita del profilo, risolvo `referrer username → uid` e scrivo l'edge. Non deve mai far fallire la registrazione (best-effort try/catch, come il pattern notifiche in deleteAccountCascade).

- [ ] **Step 1: Implementazione** (in fondo a `registerWithEmail`, prima di `return cred.user`)

```ts
import { consumeReferrer } from '@/lib/invite/referrer'
import { getPublicByUsername } from '@/lib/db/publicProfiles'
import { writeInviteEdge } from '@/lib/db/invites'
// ...
  // Attribuzione invito (best-effort: mai bloccare la registrazione).
  try {
    const ref = consumeReferrer()
    if (ref) {
      const inviter = await getPublicByUsername(ref)
      if (inviter && inviter.uid !== uid) {
        await writeInviteEdge(uid, inviter.uid)
      }
    }
  } catch {
    // ignora: l'attribuzione non è critica
  }

  await sendEmailVerification(cred.user)
  return cred.user
```

Nota: `getPublicByUsername` richiede `signedIn()` — a questo punto l'utente è già autenticato (createUser è avvenuto), quindi la lettura passa le rules.

- [ ] **Step 2: Build + typecheck**

Run: `cd figubook-app && npx tsc -b --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add figubook-app/src/lib/auth/register.ts
git commit -m "feat(invite): attribuzione invito a fine registrazione (best-effort)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Cloud Function `nearbyCollectors`

**Files:**
- Create: `functions/src/nearbyCollectors.ts`
- Modify: `functions/src/index.ts`
- Test: `functions/src/nearbyCollectors.test.ts`

Logica pura testabile separata dall'handler. Ordine tier: CAP → provincia → squadra, accumulo fino a 6, escludi me/amici/bloccati/privati, nessun CAP nel payload.

Prima leggere `functions/src/deleteAccountCascade.ts` + `index.ts` per il pattern onCall v2 (region `europe-west1`) e la config admin.

- [ ] **Step 1: Test della logica pura**

```ts
// functions/src/nearbyCollectors.test.ts
import { describe, it, expect } from 'vitest'
import { rankCandidates } from './nearbyCollectors'

type C = { uid: string; cap?: string; provincia?: string; favTeam?: string; isPublic: boolean }

const me = { uid: 'me', cap: '20100', provincia: 'MI', favTeam: 'inter' }

describe('rankCandidates', () => {
  it('ordina CAP prima di provincia prima di squadra', () => {
    const cands: C[] = [
      { uid: 'team', favTeam: 'inter', provincia: 'RM', cap: '00100', isPublic: true },
      { uid: 'prov', favTeam: 'milan', provincia: 'MI', cap: '20200', isPublic: true },
      { uid: 'cap', favTeam: 'milan', provincia: 'MI', cap: '20100', isPublic: true },
    ]
    const r = rankCandidates(me, cands, ['friendUid'], ['blockedUid'], 6)
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
    const r = rankCandidates(me, cands, ['friendUid'], ['blockedUid'], 6)
    expect(r).toEqual(['ok'])
  })
  it('rispetta il limite', () => {
    const cands: C[] = Array.from({ length: 10 }, (_, i) => ({
      uid: 'u' + i, favTeam: 'inter', isPublic: true,
    }))
    expect(rankCandidates(me, cands, [], [], 6)).toHaveLength(6)
  })
  it('nessun tier disponibile → vuoto', () => {
    const cands: C[] = [{ uid: 'x', favTeam: 'juve', provincia: 'TO', cap: '10100', isPublic: true }]
    expect(rankCandidates(me, cands, [], [], 6)).toEqual([])
  })
})
```

- [ ] **Step 2: Verifica fallimento**

Run: `cd functions && npx vitest run src/nearbyCollectors.test.ts`
Expected: FAIL — modulo assente.

- [ ] **Step 3: Implementazione**

```ts
// functions/src/nearbyCollectors.ts
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

export interface Me { uid: string; cap?: string; provincia?: string; favTeam?: string }
export interface Cand {
  uid: string; cap?: string; provincia?: string; favTeam?: string; isPublic: boolean
}

// Tier: 0 = CAP, 1 = provincia, 2 = squadra, -1 = nessun match. Più basso = più vicino.
function tier(me: Me, c: Cand): number {
  if (me.cap && c.cap && c.cap === me.cap) return 0
  if (me.provincia && c.provincia && c.provincia === me.provincia) return 1
  if (me.favTeam && c.favTeam && c.favTeam === me.favTeam) return 2
  return -1
}

// Logica pura: filtra + ordina per tier, ritorna solo gli uid (max limit).
export function rankCandidates(
  me: Me, cands: Cand[], friends: string[], blocked: string[], limit: number,
): string[] {
  const excl = new Set<string>([me.uid, ...friends, ...blocked])
  return cands
    .filter((c) => c.isPublic && !excl.has(c.uid))
    .map((c) => ({ uid: c.uid, t: tier(me, c) }))
    .filter((x) => x.t >= 0)
    .sort((a, b) => a.t - b.t)
    .slice(0, limit)
    .map((x) => x.uid)
}

// Legge i candidati dei tier presenti via collectionGroup('meta') sui profili.
async function fetchCandidates(db: admin.firestore.Firestore, me: Me): Promise<Cand[]> {
  const cg = db.collectionGroup('meta')
  const queries: Promise<admin.firestore.QuerySnapshot>[] = []
  if (me.cap) queries.push(cg.where('cap', '==', me.cap).limit(50).get())
  if (me.provincia) queries.push(cg.where('provincia', '==', me.provincia).limit(50).get())
  if (me.favTeam) queries.push(cg.where('favTeam', '==', me.favTeam).limit(50).get())
  const snaps = await Promise.all(queries)
  const byUid = new Map<string, Cand>()
  for (const snap of snaps) {
    for (const d of snap.docs) {
      if (d.id !== 'profile') continue
      const uid = d.ref.parent.parent?.id
      if (!uid || byUid.has(uid)) continue
      const p = d.data() as any
      byUid.set(uid, {
        uid, cap: p.cap, provincia: p.provincia, favTeam: p.favTeam,
        isPublic: p.isPublic === true,
      })
    }
  }
  return [...byUid.values()]
}

export const nearbyCollectors = onCall({ region: 'europe-west1' }, async (req) => {
  const uid = req.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Login richiesto')
  const db = admin.firestore()

  const meSnap = await db.doc(`users/${uid}/meta/profile`).get()
  const mp = (meSnap.data() as any) ?? {}
  const me: Me = { uid, cap: mp.cap, provincia: mp.provincia, favTeam: mp.favTeam }
  const blocked: string[] = Array.isArray(mp.blocked) ? mp.blocked : []

  // Amici: friendships dove users array-contains me.
  const frSnap = await db.collection('friendships').where('users', 'array-contains', uid).get()
  const friends: string[] = []
  for (const d of frSnap.docs) {
    const users: string[] = (d.data() as any).users ?? []
    for (const u of users) if (u !== uid) friends.push(u)
  }

  const cands = await fetchCandidates(db, me)
  return { uids: rankCandidates(me, cands, friends, blocked, 6) }
})
```

- [ ] **Step 4: Verifica pass (logica pura)**

Run: `cd functions && npx vitest run src/nearbyCollectors.test.ts`
Expected: PASS.

- [ ] **Step 5: Export**

In `functions/src/index.ts` aggiungere:

```ts
export { nearbyCollectors } from './nearbyCollectors'
```

- [ ] **Step 6: Build**

Run: `cd functions && npm run build`
Expected: exit 0.

- [ ] **Step 7: Deploy**

Run: `firebase deploy --only functions:nearbyCollectors`
Expected: `Deploy complete!`. Al primo deploy Firestore chiederà gli indici collection-group mancanti (vedi Task 8) — se la function logga `FAILED_PRECONDITION`, creare gli indici prima.

- [ ] **Step 8: Commit**

```bash
git add functions/src/nearbyCollectors.ts functions/src/nearbyCollectors.test.ts functions/src/index.ts
git commit -m "feat(functions): nearbyCollectors match prossimità server-side (CAP mai esposto)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Indici Firestore collection-group

**Files:**
- Modify: `firestore.indexes.json`

Le query `collectionGroup('meta').where('cap'|'provincia'|'favTeam','==',...)` richiedono indici a campo singolo con scope COLLECTION_GROUP.

- [ ] **Step 1: Aggiungere a `fieldOverrides`** (in `firestore.indexes.json`; se `fieldOverrides` non esiste, crearlo come array di pari livello a `indexes`)

```json
{
  "collectionGroup": "meta",
  "fieldPath": "cap",
  "indexes": [
    { "order": "ASCENDING", "queryScope": "COLLECTION_GROUP" }
  ]
},
{
  "collectionGroup": "meta",
  "fieldPath": "provincia",
  "indexes": [
    { "order": "ASCENDING", "queryScope": "COLLECTION_GROUP" }
  ]
},
{
  "collectionGroup": "meta",
  "fieldPath": "favTeam",
  "indexes": [
    { "order": "ASCENDING", "queryScope": "COLLECTION_GROUP" }
  ]
}
```

- [ ] **Step 2: Deploy indici**

Run: `firebase deploy --only firestore:indexes`
Expected: `Deploy complete!` (la costruzione può richiedere qualche minuto).

- [ ] **Step 3: Commit**

```bash
git add firestore.indexes.json
git commit -m "feat(indexes): collection-group meta su cap/provincia/favTeam per nearbyCollectors

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9: Wrapper client + hook teaser prossimità

**Files:**
- Create: `figubook-app/src/lib/functions/nearby.ts`
- Create: `figubook-app/src/hooks/useNearbyCollectors.ts`

Prima verificare come è inizializzato `functions` altrove nel client (cercare `httpsCallable` o `getFunctions`). Se non esiste ancora, inizializzarlo con region `europe-west1`.

- [ ] **Step 1: Wrapper callable**

```ts
// figubook-app/src/lib/functions/nearby.ts
import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '@/lib/firebase' // usare l'export reale dell'app inizializzata

const fns = getFunctions(app, 'europe-west1')

// Ritorna gli uid dei collezionisti vicini (CAP→provincia→squadra), max 6.
export async function fetchNearbyUids(): Promise<string[]> {
  const call = httpsCallable<unknown, { uids: string[] }>(fns, 'nearbyCollectors')
  const res = await call({})
  return res.data?.uids ?? []
}
```

Se `@/lib/firebase` non esporta `app`, aggiungere l'export dell'istanza `initializeApp`.

- [ ] **Step 2: Hook**

```ts
// figubook-app/src/hooks/useNearbyCollectors.ts
import { useEffect, useState } from 'react'
import { fetchNearbyUids } from '@/lib/functions/nearby'
import { getPublicByUid } from '@/lib/db/publicProfiles'
import type { PublicProfile } from '@/lib/db/profile'

// Carica il teaser di prossimità (una tantum). enabled=false → non chiama.
export function useNearbyCollectors(enabled: boolean) {
  const [people, setPeople] = useState<PublicProfile[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled) return
    let active = true
    setLoading(true)
    fetchNearbyUids()
      .then(async (uids) => {
        const profs = await Promise.all(uids.map((u) => getPublicByUid(u)))
        return profs.filter((p): p is PublicProfile => !!p)
      })
      .then((p) => active && setPeople(p))
      .catch(() => active && setPeople([]))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [enabled])

  return { people, loading }
}
```

- [ ] **Step 3: Typecheck**

Run: `cd figubook-app && npx tsc -b --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add figubook-app/src/lib/functions/nearby.ts figubook-app/src/hooks/useNearbyCollectors.ts
git commit -m "feat(community): hook teaser prossimità via nearbyCollectors

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 10: Hook amici + richieste (risoluzione profili)

**Files:**
- Modify: `figubook-app/src/lib/db/friends.ts`
- Create: `figubook-app/src/hooks/useMyFriends.ts`
- Create: `figubook-app/src/hooks/useInviteCount.ts`
- Create: `figubook-app/src/hooks/useIncomingRequestProfiles.ts`

- [ ] **Step 1: `subscribeMyFriends` in friends.ts**

```ts
// aggiungere a figubook-app/src/lib/db/friends.ts
// Elenco uid degli amici accettati, live.
export function subscribeMyFriends(me: string, cb: (uids: string[]) => void): () => void {
  const q = query(collection(db, 'friendships'), where('users', 'array-contains', me))
  return onSnapshot(
    q,
    (snap) => {
      const uids: string[] = []
      snap.docs.forEach((d) => {
        const users: string[] = (d.data() as { users: string[] }).users ?? []
        users.forEach((u) => { if (u !== me) uids.push(u) })
      })
      cb(uids)
    },
    () => cb([]),
  )
}
```

- [ ] **Step 2: `useMyFriends`**

```ts
// figubook-app/src/hooks/useMyFriends.ts
import { useEffect, useState } from 'react'
import { subscribeMyFriends } from '@/lib/db/friends'
import { getPublicByUid } from '@/lib/db/publicProfiles'
import { useAuth } from '@/hooks/useAuth' // usare l'hook auth reale del progetto
import type { PublicProfile } from '@/lib/db/profile'

export function useMyFriends() {
  const { user } = useAuth()
  const [friends, setFriends] = useState<PublicProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    return subscribeMyFriends(user.uid, async (uids) => {
      const profs = await Promise.all(uids.map((u) => getPublicByUid(u)))
      setFriends(profs.filter((p): p is PublicProfile => !!p))
      setLoading(false)
    })
  }, [user])

  return { friends, loading }
}
```

Nota: verificare il nome reale dell'hook auth (cercare `useAuth`/`useProfile` in `src/hooks`) e adattare `user.uid`.

- [ ] **Step 3: `useInviteCount`**

```ts
// figubook-app/src/hooks/useInviteCount.ts
import { useEffect, useState } from 'react'
import { subscribeInviteCount } from '@/lib/db/invites'
import { useAuth } from '@/hooks/useAuth'

export function useInviteCount(): number {
  const { user } = useAuth()
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!user) return
    return subscribeInviteCount(user.uid, setN)
  }, [user])
  return n
}
```

- [ ] **Step 4: `useIncomingRequestProfiles`**

```ts
// figubook-app/src/hooks/useIncomingRequestProfiles.ts
import { useEffect, useState } from 'react'
import { subscribeIncomingRequests } from '@/lib/db/friends'
import { getPublicByUid } from '@/lib/db/publicProfiles'
import { useAuth } from '@/hooks/useAuth'
import type { PublicProfile } from '@/lib/db/profile'

export function useIncomingRequestProfiles() {
  const { user } = useAuth()
  const [reqs, setReqs] = useState<PublicProfile[]>([])
  useEffect(() => {
    if (!user) return
    return subscribeIncomingRequests(user.uid, async (list) => {
      const profs = await Promise.all(list.map((r) => getPublicByUid(r.fromUid)))
      setReqs(profs.filter((p): p is PublicProfile => !!p))
    })
  }, [user])
  return reqs
}
```

- [ ] **Step 5: Typecheck**

Run: `cd figubook-app && npx tsc -b --noEmit`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add figubook-app/src/lib/db/friends.ts figubook-app/src/hooks/useMyFriends.ts figubook-app/src/hooks/useInviteCount.ts figubook-app/src/hooks/useIncomingRequestProfiles.ts
git commit -m "feat(community): hook amici, contatore inviti, richieste con profili

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 11: Landing invito `/invita/:username`

**Files:**
- Create: `figubook-app/src/pages/InvitaLanding.tsx`
- Modify: `figubook-app/src/App.tsx`

Rotta PUBBLICA (fuori da `ProtectedRoute`). Sloggato → salva referrer + mostra `@username` (no read profilo) + CTA Registrati. Loggato → redirect `/u/:username`.

- [ ] **Step 1: Componente**

```tsx
// figubook-app/src/pages/InvitaLanding.tsx
import { useEffect } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { rememberReferrer } from '@/lib/invite/referrer'

export default function InvitaLanding() {
  const { username = '' } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const clean = username.trim()

  useEffect(() => {
    if (!user && clean) rememberReferrer(clean)
  }, [user, clean])

  if (user) return <Navigate to={`/u/${clean}`} replace />

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="type-body text-ink-2">Sei stato invitato su FiguBook da</p>
      <h1 className="type-h1 mt-2 text-ink">@{clean}</h1>
      <p className="type-body mt-4 text-ink-2">
        Colleziona figurine, scambia doppioni e trova altri collezionisti.
      </p>
      <button
        onClick={() => navigate('/login?r=1')}
        className="group mt-8 inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3 font-medium text-black"
      >
        Registrati
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </button>
    </div>
  )
}
```

Adattare classi/freccia allo standard "azioni dirette" del progetto (vedi memoria azioni-dirette-freccia-animata) e al componente CTA esistente se presente. Verificare il nome reale dell'hook auth.

- [ ] **Step 2: Rotta pubblica in App.tsx** (accanto a `/login`, FUORI dal blocco `ProtectedRoute`)

```tsx
import InvitaLanding from '@/pages/InvitaLanding'
// ...
<Route path="/invita/:username" element={<InvitaLanding />} />
```

- [ ] **Step 3: Typecheck + build**

Run: `cd figubook-app && npx tsc -b --noEmit && npm run build`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add figubook-app/src/pages/InvitaLanding.tsx figubook-app/src/App.tsx
git commit -m "feat(invite): landing pubblica /invita/:username con referrer

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 12: Pagina Community a sezioni

**Files:**
- Modify: `figubook-app/src/pages/Community.tsx`

Assembla: Header + CTA invita/contatore → Richieste in arrivo (se >0) → Ricerca (esistente) → Amici / Teaser prossimità. Riusa lo stile card esistente. La CTA "Invita" copia il link `${origin}/invita/<mioUsername>` con feedback "Copiato!".

- [ ] **Step 1: Implementazione** (partendo dal Community.tsx attuale, mantenendo la ricerca com'è)

```tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useUserSearch } from '@/hooks/useUserSearch'
import { useProfile } from '@/hooks/useProfile'
import { useInviteCount } from '@/hooks/useInviteCount'
import { useMyFriends } from '@/hooks/useMyFriends'
import { useIncomingRequestProfiles } from '@/hooks/useIncomingRequestProfiles'
import { useNearbyCollectors } from '@/hooks/useNearbyCollectors'
import { acceptFriendRequest, rejectFriendRequest } from '@/lib/db/friends'
import { Avatar } from '@/components/Avatar'
import { TeamCrest } from '@/components/TeamCrest'
import { teamById } from '@/lib/teams'
import { FadeIn } from '@/components/home/FadeIn'
import type { PublicProfile } from '@/lib/db/profile'

function PersonRow({ u }: { u: PublicProfile }) {
  const team = u.favTeam ? teamById[u.favTeam] : undefined
  return (
    <Link
      to={`/u/${u.username}`}
      className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-surface/40 px-4 py-3 transition-colors hover:border-white/20"
    >
      <Avatar id={u.avatarId} name={u.username} className="h-11 w-11 shrink-0 overflow-hidden rounded-full" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-ink">{u.username}</p>
        {u.nome && <p className="truncate text-sm text-ink-2">{u.nome}</p>}
      </div>
      {team && <TeamCrest teamId={team.id} c1={team.c1} c2={team.c2} className="h-6 w-[18px] shrink-0" />}
    </Link>
  )
}

export default function Community() {
  const { profile } = useProfile()
  const [q, setQ] = useState('')
  const { results, loading } = useUserSearch(q)
  const term = q.trim()

  const inviteCount = useInviteCount()
  const { friends } = useMyFriends()
  const requests = useIncomingRequestProfiles()
  const noFriends = friends.length === 0
  const { people: nearby } = useNearbyCollectors(noFriends)

  const [copied, setCopied] = useState(false)
  const shareInvite = async () => {
    const uname = profile?.username
    if (!uname) return
    const url = `${window.location.origin}/FiguBook/app/invita/${uname}`
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {}
  }

  const myUid = profile ? (profile as { uid?: string }).uid : undefined

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Header + invito */}
      <FadeIn>
        <h1 className="type-h1 text-ink">Community</h1>
        <p className="type-body mt-1.5 text-ink-2">
          {inviteCount > 0 ? `Hai invitato ${inviteCount} ${inviteCount === 1 ? 'amico' : 'amici'}.` : 'Invita i tuoi amici e trova collezionisti vicini.'}
        </p>
        <button
          onClick={shareInvite}
          className="group mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-lime px-5 py-2.5 font-medium text-black"
        >
          {copied ? 'Link copiato!' : 'Invita un amico'}
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </button>
      </FadeIn>

      {/* Richieste in arrivo */}
      {requests.length > 0 && myUid && (
        <FadeIn>
          <h2 className="type-h2 mt-8 text-ink">Richieste di amicizia</h2>
          <div className="mt-3 space-y-2">
            {requests.map((u) => (
              <div key={u.uid} className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-surface/40 px-4 py-3">
                <Avatar id={u.avatarId} name={u.username} className="h-11 w-11 shrink-0 overflow-hidden rounded-full" />
                <p className="min-w-0 flex-1 truncate text-[15px] font-medium text-ink">{u.username}</p>
                <button
                  onClick={() => acceptFriendRequest(u.uid, myUid, profile!.username)}
                  className="rounded-full bg-lime px-4 py-1.5 text-sm font-medium text-black"
                >Accetta</button>
                <button
                  onClick={() => rejectFriendRequest(u.uid, myUid, profile!.username)}
                  className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-ink-2"
                >Rifiuta</button>
              </div>
            ))}
          </div>
        </FadeIn>
      )}

      {/* Ricerca */}
      <FadeIn>
        <div className="relative mt-8">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cerca un collezionista…"
            className="w-full rounded-full border border-white/[0.1] bg-surface py-3.5 pl-12 pr-4 text-[16px] text-ink outline-none transition-colors placeholder:text-ink-2 focus:border-lime"
          />
        </div>
        <div className="mt-4 space-y-2">
          {term.length >= 2 && !loading && results.length === 0 && (
            <p className="px-1 text-sm text-ink-2">Nessun collezionista per “{term}”.</p>
          )}
          {results.map((u) => <PersonRow key={u.uid} u={u} />)}
        </div>
      </FadeIn>

      {/* Amici / Teaser prossimità */}
      <FadeIn>
        <h2 className="type-h2 mt-8 text-ink">I miei amici</h2>
        {friends.length > 0 ? (
          <div className="mt-3 space-y-2">{friends.map((u) => <PersonRow key={u.uid} u={u} />)}</div>
        ) : (
          <div className="mt-3">
            <p className="text-sm text-ink-2">Non hai ancora amici.</p>
            {nearby.length > 0 && (
              <>
                <p className="mt-5 text-sm font-medium text-ink">Collezionisti vicini a te</p>
                <div className="mt-3 space-y-2">{nearby.map((u) => <PersonRow key={u.uid} u={u} />)}</div>
              </>
            )}
          </div>
        )}
      </FadeIn>
    </div>
  )
}
```

Nota: verificare il campo `username` e `uid` esposti da `useProfile` e adattare (`profile.username`, `profile.uid`). Il basename router è `/FiguBook/app` → il link invito deve includerlo (già fatto sopra). Rifinire spaziature/estetica con le skill design/impeccable in fase di review.

- [ ] **Step 2: Typecheck + build**

Run: `cd figubook-app && npx tsc -b --noEmit && npm run build`
Expected: exit 0 (solo warning INEFFECTIVE_DYNAMIC_IMPORT già noto).

- [ ] **Step 3: Bump cache-bust** (se il progetto versiona asset locali con `?v=N` — vedi memoria cache-bust-assets): incrementare il valore dove serve.

- [ ] **Step 4: Commit**

```bash
git add figubook-app/src/pages/Community.tsx
git commit -m "feat(community): pagina a sezioni (invito, richieste, ricerca, amici/teaser)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 13: Verifica end-to-end + rifinitura design

**Files:** nessuna modifica strutturale; rifinitura estetica su `Community.tsx` / `InvitaLanding.tsx`.

- [ ] **Step 1: Suite completa client**

Run: `cd figubook-app && npx vitest run src/lib/geo/provincia.test.ts src/lib/db/invites.test.ts src/lib/invite/referrer.test.ts src/lib/db/profile.test.ts`
Expected: tutti PASS.

- [ ] **Step 2: Suite function**

Run: `cd functions && npx vitest run src/nearbyCollectors.test.ts && npm run build`
Expected: PASS + exit 0.

- [ ] **Step 3: Invocare le skill design/impeccable** su `Community.tsx` e `InvitaLanding.tsx` per allineare spaziature, gerarchia tipografica e coerenza con le altre 3 sezioni. Applicare le rifiniture.

- [ ] **Step 4: Verifica manuale** (via `/run` o browser-probe, vedi memoria browser-probe-figubook):
  - Pagina Community: header+CTA, ricerca funziona, sezione amici/teaser rende.
  - `/invita/<username>` da sloggato: mostra @username + Registrati; da loggato: redirect a `/u/<username>`.
  - Registrarsi via link invito → verificare che `invites/{nuovoUid}` sia scritto e il contatore dell'invitante salga.

- [ ] **Step 5: Commit rifiniture**

```bash
git add figubook-app/src/pages/Community.tsx figubook-app/src/pages/InvitaLanding.tsx
git commit -m "style(community): rifinitura estetica coerente con le sezioni

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push
```

---

## Self-Review (copertura spec)

- Invito attribuzione vera → Task 3,5,6 (edge + referrer + register). ✓
- Pagina singola a sezioni → Task 12. ✓
- Teaser scala CAP→provincia→squadra live, CAP mai esposto → Task 7 (function), 9 (hook), 12 (UI). ✓
- Discoverability solo profili pubblici → Task 7 (`isPublic` filter). ✓
- `provincia` derivata dal comune, privata → Task 1,2. ✓
- Contatore inviti (solo numero) → Task 3,10,12. ✓
- Modello `invites` + regole + indici → Task 3,4,8. ✓
- Coerenza visiva + azioni freccia animata → Task 11,12,13. ✓
- Nota sicurezza al contatto = fuori scope (Fase 3): non implementata qui, come da spec. ✓

Rischi noti / da verificare in esecuzione:
- Nome reale dell'hook auth (`useAuth` vs altro) e campi `profile.uid`/`profile.username`.
- Export `app` da `@/lib/firebase` per `getFunctions`.
- Struttura di `firestore.indexes.json` (`fieldOverrides`).
- `saveAccount` esatto in `profile.ts` dove iniettare `provincia`.
