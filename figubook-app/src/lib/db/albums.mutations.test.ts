import { describe, it, expect, vi, beforeEach } from 'vitest'

const { setDoc, deleteDoc, arrayUnion, arrayRemove, doc } = vi.hoisted(() => ({
  setDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  arrayUnion: vi.fn((...v: string[]) => ({ __union: v })),
  arrayRemove: vi.fn((...v: string[]) => ({ __remove: v })),
  doc: vi.fn((...path: unknown[]) => ({ path })),
}))

vi.mock('firebase/firestore', () => ({
  doc, onSnapshot: vi.fn(), setDoc, deleteDoc, arrayUnion, arrayRemove,
  deleteField: () => '__DELETE__',
}))
vi.mock('@/lib/firebase', () => ({ db: {} }))

import { addAlbum, removeAlbum, archiveAlbum, unarchiveAlbum, markAlbumOpened } from './albums'

beforeEach(() => { vi.clearAllMocks() })

describe('addAlbum', () => {
  it('arrayUnion id su ids (merge)', async () => {
    await addAlbum('u1', 'calciatori-25-26')
    expect(arrayUnion).toHaveBeenCalledWith('calciatori-25-26')
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(), { ids: { __union: ['calciatori-25-26'] } }, { merge: true },
    )
  })
})

describe('archiveAlbum / unarchiveAlbum', () => {
  it('archive: arrayUnion su archived', async () => {
    await archiveAlbum('u1', 'x')
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(), { archived: { __union: ['x'] } }, { merge: true },
    )
  })
  it('unarchive: arrayRemove su archived', async () => {
    await unarchiveAlbum('u1', 'x')
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(), { archived: { __remove: ['x'] } }, { merge: true },
    )
  })
})

describe('markAlbumOpened', () => {
  it('arrayUnion id su opened (merge)', async () => {
    await markAlbumOpened('u1', 'calciatori-25-26')
    expect(arrayUnion).toHaveBeenCalledWith('calciatori-25-26')
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(), { opened: { __union: ['calciatori-25-26'] } }, { merge: true },
    )
  })
})

describe('removeAlbum', () => {
  it('rimuove da ids+archived e poi deleteDoc del doc dati (wipe)', async () => {
    await removeAlbum('u1', 'x')
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(),
      { ids: { __remove: ['x'] }, archived: { __remove: ['x'] } },
      { merge: true },
    )
    expect(deleteDoc).toHaveBeenCalledTimes(1)
    expect(setDoc.mock.invocationCallOrder[0]).toBeLessThan(deleteDoc.mock.invocationCallOrder[0])
  })
})
