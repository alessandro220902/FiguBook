import {
  addDoc, collection, doc, onSnapshot, query, updateDoc, where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { subscribeAlbum, flushAlbumCounts } from '@/lib/db/albums'
import { applyTradeToAlbum } from '@/lib/trade/applyTradeToAlbum'

export type ProposalStatus = 'pending' | 'accepted' | 'completed' | 'declined' | 'cancelled'

export interface Proposal {
  id: string
  participants: string[]
  fromUid: string
  toUid: string
  albumId: string
  give: string[]
  receive: string[]
  status: ProposalStatus
  confirmedBy: string[]
  lastEditedBy: string
  turnUid: string
  createdAt: number
  updatedAt: number
}

// --- helper puri (testabili) ---
export function addConfirmation(confirmedBy: string[], uid: string): string[] {
  return confirmedBy.includes(uid) ? confirmedBy : [...confirmedBy, uid]
}
export function isCompleted(participants: string[], confirmedBy: string[]): boolean {
  return participants.every((p) => confirmedBy.includes(p))
}
export function otherParticipant(participants: string[], uid: string): string {
  return participants.find((p) => p !== uid) ?? uid
}

// --- wrapper Firestore ---
export async function createProposal(
  fromUid: string, toUid: string, albumId: string, give: string[], receive: string[],
): Promise<void> {
  const now = Date.now()
  await addDoc(collection(db, 'proposals'), {
    participants: [fromUid, toUid],
    fromUid, toUid, albumId, give, receive,
    status: 'pending', confirmedBy: [],
        lastEditedBy: fromUid, turnUid: toUid,
        createdAt: now, updatedAt: now,
  })
}

export function subscribeMyProposals(uid: string, cb: (p: Proposal[]) => void): () => void {
  const q = query(collection(db, 'proposals'), where('participants', 'array-contains', uid))
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Proposal, 'id'>) }))),
    (err) => { console.error('proposals', err); cb([]) },
  )
}

export async function acceptProposal(id: string): Promise<void> {
  await updateDoc(doc(db, 'proposals', id), { status: 'accepted', updatedAt: Date.now() })
}
export async function declineProposal(id: string): Promise<void> {
  await updateDoc(doc(db, 'proposals', id), { status: 'declined', updatedAt: Date.now() })
}

// Applica lo scambio all'album di chi conferma (una lettura + un flush).
// give/receive sono nel frame di fromUid: chi conferma ed è toUid vede
// tutto invertito (riceve p.give, dà p.receive).
async function applyToMyAlbum(uid: string, p: Proposal): Promise<void> {
  const mine = uid === p.fromUid
    ? { give: p.give, receive: p.receive }
    : { give: p.receive, receive: p.give }
  await new Promise<void>((resolve) => {
    const unsub = subscribeAlbum(uid, p.albumId, async (d) => {
      unsub()
      const deltas = applyTradeToAlbum(d.states, d.counts, mine)
      try { await flushAlbumCounts(uid, p.albumId, deltas) } catch (e) { console.error('apply trade', e) }
      resolve()
    })
  })
}

// Modifica offerta (stesso doc): rimette in attesa e passa il turno all'altro.
export async function updateProposalOffer(
  p: Proposal, editorUid: string, give: string[], receive: string[],
): Promise<void> {
  await updateDoc(doc(db, 'proposals', p.id), {
    give, receive,
    status: 'pending', confirmedBy: [],
    lastEditedBy: editorUid,
    turnUid: otherParticipant(p.participants, editorUid),
    updatedAt: Date.now(),
  })
}

// Annulla proposta ancora in attesa (soft-cancel: rules vietano delete).
export async function cancelProposal(id: string): Promise<void> {
  await updateDoc(doc(db, 'proposals', id), { status: 'cancelled', updatedAt: Date.now() })
}

// Conferma "scambio fatto"; passa a completed se entrambi hanno confermato.
export async function confirmProposal(p: Proposal, uid: string): Promise<void> {
  const confirmedBy = addConfirmation(p.confirmedBy, uid)
  const status: ProposalStatus = isCompleted(p.participants, confirmedBy) ? 'completed' : p.status
  await applyToMyAlbum(uid, p)
  await updateDoc(doc(db, 'proposals', p.id), { confirmedBy, status, updatedAt: Date.now() })
}
