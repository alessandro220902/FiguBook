import {
  doc,
  collection,
  addDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  runTransaction,
  query,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Modello amicizie:
//  - friendRequests/{from__to} = { fromUid, toUid, createdAt }  (solo pending)
//  - friendships/{pair} = { users:[a,b], requester, accepter, since }  (pair = uid ordinati)
// Accettare = transazione: crea friendship + cancella la richiesta.
export type FriendStatus = 'none' | 'outgoing' | 'incoming' | 'friends'

const reqId = (from: string, to: string) => `${from}__${to}`
const pairId = (a: string, b: string) => [a, b].sort().join('__')

function reqRef(from: string, to: string) {
  return doc(db, 'friendRequests', reqId(from, to))
}
function pairRef(a: string, b: string) {
  return doc(db, 'friendships', pairId(a, b))
}

// Notifica all'altro utente (forma vincolata dalle regole: fromUid, read=false, ecc.)
async function notify(toUid: string, fromUid: string, title: string) {
  await addDoc(collection(db, 'users', toUid, 'notifications'), {
    fromUid,
    type: 'friend',
    title,
    icon: 'ℹ️',
    href: '/community',
    read: false,
    at: Date.now(),
  })
}

export async function sendFriendRequest(fromUid: string, toUid: string, fromUsername: string) {
  await setDoc(reqRef(fromUid, toUid), { fromUid, toUid, createdAt: Date.now() })
  await notify(toUid, fromUid, `${fromUsername} ti ha inviato una richiesta di amicizia`)
}

export async function cancelFriendRequest(fromUid: string, toUid: string) {
  await deleteDoc(reqRef(fromUid, toUid))
}

// Accetta la richiesta di `requester` (io = accepter).
export async function acceptFriendRequest(requester: string, me: string, myUsername: string) {
  await runTransaction(db, async (tx) => {
    const r = await tx.get(reqRef(requester, me))
    if (!r.exists()) throw new Error('richiesta inesistente')
    tx.set(pairRef(requester, me), {
      users: [requester, me].sort(),
      requester,
      accepter: me,
      since: Date.now(),
    })
    tx.delete(reqRef(requester, me))
  })
  await notify(requester, me, `${myUsername} ha accettato la tua richiesta di amicizia`)
}

export async function rejectFriendRequest(requester: string, me: string, myUsername: string) {
  await deleteDoc(reqRef(requester, me))
  await notify(requester, me, `${myUsername} ha rifiutato la tua richiesta di amicizia`)
}

export interface IncomingRequest {
  fromUid: string
  createdAt: number
}

// Richieste di amicizia ricevute (pending), live.
export function subscribeIncomingRequests(
  me: string,
  cb: (reqs: IncomingRequest[]) => void,
): () => void {
  const q = query(collection(db, 'friendRequests'), where('toUid', '==', me))
  return onSnapshot(
    q,
    (snap) =>
      cb(
        snap.docs
          .map((d) => d.data() as { fromUid: string; createdAt: number })
          .map((d) => ({ fromUid: d.fromUid, createdAt: d.createdAt || 0 }))
          .sort((a, b) => b.createdAt - a.createdAt),
      ),
    () => cb([]),
  )
}

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

export async function unfriend(a: string, b: string) {
  await deleteDoc(pairRef(a, b))
}

// Stato amicizia live tra me e `other`: combina friendship + le due richieste.
export function subscribeFriendStatus(
  me: string,
  other: string,
  cb: (s: FriendStatus) => void,
): () => void {
  let friends = false
  let outgoing = false
  let incoming = false
  const emit = () =>
    cb(friends ? 'friends' : incoming ? 'incoming' : outgoing ? 'outgoing' : 'none')

  const u1 = onSnapshot(pairRef(me, other), (s) => {
    friends = s.exists()
    emit()
  })
  const u2 = onSnapshot(reqRef(me, other), (s) => {
    outgoing = s.exists()
    emit()
  })
  const u3 = onSnapshot(reqRef(other, me), (s) => {
    incoming = s.exists()
    emit()
  })
  return () => {
    u1()
    u2()
    u3()
  }
}
