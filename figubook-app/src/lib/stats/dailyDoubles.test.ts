import { describe, expect, it } from 'vitest'
import { dailyDoublesSeries } from './dailyDoubles'
import type { StatSnapshot } from './computeDeltas'

const snap = (
  date: string,
  have: number,
  doubles: number,
  albums?: StatSnapshot['albums'],
  albumsStart?: StatSnapshot['albumsStart'],
): StatSnapshot => ({ date, have, doubles, missing: 0, total: 0, albums, albumsStart })

describe('dailyDoublesSeries', () => {
  it('aggregato day-over-day + perAlbum = corrente - inizio giornata', () => {
    const snaps: StatSnapshot[] = [
      snap('2025-12-19', 10, 2),
      snap(
        '2025-12-20', 27, 5,
        { 'calciatori-25-26': { have: 25, doubles: 4 }, 'mondiali-2026': { have: 2, doubles: 1 } },
        { 'calciatori-25-26': { have: 10, doubles: 2 } }, // inizio giornata
      ),
    ]
    const day = dailyDoublesSeries(snaps, '2025-12-20').at(-1)!
    expect(day.nuove).toBe(17) // 27 - 10 (aggregato vs ieri)
    expect(day.doppie).toBe(3)
    // perAlbum vs inizio giornata:
    expect(day.perAlbum['calciatori-25-26']).toEqual({ nuove: 15, doppie: 2 })
    expect(day.perAlbum['mondiali-2026']).toEqual({ nuove: 2, doppie: 1 }) // assente a inizio = base 0
  })
  it('senza albumsStart, perAlbum resta vuoto', () => {
    const day = dailyDoublesSeries([snap('2025-12-20', 5, 0, { 'x': { have: 5, doubles: 0 } })], '2025-12-20').at(-1)!
    expect(day.perAlbum).toEqual({})
  })
  it('giorno senza snapshot = zeri', () => {
    const out = dailyDoublesSeries([snap('2025-12-20', 5, 0)], '2025-12-20')
    expect(out[0].nuove).toBe(0)
    expect(out[0].perAlbum).toEqual({})
  })
  it('delta negativi clampati a 0', () => {
    const snaps = [snap('2025-12-19', 30, 9), snap('2025-12-20', 20, 4)]
    const day = dailyDoublesSeries(snaps, '2025-12-20').at(-1)!
    expect(day.nuove).toBe(0)
    expect(day.doppie).toBe(0)
  })
})
