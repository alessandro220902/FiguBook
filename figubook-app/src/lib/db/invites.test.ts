import { describe, it, expect, vi } from 'vitest'

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db, _c, id) => ({ id })),
  setDoc: vi.fn(async () => {}),
  collection: vi.fn(() => ({})),
  query: vi.fn((...a) => a),
  where: vi.fn((...a) => a),
  onSnapshot: vi.fn(),
}))
vi.mock('@/lib/firebase', () => ({ db: {} }))

import { setDoc } from 'firebase/firestore'
import { writeInviteEdge } from './invites'

describe('writeInviteEdge', () => {
  it('scrive invites/{invitedUid} = { inviterUid, at }', async () => {
    await writeInviteEdge('newUser', 'marcoUid')
    expect(setDoc).toHaveBeenCalledTimes(1)
    const [ref, data] = (setDoc as any).mock.calls[0]
    expect(ref.id).toBe('newUser')
    expect(data.inviterUid).toBe('marcoUid')
    expect(typeof data.at).toBe('number')
  })
  it('non scrive se inviterUid mancante', async () => {
    ;(setDoc as any).mockClear()
    await writeInviteEdge('newUser', '')
    expect(setDoc).not.toHaveBeenCalled()
  })
})
