# Elimina account — cascade delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dare all'utente un bottone "Elimina account" che cancella definitivamente e senza dati orfani il proprio profilo (incluso lo username prenotato), via Cloud Function admin.

**Architecture:** Una callable Cloud Function (`deleteAccount`, region europe-west) esegue tutto il cascade con l'Admin SDK operando solo su `context.auth.uid`. La logica di cascade è isolata in un modulo puro `deleteAccountCascade(db, authAdmin, uid)` testato contro il Firestore emulator. Il client (Profilo → "Zona pericolosa") chiama la function dopo una modale di conferma "digita username".

**Tech Stack:** Firebase Cloud Functions (Node/TypeScript, Admin SDK), Firestore emulator, Vitest (app + functions), React + firebase/functions httpsCallable.

---

## File Structure

- `functions/package.json` — nuovo package Node per le functions (firebase-admin, firebase-functions, vitest)
- `functions/tsconfig.json` — config TS functions
- `functions/src/index.ts` — export della callable `deleteAccount`
- `functions/src/deleteAccountCascade.ts` — logica pura di cascade (testabile)
- `functions/src/deleteAccountCascade.test.ts` — test integrazione su emulator
- `firebase.json` — aggiungere blocco `functions` + `emulators`
- `figubook-app/src/lib/db/account.ts` — wrapper client `deleteAccount()` (httpsCallable)
- `figubook-app/src/lib/db/account.test.ts` — test della pura `usernameMatches()`
- `figubook-app/src/components/profile/DangerZone.tsx` — sezione + modale conferma
- `figubook-app/src/pages/Profilo.tsx` — montare `<DangerZone />` in fondo al form

---

## Task 1: Scaffold del package functions

**Files:**
- Create: `functions/package.json`
- Create: `functions/tsconfig.json`
- Modify: `firebase.json`

- [ ] **Step 1: Crea `functions/package.json`**

```json
{
  "name": "functions",
  "private": true,
  "type": "module",
  "engines": { "node": "20" },
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "deploy": "firebase deploy --only functions"
  },
  "dependencies": {
    "firebase-admin": "^12.6.0",
    "firebase-functions": "^5.1.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Crea `functions/tsconfig.json`**

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022",
    "outDir": "lib",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Aggiungi i blocchi `functions` ed `emulators` a `firebase.json`**

`firebase.json` diventa:

```json
{
  "firestore": {
    "rules": "firestore.rules"
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs20"
  },
  "emulators": {
    "firestore": { "port": 8080 },
    "auth": { "port": 9099 }
  }
}
```

- [ ] **Step 4: Installa le dipendenze**

Run: `cd functions && npm install`
Expected: `node_modules` creato, nessun errore.

- [ ] **Step 5: Commit**

```bash
git add functions/package.json functions/tsconfig.json firebase.json
git commit -m "chore(functions): scaffold TypeScript Cloud Functions package"
```

---

## Task 2: Modulo cascade + test su emulator

Il cuore. `deleteAccountCascade(db, authAdmin, uid)` cancella tutti i dati di `uid`.
Testato seminando dati nell'emulator, eseguendo il cascade, e verificando che tutto sparisca.

**Files:**
- Create: `functions/src/deleteAccountCascade.ts`
- Test: `functions/src/deleteAccountCascade.test.ts`

- [ ] **Step 1: Scrivi il test che fallisce**

`functions/src/deleteAccountCascade.test.ts`:

```ts
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest'
import { initializeApp, deleteApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { deleteAccountCascade } from './deleteAccountCascade.js'

// Richiede: firebase emulators:start --only firestore  (porta 8080)
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'

const U = 'user-under-test'
const L = 'mario'
const OTHER = 'other-user'

let app: App
let db: Firestore
// authAdmin finto: registra le deleteUser chiamate senza toccare l'Auth emulator
const deletedAuth: string[] = []
const authAdmin = { deleteUser: async (uid: string) => { deletedAuth.push(uid) } }

beforeAll(() => {
  app = initializeApp({ projectId: 'figubook-test' })
  db = getFirestore(app)
})
afterAll(async () => { await deleteApp(app) })

async function seed() {
  await db.doc(`users/${U}/meta/profile`).set({ username: 'Mario', usernameLower: L })
  await db.doc(`users/${U}/albums/calciatori-25-26`).set({ owned: [1, 2, 3] })
  await db.doc(`users/${U}/notifications/n1`).set({ read: false })
  await db.doc(`publicProfiles/${U}`).set({ uid: U, usernameLower: L })
  await db.doc(`usernames/${L}`).set({ uid: U })
  await db.doc(`tradeIndex/calciatori-25-26/users/${U}`).set({ doubles: [1] })
  await db.doc(`tradeIndex/calciatori-25-26/users/${OTHER}`).set({ doubles: [2] })
  await db.doc(`friendRequests/${U}__${OTHER}`).set({ fromUid: U, toUid: OTHER })
  await db.doc(`friendRequests/${OTHER}__${U}`).set({ fromUid: OTHER, toUid: U })
  await db.doc(`friendships/${[U, OTHER].sort().join('__')}`).set({ users: [U, OTHER] })
  await db.doc(`proposals/p1`).set({ participants: [U, OTHER], fromUid: U, toUid: OTHER })
  await db.doc(`users/${OTHER}/notifications/n9`).set({ fromUid: U, read: false })
}

async function exists(path: string) {
  return (await db.doc(path).get()).exists
}

beforeEach(async () => {
  deletedAuth.length = 0
  // pulizia grezza tra i test: cancella le radici usate
  for (const p of [`users/${U}`, `users/${OTHER}`, `publicProfiles/${U}`,
    `usernames/${L}`]) {
    await db.recursiveDelete(db.doc(p)).catch(() => {})
  }
})

describe('deleteAccountCascade', () => {
  it('cancella tutti i dati utente e libera lo username', async () => {
    await seed()
    await deleteAccountCascade(db, authAdmin, U)

    expect(await exists(`users/${U}/meta/profile`)).toBe(false)
    expect(await exists(`users/${U}/albums/calciatori-25-26`)).toBe(false)
    expect(await exists(`publicProfiles/${U}`)).toBe(false)
    expect(await exists(`usernames/${L}`)).toBe(false)
    expect(await exists(`tradeIndex/calciatori-25-26/users/${U}`)).toBe(false)
    expect(await exists(`friendRequests/${U}__${OTHER}`)).toBe(false)
    expect(await exists(`friendRequests/${OTHER}__${U}`)).toBe(false)
    expect(await exists(`friendships/${[U, OTHER].sort().join('__')}`)).toBe(false)
    expect(await exists(`proposals/p1`)).toBe(false)
    expect(await exists(`users/${OTHER}/notifications/n9`)).toBe(false)
    expect(deletedAuth).toEqual([U])
  })

  it('non tocca i dati degli altri utenti', async () => {
    await seed()
    await deleteAccountCascade(db, authAdmin, U)
    expect(await exists(`tradeIndex/calciatori-25-26/users/${OTHER}`)).toBe(true)
  })

  it('è idempotente su un utente già cancellato', async () => {
    await deleteAccountCascade(db, authAdmin, U) // nessun dato: non deve lanciare
    expect(deletedAuth).toEqual([U])
  })
})
```

- [ ] **Step 2: Avvia l'emulator e lancia il test per vederlo fallire**

Terminale A: `firebase emulators:start --only firestore`
Terminale B: `cd functions && npx vitest run src/deleteAccountCascade.test.ts`
Expected: FAIL — `deleteAccountCascade` non esiste / import non risolto.

- [ ] **Step 3: Implementa `deleteAccountCascade`**

`functions/src/deleteAccountCascade.ts`:

```ts
import type { Firestore } from 'firebase-admin/firestore'

// Interfaccia minima admin auth (facilita il test con un fake)
export interface AuthAdminLike {
  deleteUser(uid: string): Promise<void>
}

// Cancella un doc ignorando gli errori "non esiste" (idempotenza).
async function del(db: Firestore, path: string) {
  await db.doc(path).delete().catch(() => {})
}

// Cancella i risultati di una query a batch.
async function deleteQuery(
  db: Firestore,
  query: FirebaseFirestore.Query,
) {
  const snap = await query.get()
  const batch = db.batch()
  snap.docs.forEach((d) => batch.delete(d.ref))
  if (snap.size) await batch.commit()
}

export async function deleteAccountCascade(
  db: Firestore,
  authAdmin: AuthAdminLike,
  uid: string,
): Promise<void> {
  // 1. Ricava usernameLower (da publicProfiles, fallback meta/profile).
  let lower = ''
  const pub = await db.doc(`publicProfiles/${uid}`).get()
  if (pub.exists) lower = (pub.data()?.usernameLower as string) ?? ''
  if (!lower) {
    const prof = await db.doc(`users/${uid}/meta/profile`).get()
    lower = (prof.data()?.usernameLower as string) ?? ''
  }

  // 2. Cross-reference dove altri referenziano uid.
  await deleteQuery(db, db.collection('friendRequests').where('fromUid', '==', uid))
  await deleteQuery(db, db.collection('friendRequests').where('toUid', '==', uid))
  await deleteQuery(db, db.collection('friendships').where('users', 'array-contains', uid))
  await deleteQuery(db, db.collection('proposals').where('participants', 'array-contains', uid))
  await deleteQuery(db, db.collectionGroup('notifications').where('fromUid', '==', uid))

  // 3. tradeIndex/{albumId}/users/{uid}: l'uid è solo il doc id e collectionGroup('users')
  //    colliderebbe con la collezione root `users`. Filtro per path + leaf id.
  const tradeUsers = await db.collectionGroup('users').get()
  const tradeBatch = db.batch()
  let tradeCount = 0
  tradeUsers.docs.forEach((d) => {
    const isTradeIndex = d.ref.parent.parent?.parent?.id === 'tradeIndex'
    if (isTradeIndex && d.id === uid) {
      tradeBatch.delete(d.ref)
      tradeCount++
    }
  })
  if (tradeCount) await tradeBatch.commit()

  // 4. Albero utente (ricorsivo) + globali con chiave uid.
  await db.recursiveDelete(db.doc(`users/${uid}`))
  await del(db, `publicProfiles/${uid}`)
  if (lower) await del(db, `usernames/${lower}`)

  // 5. Auth per ultimo.
  await authAdmin.deleteUser(uid)
}
```

- [ ] **Step 4: Lancia il test per verificarlo verde**

Run (emulator attivo): `cd functions && npx vitest run src/deleteAccountCascade.test.ts`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git add functions/src/deleteAccountCascade.ts functions/src/deleteAccountCascade.test.ts
git commit -m "feat(functions): cascade delete logic with emulator tests"
```

---

## Task 3: Callable `deleteAccount`

Wrapper sottile: verifica auth, inizializza admin, chiama il cascade sull'uid del chiamante.

**Files:**
- Create: `functions/src/index.ts`

- [ ] **Step 1: Implementa la callable**

`functions/src/index.ts`:

```ts
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { deleteAccountCascade } from './deleteAccountCascade.js'

initializeApp()

export const deleteAccount = onCall({ region: 'europe-west1' }, async (req) => {
  const uid = req.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Login richiesto.')
  await deleteAccountCascade(getFirestore(), getAuth(), uid)
  return { ok: true }
})
```

- [ ] **Step 2: Verifica che compili**

Run: `cd functions && npm run build`
Expected: exit 0, cartella `lib/` generata.

- [ ] **Step 3: Commit**

```bash
git add functions/src/index.ts
git commit -m "feat(functions): deleteAccount callable operating on caller uid"
```

---

## Task 4: Client — wrapper + logica conferma

**Files:**
- Create: `figubook-app/src/lib/db/account.ts`
- Test: `figubook-app/src/lib/db/account.test.ts`

- [ ] **Step 1: Scrivi il test della pura `usernameMatches`**

`figubook-app/src/lib/db/account.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { usernameMatches } from './account'

describe('usernameMatches', () => {
  it('combacia ignorando maiuscole e spazi', () => {
    expect(usernameMatches('  Mario ', 'mario')).toBe(true)
    expect(usernameMatches('MARIO', 'mario')).toBe(true)
  })
  it('non combacia se diverso', () => {
    expect(usernameMatches('luigi', 'mario')).toBe(false)
    expect(usernameMatches('', 'mario')).toBe(false)
  })
})
```

- [ ] **Step 2: Lancia il test per vederlo fallire**

Run: `cd figubook-app && npx vitest run src/lib/db/account.test.ts`
Expected: FAIL — `usernameMatches` non esportata.

- [ ] **Step 3: Implementa `account.ts`**

`figubook-app/src/lib/db/account.ts`:

```ts
import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '@/lib/firebase'

// Confronto per la modale di conferma: input digitato vs username reale.
export function usernameMatches(typed: string, username: string): boolean {
  const t = typed.trim().toLowerCase()
  return t.length > 0 && t === username.trim().toLowerCase()
}

// Chiama la Cloud Function che cancella l'account del chiamante.
export async function deleteAccount(): Promise<void> {
  const functions = getFunctions(app, 'europe-west1')
  const call = httpsCallable(functions, 'deleteAccount')
  await call()
}
```

Nota: verifica che `@/lib/firebase` esporti `app`. Se esporta solo `auth`/`db`, aggiungi
`export const app = ...` (l'istanza `initializeApp` già presente nel file) e usa quella.

- [ ] **Step 4: Lancia il test per verificarlo verde**

Run: `cd figubook-app && npx vitest run src/lib/db/account.test.ts`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
git add figubook-app/src/lib/db/account.ts figubook-app/src/lib/db/account.test.ts
git commit -m "feat(account): client wrapper for deleteAccount + confirm logic"
```

---

## Task 5: Componente DangerZone (sezione + modale)

**Files:**
- Create: `figubook-app/src/components/profile/DangerZone.tsx`

- [ ] **Step 1: Implementa il componente**

`figubook-app/src/components/profile/DangerZone.tsx`:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { deleteAccount, usernameMatches } from '@/lib/db/account'

export function DangerZone({ username }: { username: string }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const canConfirm = usernameMatches(typed, username) && !busy

  async function confirm() {
    setBusy(true)
    setError('')
    try {
      await deleteAccount()
      await signOut(auth)
      navigate('/', { replace: true })
    } catch {
      setError('Eliminazione non riuscita. Riprova.')
      setBusy(false)
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/[0.04] p-5 sm:p-6">
      <h2 className="text-[15px] font-semibold text-red-400">Zona pericolosa</h2>
      <p className="mt-1 text-sm text-ink-2">
        Eliminare l'account cancella per sempre profilo, album, scambi e amicizie. Azione
        irreversibile.
      </p>
      <button
        onClick={() => setOpen(true)}
        className="mt-4 rounded-full border border-red-500/50 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
      >
        Elimina account
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-6">
            <h3 className="text-lg font-semibold text-ink">Sei sicuro?</h3>
            <p className="mt-2 text-sm text-ink-2">
              Questa azione è definitiva. Per confermare, digita il tuo username
              <span className="font-medium text-ink"> {username}</span>.
            </p>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Il tuo username"
              className="mt-4 w-full rounded-xl border border-white/10 bg-surface px-4 py-2.5 text-[15px] text-ink outline-none focus:border-red-500"
            />
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => { setOpen(false); setTyped(''); setError('') }}
                disabled={busy}
                className="rounded-full px-4 py-2 text-sm text-ink-2 hover:text-ink"
              >
                Annulla
              </button>
              <button
                onClick={confirm}
                disabled={!canConfirm}
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {busy ? 'Eliminazione…' : 'Elimina definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Verifica typecheck**

Run: `cd figubook-app && npx tsc -b --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add figubook-app/src/components/profile/DangerZone.tsx
git commit -m "feat(profile): DangerZone delete-account section with confirm modal"
```

---

## Task 6: Monta DangerZone in Profilo

**Files:**
- Modify: `figubook-app/src/pages/Profilo.tsx` (in fondo al form, dopo il toggle "Profilo privato" ~riga 322; lo username è disponibile come `initial.username` nel componente form)

- [ ] **Step 1: Importa il componente**

In cima a `figubook-app/src/pages/Profilo.tsx`, con gli altri import:

```tsx
import { DangerZone } from '@/components/profile/DangerZone'
```

- [ ] **Step 2: Renderizza dopo il blocco del toggle "Profilo privato"**

Subito dopo il `</div>`/`</label>` di chiusura del toggle "Profilo privato" (~riga 322-330),
prima della chiusura del form/sezione, aggiungi:

```tsx
<DangerZone username={initial.username} />
```

Nota: `initial.username` è la prop già passata al form (vedi la signature a riga 183:
`initial: { ...; username: string; ... }`). Se il render è in un componente diverso da
quello che ha `initial`, usa la variabile username già disponibile in quello scope.

- [ ] **Step 3: Verifica typecheck + build**

Run: `cd figubook-app && npx tsc -b --noEmit && npm run build`
Expected: exit 0 (solo il warning preesistente INEFFECTIVE_DYNAMIC_IMPORT su firebase.ts).

- [ ] **Step 4: Commit + cache-bust**

Bumpa `?v=N` sugli asset locali se necessario (regola cache-bust), poi:

```bash
git add figubook-app/src/pages/Profilo.tsx
git commit -m "feat(profile): mount DangerZone at bottom of profile form"
```

---

## Task 7: Deploy e verifica end-to-end

**Files:** nessuno (deploy + test manuale)

- [ ] **Step 1: Deploy della function**

Run: `cd functions && npm run build && firebase deploy --only functions`
Expected: `deleteAccount(europe-west1)` deployata con successo.

- [ ] **Step 2: Verifica manuale (founder)**

1. Login con un account di test.
2. Profilo → in fondo "Zona pericolosa" → Elimina account.
3. Modale: digita username → conferma.
4. Atteso: logout automatico + redirect landing.
5. Ri-registrati con **lo stesso username** → deve funzionare (username liberato).
6. (Console Firebase) verifica che `publicProfiles/{uid}`, `usernames/{lower}`,
   `users/{uid}` non esistano più.

- [ ] **Step 3: Commit finale (se cache-bust o note)**

```bash
git add -A figubook-app
git commit -m "chore: cache-bust after delete-account feature" || true
git push origin main
```

---

## Note di sicurezza / operative

- La function opera **solo** su `req.auth.uid`: nessun client può cancellare un altro utente.
- Nessuna reauth password: l'Admin SDK bypassa recent-login; la conferma "digita username"
  è la barriera anti-errore.
- Firestore prima, Auth per ultimo: se l'Auth delete fallisce l'utente ritenta; se Firestore
  fallisce a metà, il cascade è idempotente e ritentabile.
- `git add` con path espliciti (mai `-A` da root: node_modules + symlink .claude rompono Pages).
