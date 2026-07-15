import { describe, it, expect } from 'vitest'
import { scoreCollezionista, scoreCollezionistaSeasonal, scoreScambista, computeAxes } from './scoring.js'

describe('scoreCollezionista', () => {
  it('album al 100% => 50 + 3 soglie(15) + started(2) + 0.1*total', () => {
    const s = scoreCollezionista([{ albumId: 'a', have: 100, total: 100, teamHave: 0 }])
    expect(s).toBe(77)
  })
  it('album al 30% => started + soglia25 + 0.1*have', () => {
    const s = scoreCollezionista([{ albumId: 'a', have: 30, total: 100, teamHave: 0 }])
    expect(s).toBe(10)
  })
  it('album vuoto => 0', () => {
    expect(scoreCollezionista([{ albumId: 'a', have: 0, total: 100, teamHave: 0 }])).toBe(0)
  })
  it('derby: +0.5*0.1*teamHave extra', () => {
    const s = scoreCollezionista([{ albumId: 'a', have: 50, total: 100, teamHave: 20 }])
    expect(s).toBe(18)
  })
})

describe('scoreCollezionistaSeasonal (delta dal baseline mese)', () => {
  it('nessun progresso nel mese => 0', () => {
    const s = scoreCollezionistaSeasonal([{ albumId: 'a', have: 50, total: 100, teamHave: 0, baselineHave: 50 }])
    expect(s).toBe(0)
  })
  it('album iniziato nel mese (baseline 0) => started + soglie superate nel mese + 0.1*delta', () => {
    const s = scoreCollezionistaSeasonal([{ albumId: 'a', have: 30, total: 100, teamHave: 0, baselineHave: 0 }])
    expect(s).toBe(10)
  })
  it('completato nel mese (baseline 60) => complete50 + soglia75 + 0.1*40', () => {
    const s = scoreCollezionistaSeasonal([{ albumId: 'a', have: 100, total: 100, teamHave: 0, baselineHave: 60 }])
    expect(s).toBe(59)
  })
})

describe('scoreScambista', () => {
  it('conta scambi, partner distinti, inviti, amicizie, giorni, profilo', () => {
    const s = scoreScambista({
      trades: [{ partner: 'x', at: 1 }, { partner: 'x', at: 2 }, { partner: 'y', at: 3 }],
      invites: [{ at: 1 }, { at: 2 }],
      friendshipsAt: [1, 2, 3],
      activeDays: ['2026-07-01', '2026-07-02'],
      profileComplete: true,
    })
    expect(s).toBe(71)
  })
  it('profilo incompleto non dà i 5 punti', () => {
    const s = scoreScambista({ trades: [], invites: [], friendshipsAt: [], activeDays: [], profileComplete: false })
    expect(s).toBe(0)
  })
})

describe('computeAxes', () => {
  it('totale = collezionista + scambista', () => {
    const a = computeAxes({
      albums: [{ albumId: 'a', have: 100, total: 100, teamHave: 0 }],
      trades: [], invites: [], friendshipsAt: [], activeDays: [], profileComplete: false,
    })
    expect(a.collezionista).toBe(77)
    expect(a.scambista).toBe(0)
    expect(a.totale).toBe(77)
  })
  it('sinceMs filtra gli eventi al mese', () => {
    const a = computeAxes({
      albums: [],
      trades: [{ partner: 'x', at: 100 }, { partner: 'y', at: 5000 }],
      invites: [{ at: 100 }, { at: 5000 }],
      friendshipsAt: [100, 5000],
      activeDays: ['2026-06-30', '2026-07-01'],
      profileComplete: false,
    }, 1000)
    expect(a.scambista).toBeGreaterThanOrEqual(29)
  })
})
