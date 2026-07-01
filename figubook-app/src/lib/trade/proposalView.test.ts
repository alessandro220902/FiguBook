import { describe, it, expect } from 'vitest'
import { proposalView } from './proposalView'
import type { Proposal } from '@/lib/db/proposals'

const base: Proposal = {
  id: 'p1', participants: ['A', 'B'], fromUid: 'A', toUid: 'B',
  albumId: 'adrenalyn-25-26', give: ['19', '20'], receive: ['1'],
  status: 'pending', confirmedBy: [], lastEditedBy: 'A', turnUid: 'B',
  createdAt: 0, updatedAt: 0,
}

describe('proposalView', () => {
  it('FROM = lastEditedBy, TO = altro; cede/riceve dal frame fromUid', () => {
    const v = proposalView(base, 'B')
    expect(v.fromUid).toBe('A')
    expect(v.toUid).toBe('B')
    expect(v.fromGives).toEqual(['19', '20'])
    expect(v.toGives).toEqual(['1'])
  })

  it('dopo contro-proposta di B: lastEditedBy=B -> FROM=B', () => {
    const counter: Proposal = { ...base, lastEditedBy: 'B', turnUid: 'A' }
    const v = proposalView(counter, 'A')
    expect(v.fromUid).toBe('B')
    expect(v.toUid).toBe('A')
    expect(v.fromGives).toEqual(['1'])
    expect(v.toGives).toEqual(['19', '20'])
  })

  it('isMyTurn true solo se turnUid == me', () => {
    expect(proposalView(base, 'B').isMyTurn).toBe(true)
    expect(proposalView(base, 'A').isMyTurn).toBe(false)
  })
})
