# Team Kit Fase B — Badge "Nuovo" su album — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Due badge album — "Nuova uscita" (novità di catalogo, 30gg da `addedAt`) e "Nuovo" (album in lista non ancora aperto) — su superfici separate.

**Architecture:** Campo statico `addedAt` nel catalogo + pura `isNewRelease`. Array `opened` nel doc `_my-albums` (nessun timestamp) + mutation `markAlbumOpened` + helper `isNewInList`. Un componente chip `<AlbumBadge>` riusa lo stile Midnight Gold del badge ×N. Applicato a CreateAlbumMenu (discovery → "Nuova uscita"), AlbumList tile (lista → "Nuovo"), Album.tsx mount (segna aperto).

**Tech Stack:** React 18 + TS, Vite, Firestore (modular SDK), Vitest.

Spec: `docs/superpowers/specs/2026-07-10-team-kit-fase-b-badge-nuovo-design.md`

Regole sessione: commit+push su main dopo ogni task; `git add` path espliciti (mai `-A` da root); dev dir `figubook-app`.

---

## File Structure

- `src/data/albumCatalog.ts` — MODIFICA: campo `addedAt?` su `AlbumCatalogEntry`; export `isNewRelease`.
- `src/data/albumCatalog.test.ts` — CREA: test `isNewRelease`.
- `src/lib/db/albums.ts` — MODIFICA: `opened` in `MyAlbums`, letto da `subscribeMyAlbumIds`; `markAlbumOpened`; `isNewInList`.
- `src/lib/db/albums.mutations.test.ts` — MODIFICA: test `markAlbumOpened`.
- `src/lib/db/albums.new.test.ts` — CREA: test `isNewInList`.
- `src/components/album/ui/AlbumBadge.tsx` — CREA: chip badge.
- `src/hooks/useCollection.ts` — MODIFICA: espone `opened`.
- `src/pages/AlbumList.tsx` — MODIFICA: badge "Nuovo" su tile.
- `src/components/album/CreateAlbumMenu.tsx` — MODIFICA: badge "Nuova uscita" su card catalogo.
- `src/pages/Album.tsx` — MODIFICA: `markAlbumOpened` al mount.

---

## Task 1: `addedAt` + `isNewRelease` nel catalogo

**Files:**
- Modify: `src/data/albumCatalog.ts`
- Test: `src/data/albumCatalog.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `src/data/albumCatalog.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { isNewRelease, type AlbumCatalogEntry } from './albumCatalog'

const base: AlbumCatalogEntry = {
  id: 'x', title: 'X', editor: 'Panini', season: '2025/26', total: 100,
  href: '', missingParam: '', storageKey: '', tags: [], c1: '#000', c2: '#fff',
}
const now = new Date('2026-07-10T12:00:00Z')

describe('isNewRelease', () => {
  it('false senza addedAt', () => {
    expect(isNewRelease(base, now)).toBe(false)
  })
  it('true dentro la finestra 30gg', () => {
    expect(isNewRelease({ ...base, addedAt: '2026-07-01' }, now)).toBe(true)
  })
  it('false al confine esatto 30gg', () => {
    expect(isNewRelease({ ...base, addedAt: '2026-06-10' }, now)).toBe(false)
  })
  it('false oltre 30gg', () => {
    expect(isNewRelease({ ...base, addedAt: '2026-05-01' }, now)).toBe(false)
  })
  it('false per data futura', () => {
    expect(isNewRelease({ ...base, addedAt: '2026-08-01' }, now)).toBe(false)
  })
  it('false per addedAt non parsabile', () => {
    expect(isNewRelease({ ...base, addedAt: 'boh' }, now)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/albumCatalog.test.ts`
Expected: FAIL — `isNewRelease` non esportato.

- [ ] **Step 3: Add field + function**

In `src/data/albumCatalog.ts`, add to the `AlbumCatalogEntry` interface (after `cover?: string`):

```ts
  /** data ISO (YYYY-MM-DD) di inserimento nel catalogo; abilita il badge "Nuova uscita" per 30gg */
  addedAt?: string
```

Append at end of file:

```ts
const NEW_RELEASE_MS = 30 * 24 * 60 * 60 * 1000

/** true se l'album è "Nuova uscita": addedAt presente, non futuro, entro 30 giorni da now. */
export function isNewRelease(entry: AlbumCatalogEntry, now: Date): boolean {
  if (!entry.addedAt) return false
  const t = Date.parse(entry.addedAt)
  if (Number.isNaN(t)) return false
  const delta = now.getTime() - t
  return delta >= 0 && delta < NEW_RELEASE_MS
}
```

- [ ] **Step 4: Set `addedAt` on the newest album (demo/live)**

In the `mondiali-2026` catalog entry, add `addedAt: '2026-07-10'` (founder può cambiarlo/rimuoverlo). Esempio, aggiungere prima di `cover: mondiali2026Cover`:

```ts
addedAt: '2026-07-10',
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/data/albumCatalog.test.ts`
Expected: PASS (6 test).

- [ ] **Step 6: Commit**

```bash
git add src/data/albumCatalog.ts src/data/albumCatalog.test.ts
git commit -m "feat(album): campo addedAt + isNewRelease (badge Nuova uscita, 30gg)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

---

## Task 2: `opened` + `markAlbumOpened` + `isNewInList`

**Files:**
- Modify: `src/lib/db/albums.ts`
- Test: `src/lib/db/albums.mutations.test.ts` (modify), `src/lib/db/albums.new.test.ts` (create)

- [ ] **Step 1: Write the failing mutation test**

In `src/lib/db/albums.mutations.test.ts`, update the import line to include `markAlbumOpened`:

```ts
import { addAlbum, removeAlbum, archiveAlbum, unarchiveAlbum, markAlbumOpened } from './albums'
```

Add a new describe block after the `addAlbum` block:

```ts
describe('markAlbumOpened', () => {
  it('arrayUnion id su opened (merge)', async () => {
    await markAlbumOpened('u1', 'calciatori-25-26')
    expect(arrayUnion).toHaveBeenCalledWith('calciatori-25-26')
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(), { opened: { __union: ['calciatori-25-26'] } }, { merge: true },
    )
  })
})
```

- [ ] **Step 2: Write the failing isNewInList test**

Create `src/lib/db/albums.new.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { isNewInList } from './albums'

describe('isNewInList', () => {
  const my = { ids: ['a', 'b'], archived: [], opened: ['a'] }
  it('true se in ids e non in opened', () => {
    expect(isNewInList(my, 'b')).toBe(true)
  })
  it('false se già in opened', () => {
    expect(isNewInList(my, 'a')).toBe(false)
  })
  it('false se non in ids', () => {
    expect(isNewInList(my, 'z')).toBe(false)
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/lib/db/albums.mutations.test.ts src/lib/db/albums.new.test.ts`
Expected: FAIL — `markAlbumOpened` / `isNewInList` non esportati.

- [ ] **Step 4: Implement in `src/lib/db/albums.ts`**

Extend the `MyAlbums` interface (currently `ids`/`archived`):

```ts
export interface MyAlbums {
  ids: string[]
  archived: string[]
  opened: string[]
}
```

In `subscribeMyAlbumIds`, update the object passed to `cb` to include `opened` (mirror the `ids`/`archived` reads):

```ts
        opened: (d.opened as string[]) ?? [],
```

And the error/empty fallback (`cb({ ids: [], archived: [] })`) becomes:

```ts
      else cb({ ids: [], archived: [], opened: [] })
```

Add the mutation next to `addAlbum`:

```ts
// Segna un album come "aperto almeno una volta" (idempotente via arrayUnion).
export async function markAlbumOpened(uid: string, id: string): Promise<void> {
  await setDoc(myAlbumsRef(uid), { opened: arrayUnion(id) }, { merge: true })
}
```

Add the pure helper (near the interface, exported):

```ts
// "Nuovo nella tua lista": in collezione ma non ancora aperto.
export function isNewInList(my: MyAlbums, id: string): boolean {
  return my.ids.includes(id) && !my.opened.includes(id)
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/db/albums.mutations.test.ts src/lib/db/albums.new.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/db/albums.ts src/lib/db/albums.mutations.test.ts src/lib/db/albums.new.test.ts
git commit -m "feat(album): opened[] + markAlbumOpened + isNewInList (badge Nuovo)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

---

## Task 3: Componente `<AlbumBadge>`

**Files:**
- Create: `src/components/album/ui/AlbumBadge.tsx`

- [ ] **Step 1: Create the component**

Chip Midnight Gold — stesso linguaggio del badge ×N in `StickerCard.tsx` (`bg-lime-ink/90 text-gold ring-1 ring-gold/60`). Decorativo, `aria-label` esplicito.

```tsx
export type AlbumBadgeVariant = 'new-release' | 'new'

const LABEL: Record<AlbumBadgeVariant, { text: string; aria: string }> = {
  'new-release': { text: 'Nuova uscita', aria: 'Nuova uscita' },
  'new': { text: 'Nuovo', aria: 'Nuovo nella tua lista' },
}

// Chip novità album: oro su near-black (Midnight Gold), stesso linguaggio del badge ×N.
export function AlbumBadge({ variant, className }: { variant: AlbumBadgeVariant; className?: string }) {
  const { text, aria } = LABEL[variant]
  return (
    <span
      role="img"
      aria-label={aria}
      className={
        'pointer-events-none inline-flex items-center rounded-full bg-lime-ink/90 px-2 py-0.5 ' +
        'text-[10px] font-bold uppercase tracking-wide text-gold ring-1 ring-gold/60 shadow-sm ' +
        (className ?? '')
      }
    >
      {text}
    </span>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/album/ui/AlbumBadge.tsx
git commit -m "feat(album): componente AlbumBadge (chip Midnight Gold)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

---

## Task 4: useCollection espone `opened`

**Files:**
- Modify: `src/hooks/useCollection.ts`

- [ ] **Step 1: Add state + wire**

Add state next to `archived`:

```ts
  const [opened, setOpened] = useState<string[]>([])
```

In the `subscribeMyAlbumIds` callback, alongside `setIds`/`setArchived`:

```ts
          setOpened(next.opened)
```

In the same effect's cleanup (where `setIds([])`/`setArchived([])` run) and in the `retry`/unmount reset, add:

```ts
      setOpened([])
```

- [ ] **Step 2: Return it**

Extend the hook's return type and value to include `opened: string[]`:

```ts
  return { albums, totals, archived, opened, loading, error, retry }
```

Update the return type annotation of `useCollection` to add `opened: string[]`.

- [ ] **Step 3: Typecheck**

Run: `npx tsc -b --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useCollection.ts
git commit -m "feat(album): useCollection espone opened[] per badge Nuovo

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

---

## Task 5: Badge "Nuovo" su AlbumList tile

**Files:**
- Modify: `src/pages/AlbumList.tsx`

- [ ] **Step 1: Compute the flag per tile**

Import the badge and the ids helper set at top of `AlbumList.tsx`:

```ts
import { AlbumBadge } from '@/components/album/ui/AlbumBadge'
```

In `AlbumList()`, pull `opened` from the hook:

```ts
  const { albums, archived, opened, loading, error, retry } = useCollection()
```

Build a set and pass `isNew` down to each tile. Where `visible.map(({ a, archived }) => (`:

```tsx
              {visible.map(({ a, archived }) => (
                <AlbumTile
                  key={a.id}
                  a={a}
                  archived={archived}
                  isNew={!opened.includes(a.id)}
                  uid={user?.uid ?? null}
                  isDesktop={isDesktop}
                  onOpen={() => navigate(`/album/${a.id}`)}
                  onArchive={() => user && archiveAlbum(user.uid, a.id)}
                  onUnarchive={() => user && unarchiveAlbum(user.uid, a.id)}
                  onDelete={() => user && removeAlbum(user.uid, a.id)}
                />
              ))}
```

(Nota: `a.id` è in `ids` per costruzione — `albums` deriva da `ids` — quindi `!opened.includes(a.id)` equivale a `isNewInList`.)

- [ ] **Step 2: Accept + render in AlbumTile**

Add `isNew: boolean` to `TileProps`:

```ts
interface TileProps {
  a: PerAlbumStats
  archived: boolean
  isNew: boolean
  uid: string | null
  isDesktop: boolean
  onOpen: () => void
  onArchive: () => void
  onUnarchive: () => void
  onDelete: () => void
}
```

Destructure it: `function AlbumTile({ a, archived, isNew, uid, isDesktop, onOpen, onArchive, onUnarchive, onDelete }: TileProps) {`

Render the chip top-left (the menu is top-right `z-30`; put the badge top-left above overlays at `z-30`). Add right after the dark-gradient overlay `<div aria-hidden … />`:

```tsx
      {isNew && (
        <div className="absolute left-3 top-3 z-30">
          <AlbumBadge variant="new" />
        </div>
      )}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc -b --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/pages/AlbumList.tsx
git commit -m "feat(album): badge Nuovo su tile lista (non ancora aperto)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

---

## Task 6: Badge "Nuova uscita" su CreateAlbumMenu

**Files:**
- Modify: `src/components/album/CreateAlbumMenu.tsx`

- [ ] **Step 1: Import + compute now once**

Add imports:

```ts
import { ALBUM_CATALOG, isNewRelease } from '@/data/albumCatalog'
import { AlbumBadge } from '@/components/album/ui/AlbumBadge'
```

(la riga import `ALBUM_CATALOG` esistente va estesa con `isNewRelease`, non duplicata.)

Inside `CreateAlbumMenu`, compute `now` once:

```ts
  const now = useMemo(() => new Date(), [])
```

- [ ] **Step 2: Render badge over the cover**

The catalog card renders the cover `<span aria-hidden className="aspect-[4/3] …" />`. Wrap that cover area to host the badge. Replace the cover `<span>` with a relative container:

```tsx
                                <span className="relative block">
                                  <span
                                    aria-hidden
                                    className="block aspect-[4/3] w-full bg-cover bg-center"
                                    style={a.cover ? { backgroundImage: `url(${a.cover})` } : { background: `linear-gradient(145deg, ${a.c1}, ${a.c2})` }}
                                  />
                                  {isNewRelease(a, now) && (
                                    <span className="absolute left-2 top-2">
                                      <AlbumBadge variant="new-release" />
                                    </span>
                                  )}
                                </span>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc -b --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/album/CreateAlbumMenu.tsx
git commit -m "feat(album): badge Nuova uscita su card catalogo (discovery)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

---

## Task 7: `markAlbumOpened` al mount di Album.tsx

**Files:**
- Modify: `src/pages/Album.tsx`

- [ ] **Step 1: Import**

```ts
import { computeStats, markAlbumOpened } from '@/lib/db/albums'
import { useAuth } from '@/hooks/useAuth'
```

(la riga `import { computeStats } from '@/lib/db/albums'` esistente va estesa; verificare se `useAuth` è già importato — in tal caso non duplicare.)

- [ ] **Step 2: Effect al mount**

In `Album()`, ottenere l'utente:

```ts
  const { user } = useAuth()
```

Aggiungere l'effetto (dopo gli altri hook di stato, prima del return). Idempotente: arrayUnion su Firestore, ma la guardia evita scritture inutili tra i re-render dello stesso album. Poiché la lista `opened` non è disponibile qui senza subscription, ci si affida all'idempotenza di arrayUnion + una guardia ref per non riscrivere lo stesso id nella stessa sessione:

```ts
  const openedMarkedRef = useRef<string>('')
  useEffect(() => {
    if (!user || !albumId || !entry) return
    if (openedMarkedRef.current === albumId) return
    openedMarkedRef.current = albumId
    void markAlbumOpened(user.uid, albumId)
  }, [user, albumId, entry])
```

(`useRef` è già importato in Album.tsx.)

Nota: `markAlbumOpened` fa arrayUnion anche se l'album non è nella lista dell'utente; in pratica il badge "Nuovo" si mostra solo per album in `ids`, quindi scrivere `opened` per un album non in lista è innocuo (verrà ignorato dal calcolo `isNewInList`). Accettato per semplicità.

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc -b --noEmit && npm run build`
Expected: exit 0 (solo warning preesistente `INEFFECTIVE_DYNAMIC_IMPORT` su firebase.ts).

- [ ] **Step 4: Commit**

```bash
git add src/pages/Album.tsx
git commit -m "feat(album): markAlbumOpened al mount (spegne badge Nuovo)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

---

## Task 8: Firestore rules — verifica `opened`

**Files:**
- Inspect: `firestore.rules` (o file regole del progetto)

- [ ] **Step 1: Ispeziona le regole del doc `_my-albums`**

Run: `grep -n "albums\|_my-albums\|allow write\|keys()\|hasOnly" firestore.rules`

- [ ] **Step 2: Decidi**

- Se la write su `users/{uid}/albums/{doc}` è consentita all'owner **senza whitelist di campi** (nessun `hasOnly([...])`), nessuna modifica: fine task.
- Se esiste una whitelist di campi che elenca `ids`/`archived`, aggiungere `opened` all'elenco. Poi deploy:

```bash
firebase deploy --only firestore:rules
```

(CLI già loggata — vedi memory `firebase-cli-deploy`.)

- [ ] **Step 3: Commit (solo se rules modificate)**

```bash
git add firestore.rules
git commit -m "chore(rules): consenti campo opened su _my-albums

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

---

## Task 9: Cache-bust + verifica finale

**Files:**
- Inspect: full test suite

- [ ] **Step 1: Cache-bust (se asset locali js/css versionati toccati)**

Se il progetto usa `?v=N` su asset locali (vedi memory `cache-bust-assets`), bumpare il valore per i file toccati. Se la Fase B non tocca asset versionati manualmente (solo moduli TS compilati da Vite), saltare — Vite hash-a gli asset in build.

- [ ] **Step 2: Full test + build**

Run:
```bash
npx vitest run src/data/albumCatalog.test.ts src/lib/db/albums.mutations.test.ts src/lib/db/albums.new.test.ts && npx tsc -b --noEmit && npm run build
```
Expected: tutti PASS, tsc exit 0, build exit 0 (solo warning preesistente firebase.ts).

- [ ] **Step 3: Verifica live (opzionale, se richiesto dall'utente)**

Vedi memory `browser-probe-figubook` per il probe Playwright con bypass auth temporaneo. Controllare: card catalogo mondiali-2026 mostra "Nuova uscita"; dopo add compare "Nuovo" in lista; aprendo l'album il badge sparisce (dopo refresh subscription).

- [ ] **Step 4: Commit finale (se cache-bust toccato)**

```bash
git add -- <file versionati toccati>
git commit -m "chore(album): cache-bust badge Nuovo Fase B

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

---

## Self-review

- **Spec coverage:** "Nuova uscita" (T1,T6) · "Nuovo" (T2,T4,T5) · funnel/superfici separate (T5 lista, T6 discovery) · markAlbumOpened al mount (T7) · componente chip (T3) · Firestore (T8) · test isNewRelease/markAlbumOpened/isNewInList (T1,T2) · tsc/build/cache-bust (T9). Tutto coperto.
- **Placeholder:** nessuno — ogni step ha codice/comando reali.
- **Type consistency:** `MyAlbums { ids, archived, opened }` usato coerente in T2/T4; `isNewInList(my, id)`; `markAlbumOpened(uid, id)`; `AlbumBadge variant`; `isNewRelease(entry, now)` con `now: Date` in T1/T6. Coerenti.
