import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, type Firestore, type QuerySnapshot } from 'firebase-admin/firestore'

export interface Me { uid: string; cap?: string; provincia?: string; favTeam?: string }
export interface Cand {
  uid: string; cap?: string; provincia?: string; favTeam?: string; isPublic: boolean
}

// Tier: 0 = CAP, 1 = provincia, -1 = nessun match. Più basso = più vicino.
// La squadra NON è più criterio di prossimità: "vicino" = stessa zona geografica.
function tier(me: Me, c: Cand): number {
  if (me.cap && c.cap && c.cap === me.cap) return 0
  if (me.provincia && c.provincia && c.provincia === me.provincia) return 1
  return -1
}

// Logica pura: filtra + ordina per tier, ritorna solo gli uid (max limit).
export function rankCandidates(
  me: Me, cands: Cand[], friends: string[], blocked: string[],
  exclude: string[], limit: number,
): string[] {
  const excl = new Set<string>([me.uid, ...friends, ...blocked, ...exclude])
  return cands
    .filter((c) => c.isPublic && !excl.has(c.uid))
    .map((c) => ({ uid: c.uid, t: tier(me, c) }))
    .filter((x) => x.t >= 0)
    .sort((a, b) => a.t - b.t)
    .slice(0, limit)
    .map((x) => x.uid)
}

// Legge i candidati dei tier presenti via collectionGroup('meta') sui profili.
async function fetchCandidates(db: Firestore, me: Me): Promise<Cand[]> {
  const cg = db.collectionGroup('meta')
  const queries: Promise<QuerySnapshot>[] = []
  if (me.cap) queries.push(cg.where('cap', '==', me.cap).limit(50).get())
  if (me.provincia) queries.push(cg.where('provincia', '==', me.provincia).limit(50).get())
  const snaps = await Promise.all(queries)
  const byUid = new Map<string, Cand>()
  for (const snap of snaps) {
    for (const d of snap.docs) {
      if (d.id !== 'profile') continue
      const uid = d.ref.parent.parent?.id
      if (!uid || byUid.has(uid)) continue
      const p = d.data() as any
      byUid.set(uid, {
        uid, cap: p.cap, provincia: p.provincia, favTeam: p.favTeam,
        isPublic: p.isPublic === true,
      })
    }
  }
  return [...byUid.values()]
}

export const nearbyCollectors = onCall({ region: 'europe-west1' }, async (req) => {
  const uid = req.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Login richiesto')
  const db = getFirestore()

  const data = (req.data as { exclude?: unknown; limit?: unknown }) ?? {}
  const exclude: string[] = Array.isArray(data.exclude)
    ? data.exclude.filter((x): x is string => typeof x === 'string')
    : []
  const rawLimit = typeof data.limit === 'number' ? data.limit : 6
  const limit = Math.min(12, Math.max(1, Math.floor(rawLimit)))

  const meSnap = await db.doc(`users/${uid}/meta/profile`).get()
  const mp = (meSnap.data() as any) ?? {}
  const me: Me = { uid, cap: mp.cap, provincia: mp.provincia, favTeam: mp.favTeam }
  const blocked: string[] = Array.isArray(mp.blocked) ? mp.blocked : []

  const frSnap = await db.collection('friendships').where('users', 'array-contains', uid).get()
  const friends: string[] = []
  for (const d of frSnap.docs) {
    const users: string[] = (d.data() as any).users ?? []
    for (const u of users) if (u !== uid) friends.push(u)
  }

  const cands = await fetchCandidates(db, me)
  const uids = rankCandidates(me, cands, friends, blocked, exclude, limit)
  return { uids, hasMore: uids.length === limit }
})
