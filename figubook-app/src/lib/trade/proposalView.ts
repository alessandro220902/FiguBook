import type { Proposal } from '@/lib/db/proposals'

export interface ProposalView {
  fromUid: string
  toUid: string
  fromGives: string[]
  toGives: string[]
  isMyTurn: boolean
}

// give/receive sono nel frame di p.fromUid: give = ciò che fromUid cede.
export function proposalView(p: Proposal, meUid: string): ProposalView {
  const from = p.lastEditedBy
  const to = p.participants.find((x) => x !== from) ?? p.toUid
  const fromGives = from === p.fromUid ? p.give : p.receive
  const toGives = from === p.fromUid ? p.receive : p.give
  return { fromUid: from, toUid: to, fromGives, toGives, isMyTurn: p.turnUid === meUid }
}
