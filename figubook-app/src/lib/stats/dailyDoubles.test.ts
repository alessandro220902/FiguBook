import { describe, expect, it } from 'vitest'
import { dailyDoublesSeries } from './dailyDoubles'
import type { StatSnapshot } from './computeDeltas'

const snap = (date: string, have: number, doubles: number, albums?: StatSnapshot['albums']): StatSnapshot => ({
  date, have, doubles, missing: 0, total: 0, albums,
})

describe('dailyDoublesSeries', () => {
  it('serie 7 giorni: delta nuove/doppie e per album', () => {
    const snaps: StatSnapshot[] = [
      snap('2025-12-19', 10, 2, { 'calciatori-25-26': { have: 10, doubles: 2 } }),
      snap('2025-12-20', 27, 5, { 'calciatori-25-26': { have: 25, doubles: 4 }, 'mondiali-2026': { have: 2, doubles: 1 } }),
    ]
    const out = dailyDoublesSeries(snaps, '2025-12-20')
    expect(out).toHaveLength(7)
    const day = out[out.length - 1]
    expect(day.date).toBe('2025-12-20')
    expect(day.nuove).toBe(17)
    expect(day.doppie).toBe(3)
    expect(day.perAlbum['calciatori-25-26']).toEqual({ nuove: 15, doppie: 2 })
    expect(day.perAlbum['mondiali-2026']).toEqual({ nuove: 2, doppie: 1 })
  })
  it('giorno senza snapshot = zeri, nessun perAlbum', () => {
    const out = dailyDoublesSeries([snap('2025-12-20', 5, 0)], '2025-12-20')
    const empty = out[0]
    expect(empty.nuove).toBe(0)
    expect(empty.doppie).toBe(0)
    expect(empty.perAlbum).toEqual({})
  })
  it('senza baseline per-album nel giorno prima, perAlbum resta vuoto', () => {
    const snaps: StatSnapshot[] = [
      snap('2025-12-19', 10, 2), // niente albums (giorno pre-logging)
      snap('2025-12-20', 27, 5, { 'calciatori-25-26': { have: 25, doubles: 4 } }),
    ]
    const day = dailyDoublesSeries(snaps, '2025-12-20').at(-1)!
    expect(day.nuove).toBe(17)
    expect(day.perAlbum).toEqual({})
  })
  it('delta negativi (rimozioni) clampati a 0', () => {
    const snaps = [snap('2025-12-19', 30, 9), snap('2025-12-20', 20, 4)]
    const day = dailyDoublesSeries(snaps, '2025-12-20').at(-1)!
    expect(day.nuove).toBe(0)
    expect(day.doppie).toBe(0)
  })
})
