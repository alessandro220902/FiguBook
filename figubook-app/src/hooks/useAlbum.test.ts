import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'

const flushMock = vi.fn().mockResolvedValue(undefined)
let snapCb: ((d: { states: Record<string, string>; counts: Record<string, number> }) => void) | null = null
vi.mock('@/lib/db/albums', async (orig) => ({
  ...(await orig<typeof import('@/lib/db/albums')>()),
  subscribeAlbum: (_u: string, _a: string, cb: typeof snapCb) => { snapCb = cb; return () => {} },
  flushAlbumCounts: (...a: unknown[]) => flushMock(...a),
}))
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }))
import { useAlbum } from './useAlbum'

beforeEach(() => { flushMock.mockClear(); vi.useFakeTimers() })

describe('useAlbum', () => {
  it('increment ottimistico aggiorna subito il count', () => {
    const { result } = renderHook(() => useAlbum('mondiali-2022'))
    act(() => snapCb!({ states: {}, counts: {} }))
    act(() => result.current.increment('QAT1'))
    expect(result.current.countOf('QAT1')).toBe(1)
    act(() => result.current.increment('QAT1'))
    expect(result.current.countOf('QAT1')).toBe(2)
  })

  it('decrement non scende sotto 0', () => {
    const { result } = renderHook(() => useAlbum('mondiali-2022'))
    act(() => snapCb!({ states: {}, counts: {} }))
    act(() => result.current.decrement('QAT1'))
    expect(result.current.countOf('QAT1')).toBe(0)
  })

  it('flush batch dopo debounce con tutti i delta', async () => {
    const { result } = renderHook(() => useAlbum('mondiali-2022'))
    act(() => snapCb!({ states: {}, counts: {} }))
    act(() => { result.current.increment('QAT1'); result.current.increment('QAT2') })
    await act(async () => { vi.advanceTimersByTime(900) })
    expect(flushMock).toHaveBeenCalledTimes(1)
    expect(flushMock).toHaveBeenCalledWith('u1', 'mondiali-2022', { QAT1: 1, QAT2: 1 })
  })
})
