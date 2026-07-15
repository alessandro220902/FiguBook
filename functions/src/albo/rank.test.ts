import { describe, it, expect } from 'vitest'
import { rankByAxis, type ScoreRow } from './rank.js'

const rows: ScoreRow[] = [
  { uid: 'a', totale: 10, collezionista: 4, scambista: 6 },
  { uid: 'b', totale: 30, collezionista: 30, scambista: 0 },
  { uid: 'c', totale: 20, collezionista: 5, scambista: 15 },
] as ScoreRow[]

describe('rankByAxis', () => {
  it('ordina desc per totale e assegna rank 1-based', () => {
    const r = rankByAxis(rows, 'totale', 10)
    expect(r.map((x) => x.uid)).toEqual(['b', 'c', 'a'])
    expect(r.map((x) => x.rank)).toEqual([1, 2, 3])
  })
  it('ordina per asse scambista', () => {
    const r = rankByAxis(rows, 'scambista', 10)
    expect(r.map((x) => x.uid)).toEqual(['c', 'a', 'b'])
  })
  it('taglia a limit', () => {
    expect(rankByAxis(rows, 'totale', 2).length).toBe(2)
  })
})
