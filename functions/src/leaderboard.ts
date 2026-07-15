import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { computeAxes } from './albo/scoring.js'
import { collectScoringInput } from './albo/collect.js'
import { rankByAxis, type Axis, type ScoreRow } from './albo/rank.js'

export type Scope = 'nazionale' | 'citta' | 'squadra' | 'amici'

export function seasonOf(ms: number): string {
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
export function monthStartMs(ms: number): number {
  const d = new Date(ms)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)
}
export function scopeQueryField(scope: Scope): 'citta' | 'favTeam' | null {
  if (scope === 'citta') return 'citta'
  if (scope === 'squadra') return 'favTeam'
  return null
}

interface PublicMeta { username?: string; avatarId?: string; favTeam?: string; citta?: string; isPublic?: boolean }

async function publicMetaOf(db: Firestore, uid: string): Promise<PublicMeta> {
  const snap = await db.collection('publicProfiles').doc(uid).get()
  return snap.exists ? (snap.data() as PublicMeta) : {}
}
async function profileOf(db: Firestore, uid: string): Promise<{ favTeam?: string; profileComplete: boolean }> {
  const snap = await db.collection('users').doc(uid).get()
  const p = snap.exists ? snap.data()! : {}
  const profileComplete = Boolean(p.citta && p.cap && p.favTeam && p.avatarId)
  return { favTeam: p.favTeam as string | undefined, profileComplete }
}

// Ricalcola e persiste scores/{uid}; ritorna la ScoreRow (stagione corrente).
export async function recomputeAndStore(db: Firestore, uid: string, now: number): Promise<ScoreRow> {
  const [meta, prof] = await Promise.all([publicMetaOf(db, uid), profileOf(db, uid)])
  const startMs = monthStartMs(now)
  const monthStartIso = new Date(startMs).toISOString().slice(0, 10)
  const input = await collectScoringInput(db, uid, { favTeam: prof.favTeam, profileComplete: prof.profileComplete, monthStartIso })
  const season = computeAxes(input, startMs)
  const allTime = computeAxes(input)
  const row: ScoreRow = {
    uid, username: meta.username, avatarId: meta.avatarId, favTeam: meta.favTeam, citta: meta.citta,
    totale: season.totale, collezionista: season.collezionista, scambista: season.scambista,
  }
  await db.collection('scores').doc(uid).set({
    ...row,
    isPublic: meta.isPublic ?? false,
    collezionistaAllTime: allTime.collezionista,
    scambistaAllTime: allTime.scambista,
    totaleAllTime: allTime.totale,
    season: seasonOf(now),
    updatedAt: now,
  }, { merge: true })
  return row
}

async function scopeMemberUids(db: Firestore, scope: Scope, me: ScoreRow, meUid: string): Promise<string[] | null> {
  if (scope === 'nazionale') return null
  if (scope === 'amici') {
    const snap = await db.collection('friendships').where('users', 'array-contains', meUid).get()
    const uids = new Set<string>()
    snap.docs.forEach((d) => (d.data().users as string[]).forEach((u) => u !== meUid && uids.add(u)))
    uids.add(meUid)
    return [...uids]
  }
  const field = scopeQueryField(scope)!
  const value = field === 'citta' ? me.citta : me.favTeam
  if (!value) return [meUid]
  const snap = await db.collection('scores').where(field, '==', value).where('isPublic', '==', true).limit(200).get()
  const uids = new Set<string>(snap.docs.map((d) => d.id))
  uids.add(meUid)
  return [...uids]
}

export const leaderboard = onCall({ region: 'europe-west1' }, async (req) => {
  const uid = req.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Login richiesto.')
  const now = Date.now()
  const axis: Axis = (req.data?.axis as Axis) ?? 'totale'
  const scope: Scope = (req.data?.scope as Scope) ?? 'nazionale'
  const limit = Math.min(50, Math.max(3, Number(req.data?.limit ?? 20)))
  const db = getFirestore()

  const meRow = await recomputeAndStore(db, uid, now)

  let rows: ScoreRow[]
  const members = await scopeMemberUids(db, scope, meRow, uid)
  if (members === null) {
    const snap = await db.collection('scores').where('isPublic', '==', true).orderBy(axis, 'desc').limit(limit + 1).get()
    rows = snap.docs.map((d) => d.data() as ScoreRow)
  } else {
    const others = members.filter((u) => u !== uid)
    const fresh = await Promise.all(others.map((u) => recomputeAndStore(db, u, now)))
    rows = [meRow, ...fresh]
  }

  const ranked = rankByAxis(rows, axis, limit)
  const meRanked = ranked.find((r) => r.uid === uid)
    ?? { ...meRow, value: meRow[axis], rank: rankByAxis(rows, axis, rows.length).findIndex((r) => r.uid === uid) + 1 }
  return { rows: ranked, me: meRanked, hasMore: rows.length > limit, season: seasonOf(now) }
})
