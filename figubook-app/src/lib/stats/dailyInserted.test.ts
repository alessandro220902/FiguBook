import { describe, it, expect } from 'vitest'
import { dailyInsertedSeries, bucketScale } from './dailyInserted'
import type { StatSnapshot } from './computeDeltas'

const s = (date: string, have: number): StatSnapshot => ({ date, have, doubles: 0, missing: 0, total: 100 })

describe('dailyInsertedSeries', () => {
  it('ritorna sempre 7 punti, vecchio→oggi', () => {
    const out = dailyInsertedSeries([], '2026-07-02')
    expect(out).toHaveLength(7)
    expect(out[0].date).toBe('2026-06-26')
    expect(out[6].date).toBe('2026-07-02')
    expect(out.every((p) => p.count === 0)).toBe(true)
  })

  it('primo snapshot in assoluto → count 0 (nessun precedente)', () => {
    const out = dailyInsertedSeries([s('2026-07-02', 50)], '2026-07-02')
    expect(out[6]).toEqual({ date: '2026-07-02', count: 0 })
  })

  it('due giorni consecutivi → delta sul secondo', () => {
    const out = dailyInsertedSeries([s('2026-07-01', 40), s('2026-07-02', 58)], '2026-07-02')
    expect(out[5]).toEqual({ date: '2026-07-01', count: 0 }) // primo, no prev
    expect(out[6]).toEqual({ date: '2026-07-02', count: 18 })
  })

  it('giorno saltato = 0, il salto si posa sul rientro', () => {
    // 2 lug have 40, 3 lug non apri, 4 lug have 58 → 4 lug = 18, 3 lug = 0
    const out = dailyInsertedSeries([s('2026-06-30', 30), s('2026-07-02', 40), s('2026-07-04', 58)], '2026-07-04')
    const byDate = Object.fromEntries(out.map((p) => [p.date, p.count]))
    expect(byDate['2026-07-02']).toBe(10) // 40-30
    expect(byDate['2026-07-03']).toBe(0)  // saltato
    expect(byDate['2026-07-04']).toBe(18) // 58-40
  })

  it('rimozioni (delta negativo) clampate a 0', () => {
    const out = dailyInsertedSeries([s('2026-07-01', 60), s('2026-07-02', 55)], '2026-07-02')
    expect(out[6].count).toBe(0)
  })
})

describe('bucketScale', () => {
  it('confini mappano a posizioni intere', () => {
    expect(bucketScale(0)).toBe(0)
    expect(bucketScale(5)).toBe(1)
    expect(bucketScale(10)).toBe(2)
    expect(bucketScale(20)).toBe(3)
    expect(bucketScale(50)).toBe(4)
    expect(bucketScale(100)).toBe(5)
  })

  it('cap 100+ alla posizione massima', () => {
    expect(bucketScale(999)).toBe(5)
  })

  it('interpola dentro un bucket', () => {
    // 12 tra 10(pos2) e 20(pos3): 2 + (12-10)/(20-10) = 2.2
    expect(bucketScale(12)).toBeCloseTo(2.2, 5)
  })

  it('negativi trattati come 0', () => {
    expect(bucketScale(-3)).toBe(0)
  })
})
