import { describe, it, expect, vi, beforeEach } from 'vitest'

const { getDoc, doc } = vi.hoisted(() => ({
  getDoc: vi.fn(),
  doc: vi.fn((...path: unknown[]) => ({ path })),
}))

vi.mock('firebase/firestore', () => ({ getDoc, doc }))
vi.mock('@/lib/firebase', () => ({ db: {} }))

import { getOtherAlbumIds, getOtherAlbum } from './otherAlbums'

beforeEach(() => { vi.clearAllMocks() })

describe('getOtherAlbumIds', () => {
  it('ritorna ids esclusi gli archived', async () => {
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ ids: ['a', 'b', 'c'], archived: ['b'] }),
    })
    const ids = await getOtherAlbumIds('u1')
    expect(ids).toEqual(['a', 'c'])
  })

  it('doc assente o permesso negato -> []', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => false, data: () => ({}) })
    expect(await getOtherAlbumIds('u1')).toEqual([])
    getDoc.mockRejectedValueOnce(new Error('permission-denied'))
    expect(await getOtherAlbumIds('u1')).toEqual([])
  })
})

describe('getOtherAlbum', () => {
  it('ritorna states/counts', async () => {
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ states: { '1': 'have' }, counts: { '2': 3 } }),
    })
    const d = await getOtherAlbum('u1', 'calciatori-25-26')
    expect(d).toEqual({ states: { '1': 'have' }, counts: { '2': 3 } })
  })

  it('assente o negato -> null', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => false, data: () => ({}) })
    expect(await getOtherAlbum('u1', 'x')).toBeNull()
    getDoc.mockRejectedValueOnce(new Error('permission-denied'))
    expect(await getOtherAlbum('u1', 'x')).toBeNull()
  })
})
