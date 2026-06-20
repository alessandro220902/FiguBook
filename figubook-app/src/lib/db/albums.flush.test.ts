import { describe, it, expect, vi } from 'vitest'
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(), onSnapshot: vi.fn(), setDoc: vi.fn(), deleteField: () => '__DELETE__',
}))
vi.mock('@/lib/firebase', () => ({ db: {} }))
import { buildAlbumUpdate } from './albums'

describe('buildAlbumUpdate', () => {
  it('mappa i count delta in states/counts con deleteField', () => {
    const u = buildAlbumUpdate({ QAT1: 1, QAT2: 0, QAT3: 3 })
    expect(u.states).toEqual({ QAT1: 'have', QAT2: '__DELETE__', QAT3: 'double' })
    expect(u.counts).toEqual({ QAT1: '__DELETE__', QAT2: '__DELETE__', QAT3: 3 })
    expect(typeof u.ts).toBe('number')
  })
})
