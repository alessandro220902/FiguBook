import type { Firestore, Query } from 'firebase-admin/firestore'

// Interfaccia minima admin auth (facilita il fake in test futuri).
export interface AuthAdminLike {
  deleteUser(uid: string): Promise<void>
}

// True solo per doc con path esatto tradeIndex/{albumId}/users/{uid}.
// Serve a distinguere questi dai doc della collezione root `users` (albero utente),
// entrambi catturati da collectionGroup('users').
export function isTradeIndexUserDoc(path: string, uid: string): boolean {
  const seg = path.split('/')
  return seg.length === 4 && seg[0] === 'tradeIndex' && seg[2] === 'users' && seg[3] === uid
}

// Cancella un doc ignorando errori (idempotenza).
async function del(db: Firestore, path: string) {
  await db.doc(path).delete().catch(() => {})
}

// Cancella a batch i risultati di una query.
async function deleteQuery(db: Firestore, query: Query) {
  const snap = await query.get()
  if (!snap.size) return
  const batch = db.batch()
  snap.docs.forEach((d) => batch.delete(d.ref))
  await batch.commit()
}

export async function deleteAccountCascade(
  db: Firestore,
  authAdmin: AuthAdminLike,
  uid: string,
): Promise<void> {
  // 2. Cross-reference dove altri referenziano uid.
  await deleteQuery(db, db.collection('friendRequests').where('fromUid', '==', uid))
  await deleteQuery(db, db.collection('friendRequests').where('toUid', '==', uid))
  await deleteQuery(db, db.collection('friendships').where('users', 'array-contains', uid))
  await deleteQuery(db, db.collection('proposals').where('participants', 'array-contains', uid))

  // Pulizia notifiche altrui: BEST-EFFORT. Richiede un indice collection-group
  // su notifications.fromUid (firestore.indexes.json); se non è ancora costruito
  // la query fallisce (FAILED_PRECONDITION). È il cleanup meno critico (orfani
  // cosmetici) e NON deve bloccare la cancellazione vera dell'account.
  try {
    await deleteQuery(db, db.collectionGroup('notifications').where('fromUid', '==', uid))
  } catch (err) {
    console.warn('deleteAccountCascade: pulizia notifiche saltata', err)
  }

  // 3. tradeIndex/{albumId}/users/{uid}: filtro per path esatto (vedi isTradeIndexUserDoc).
  const tradeUsers = await db.collectionGroup('users').get()
  const tradeDocs = tradeUsers.docs.filter((d) => isTradeIndexUserDoc(d.ref.path, uid))
  if (tradeDocs.length) {
    const batch = db.batch()
    tradeDocs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
  }

  // 4. Username: cancella per QUERY su uid (non ricavando lower da publicProfiles).
  // Robusto anche se publicProfiles/meta sono già stati cancellati da un run
  // precedente: niente prenotazione username orfana.
  await deleteQuery(db, db.collection('usernames').where('uid', '==', uid))

  // 5. Albero utente ricorsivo + doc pubblico.
  await db.recursiveDelete(db.doc(`users/${uid}`))
  await del(db, `publicProfiles/${uid}`)

  // 6. Auth per ultimo.
  await authAdmin.deleteUser(uid)
}
