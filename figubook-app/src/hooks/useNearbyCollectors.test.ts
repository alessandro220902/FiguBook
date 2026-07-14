import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useNearbyCollectors } from './useNearbyCollectors'

vi.mock('@/lib/functions/nearby', () => ({ fetchNearbyUids: vi.fn() }))
vi.mock('@/lib/db/publicProfiles', () => ({ getPublicByUid: vi.fn() }))

import { fetchNearbyUids } from '@/lib/functions/nearby'
import { getPublicByUid } from '@/lib/db/publicProfiles'

const prof = (uid: string) => ({ uid, username: uid, avatarId: 0 }) as any

beforeEach(() => {
  vi.mocked(getPublicByUid).mockImplementation(async (uid: string) => prof(uid))
})

describe('useNearbyCollectors', () => {
  it('carica il primo batch al mount', async () => {
    vi.mocked(fetchNearbyUids).mockResolvedValueOnce({ uids: ['a', 'b'], hasMore: false })
    const { result } = renderHook(() => useNearbyCollectors())
    await waitFor(() => expect(result.current.people).toHaveLength(2))
    expect(result.current.people.map((p) => p.uid)).toEqual(['a', 'b'])
    expect(result.current.hasMore).toBe(false)
  })

  it('loadMore passa i seenUids come exclude e appende senza duplicati', async () => {
    vi.mocked(fetchNearbyUids)
      .mockResolvedValueOnce({ uids: ['a', 'b'], hasMore: true })
      .mockResolvedValueOnce({ uids: ['b', 'c'], hasMore: false })
    const { result } = renderHook(() => useNearbyCollectors())
    await waitFor(() => expect(result.current.people).toHaveLength(2))

    act(() => { result.current.loadMore() })
    await waitFor(() => expect(result.current.hasMore).toBe(false))

    expect(vi.mocked(fetchNearbyUids).mock.calls[1][0]).toEqual(['a', 'b'])
    expect(result.current.people.map((p) => p.uid)).toEqual(['a', 'b', 'c'])
  })

  it('loadMore è no-op quando hasMore è false', async () => {
    vi.mocked(fetchNearbyUids).mockResolvedValueOnce({ uids: ['a'], hasMore: false })
    const { result } = renderHook(() => useNearbyCollectors())
    await waitFor(() => expect(result.current.people).toHaveLength(1))

    act(() => { result.current.loadMore() })
    expect(vi.mocked(fetchNearbyUids)).toHaveBeenCalledTimes(1)
  })
})
