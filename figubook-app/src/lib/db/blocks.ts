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
