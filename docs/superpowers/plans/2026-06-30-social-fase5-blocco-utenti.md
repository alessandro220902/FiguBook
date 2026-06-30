# Social Fase 5 — Blocco utenti Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Menu kebab sulla vetrina con Rimuovi amico + Blocca/Sblocca, blocco completo, sezione Utenti bloccati nel profilo.

**Architecture:** Blocco = campo `blocked: string[]` su `users/{uid}/meta/profile` (già nel tipo). Enforcement via firestore rules con `get()`. UI: componente kebab riusabile, sezione profilo, filtro ricerca.

**Tech Stack:** React 18 + Vite + TS + Firebase Firestore v9 + Vitest.

**Spec:** `docs/superpowers/specs/2026-06-30-social-fase5-blocco-utenti-design.md`

---

## File Structure
- Create: `figubook-app/src/lib/db/blocks.ts` + `.test.ts`
- Create: `figubook-app/src/components/ProfileActionsMenu.tsx`
- Modify: `figubook-app/src/pages/ProfiloPubblico.tsx`
- Modify: `figubook-app/src/pages/Profilo.tsx`
- Modify: `figubook-app/src/hooks/useUserSearch.ts`
- Modify: `firestore.rules`

---

## Task 1: Modulo blocks.ts (TDD)

**Files:** Create `figubook-app/src/lib/db/blocks.ts`, Test `figubook-app/src/lib/db/blocks.test.ts`

- [ ] **Step 1: Failing test** `figubook-app/src/lib/db/blocks.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { setDoc, deleteDoc, arrayUnion, arrayRemove, doc } = vi.hoisted(() => ({
  setDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  arrayUnion: vi.fn((...v: string[]) => ({ __union: v })),
  arrayRemove: vi.fn((...v: string[]) => ({ __remove: v })),
  doc: vi.fn((...path: unknown[]) => ({ path })),
}))
const unfriend = vi.fn(() => Promise.resolve())

vi.mock('firebase/firestore', () => ({ setDoc, deleteDoc, arrayUnion, arrayRemove, doc }))
vi.mock('@/lib/firebase', () => ({ db: {} }))
vi.mock('@/lib/db/friends', () => ({ unfriend }))

import { blockUser, unblockUser } from './blocks'

beforeEach(() => { vi.clearAllMocks() })

describe('blockUser', () => {
  it('arrayUnion blocked + unfriend + cancella entrambe le richieste', async () => {
    await blockUser('me', 'other')
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(), { blocked: { __union: ['other'] } }, { merge: true },
    )
    expect(unfriend).toHaveBeenCalledWith('me', 'other')
    expect(deleteDoc).toHaveBeenCalledTimes(2)
  })
})

describe('unblockUser', () => {
  it('arrayRemove blocked', async () => {
    await unblockUser('me', 'other')
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(), { blocked: { __remove: ['other'] } }, { merge: true },
    )
  })
})
```

- [ ] **Step 2: Run, must fail** `cd figubook-app && npx vitest run src/lib/db/blocks.test.ts`

- [ ] **Step 3: Implement** `figubook-app/src/lib/db/blocks.ts`:
```typescript
import { doc, setDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { unfriend } from '@/lib/db/friends'

const profileRef = (uid: string) => doc(db, 'users', uid, 'meta', 'profile')
const reqRef = (from: string, to: string) => doc(db, 'friendRequests', `${from}__${to}`)

// Blocco completo: registra il blocco, scioglie l'amicizia e cancella le
// richieste pending nei due versi. blocked vive su users/{uid}/meta/profile.
export async function blockUser(me: string, otherUid: string) {
  await setDoc(profileRef(me), { blocked: arrayUnion(otherUid) }, { merge: true })
  await unfriend(me, otherUid)
  await Promise.allSettled([
    deleteDoc(reqRef(me, otherUid)),
    deleteDoc(reqRef(otherUid, me)),
  ])
}

export async function unblockUser(me: string, otherUid: string) {
  await setDoc(profileRef(me), { blocked: arrayRemove(otherUid) }, { merge: true })
}
```

- [ ] **Step 4: Run, must pass** `cd figubook-app && npx vitest run src/lib/db/blocks.test.ts`

- [ ] **Step 5: Commit**
```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add figubook-app/src/lib/db/blocks.ts figubook-app/src/lib/db/blocks.test.ts
git commit -m "feat(social): modulo blocco utenti (block/unblock)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Regole Firestore — blocco

**Files:** Modify `firestore.rules`

- [ ] **Step 1: Album — escludere il bloccato**

Nella regola `match /albums/{albumId}` la `allow read` attuale è:
```
        allow read: if isUser(userId)
          || exists(/databases/$(database)/documents/friendships/$(userId + '__' + request.auth.uid))
          || exists(/databases/$(database)/documents/friendships/$(request.auth.uid + '__' + userId))
          || (exists(/databases/$(database)/documents/publicProfiles/$(userId))
              && get(/databases/$(database)/documents/publicProfiles/$(userId)).data.isPublic == true);
```
Sostituirla con (owner sempre; per gli altri, vale solo se NON bloccati dal proprietario):
```
        allow read: if isUser(userId)
          || (
            (exists(/databases/$(database)/documents/friendships/$(userId + '__' + request.auth.uid))
             || exists(/databases/$(database)/documents/friendships/$(request.auth.uid + '__' + userId))
             || (exists(/databases/$(database)/documents/publicProfiles/$(userId))
                 && get(/databases/$(database)/documents/publicProfiles/$(userId)).data.isPublic == true))
            && !(request.auth.uid in get(/databases/$(database)/documents/users/$(userId)/meta/profile).data.get('blocked', []))
          );
```

- [ ] **Step 2: friendRequests — vietare al bloccato di inviare**

Nella regola `match /friendRequests/{rid}` la `allow create` attuale è:
```
      allow create: if signedIn()
        && request.resource.data.fromUid == request.auth.uid
        && request.resource.data.fromUid != request.resource.data.toUid;
```
Sostituirla con:
```
      allow create: if signedIn()
        && request.resource.data.fromUid == request.auth.uid
        && request.resource.data.fromUid != request.resource.data.toUid
        && !(request.resource.data.fromUid in get(/databases/$(database)/documents/users/$(request.resource.data.toUid)/meta/profile).data.get('blocked', []));
```

- [ ] **Step 3: Validare sintassi** `cd /Users/alessandrogelo/Desktop/FiguBook && firebase deploy --only firestore:rules --dry-run`
Expected: `compiled successfully`. (Deploy reale in Task 7.)

- [ ] **Step 4: Commit (no deploy)**
```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add firestore.rules
git commit -m "feat(social): regole blocco (no album/no richieste al bloccante)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Componente kebab `ProfileActionsMenu`

**Files:** Create `figubook-app/src/components/ProfileActionsMenu.tsx`

- [ ] **Step 1: Creare il componente**
```tsx
import { useEffect, useRef, useState } from 'react'
import { MoreVertical, UserMinus, Ban, RotateCcw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { subscribeFriendStatus, unfriend, type FriendStatus } from '@/lib/db/friends'
import { blockUser, unblockUser } from '@/lib/db/blocks'

// Menu kebab sulla vetrina: Rimuovi amico (se amici) + Blocca/Sblocca.
export function ProfileActionsMenu({ otherUid }: { otherUid: string }) {
  const { user } = useAuth()
  const { profile } = useProfile()
  const me = user?.uid
  const [status, setStatus] = useState<FriendStatus>('none')
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!me || me === otherUid) return
    return subscribeFriendStatus(me, otherUid, setStatus)
  }, [me, otherUid])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  if (!me || me === otherUid) return null

  const isBlocked = profile?.blocked?.includes(otherUid) ?? false

  async function run(fn: () => Promise<void>) {
    if (busy) return
    setBusy(true)
    try { await fn() } finally { setBusy(false); setOpen(false) }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Altre azioni"
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-ink-2 transition-colors hover:bg-white/10 hover:text-ink"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-white/10 bg-surface shadow-xl">
          {status === 'friends' && !isBlocked && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => unfriend(me, otherUid))}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-ink hover:bg-white/[0.06] disabled:opacity-50"
            >
              <UserMinus className="h-4 w-4" /> Rimuovi amico
            </button>
          )}
          {isBlocked ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => unblockUser(me, otherUid))}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-ink hover:bg-white/[0.06] disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" /> Sblocca
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => blockUser(me, otherUid))}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-stat-missing hover:bg-stat-missing/10 disabled:opacity-50"
            >
              <Ban className="h-4 w-4" /> Blocca
            </button>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify** `cd figubook-app && npx tsc -b --noEmit && npm run lint 2>&1 | grep -c error` → tsc 0, lint `0`.

- [ ] **Step 3: Commit**
```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add figubook-app/src/components/ProfileActionsMenu.tsx
git commit -m "feat(social): componente kebab azioni profilo (rimuovi amico/blocca)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Integrare kebab + stato bloccato nella vetrina

**Files:** Modify `figubook-app/src/pages/ProfiloPubblico.tsx`

- [ ] **Step 1: Import** — aggiungere in testa:
```tsx
import { useProfile } from '@/hooks/useProfile'
import { ProfileActionsMenu } from '@/components/ProfileActionsMenu'
```

- [ ] **Step 2: Stato bloccato** — dentro `VetrinaInner`, dopo `const { user } = useAuth()` aggiungere:
```tsx
  const { profile: myProfile } = useProfile()
```
e dopo aver calcolato `const isMe = user?.uid === profile.uid` (esiste già più sotto) usare il flag:
```tsx
  const isBlocked = !isMe && (myProfile?.blocked?.includes(profile.uid) ?? false)
```
(Definirlo subito dopo la riga `const isMe = ...`.)

- [ ] **Step 3: Header nome + kebab** — il blocco con `<h1>{name}</h1>` è dentro `<div className="min-w-0 flex-1">`. Avvolgere nome e kebab in una riga. Sostituire:
```tsx
              <h1 className="truncate font-display text-[30px] font-semibold tracking-tight text-ink sm:text-[36px]">
                {name}
              </h1>
```
con:
```tsx
              <div className="flex items-start justify-center gap-2 sm:justify-start">
                <h1 className="truncate font-display text-[30px] font-semibold tracking-tight text-ink sm:text-[36px]">
                  {name}
                </h1>
                {!isMe && <ProfileActionsMenu otherUid={profile.uid} />}
              </div>
```

- [ ] **Step 4: Azione amicizia** — il blocco azione mostra `<FriendButton>` per i non-me. Nasconderlo se bloccato. Sostituire:
```tsx
                ) : (
                  <FriendButton otherUid={profile.uid} />
                )}
```
con:
```tsx
                ) : isBlocked ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-stat-missing/15 px-4 py-2 text-sm font-medium text-stat-missing">
                    Utente bloccato
                  </span>
                ) : (
                  <FriendButton otherUid={profile.uid} />
                )}
```

- [ ] **Step 5: Sezione album quando bloccato** — la sezione album fa `albums.length > 0 ? ...`. Anteporre il caso bloccato. Sostituire l'apertura del blocco album:
```tsx
      {/* Album (gated lato rules: vuoto se privato e non amico) */}
      <FadeIn>
        {albums.length > 0 ? (
```
con:
```tsx
      {/* Album (gated lato rules: vuoto se privato e non amico) */}
      <FadeIn>
        {isBlocked ? (
          <div className="mt-6 rounded-2xl border border-white/[0.08] bg-surface/40 px-5 py-12 text-center">
            <Ban className="mx-auto h-6 w-6 text-stat-missing" />
            <p className="mt-2 text-base font-medium text-ink">Utente bloccato</p>
            <p className="mt-1.5 text-sm text-ink-2">Sbloccalo dal menu accanto al nome per rivedere il profilo.</p>
          </div>
        ) : albums.length > 0 ? (
```
e aggiungere l'import dell'icona `Ban` alla riga `import { MapPin, Lock, Pencil } from 'lucide-react'` → `import { MapPin, Lock, Pencil, Ban } from 'lucide-react'`.

- [ ] **Step 6: Non caricare album se bloccato** — nel `useEffect` che carica gli album (deps `[profile]`) anteporre la guardia. Cambiare:
```tsx
  useEffect(() => {
    if (!profile) return
    let active = true
```
in:
```tsx
  useEffect(() => {
    if (!profile) return
    if (myProfile?.blocked?.includes(profile.uid)) { setAlbums([]); return }
    let active = true
```
e aggiungere `myProfile` alle deps dell'effetto: `}, [profile])` → `}, [profile, myProfile])`.

- [ ] **Step 7: Verify** `cd figubook-app && npx tsc -b --noEmit && npm run lint 2>&1 | grep -c error` → tsc 0, lint `0`.

- [ ] **Step 8: Commit**
```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add figubook-app/src/pages/ProfiloPubblico.tsx
git commit -m "feat(social): kebab + stato bloccato sulla vetrina

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Sezione "Utenti bloccati" nel profilo

**Files:** Modify `figubook-app/src/pages/Profilo.tsx`

- [ ] **Step 1: Import** — aggiungere in testa al file:
```tsx
import { getPublicByUid } from '@/lib/db/publicProfiles'
import { unblockUser } from '@/lib/db/blocks'
import type { PublicProfile } from '@/lib/db/profile'
```
(`useState`, `useEffect`, `Avatar` sono già importati nel file.)

- [ ] **Step 2: Componente sezione** — aggiungere prima di `export default function Profilo()`:
```tsx
function BlockedUsers({ uid, blocked }: { uid: string; blocked: string[] }) {
  const [list, setList] = useState<PublicProfile[]>([])

  useEffect(() => {
    let active = true
    Promise.all(blocked.map((id) => getPublicByUid(id)))
      .then((rs) => active && setList(rs.filter((r): r is PublicProfile => !!r)))
    return () => { active = false }
  }, [blocked])

  return (
    <section className="rounded-2xl border border-white/[0.1] bg-surface/40 p-6">
      <h2 className="font-display text-xl font-semibold text-ink">Utenti bloccati</h2>
      {blocked.length === 0 ? (
        <p className="mt-3 text-sm text-ink-2">Nessun utente bloccato.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {list.map((u) => (
            <li key={u.uid} className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-surface px-4 py-3">
              <Avatar id={u.avatarId} name={u.username} className="h-9 w-9 shrink-0 overflow-hidden rounded-full" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{u.username}</span>
              <button
                type="button"
                onClick={() => unblockUser(uid, u.uid)}
                className="rounded-full border border-white/15 px-3.5 py-1.5 text-sm font-medium text-ink-2 transition-colors hover:text-ink"
              >
                Sblocca
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
```
Nota: l'unblock aggiorna `profile.blocked` live (useProfile) → la prop `blocked` cambia → la lista si rigenera; l'utente sbloccato sparisce.

- [ ] **Step 3: Inserire la sezione** — nel `return` di `Profilo()`, subito DOPO la chiusura del `<div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">...</div>` (la riga `</div>` che chiude la griglia, prima di `{avatarOpen && ...}`), aggiungere:
```tsx
      {user && (
        <FadeIn>
          <div className="mt-6">
            <BlockedUsers uid={user.uid} blocked={profile?.blocked ?? []} />
          </div>
        </FadeIn>
      )}
```

- [ ] **Step 4: Verify** `cd figubook-app && npx tsc -b --noEmit && npm run lint 2>&1 | grep -c error` → tsc 0, lint `0`.

- [ ] **Step 5: Commit**
```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add figubook-app/src/pages/Profilo.tsx
git commit -m "feat(social): sezione Utenti bloccati nel profilo

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Filtrare i bloccati dalla ricerca

**Files:** Modify `figubook-app/src/hooks/useUserSearch.ts`

- [ ] **Step 1: Filtro** — il hook usa `searchUsers`. Leggere il proprio profilo e togliere gli uid bloccati. Sostituire l'intero file con:
```tsx
import { useEffect, useState } from 'react'
import { searchUsers } from '@/lib/db/publicProfiles'
import { useProfile } from '@/hooks/useProfile'
import type { PublicProfile } from '@/lib/db/profile'

// Ricerca utenti debounced per prefisso username. results vuoto se query corta.
// Esclude gli utenti che ho bloccato.
export function useUserSearch(q: string, max = 8) {
  const { profile } = useProfile()
  const [results, setResults] = useState<PublicProfile[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const term = q.trim()
    let active = true
    const t = setTimeout(() => {
      if (term.length < 2) {
        setResults([])
        setLoading(false)
        return
      }
      setLoading(true)
      searchUsers(term, max)
        .then((r) => active && setResults(r))
        .catch(() => active && setResults([]))
        .finally(() => active && setLoading(false))
    }, 200)
    return () => {
      active = false
      clearTimeout(t)
    }
  }, [q, max])

  const blocked = profile?.blocked ?? []
  const filtered = blocked.length ? results.filter((r) => !blocked.includes(r.uid)) : results
  return { results: filtered, loading }
}
```

- [ ] **Step 2: Verify** `cd figubook-app && npx tsc -b --noEmit && npm run lint 2>&1 | grep -c error` → tsc 0, lint `0`. Poi `npm run build` → exit 0.

- [ ] **Step 3: Commit**
```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add figubook-app/src/hooks/useUserSearch.ts
git commit -m "feat(social): escludi utenti bloccati dalla ricerca

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Deploy regole + push + verifica

**Files:** nessuno.

- [ ] **Step 1: Confermare deploy con l'utente** (cambia visibilità dati).
- [ ] **Step 2: Deploy** `cd /Users/alessandrogelo/Desktop/FiguBook && firebase deploy --only firestore:rules` → `Deploy complete!`
- [ ] **Step 3: Verifica manuale (due account A, B):**
  1. A apre `/u/B` → menu kebab → Blocca. A vede "Utente bloccato", niente album.
  2. B apre `/u/A`: il pulsante "Aggiungi amico" NON deve creare richiesta (regola nega); gli album di A NON sono visibili.
  3. A va in `/profilo` → sezione Utenti bloccati: B presente → Sblocca → B sparisce.
  4. Dopo sblocco, A può di nuovo vedere/aggiungere B.
  5. Ricerca di A: B non compare finché bloccato.
- [ ] **Step 4: Push** `cd /Users/alessandrogelo/Desktop/FiguBook && git push origin main`

---

## Self-Review note
- Spec coverage: blocks.ts (T1), rules (T2), kebab (T3+T4), sezione profilo (T5), ricerca (T6), deploy (T7).
- `blockUser`/`unblockUser` firme coerenti tra blocks.ts, ProfileActionsMenu, Profilo, useUserSearch.
- `profile.blocked` letto via `useProfile` ovunque (live).
