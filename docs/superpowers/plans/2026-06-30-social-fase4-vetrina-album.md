# Social Fase 4 — Vetrina album altrui Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sulla vetrina `/u/:username` mostrare gli album di un altro collezionista e, su rotta dedicata, le sue figurine Mancanti e Doppie — solo se profilo pubblico o amico.

**Architecture:** Lettura diretta one-shot di `users/{uid}/albums/*` via nuovo modulo isolato `otherAlbums.ts`. Gating lato Firestore rules (isPublic via get, OR amico via exists su `friendships`). UI: lista album nella vetrina + nuova rotta dettaglio `/u/:username/album/:albumId`. Sola vista, nessuna CTA scambio.

**Tech Stack:** React 18 + Vite + TypeScript, react-router-dom, Firebase Firestore (web SDK v9 modular), Vitest.

**Spec:** `docs/superpowers/specs/2026-06-30-social-fase4-vetrina-album-design.md`

---

## File Structure

- Create: `figubook-app/src/lib/db/otherAlbums.ts` — letture one-shot album altrui (ids + doc).
- Create: `figubook-app/src/lib/db/otherAlbums.test.ts` — unit test del modulo.
- Create: `figubook-app/src/pages/ProfiloPubblicoAlbum.tsx` — pagina dettaglio Mancanti/Doppie.
- Modify: `figubook-app/src/pages/ProfiloPubblico.tsx` — sezione lista album gated.
- Modify: `figubook-app/src/App.tsx` — rotta `/u/:username/album/:albumId`.
- Modify: `firestore.rules` — apertura lettura `users/{uid}/albums/{albumId}`.

---

## Task 1: Modulo letture album altrui (`otherAlbums.ts`)

**Files:**
- Create: `figubook-app/src/lib/db/otherAlbums.ts`
- Test: `figubook-app/src/lib/db/otherAlbums.test.ts`

- [ ] **Step 1: Write the failing test**

`figubook-app/src/lib/db/otherAlbums.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { getDoc, doc } = vi.hoisted(() => ({
  getDoc: vi.fn(),
  doc: vi.fn((...path: unknown[]) => ({ path })),
}))

vi.mock('firebase/firestore', () => ({ getDoc, doc }))
vi.mock('@/lib/firebase', () => ({ db: {} }))

import { getOtherAlbumIds, getOtherAlbum } from './otherAlbums'

beforeEach(() => { vi.clearAllMocks() })

describe('getOtherAlbumIds', () => {
  it('ritorna ids esclusi gli archived', async () => {
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ ids: ['a', 'b', 'c'], archived: ['b'] }),
    })
    const ids = await getOtherAlbumIds('u1')
    expect(ids).toEqual(['a', 'c'])
  })

  it('doc assente o permesso negato -> []', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => false, data: () => ({}) })
    expect(await getOtherAlbumIds('u1')).toEqual([])
    getDoc.mockRejectedValueOnce(new Error('permission-denied'))
    expect(await getOtherAlbumIds('u1')).toEqual([])
  })
})

describe('getOtherAlbum', () => {
  it('ritorna states/counts', async () => {
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ states: { '1': 'have' }, counts: { '2': 3 } }),
    })
    const d = await getOtherAlbum('u1', 'calciatori-25-26')
    expect(d).toEqual({ states: { '1': 'have' }, counts: { '2': 3 } })
  })

  it('assente o negato -> null', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => false, data: () => ({}) })
    expect(await getOtherAlbum('u1', 'x')).toBeNull()
    getDoc.mockRejectedValueOnce(new Error('permission-denied'))
    expect(await getOtherAlbum('u1', 'x')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd figubook-app && npx vitest run src/lib/db/otherAlbums.test.ts`
Expected: FAIL — `Failed to resolve import './otherAlbums'` / export non definito.

- [ ] **Step 3: Write minimal implementation**

`figubook-app/src/lib/db/otherAlbums.ts`:
```typescript
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { AlbumDoc } from '@/lib/db/albums'

// Letture ONE-SHOT degli album di un ALTRO utente (sola vista, niente onSnapshot).
// Il gating reale e' nelle firestore.rules: se la lettura e' negata
// (profilo privato e non amico) le promise rigettano e qui torniamo vuoto/null.

// Lista album visibili dell'altro utente (esclusi gli archiviati).
export async function getOtherAlbumIds(uid: string): Promise<string[]> {
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'albums', '_my-albums'))
    if (!snap.exists()) return []
    const d = snap.data() as { ids?: string[]; archived?: string[] }
    const archived = new Set(d.archived ?? [])
    return (d.ids ?? []).filter((id) => !archived.has(id))
  } catch {
    return []
  }
}

// Conteggi salvati di un singolo album dell'altro utente.
export async function getOtherAlbum(uid: string, albumId: string): Promise<AlbumDoc | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'albums', albumId))
    if (!snap.exists()) return null
    const d = snap.data() as Partial<AlbumDoc>
    return { states: d.states ?? {}, counts: d.counts ?? {} }
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd figubook-app && npx vitest run src/lib/db/otherAlbums.test.ts`
Expected: PASS (6 test).

- [ ] **Step 5: Commit**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add figubook-app/src/lib/db/otherAlbums.ts figubook-app/src/lib/db/otherAlbums.test.ts
git commit -m "feat(social): modulo letture one-shot album altrui (Fase 4)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Regole Firestore — apertura lettura album altrui

**Files:**
- Modify: `firestore.rules:13`

Non c'e' emulator nel progetto: questa task e' edit + verifica manuale post-deploy (vedi Task 5). Il deploy va CONFERMATO con l'utente prima di eseguirlo.

- [ ] **Step 1: Modificare la regola dell'albums subcollection**

In `firestore.rules`, dentro `match /users/{userId}`, sostituire:
```
      match /albums/{albumId} { allow read, write: if isUser(userId); }
```
con:
```
      // Album: owner sempre. Lettura ad altri se il proprietario e' pubblico
      // (publicProfiles.isPublic) OPPURE se sono amici accettati (friendships).
      // Le rules non ordinano gli uid: si provano entrambi gli ordini del pairId.
      match /albums/{albumId} {
        allow write: if isUser(userId);
        allow read: if isUser(userId)
          || get(/databases/$(database)/documents/publicProfiles/$(userId)).data.isPublic == true
          || exists(/databases/$(database)/documents/friendships/$(userId + '__' + request.auth.uid))
          || exists(/databases/$(database)/documents/friendships/$(request.auth.uid + '__' + userId));
      }
```

- [ ] **Step 2: Validare la sintassi delle rules**

Run: `cd /Users/alessandrogelo/Desktop/FiguBook && firebase deploy --only firestore:rules --dry-run`
Expected: compila senza errori di sintassi (no deploy effettivo).
Nota: se `--dry-run` non supportato dalla CLI installata, saltare — la validazione avviene al deploy reale in Task 5.

- [ ] **Step 3: Commit (senza deploy)**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add firestore.rules
git commit -m "feat(social): regole lettura album altrui (isPublic OR amico)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Pagina dettaglio `/u/:username/album/:albumId`

**Files:**
- Create: `figubook-app/src/pages/ProfiloPubblicoAlbum.tsx`
- Modify: `figubook-app/src/App.tsx:57` (aggiunta rotta), `figubook-app/src/App.tsx:23` (import)

- [ ] **Step 1: Creare la pagina**

`figubook-app/src/pages/ProfiloPubblicoAlbum.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getPublicByUsername } from '@/lib/db/publicProfiles'
import { getOtherAlbum } from '@/lib/db/otherAlbums'
import { loadAlbumData } from '@/data/albums'
import { computeStats, type AlbumDoc } from '@/lib/db/albums'
import { counterOf } from '@/lib/album/stats'
import { albumById } from '@/data/albumCatalog'
import type { AlbumData } from '@/data/albums/types'
import type { PublicProfile } from '@/lib/db/profile'
import { FadeIn } from '@/components/home/FadeIn'

export default function ProfiloPubblicoAlbum() {
  const { username = '', albumId = '' } = useParams()
  return <Inner key={`${username}/${albumId}`} username={username} albumId={albumId} />
}

function Inner({ username, albumId }: { username: string; albumId: string }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [album, setAlbum] = useState<AlbumDoc | null>(null)
  const [data, setData] = useState<AlbumData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      const p = await getPublicByUsername(username)
      if (!active) return
      setProfile(p)
      if (p) {
        const [a, d] = await Promise.all([getOtherAlbum(p.uid, albumId), loadAlbumData(albumId)])
        if (!active) return
        setAlbum(a)
        setData(d)
      }
      setLoading(false)
    })()
    return () => { active = false }
  }, [username, albumId])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <div className="h-40 animate-pulse rounded-2xl bg-bg-elev" />
      </div>
    )
  }

  const entry = albumById[albumId]
  // album === null => profilo privato e non sei amico (rules negano), o album assente.
  if (!profile || !album || !data || !entry) {
    return (
      <div className="mx-auto w-full max-w-3xl py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Album non disponibile</h1>
        <p className="mt-2 text-ink-2">Questo album non e' visibile o non esiste.</p>
        <Link
          to={`/u/${username}`}
          className="mt-5 inline-block rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-ink-2 hover:text-ink"
        >
          Torna al profilo
        </Link>
      </div>
    )
  }

  const stats = computeStats(albumId, album.states, album.counts)
  const allCodes = data.sections.flatMap((s) => s.codes)
  const missingCodes = allCodes.filter((c) => counterOf(c, album.states, album.counts) === 0)
  const doubleCodes = allCodes.filter((c) => counterOf(c, album.states, album.counts) >= 2)

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        to={`/u/${username}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> {profile.username}
      </Link>

      <FadeIn>
        <div className="rounded-2xl border border-white/[0.1] bg-surface/40 p-6 sm:p-7">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">{entry.title}</h1>
          <p className="mt-1 text-sm text-ink-2">{entry.editor} · {entry.season}</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-lime" style={{ width: `${stats.pct}%` }} />
            </div>
            <span className="text-sm font-semibold text-ink">{stats.pct}%</span>
          </div>
          <p className="mt-1.5 text-sm text-ink-2">{stats.have}/{stats.total} · {stats.missing} mancanti · {stats.doubles} doppie</p>
        </div>
      </FadeIn>

      <CodeSection title="Mancanti" codes={missingCodes} names={data.names} />
      <CodeSection title="Doppie" codes={doubleCodes} names={data.names} counts={album.counts} />
    </div>
  )
}

function CodeSection({
  title, codes, names, counts,
}: {
  title: string
  codes: string[]
  names: Record<string, string>
  counts?: Record<string, number>
}) {
  return (
    <FadeIn>
      <div className="mt-6 rounded-2xl border border-white/[0.08] bg-surface/40 p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-ink">
          {title} <span className="text-ink-2">({codes.length})</span>
        </h2>
        {codes.length === 0 ? (
          <p className="mt-2 text-sm text-ink-2">Nessuna.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {codes.map((c) => (
              <li
                key={c}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-sm text-ink"
              >
                <span className="font-mono text-xs text-ink-2">{c}</span>
                <span className="truncate max-w-[10rem]">{names[c] ?? '—'}</span>
                {counts && counts[c] > 2 && (
                  <span className="rounded bg-lime/15 px-1.5 text-xs font-semibold text-lime">×{counts[c] - 1}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </FadeIn>
  )
}
```
Nota: per le Doppie la quantita' scambiabile e' `count - 1` (ne tieni una). Mostrata solo se >1.

- [ ] **Step 2: Registrare la rotta in App.tsx**

In `figubook-app/src/App.tsx`, dopo l'import a riga 23 aggiungere:
```tsx
import ProfiloPubblicoAlbum from '@/pages/ProfiloPubblicoAlbum'
```
e dopo la rotta `/u/:username` (riga 57) aggiungere:
```tsx
        <Route path="/u/:username/album/:albumId" element={<ProfiloPubblicoAlbum />} />
```

- [ ] **Step 3: Verificare build + tipi**

Run: `cd figubook-app && npx tsc -b --noEmit && npm run lint 2>&1 | grep -c error`
Expected: tsc exit 0; conteggio errori lint = `0`.

- [ ] **Step 4: Commit**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add figubook-app/src/pages/ProfiloPubblicoAlbum.tsx figubook-app/src/App.tsx
git commit -m "feat(social): pagina dettaglio album altrui (Mancanti/Doppie)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Sezione lista album nella vetrina

**Files:**
- Modify: `figubook-app/src/pages/ProfiloPubblico.tsx:131-149` (blocco "Album e attività gated")

- [ ] **Step 1: Aggiungere stato e caricamento album nella vetrina**

In `ProfiloPubblico.tsx`, dentro `VetrinaInner`, dopo il blocco `useEffect` esistente del profilo (riga 35) aggiungere import e logica. In testa al file aggiungere agli import esistenti:
```tsx
import { getOtherAlbumIds, getOtherAlbum } from '@/lib/db/otherAlbums'
import { computeStats } from '@/lib/db/albums'
import { albumById } from '@/data/albumCatalog'
```
Dentro `VetrinaInner`, sotto gli state esistenti. Nota: non serve sapere lo stato amicizia qui — tentiamo sempre la lettura. Se sei pubblico/amico le rules permettono e gli album appaiono; altrimenti le letture tornano vuote e la lista resta vuota (mostriamo lo stato gated).
```tsx
  const [albums, setAlbums] = useState<{ id: string; pct: number }[]>([])

  useEffect(() => {
    if (!profile) return
    let active = true
    ;(async () => {
      const ids = await getOtherAlbumIds(profile.uid)
      const withPct = await Promise.all(
        ids.filter((id) => albumById[id]).map(async (id) => {
          const a = await getOtherAlbum(profile.uid, id)
          const pct = a ? computeStats(id, a.states, a.counts).pct : 0
          return { id, pct }
        }),
      )
      if (active) setAlbums(withPct)
    })()
    return () => { active = false }
  }, [profile])
```

- [ ] **Step 2: Sostituire il blocco placeholder "Album e attività (gated)"**

Sostituire l'intero blocco JSX da `{/* Album e attività (gated) */}` (riga 131) fino alla chiusura del `</FadeIn>` (riga 149) con:
```tsx
      {/* Album (gated lato rules: vuoto se privato e non amico) */}
      <FadeIn>
        {albums.length > 0 ? (
          <div className="mt-6">
            <h2 className="mb-3 px-1 font-display text-lg font-semibold text-ink">Album</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {albums.map(({ id, pct }) => {
                const entry = albumById[id]
                return (
                  <Link
                    key={id}
                    to={`/u/${profile.username}/album/${id}`}
                    className="group flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-surface/40 p-4 transition-colors hover:border-white/20"
                  >
                    <div
                      className="h-12 w-9 shrink-0 overflow-hidden rounded-md bg-cover bg-center"
                      style={{ background: `linear-gradient(135deg, ${entry.c1}, ${entry.c2})` }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{entry.title}</p>
                      <p className="text-xs text-ink-2">{pct}% completo</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-white/[0.08] bg-surface/40 px-5 py-12 text-center">
            {profile.isPublic ? (
              <>
                <p className="text-base font-medium text-ink">Nessun album pubblico</p>
                <p className="mt-1.5 text-sm text-ink-2">Questo collezionista non ha ancora album da mostrare.</p>
              </>
            ) : (
              <>
                <Lock className="mx-auto h-6 w-6 text-ink-2" />
                <p className="mt-2 text-base font-medium text-ink">Profilo privato</p>
                <p className="mt-1.5 text-sm text-ink-2">Aggiungilo come amico per vedere i suoi album.</p>
              </>
            )}
          </div>
        )}
      </FadeIn>
```
`Lock`, `Link`, `FadeIn` sono gia' importati nel file.

- [ ] **Step 3: Verificare build + tipi**

Run: `cd figubook-app && npx tsc -b --noEmit && npm run lint 2>&1 | grep -c error`
Expected: tsc exit 0; conteggio errori lint = `0`.

- [ ] **Step 4: Build completo**

Run: `cd figubook-app && npm run build`
Expected: exit 0 (solo warning chunk-size accettati).

- [ ] **Step 5: Commit**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add figubook-app/src/pages/ProfiloPubblico.tsx
git commit -m "feat(social): lista album altrui nella vetrina /u/:username

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Deploy regole + verifica end-to-end

**Files:** nessuno (deploy + test manuale).

- [ ] **Step 1: Confermare il deploy con l'utente**

Le rules cambiano la visibilita' dei dati: chiedere conferma esplicita prima del deploy.

- [ ] **Step 2: Deploy regole**

Run: `cd /Users/alessandrogelo/Desktop/FiguBook && firebase deploy --only firestore:rules`
Expected: `Deploy complete!`.

- [ ] **Step 3: Verifica manuale (due account)**

1. Account A pubblico con almeno un album → da account B apri `/u/usernameA`: appaiono gli album con %.
2. Click su un album → pagina mostra Mancanti e Doppie corrette (confronta con l'album di A).
3. Account A privato, B NON amico → `/u/usernameA`: stato "Profilo privato", nessun album; aprire a mano `/u/usernameA/album/<id>` → "Album non disponibile".
4. B manda richiesta, A accetta → ricarica `/u/usernameA`: gli album ora appaiono.

- [ ] **Step 4: Push finale**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook && git push origin main
```

---

## Self-Review note
- Spec coverage: regole (Task 2), otherAlbums.ts (Task 1), vetrina lista (Task 4), dettaglio rotta nuova (Task 3), deploy/verifica (Task 5) — tutte le sezioni dello spec coperte.
- `counterOf(code, states, counts)` e `computeStats` sono export esistenti riusati (no nuove firme).
- Sola vista confermata: nessun bottone scambio in nessuna task.
