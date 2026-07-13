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
