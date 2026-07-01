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
