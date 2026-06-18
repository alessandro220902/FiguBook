# A2.0 fondamenta + A2.1 notifiche Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox.

**Goal:** Fondamenta layer dati + campanella notifiche live.

**Architecture:** requireUid + catalogo tipizzato (A2.0). notifications.ts (onSnapshot live + markAllRead) → useNotifications hook → TopRightMenu pannello reale + dot (A2.1).

**Tech Stack:** Firebase modular (firestore onSnapshot/writeBatch), React hooks, framer-motion (gia' c'e').

**Verifica:** `npm run build` + `npm run lint` + live (no test runner, zero-locale).

---

## Task 1 — requireUid (A2.0)
**Files:** Modify `figubook-app/src/lib/firebase.ts`
- [ ] Aggiungere in fondo:
```ts
export function requireUid(): string {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Utente non autenticato')
  return uid
}
```

## Task 2 — catalogo album tipizzato (A2.0)
**Files:** Create `figubook-app/src/data/albumCatalog.ts`
- [ ] Portare ALBUM_CATALOG (da figubook-db.js:16-26), tipizzato:
```ts
export interface AlbumCatalogEntry {
  id: string
  title: string
  editor: string
  season: string
  total: number
  missingParam: string
  storageKey: string
  tags: string[]
  c1: string
  c2: string
}

export const ALBUM_CATALOG: AlbumCatalogEntry[] = [ /* 9 voci dal vecchio */ ]
export const albumById: Record<string, AlbumCatalogEntry> =
  Object.fromEntries(ALBUM_CATALOG.map((a) => [a.id, a]))
```

## Task 3 — notifications.ts (A2.1)
**Files:** Create `figubook-app/src/lib/db/notifications.ts`
- [ ] Tipo + funzioni:
```ts
import { collection, query, where, orderBy, limit, onSnapshot, writeBatch, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface FiguNotification {
  id: string
  fromUid?: string
  type?: string
  title: string
  info?: string
  href?: string
  icon?: string
  read: boolean
  at: number
}

const WEEK = 7 * 24 * 60 * 60 * 1000

export function resolveHref(href?: string): string {
  if (!href) return '/scambi'
  if (href === 'figubook-scambia.html') return '/scambi'
  if (href.startsWith('/')) return href
  return '/scambi'
}

export function timeAgo(at: number): string {
  const m = Math.floor((Date.now() - at) / 60000)
  if (m < 1) return 'ora'
  if (m < 60) return `${m}m fa`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h fa`
  return `${Math.floor(h / 24)}g fa`
}

export function subscribeNotifications(uid: string, cb: (n: FiguNotification[]) => void): () => void {
  const col = collection(db, 'users', uid, 'notifications')
  const q = query(col, where('at', '>=', Date.now() - WEEK), orderBy('at', 'desc'), limit(50))
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FiguNotification, 'id'>) }))),
    (err) => { console.error('notifiche', err); cb([]) },
  )
}

export async function markAllRead(uid: string): Promise<void> {
  const col = collection(db, 'users', uid, 'notifications')
  const snap = await getDocs(query(col, where('read', '==', false)))
  if (snap.empty) return
  const batch = writeBatch(db)
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }))
  await batch.commit()
}
```

## Task 4 — useNotifications hook (A2.1)
**Files:** Create `figubook-app/src/hooks/useNotifications.ts`
```ts
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { subscribeNotifications, type FiguNotification } from '@/lib/db/notifications'

export function useNotifications() {
  const { user } = useAuth()
  const [items, setItems] = useState<FiguNotification[]>([])
  useEffect(() => {
    if (!user) { setItems([]); return }
    return subscribeNotifications(user.uid, setItems)
  }, [user])
  const unread = items.filter((n) => !n.read).length
  return { items, unread }
}
```

## Task 5 — dot in expandable-tabs (A2.1)
**Files:** Modify `figubook-app/src/components/ui/expandable-tabs.tsx`
- [ ] Estendere `Tab` con `dot?: boolean`; nel button (dopo `<Icon>`) renderizzare quando `tab.dot`:
```tsx
{'dot' in tab && tab.dot && (
  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-lime ring-2 ring-card" />
)}
```

## Task 6 — collega TopRightMenu (A2.1)
**Files:** Modify `figubook-app/src/components/layout/TopRightMenu.tsx`
- [ ] import useNotifications + resolveHref/timeAgo + Link + markAllRead.
- [ ] TABS Notifiche con `dot: unread > 0` (ricostruire TABS dentro il componente per accedere a unread).
- [ ] useEffect: quando `selected === 1` → `markAllRead(user.uid)`.
- [ ] Pannello Notifiche: se `items.length` → lista (Link to resolveHref(n.href), icona n.icon, titolo, info + timeAgo, evidenzia `!n.read`); altrimenti empty-state esistente.

## Task 7 — verifica + deploy
- [ ] `npm run build && npm run lint` → solo i 2 error shadcn pre-esistenti.
- [ ] commit + push (memory [[push-after-update]]).

## Rimandati (non buchi)
B9 serverTimestamp (cutover), cleanup >7g separato, dati album SECTIONS (A2.2).
