import { describe, it, expect, vi, beforeEach } from 'vitest'

const { setDoc, deleteDoc, arrayUnion, arrayRemove, doc, unfriend } = vi.hoisted(() => ({
  setDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  arrayUnion: vi.fn((...v: string[]) => ({ __union: v })),
  arrayRemove: vi.fn((...v: string[]) => ({ __remove: v })),
  doc: vi.fn((...path: unknown[]) => ({ path })),
  unfriend: vi.fn(() => Promise.resolve()),
}))

vi.mock('firebase/firestore', () => ({ setDoc, deleteDoc, arrayUnion, arrayRemove, doc }))
vi.mock('@/lib/firebase', () => ({ db: {} }))
vi.mock('@/lib/db/friends', () => ({ unfriend }))

import { blockUser, unblockUser } from './blocks'

beforeEach(() => { vi.clearAllMocks() })

describe('blockUser', () => {
  it('arrayUnion blocked + unfriend + cancella entrambe le richieste', async () => {
    await blockUser('me', 'other')
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(), { blocked: { __union: ['other'] } }, { merge: true },
    )
    expect(unfriend).toHaveBeenCalledWith('me', 'other')
    expect(deleteDoc).toHaveBeenCalledTimes(2)
  })
})

describe('unblockUser', () => {
  it('arrayRemove blocked', async () => {
    await unblockUser('me', 'other')
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(), { blocked: { __remove: ['other'] } }, { merge: true },
    )
  })
})
