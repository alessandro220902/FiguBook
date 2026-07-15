import type { Firestore } from 'firebase-admin/firestore'
import type { AlbumInput, ScoringInput } from './scoring.js'
import { totalOf } from './albumTotals.js'

interface ProposalDoc { participants: string[]; status: string; updatedAt: number }
interface AlbumDocRaw { id: string; states: Record<string, string>; counts: Record<string, number> }

export function tradesFromProposals(docs: ProposalDoc[], uid: string): { partner: string; at: number }[] {
  return docs
    .filter((d) => d.status === 'completed' && d.participants.includes(uid))
    .map((d) => ({ partner: d.participants.find((p) => p !== uid) ?? uid, at: d.updatedAt ?? 0 }))
}

export function albumsFromDocs(
  docs: AlbumDocRaw[],
  totalFn: (id: string) => number,
  teamHaveFn: (id: string, states: Record<string, string>) => number,
): AlbumInput[] {
  return docs.map((d) => {
    let have = 0
    for (const code of Object.keys(d.states || {})) {
      const s = d.states[code]
      if (s === 'have' || s === 'double') have++
    }
    return { albumId: d.id, have, total: totalFn(d.id), teamHave: teamHaveFn(d.id, d.states || {}) }
  })
}

// Estrae la mappa baselineHave (albumId -> have) dallo snapshot stats più vecchio del mese corrente.
export function baselineHaveOf(
  statsDocs: { id: string; albums?: Record<string, { have: number }> }[],
  monthStartIso: string,
): Record<string, number> {
  const inMonth = statsDocs.filter((d) => d.id >= monthStartIso).sort((a, b) => a.id.localeCompare(b.id))
  const first = inMonth[0]
  if (!first?.albums) return {}
  const out: Record<string, number> = {}
  for (const [id, v] of Object.entries(first.albums)) out[id] = v.have ?? 0
  return out
}

export async function collectScoringInput(
  db: Firestore,
  uid: string,
  opts: { favTeam?: string; profileComplete: boolean; monthStartIso: string },
): Promise<ScoringInput> {
  const [albumsSnap, propsSnap, invitesSnap, friendsSnap, statsSnap] = await Promise.all([
    db.collection('users').doc(uid).collection('albums').get(),
    db.collection('proposals').where('participants', 'array-contains', uid).get(),
    db.collection('invites').where('inviterUid', '==', uid).get(),
    db.collection('friendships').where('users', 'array-contains', uid).get(),
    db.collection('users').doc(uid).collection('stats').get(),
  ])

  const statsDocs = statsSnap.docs.map((d) => ({ id: d.id, albums: d.data().albums as Record<string, { have: number }> | undefined }))
  const baseline = baselineHaveOf(statsDocs, opts.monthStartIso)

  const albumDocs: AlbumDocRaw[] = albumsSnap.docs
    .filter((d) => d.id !== '_my-albums')
    .map((d) => ({ id: d.id, states: d.data().states || {}, counts: d.data().counts || {} }))
  const albums = albumsFromDocs(albumDocs, totalOf, () => 0)
    .map((a) => ({ ...a, baselineHave: baseline[a.albumId] ?? 0 }))

  const trades = tradesFromProposals(
    propsSnap.docs.map((d) => d.data() as ProposalDoc), uid,
  )
  const invites = invitesSnap.docs.map((d) => ({ at: (d.data().at as number) ?? 0 }))
  const friendshipsAt = friendsSnap.docs.map((d) => (d.data().createdAt as number) ?? 0)
  const activeDays = statsDocs.map((d) => d.id)

  return { albums, trades, invites, friendshipsAt, activeDays, profileComplete: opts.profileComplete }
}
