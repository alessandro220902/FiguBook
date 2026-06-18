import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  getDocs,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Forma invariata dal sito vecchio (figubook-db.js): users/{uid}/notifications/{id}.
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

// Mappa href del vecchio (pagine .html) alle rotte React.
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

// Sottoscrizione live (onSnapshot): ultimi 7 giorni, piu' recenti prima.
// Nessuna cancellazione in lettura (fix B8).
export function subscribeNotifications(
  uid: string,
  cb: (n: FiguNotification[]) => void,
): () => void {
  const col = collection(db, 'users', uid, 'notifications')
  const q = query(col, where('at', '>=', Date.now() - WEEK), orderBy('at', 'desc'), limit(50))
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FiguNotification, 'id'>) }))),
    (err) => {
      console.error('notifiche', err)
      cb([])
    },
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
