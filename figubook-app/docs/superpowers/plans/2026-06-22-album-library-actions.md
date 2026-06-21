# Album Library Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere alla pagina libreria album (`AlbumList.tsx`) barra filtri per stato, bottone "Nuovo album" e menu azioni per-album (archivia/ripristina/elimina) con conferme distruttive.

**Architecture:** Estende il layer dati Firestore esistente (`_my-albums` con nuovo campo `archived[]`), aggiunge funzioni mutate (`addAlbum`/`removeAlbum`/`archiveAlbum`/`unarchiveAlbum`), wrapper UI accessibili su `@base-ui/react` (Dialog + Menu), e ricompone la tile album per ospitare il menu fuori dal `<Link>`. Filtro selezionato in stato locale. La lista resta live via `onSnapshot` (nessun ottimismo manuale).

**Tech Stack:** React 19, TypeScript, Firebase Firestore, `@base-ui/react` 1.5, framer-motion, lucide-react, Tailwind, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-06-22-album-library-actions-design.md`

---

## File Structure

Nuovi:
- `src/lib/album/libraryFilters.ts` — tipo `LibraryFilter` + predicato puro `inBucket`. Logica filtro testabile, zero React.
- `src/components/ui/dialog.tsx` — `<Modal>` wrapper su Base UI Dialog (backdrop+popup, tema, anim).
- `src/components/ui/menu.tsx` — primitive Menu stilizzate (`MenuRoot`/`MenuTrigger`/`MenuContent`/`MenuItem`).
- `src/components/album/LibraryFilters.tsx` — barra pills + bottone "Nuovo album".
- `src/components/album/ConfirmActionDialog.tsx` — conferma generica (elimina/ripristina).
- `src/components/album/NewAlbumDialog.tsx` — picker catalogo − posseduti.
- `src/components/album/AlbumMenu.tsx` — trigger 3 punti + voci, gestisce i propri dialog di conferma.

Modificati:
- `src/lib/db/albums.ts` — `subscribeMyAlbumIds` ritorna `{ids, archived}`; nuove mutate.
- `src/hooks/useCollection.ts` — espone `archived: string[]`.
- `src/pages/AlbumList.tsx` — integra barra, filtro, tile ricomposta col menu.

---

## Task 1: Layer dati — `subscribeMyAlbumIds` con `archived` + mutate

**Files:**
- Modify: `src/lib/db/albums.ts`
- Test: `src/lib/db/albums.mutations.test.ts` (create)

- [ ] **Step 1: Scrivi il test delle mutate (fallisce)**

Create `src/lib/db/albums.mutations.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const setDoc = vi.fn(() => Promise.resolve())
const deleteDoc = vi.fn(() => Promise.resolve())
const arrayUnion = vi.fn((...v: string[]) => ({ __union: v }))
const arrayRemove = vi.fn((...v: string[]) => ({ __remove: v }))
const doc = vi.fn((...path: unknown[]) => ({ path }))

vi.mock('firebase/firestore', () => ({
  doc, onSnapshot: vi.fn(), setDoc, deleteDoc, arrayUnion, arrayRemove,
  deleteField: () => '__DELETE__',
}))
vi.mock('@/lib/firebase', () => ({ db: {} }))

import { addAlbum, removeAlbum, archiveAlbum, unarchiveAlbum } from './albums'

beforeEach(() => { vi.clearAllMocks() })

describe('addAlbum', () => {
  it('arrayUnion id su ids (merge)', async () => {
    await addAlbum('u1', 'calciatori-25-26')
    expect(arrayUnion).toHaveBeenCalledWith('calciatori-25-26')
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(), { ids: { __union: ['calciatori-25-26'] } }, { merge: true },
    )
  })
})

describe('archiveAlbum / unarchiveAlbum', () => {
  it('archive: arrayUnion su archived', async () => {
    await archiveAlbum('u1', 'x')
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(), { archived: { __union: ['x'] } }, { merge: true },
    )
  })
  it('unarchive: arrayRemove su archived', async () => {
    await unarchiveAlbum('u1', 'x')
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(), { archived: { __remove: ['x'] } }, { merge: true },
    )
  })
})

describe('removeAlbum', () => {
  it('rimuove da ids+archived e poi deleteDoc del doc dati (wipe)', async () => {
    await removeAlbum('u1', 'x')
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(),
      { ids: { __remove: ['x'] }, archived: { __remove: ['x'] } },
      { merge: true },
    )
    expect(deleteDoc).toHaveBeenCalledTimes(1)
    // setDoc (rimozione da lista) prima di deleteDoc (wipe dati)
    expect(setDoc.mock.invocationCallOrder[0]).toBeLessThan(deleteDoc.mock.invocationCallOrder[0])
  })
})
```

- [ ] **Step 2: Esegui — deve fallire**

Run: `npx vitest run src/lib/db/albums.mutations.test.ts`
Expected: FAIL — `addAlbum`/`removeAlbum`/`archiveAlbum`/`unarchiveAlbum` non esportati.

- [ ] **Step 3: Implementa le mutate + estendi `subscribeMyAlbumIds`**

In `src/lib/db/albums.ts`, aggiorna l'import firestore (riga 2) aggiungendo le primitive:

```ts
import { doc, onSnapshot, setDoc, deleteDoc, deleteField, arrayUnion, arrayRemove } from 'firebase/firestore'
```

Sostituisci `subscribeMyAlbumIds` (la firma callback passa da `string[]` a `{ids, archived}`):

```ts
export interface MyAlbums {
  ids: string[]
  archived: string[]
}

// onSnapshot live su users/{uid}/albums/_my-albums -> { ids, archived }.
export function subscribeMyAlbumIds(
  uid: string,
  cb: (data: MyAlbums) => void,
  onError?: (err: unknown) => void,
): () => void {
  const ref = doc(db, 'users', uid, 'albums', '_my-albums')
  return onSnapshot(
    ref,
    (snap) => {
      const d = snap.exists() ? snap.data() : {}
      cb({
        ids: (d.ids as string[]) ?? [],
        archived: (d.archived as string[]) ?? [],
      })
    },
    (err) => {
      console.error('album ids', err)
      if (onError) onError(err)
      else cb({ ids: [], archived: [] })
    },
  )
}
```

In fondo al file aggiungi le mutate:

```ts
const myAlbumsRef = (uid: string) => doc(db, 'users', uid, 'albums', '_my-albums')

// Aggiunge un album alla collezione (idempotente via arrayUnion).
export async function addAlbum(uid: string, id: string): Promise<void> {
  await setDoc(myAlbumsRef(uid), { ids: arrayUnion(id) }, { merge: true })
}

// Archivia: l'album resta in ids, entra in archived (escluso dai filtri non-archivio).
export async function archiveAlbum(uid: string, id: string): Promise<void> {
  await setDoc(myAlbumsRef(uid), { archived: arrayUnion(id) }, { merge: true })
}

export async function unarchiveAlbum(uid: string, id: string): Promise<void> {
  await setDoc(myAlbumsRef(uid), { archived: arrayRemove(id) }, { merge: true })
}

// Elimina IRREVERSIBILE: rimuove da lista (e archived) poi cancella il doc dati.
// Ordine: prima fuori dalla lista live, poi wipe; re-add riparte da doc vuoto.
export async function removeAlbum(uid: string, id: string): Promise<void> {
  await setDoc(myAlbumsRef(uid), { ids: arrayRemove(id), archived: arrayRemove(id) }, { merge: true })
  await deleteDoc(doc(db, 'users', uid, 'albums', id))
}
```

- [ ] **Step 4: Esegui — deve passare**

Run: `npx vitest run src/lib/db/albums.mutations.test.ts`
Expected: PASS (5 test).

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/albums.ts src/lib/db/albums.mutations.test.ts
git commit -m "feat(album): mutate libreria (add/remove/archive/unarchive) + archived in _my-albums

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: `useCollection` espone `archived`

**Files:**
- Modify: `src/hooks/useCollection.ts`

> Nessun test dedicato (hook con onSnapshot live, coperto dall'integrazione pagina). Cambio meccanico per allinearsi alla nuova firma di `subscribeMyAlbumIds`.

- [ ] **Step 1: Adatta il consumo della callback + esponi `archived`**

In `src/hooks/useCollection.ts`:

Aggiungi lo stato (dopo `const [ids, setIds] = useState<string[]>([])`):

```ts
  const [archived, setArchived] = useState<string[]>([])
```

Nel primo `useEffect`, sostituisci la callback `(next) => {...}` con:

```ts
      (next) => {
        if (active) {
          setIds(next.ids)
          setArchived(next.archived)
          setIdsLoaded(true)
          setError(false)
        }
      },
```

Nel cleanup dello stesso effect, aggiungi `setArchived([])` accanto a `setIds([])`.

Aggiorna la firma di ritorno dell'hook (interfaccia + return):

```ts
export function useCollection(): {
  albums: PerAlbumStats[]
  totals: AlbumStats
  archived: string[]
  loading: boolean
  error: boolean
  retry: () => void
} {
```

e nel `return` finale aggiungi `archived,`:

```ts
  return { albums, totals, archived, loading, error, retry }
```

- [ ] **Step 2: Verifica build types**

Run: `npx tsc -b --noEmit`
Expected: exit 0 (nessun errore di tipo; AlbumList ancora non usa `archived`, ok).

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useCollection.ts
git commit -m "feat(album): useCollection espone archived

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Logica filtri pura

**Files:**
- Create: `src/lib/album/libraryFilters.ts`
- Test: `src/lib/album/libraryFilters.test.ts`

- [ ] **Step 1: Scrivi il test (fallisce)**

Create `src/lib/album/libraryFilters.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { inBucket, LIBRARY_FILTERS } from './libraryFilters'

describe('inBucket', () => {
  it('in-corso: non archiviato e pct < 100 (incluso 0%)', () => {
    expect(inBucket('in-corso', { pct: 0, archived: false })).toBe(true)
    expect(inBucket('in-corso', { pct: 62, archived: false })).toBe(true)
    expect(inBucket('in-corso', { pct: 100, archived: false })).toBe(false)
    expect(inBucket('in-corso', { pct: 50, archived: true })).toBe(false)
  })
  it('tutti: tutti i non archiviati', () => {
    expect(inBucket('tutti', { pct: 0, archived: false })).toBe(true)
    expect(inBucket('tutti', { pct: 100, archived: false })).toBe(true)
    expect(inBucket('tutti', { pct: 50, archived: true })).toBe(false)
  })
  it('completati: pct === 100 e non archiviato', () => {
    expect(inBucket('completati', { pct: 100, archived: false })).toBe(true)
    expect(inBucket('completati', { pct: 99, archived: false })).toBe(false)
    expect(inBucket('completati', { pct: 100, archived: true })).toBe(false)
  })
  it('archivio: solo archiviati', () => {
    expect(inBucket('archivio', { pct: 100, archived: true })).toBe(true)
    expect(inBucket('archivio', { pct: 0, archived: false })).toBe(false)
  })
  it('ordine e default', () => {
    expect(LIBRARY_FILTERS.map((f) => f.key)).toEqual(['in-corso', 'tutti', 'completati', 'archivio'])
    expect(LIBRARY_FILTERS[0].key).toBe('in-corso')
  })
})
```

- [ ] **Step 2: Esegui — deve fallire**

Run: `npx vitest run src/lib/album/libraryFilters.test.ts`
Expected: FAIL — modulo inesistente.

- [ ] **Step 3: Implementa**

Create `src/lib/album/libraryFilters.ts`:

```ts
export type LibraryFilter = 'in-corso' | 'tutti' | 'completati' | 'archivio'

export const LIBRARY_FILTERS: { key: LibraryFilter; label: string }[] = [
  { key: 'in-corso', label: 'In corso' },
  { key: 'tutti', label: 'Tutti' },
  { key: 'completati', label: 'Completati' },
  { key: 'archivio', label: 'Archivio' },
]

export const DEFAULT_FILTER: LibraryFilter = 'in-corso'

// Predicato puro: un album (pct + flag archiviato) appartiene al bucket?
export function inBucket(
  filter: LibraryFilter,
  album: { pct: number; archived: boolean },
): boolean {
  if (filter === 'archivio') return album.archived
  if (album.archived) return false
  if (filter === 'tutti') return true
  if (filter === 'completati') return album.pct === 100
  return album.pct < 100 // in-corso
}
```

- [ ] **Step 4: Esegui — deve passare**

Run: `npx vitest run src/lib/album/libraryFilters.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/album/libraryFilters.ts src/lib/album/libraryFilters.test.ts
git commit -m "feat(album): logica filtri libreria (in-corso/tutti/completati/archivio)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Wrapper UI `Modal` (Base UI Dialog)

**Files:**
- Create: `src/components/ui/dialog.tsx`
- Test: `src/components/ui/dialog.test.tsx`

- [ ] **Step 1: Scrivi il test (fallisce)**

Create `src/components/ui/dialog.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './dialog'

describe('Modal', () => {
  it('mostra il contenuto quando open', () => {
    render(<Modal open onOpenChange={() => {}}><p>ciao</p></Modal>)
    expect(screen.getByText('ciao')).toBeInTheDocument()
  })
  it('non monta il contenuto quando chiuso', () => {
    render(<Modal open={false} onOpenChange={() => {}}><p>ciao</p></Modal>)
    expect(screen.queryByText('ciao')).toBeNull()
  })
  it('click backdrop chiama onOpenChange(false)', async () => {
    const onOpenChange = vi.fn()
    render(<Modal open onOpenChange={onOpenChange}><p>ciao</p></Modal>)
    await userEvent.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything(), expect.anything())
  })
})
```

- [ ] **Step 2: Esegui — deve fallire**

Run: `npx vitest run src/components/ui/dialog.test.tsx`
Expected: FAIL — `./dialog` inesistente.

- [ ] **Step 3: Implementa**

Create `src/components/ui/dialog.tsx`:

```tsx
import type { ReactNode } from 'react'
import { Dialog } from '@base-ui/react/dialog'

export interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean, event?: Event, reason?: string) => void
  children: ReactNode
  /** larghezza max del popup (default sm) */
  size?: 'sm' | 'md'
}

const WIDTH = { sm: 'max-w-sm', md: 'max-w-md' }

// Wrapper modale sul Dialog di Base UI, tema album. Backdrop scuro + popup
// centrato. ESC e click backdrop => onOpenChange(false). Anim via data-attr.
export function Modal({ open, onOpenChange, children, size = 'sm' }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="album-theme fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <Dialog.Popup
          className={`album-theme fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] ${WIDTH[size]} -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-bg-elev p-6 text-ink shadow-[0_24px_64px_-24px_rgba(0,0,0,0.8)] transition-all duration-150 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0`}
        >
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export { Dialog }
```

- [ ] **Step 4: Esegui — deve passare**

Run: `npx vitest run src/components/ui/dialog.test.tsx`
Expected: PASS (3 test).

> Nota: se il callback di `onOpenChange` di Base UI passa argomenti diversi, allinea l'assert del test al numero reale di argomenti (il comportamento — chiamato con `false` su ESC — resta).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/dialog.tsx src/components/ui/dialog.test.tsx
git commit -m "feat(ui): Modal wrapper su Base UI Dialog (tema album)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Wrapper UI `Menu`

**Files:**
- Create: `src/components/ui/menu.tsx`
- Test: `src/components/ui/menu.test.tsx`

- [ ] **Step 1: Scrivi il test (fallisce)**

Create `src/components/ui/menu.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MenuRoot, MenuTrigger, MenuContent, MenuItem } from './menu'

function Harness({ onPick }: { onPick: () => void }) {
  return (
    <MenuRoot>
      <MenuTrigger aria-label="Azioni">⋮</MenuTrigger>
      <MenuContent>
        <MenuItem onClick={onPick}>Archivia</MenuItem>
        <MenuItem destructive onClick={() => {}}>Elimina</MenuItem>
      </MenuContent>
    </MenuRoot>
  )
}

describe('Menu', () => {
  it('apre al click sul trigger e mostra le voci', async () => {
    render(<Harness onPick={() => {}} />)
    await userEvent.click(screen.getByLabelText('Azioni'))
    expect(await screen.findByText('Archivia')).toBeInTheDocument()
    expect(screen.getByText('Elimina')).toBeInTheDocument()
  })
  it('click su una voce esegue onClick', async () => {
    const onPick = vi.fn()
    render(<Harness onPick={onPick} />)
    await userEvent.click(screen.getByLabelText('Azioni'))
    await userEvent.click(await screen.findByText('Archivia'))
    expect(onPick).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Esegui — deve fallire**

Run: `npx vitest run src/components/ui/menu.test.tsx`
Expected: FAIL — `./menu` inesistente.

- [ ] **Step 3: Implementa**

Create `src/components/ui/menu.tsx`:

```tsx
import type { ComponentProps, ReactNode } from 'react'
import { Menu } from '@base-ui/react/menu'

export function MenuRoot({ children }: { children: ReactNode }) {
  return <Menu.Root>{children}</Menu.Root>
}

export function MenuTrigger({ className = '', ...rest }: ComponentProps<typeof Menu.Trigger>) {
  return (
    <Menu.Trigger
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white/90 transition-transform duration-150 ease-out hover:bg-black/50 active:scale-[0.92] focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime ${className}`}
      {...rest}
    />
  )
}

export function MenuContent({ children }: { children: ReactNode }) {
  return (
    <Menu.Portal>
      <Menu.Positioner className="z-50" sideOffset={6} align="end">
        <Menu.Popup className="album-theme min-w-44 rounded-xl border border-white/10 bg-bg-elev p-1.5 text-ink shadow-[0_18px_48px_-20px_rgba(0,0,0,0.8)] transition-all duration-150 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0">
          {children}
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  )
}

export interface MenuItemProps extends ComponentProps<typeof Menu.Item> {
  destructive?: boolean
}

export function MenuItem({ destructive = false, className = '', ...rest }: MenuItemProps) {
  const tone = destructive
    ? 'text-red-400 data-[highlighted]:bg-red-500/15'
    : 'text-ink data-[highlighted]:bg-white/[0.06]'
  return (
    <Menu.Item
      className={`flex h-10 cursor-default select-none items-center gap-2 rounded-lg px-3 text-sm font-medium outline-none ${tone} ${className}`}
      {...rest}
    />
  )
}
```

- [ ] **Step 4: Esegui — deve passare**

Run: `npx vitest run src/components/ui/menu.test.tsx`
Expected: PASS (2 test).

> Nota: `sideOffset`/`align` sono props di `Menu.Positioner` in Base UI 1.5. Se la build segnala una prop non valida, rimuovi quella prop (il default va bene) — non bloccante.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/menu.tsx src/components/ui/menu.test.tsx
git commit -m "feat(ui): Menu wrapper su Base UI (trigger 3 punti + item distruttivo)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: `ConfirmActionDialog`

**Files:**
- Create: `src/components/album/ConfirmActionDialog.tsx`
- Test: `src/components/album/ConfirmActionDialog.test.tsx`

- [ ] **Step 1: Scrivi il test (fallisce)**

Create `src/components/album/ConfirmActionDialog.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmActionDialog } from './ConfirmActionDialog'

const base = {
  open: true,
  title: 'Eliminare «X»?',
  body: 'Operazione irreversibile.',
  confirmLabel: 'Elimina',
  destructive: true,
  onOpenChange: () => {},
}

describe('ConfirmActionDialog', () => {
  it('mostra titolo, corpo e label conferma', () => {
    render(<ConfirmActionDialog {...base} onConfirm={() => {}} />)
    expect(screen.getByText('Eliminare «X»?')).toBeInTheDocument()
    expect(screen.getByText('Operazione irreversibile.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Elimina' })).toBeInTheDocument()
  })
  it('Conferma chiama onConfirm', async () => {
    const onConfirm = vi.fn()
    render(<ConfirmActionDialog {...base} onConfirm={onConfirm} />)
    await userEvent.click(screen.getByRole('button', { name: 'Elimina' }))
    expect(onConfirm).toHaveBeenCalled()
  })
  it('Annulla chiama onOpenChange(false), non onConfirm', async () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()
    render(<ConfirmActionDialog {...base} onOpenChange={onOpenChange} onConfirm={onConfirm} />)
    await userEvent.click(screen.getByRole('button', { name: 'Annulla' }))
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
```

- [ ] **Step 2: Esegui — deve fallire**

Run: `npx vitest run src/components/album/ConfirmActionDialog.test.tsx`
Expected: FAIL — modulo inesistente.

- [ ] **Step 3: Implementa**

Create `src/components/album/ConfirmActionDialog.tsx`:

```tsx
import { Modal, Dialog } from '@/components/ui/dialog'
import { AlbumButton } from '@/components/album/ui/Button'

export interface ConfirmActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  body: string
  confirmLabel: string
  destructive?: boolean
  onConfirm: () => void
}

// Dialog di conferma generico (elimina/ripristina). Annulla = chiude;
// Conferma = onConfirm (il chiamante decide se chiudere).
export function ConfirmActionDialog({
  open, onOpenChange, title, body, confirmLabel, destructive = false, onConfirm,
}: ConfirmActionDialogProps) {
  return (
    <Modal open={open} onOpenChange={(o) => onOpenChange(o)}>
      <Dialog.Title className="text-lg font-semibold tracking-tight text-ink">{title}</Dialog.Title>
      <Dialog.Description className="mt-2 text-sm leading-relaxed text-ink-2">{body}</Dialog.Description>
      <div className="mt-6 flex justify-end gap-2">
        <AlbumButton variant="ghost" type="button" onClick={() => onOpenChange(false)}>Annulla</AlbumButton>
        <AlbumButton
          type="button"
          onClick={onConfirm}
          className={destructive ? 'bg-red-500 text-white hover:brightness-110' : ''}
        >
          {confirmLabel}
        </AlbumButton>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 4: Esegui — deve passare**

Run: `npx vitest run src/components/album/ConfirmActionDialog.test.tsx`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/album/ConfirmActionDialog.tsx src/components/album/ConfirmActionDialog.test.tsx
git commit -m "feat(album): ConfirmActionDialog (conferma elimina/ripristina)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: `AlbumMenu` (3 punti + conferme)

**Files:**
- Create: `src/components/album/AlbumMenu.tsx`
- Test: `src/components/album/AlbumMenu.test.tsx`

- [ ] **Step 1: Scrivi il test (fallisce)**

Create `src/components/album/AlbumMenu.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AlbumMenu } from './AlbumMenu'

const cbs = () => ({ onArchive: vi.fn(), onUnarchive: vi.fn(), onDelete: vi.fn() })

describe('AlbumMenu', () => {
  it('non archiviato: voce Archivia (no conferma) + Elimina', async () => {
    const c = cbs()
    render(<AlbumMenu title="X" archived={false} {...c} />)
    await userEvent.click(screen.getByLabelText('Azioni album'))
    await userEvent.click(await screen.findByText('Archivia'))
    expect(c.onArchive).toHaveBeenCalled()
  })
  it('archiviato: Ripristina apre conferma, conferma chiama onUnarchive', async () => {
    const c = cbs()
    render(<AlbumMenu title="X" archived {...c} />)
    await userEvent.click(screen.getByLabelText('Azioni album'))
    await userEvent.click(await screen.findByText('Ripristina'))
    await userEvent.click(await screen.findByRole('button', { name: 'Ripristina' }))
    expect(c.onUnarchive).toHaveBeenCalled()
  })
  it('Elimina apre conferma distruttiva, conferma chiama onDelete', async () => {
    const c = cbs()
    render(<AlbumMenu title="X" archived={false} {...c} />)
    await userEvent.click(screen.getByLabelText('Azioni album'))
    await userEvent.click(await screen.findByText('Elimina'))
    await userEvent.click(await screen.findByRole('button', { name: 'Elimina' }))
    expect(c.onDelete).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Esegui — deve fallire**

Run: `npx vitest run src/components/album/AlbumMenu.test.tsx`
Expected: FAIL — modulo inesistente.

- [ ] **Step 3: Implementa**

Create `src/components/album/AlbumMenu.tsx`:

```tsx
import { useState } from 'react'
import { MoreVertical, Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { MenuRoot, MenuTrigger, MenuContent, MenuItem } from '@/components/ui/menu'
import { ConfirmActionDialog } from './ConfirmActionDialog'

export interface AlbumMenuProps {
  title: string
  archived: boolean
  onArchive: () => void
  onUnarchive: () => void
  onDelete: () => void
}

// Menu azioni per-card. Archivia = immediato (reversibile). Ripristina/Elimina
// passano dal dialog di conferma. Trigger fuori dal <Link> della tile.
export function AlbumMenu({ title, archived, onArchive, onUnarchive, onDelete }: AlbumMenuProps) {
  const [confirm, setConfirm] = useState<null | 'delete' | 'restore'>(null)

  return (
    <>
      <MenuRoot>
        <MenuTrigger aria-label="Azioni album">
          <MoreVertical className="h-5 w-5" aria-hidden />
        </MenuTrigger>
        <MenuContent>
          {archived ? (
            <MenuItem onClick={() => setConfirm('restore')}>
              <ArchiveRestore className="h-4 w-4" aria-hidden /> Ripristina
            </MenuItem>
          ) : (
            <MenuItem onClick={onArchive}>
              <Archive className="h-4 w-4" aria-hidden /> Archivia
            </MenuItem>
          )}
          <MenuItem destructive onClick={() => setConfirm('delete')}>
            <Trash2 className="h-4 w-4" aria-hidden /> Elimina
          </MenuItem>
        </MenuContent>
      </MenuRoot>

      <ConfirmActionDialog
        open={confirm === 'delete'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`Eliminare «${title}»?`}
        body="Verranno cancellati per sempre tutti i dati di questo album: figurine possedute, doppie e progresso. L'operazione non è reversibile — se in futuro lo riaggiungi, riparti da zero."
        confirmLabel="Elimina"
        destructive
        onConfirm={() => { onDelete(); setConfirm(null) }}
      />
      <ConfirmActionDialog
        open={confirm === 'restore'}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`Ripristinare «${title}»?`}
        body="L'album torna tra quelli attivi e ricompare nei filtri In corso/Completati. Nessun dato è andato perso durante l'archiviazione: ritrovi progresso e doppie esattamente com'erano."
        confirmLabel="Ripristina"
        onConfirm={() => { onUnarchive(); setConfirm(null) }}
      />
    </>
  )
}
```

- [ ] **Step 4: Esegui — deve passare**

Run: `npx vitest run src/components/album/AlbumMenu.test.tsx`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/album/AlbumMenu.tsx src/components/album/AlbumMenu.test.tsx
git commit -m "feat(album): AlbumMenu 3 punti (archivia/ripristina/elimina + conferme)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: `NewAlbumDialog` (picker catalogo)

**Files:**
- Create: `src/components/album/NewAlbumDialog.tsx`
- Test: `src/components/album/NewAlbumDialog.test.tsx`

- [ ] **Step 1: Scrivi il test (fallisce)**

Create `src/components/album/NewAlbumDialog.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NewAlbumDialog } from './NewAlbumDialog'

describe('NewAlbumDialog', () => {
  it('elenca solo gli album NON posseduti', () => {
    render(<NewAlbumDialog open ownedIds={['calciatori-25-26']} onOpenChange={() => {}} onAdd={() => {}} />)
    expect(screen.queryByText('Calciatori 2025/26')).toBeNull()
    expect(screen.getByText('Calciatori 2024/25')).toBeInTheDocument()
  })
  it('click su un album chiama onAdd con id', async () => {
    const onAdd = vi.fn()
    render(<NewAlbumDialog open ownedIds={[]} onOpenChange={() => {}} onAdd={onAdd} />)
    await userEvent.click(screen.getByText('Calciatori 2024/25'))
    expect(onAdd).toHaveBeenCalledWith('calciatori-24-25')
  })
  it('tutti posseduti: stato vuoto', () => {
    const all = ['calciatori-25-26','calciatori-24-25','calciatori-23-24','calciatori-22-23','mondiali-2026','mondiali-2022','calb-25-26','adrenalyn-25-26','match-attax-ucl']
    render(<NewAlbumDialog open ownedIds={all} onOpenChange={() => {}} onAdd={() => {}} />)
    expect(screen.getByText(/Hai già tutti gli album/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Esegui — deve fallire**

Run: `npx vitest run src/components/album/NewAlbumDialog.test.tsx`
Expected: FAIL — modulo inesistente.

- [ ] **Step 3: Implementa**

Create `src/components/album/NewAlbumDialog.tsx`:

```tsx
import { Modal, Dialog } from '@/components/ui/dialog'
import { ALBUM_CATALOG } from '@/data/albumCatalog'

export interface NewAlbumDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ownedIds: string[]
  onAdd: (id: string) => void
}

// Picker: catalogo MENO posseduti. Click su una riga = onAdd + chiude.
export function NewAlbumDialog({ open, onOpenChange, ownedIds, onAdd }: NewAlbumDialogProps) {
  const owned = new Set(ownedIds)
  const available = ALBUM_CATALOG.filter((a) => !owned.has(a.id))

  return (
    <Modal open={open} onOpenChange={(o) => onOpenChange(o)} size="md">
      <Dialog.Title className="text-lg font-semibold tracking-tight text-ink">Aggiungi un album</Dialog.Title>
      {available.length === 0 ? (
        <p className="mt-4 text-sm text-ink-2">Hai già tutti gli album disponibili.</p>
      ) : (
        <ul className="mt-4 max-h-[60vh] space-y-2 overflow-y-auto">
          {available.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => { onAdd(a.id); onOpenChange(false) }}
                className="flex w-full items-center gap-3 rounded-xl border border-white/10 p-3 text-left transition-transform duration-150 ease-out hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
              >
                <span aria-hidden className="h-10 w-10 shrink-0 rounded-lg" style={{ background: `linear-gradient(145deg, ${a.c1}, ${a.c2})` }} />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">{a.title}</span>
                  <span className="block font-mono text-[11px] uppercase tracking-wide text-ink-2">{a.editor} · {a.season} · {a.total} fig.</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
```

- [ ] **Step 4: Esegui — deve passare**

Run: `npx vitest run src/components/album/NewAlbumDialog.test.tsx`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/album/NewAlbumDialog.tsx src/components/album/NewAlbumDialog.test.tsx
git commit -m "feat(album): NewAlbumDialog picker catalogo (esclude posseduti)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9: `LibraryFilters` (barra pills + bottone)

**Files:**
- Create: `src/components/album/LibraryFilters.tsx`
- Test: `src/components/album/LibraryFilters.test.tsx`

- [ ] **Step 1: Scrivi il test (fallisce)**

Create `src/components/album/LibraryFilters.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LibraryFilters } from './LibraryFilters'

const counts = { 'in-corso': 4, tutti: 6, completati: 2, archivio: 1 }

describe('LibraryFilters', () => {
  it('mostra le 4 pill in ordine con conteggi (no "Appena usciti")', () => {
    render(<LibraryFilters active="in-corso" counts={counts} onChange={() => {}} onNew={() => {}} />)
    const labels = screen.getAllByRole('button').map((b) => b.textContent)
    expect(labels.join(' ')).toContain('In corso')
    expect(labels.join(' ')).toContain('Archivio')
    expect(labels.join(' ')).not.toContain('Appena usciti')
  })
  it('click pill chiama onChange con la key', async () => {
    const onChange = vi.fn()
    render(<LibraryFilters active="in-corso" counts={counts} onChange={onChange} onNew={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /Completati/ }))
    expect(onChange).toHaveBeenCalledWith('completati')
  })
  it('bottone Nuovo album chiama onNew', async () => {
    const onNew = vi.fn()
    render(<LibraryFilters active="in-corso" counts={counts} onChange={() => {}} onNew={onNew} />)
    await userEvent.click(screen.getByRole('button', { name: /Nuovo album/ }))
    expect(onNew).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Esegui — deve fallire**

Run: `npx vitest run src/components/album/LibraryFilters.test.tsx`
Expected: FAIL — modulo inesistente.

- [ ] **Step 3: Implementa**

Create `src/components/album/LibraryFilters.tsx`:

```tsx
import { Plus } from 'lucide-react'
import { LIBRARY_FILTERS, type LibraryFilter } from '@/lib/album/libraryFilters'

export interface LibraryFiltersProps {
  active: LibraryFilter
  counts: Record<LibraryFilter, number>
  onChange: (f: LibraryFilter) => void
  onNew: () => void
}

// Barra filtri: pills a sinistra, "Nuovo album" a destra. Min touch target 44px.
export function LibraryFilters({ active, counts, onChange, onNew }: LibraryFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {LIBRARY_FILTERS.map(({ key, label }) => {
          const on = key === active
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-pressed={on}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime ${
                on ? 'bg-bg-elev text-ink' : 'border border-white/10 text-ink-2 hover:text-ink'
              }`}
            >
              {label}
              <span className={`tabular-nums text-xs ${on ? 'rounded-full bg-lime px-1.5 text-lime-ink' : 'text-ink-2/70'}`}>{counts[key]}</span>
            </button>
          )
        })}
      </div>
      <button
        type="button"
        onClick={onNew}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-lime px-4 text-sm font-semibold text-lime-ink transition-transform duration-150 ease-out hover:brightness-105 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
      >
        <Plus className="h-4 w-4" aria-hidden /> Nuovo album
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Esegui — deve passare**

Run: `npx vitest run src/components/album/LibraryFilters.test.tsx`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/album/LibraryFilters.tsx src/components/album/LibraryFilters.test.tsx
git commit -m "feat(album): LibraryFilters barra pills + bottone Nuovo album

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 10: Integrazione in `AlbumList.tsx`

**Files:**
- Modify: `src/pages/AlbumList.tsx`
- Test: `src/pages/AlbumList.test.tsx` (create)

Ricompone la pagina: barra filtri + filtro attivo (default `in-corso`), tile con `AlbumMenu` fuori dal `<Link>`, NewAlbumDialog, e wiring delle mutate da `useCollection`/`useAuth`.

- [ ] **Step 1: Scrivi il test d'integrazione (fallisce)**

Create `src/pages/AlbumList.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const addAlbum = vi.fn(() => Promise.resolve())
const removeAlbum = vi.fn(() => Promise.resolve())
const archiveAlbum = vi.fn(() => Promise.resolve())
const unarchiveAlbum = vi.fn(() => Promise.resolve())

vi.mock('@/lib/db/albums', () => ({ addAlbum, removeAlbum, archiveAlbum, unarchiveAlbum }))
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }))

const entry = (id: string, title: string) => ({ id, title, editor: 'Panini', season: '2024/25', c1: '#111', c2: '#222' })
let mockData: { albums: unknown[]; archived: string[]; loading: boolean; error: boolean }
vi.mock('@/hooks/useCollection', () => ({ useCollection: () => mockData }))

import AlbumList from './AlbumList'

const stats = (over: Partial<{ pct: number }> = {}) => ({ have: 1, doubles: 0, missing: 1, total: 2, pct: 50, ...over })

beforeEach(() => {
  vi.clearAllMocks()
  mockData = {
    albums: [
      { id: 'a-progress', entry: entry('a-progress', 'In Corso A'), ...stats({ pct: 50 }) },
      { id: 'a-done', entry: entry('a-done', 'Completo B'), ...stats({ pct: 100, have: 2, missing: 0 }) },
      { id: 'a-arch', entry: entry('a-arch', 'Archiviato C'), ...stats({ pct: 30 }) },
    ],
    archived: ['a-arch'],
    loading: false,
    error: false,
  }
})

function setup() {
  return render(<MemoryRouter><AlbumList /></MemoryRouter>)
}

describe('AlbumList', () => {
  it('default In corso: mostra in-progress (non completati, non archiviati)', () => {
    setup()
    expect(screen.getByText('In Corso A')).toBeInTheDocument()
    expect(screen.queryByText('Completo B')).toBeNull()
    expect(screen.queryByText('Archiviato C')).toBeNull()
  })
  it('filtro Archivio mostra solo archiviati', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: /Archivio/ }))
    expect(screen.getByText('Archiviato C')).toBeInTheDocument()
    expect(screen.queryByText('In Corso A')).toBeNull()
  })
  it('elimina: menu -> Elimina -> conferma chiama removeAlbum(uid,id)', async () => {
    setup()
    await userEvent.click(screen.getByLabelText('Azioni album'))
    await userEvent.click(await screen.findByText('Elimina'))
    await userEvent.click(await screen.findByRole('button', { name: 'Elimina' }))
    expect(removeAlbum).toHaveBeenCalledWith('u1', 'a-progress')
  })
})
```

- [ ] **Step 2: Esegui — deve fallire**

Run: `npx vitest run src/pages/AlbumList.test.tsx`
Expected: FAIL (la pagina non rende ancora filtri/menu).

- [ ] **Step 3: Riscrivi `AlbumList.tsx`**

Replace l'intero contenuto di `src/pages/AlbumList.tsx`:

```tsx
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCollection } from '@/hooks/useCollection'
import { useAuth } from '@/hooks/useAuth'
import type { PerAlbumStats } from '@/lib/db/albums'
import { addAlbum, removeAlbum, archiveAlbum, unarchiveAlbum } from '@/lib/db/albums'
import { AlbumButton } from '@/components/album/ui/Button'
import { LibraryFilters } from '@/components/album/LibraryFilters'
import { NewAlbumDialog } from '@/components/album/NewAlbumDialog'
import { AlbumMenu } from '@/components/album/AlbumMenu'
import {
  inBucket, LIBRARY_FILTERS, DEFAULT_FILTER, type LibraryFilter,
} from '@/lib/album/libraryFilters'

export default function AlbumList() {
  const { albums, archived, loading, error, retry } = useCollection()
  const { user } = useAuth()
  const [filter, setFilter] = useState<LibraryFilter>(DEFAULT_FILTER)
  const [newOpen, setNewOpen] = useState(false)

  const archivedSet = useMemo(() => new Set(archived), [archived])
  const withFlag = useMemo(
    () => albums.map((a) => ({ a, archived: archivedSet.has(a.id) })),
    [albums, archivedSet],
  )

  const counts = useMemo(() => {
    const c = { 'in-corso': 0, tutti: 0, completati: 0, archivio: 0 } as Record<LibraryFilter, number>
    for (const { a, archived } of withFlag) {
      for (const { key } of LIBRARY_FILTERS) {
        if (inBucket(key, { pct: a.pct, archived })) c[key]++
      }
    }
    return c
  }, [withFlag])

  const visible = withFlag.filter(({ a, archived }) => inBucket(filter, { pct: a.pct, archived }))
  const ownedIds = albums.map((a) => a.id)

  if (loading) {
    return (
      <div className="album-theme mx-auto w-full max-w-[88rem]">
        <div className="h-8 w-40 animate-pulse rounded bg-bg-elev" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-bg-elev" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="album-theme mx-auto w-full max-w-[88rem]">
      <h1 className="text-[28px] font-medium tracking-tight text-ink sm:text-[32px]">I tuoi album</h1>

      {error ? (
        <div role="alert" className="mt-10 flex flex-col items-center rounded-xl border border-white/[0.07] bg-bg-elev px-6 py-16 text-center">
          <div className="text-xl font-medium tracking-tight text-ink">Non riesco a caricare gli album</div>
          <AlbumButton type="button" onClick={retry} className="mt-5">Riprova</AlbumButton>
        </div>
      ) : (
        <>
          <div className="mt-6">
            <LibraryFilters active={filter} counts={counts} onChange={setFilter} onNew={() => setNewOpen(true)} />
          </div>

          {visible.length === 0 ? (
            <div className="mt-8 flex flex-col items-center rounded-xl border border-white/[0.07] bg-bg-elev px-6 py-16 text-center">
              <div className="text-xl font-medium tracking-tight text-ink">
                {albums.length === 0 ? 'Nessun album ancora' : 'Niente in questo filtro'}
              </div>
              <p className="mt-2 max-w-xs text-sm text-ink-2">
                {albums.length === 0 ? 'Aggiungi un album per iniziare a collezionare.' : 'Cambia filtro o aggiungi un nuovo album.'}
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map(({ a, archived }) => (
                <AlbumTile
                  key={a.id}
                  a={a}
                  archived={archived}
                  onArchive={() => user && archiveAlbum(user.uid, a.id)}
                  onUnarchive={() => user && unarchiveAlbum(user.uid, a.id)}
                  onDelete={() => user && removeAlbum(user.uid, a.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <NewAlbumDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        ownedIds={ownedIds}
        onAdd={(id) => user && addAlbum(user.uid, id)}
      />
    </div>
  )
}

interface TileProps {
  a: PerAlbumStats
  archived: boolean
  onArchive: () => void
  onUnarchive: () => void
  onDelete: () => void
}

// Tile a gradiente pieno colore-album. Il <Link> copre la card; AlbumMenu è
// fratello sopra (z) col proprio stato => il tap sul menu non naviga.
function AlbumTile({ a, archived, onArchive, onUnarchive, onDelete }: TileProps) {
  const { entry } = a
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/10 p-5 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.7)] transition-transform duration-150 ease-out hover:-translate-y-0.5"
      style={{ background: `linear-gradient(145deg, ${entry.c1} 0%, ${entry.c2} 100%)` }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.05) 40%, transparent 60%, rgba(0,0,0,0.45) 100%)' }} />

      <Link
        to={`/album/${a.id}`}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
        aria-label={`Apri ${entry.title} — ${a.pct}% completo`}
      />

      <div className="absolute right-3 top-3 z-20">
        <AlbumMenu title={entry.title} archived={archived} onArchive={onArchive} onUnarchive={onUnarchive} onDelete={onDelete} />
      </div>

      <div className="pointer-events-none relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-[11px] uppercase tracking-wide text-white/85">{entry.editor} · {entry.season}</div>
            <h2 className="mt-1 truncate text-2xl font-semibold tracking-tight text-white">{entry.title}</h2>
          </div>
          <div className="shrink-0 pr-10 font-display text-3xl font-bold leading-none tabular-nums text-white">
            {a.pct}<span className="text-xl text-white/75">%</span>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/30">
          <div className="h-full rounded-full bg-white" style={{ width: `${Math.max(2, a.pct)}%` }} />
        </div>

        <div className="mt-4 flex items-end justify-between">
          <dl className="flex gap-5 text-white">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wide text-white/75">Possedute</dt>
              <dd className="mt-0.5 font-display text-lg font-bold tabular-nums">{a.have}<span className="text-sm font-medium text-white/70"> / {a.total}</span></dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wide text-white/75">Mancanti</dt>
              <dd className="mt-0.5 font-display text-lg font-bold tabular-nums">{a.missing}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wide text-white/75">Doppie</dt>
              <dd className="mt-0.5 font-display text-lg font-bold tabular-nums">{a.doubles}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
```

Note di accessibilità/interazione: la card non è più un `<Link>` intero; il link è un overlay `absolute inset-0 z-10`. Il menu sta a `z-20` con il proprio handling, quindi i suoi click non raggiungono il link. Il contenuto testuale è `pointer-events-none` così i click "passano" al link sottostante. La "Apri →" affordance è rimossa (l'intera card è cliccabile via overlay).

- [ ] **Step 4: Esegui il test d'integrazione — deve passare**

Run: `npx vitest run src/pages/AlbumList.test.tsx`
Expected: PASS (3 test).

- [ ] **Step 5: Suite completa + commit**

Run: `npx vitest run`
Expected: PASS (tutti, inclusi i pre-esistenti).

```bash
git add src/pages/AlbumList.tsx src/pages/AlbumList.test.tsx
git commit -m "feat(album): libreria con filtri, nuovo album e menu azioni per-card

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 11: Verifica finale + push

**Files:** nessuno (gate di qualità).

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: exit 0.

- [ ] **Step 2: Lint (nessun nuovo errore)**

Run: `npm run lint`
Expected: solo i 2 error pre-esistenti (`src/components/ui/button.tsx`, `tabs.tsx`); nessuno nuovo sui file aggiunti.

- [ ] **Step 3: impeccable detect sui nuovi file**

Run:
```bash
node /Users/alessandrogelo/.claude/skills/impeccable/scripts/detect.mjs --json \
  figubook-app/src/components/album/LibraryFilters.tsx \
  figubook-app/src/components/album/NewAlbumDialog.tsx \
  figubook-app/src/components/album/ConfirmActionDialog.tsx \
  figubook-app/src/components/album/AlbumMenu.tsx \
  figubook-app/src/components/ui/dialog.tsx \
  figubook-app/src/components/ui/menu.tsx \
  figubook-app/src/lib/album/libraryFilters.ts \
  figubook-app/src/lib/db/albums.ts
```
Expected: `[]`.

- [ ] **Step 4: Push**

```bash
git push origin main
```
Expected: push ok (deploy via GitHub Actions; verifica live in incognito su /app/album).

---

## Self-Review (compilata)

**Spec coverage:**
- Modello dati `archived[]` + mutate → Task 1 ✓
- `useCollection` espone archived → Task 2 ✓
- Filtri (ordine, default in-corso, no "Appena usciti", predicati) → Task 3 + Task 9 + Task 10 ✓
- Nuovo album (bottone a destra barra + picker catalogo−posseduti + stato vuoto) → Task 8 + Task 9 ✓
- Menu 3 punti (archivia/ripristina/elimina, no condividi) → Task 7 ✓
- Conferma elimina (testo irreversibile) + ripristina (testo distinto), archivia senza conferma → Task 6 + Task 7 ✓
- Primitives Base UI Dialog/Menu, tema album → Task 4 + Task 5 ✓
- Tile ricomposta col menu fuori dal Link → Task 10 ✓
- Wipe irreversibile (ordine setDoc poi deleteDoc) → Task 1 ✓
- Error handling (lista live, no rollback) → implicito nel wiring Task 10 ✓
- Testing (db fns, predicati, componenti, integrazione) → presente in ogni task ✓

**Type consistency:** `LibraryFilter`/`inBucket`/`LIBRARY_FILTERS`/`DEFAULT_FILTER` (Task 3) usati identici in Task 9/10. `MyAlbums {ids,archived}` (Task 1) consumato in Task 2. `addAlbum/removeAlbum/archiveAlbum/unarchiveAlbum(uid,id)` firma costante Task 1→10. `Modal`/`Dialog` export (Task 4) usati in Task 6/8. `MenuRoot/MenuTrigger/MenuContent/MenuItem` (Task 5) usati in Task 7. `ConfirmActionDialog` props (Task 6) usate in Task 7. `AlbumMenu` props (Task 7) usate in Task 10. ✓

**Placeholder scan:** nessun TBD/TODO; ogni step ha codice o comando concreto. ✓

**Note di rischio (non bloccanti):** API minori di Base UI 1.5 (`onOpenChange` arity, props `Positioner`) annotate inline nei Task 4/5 con fallback. Se un test sull'arity di `onOpenChange` non combacia, allinea l'assert mantenendo il comportamento.
