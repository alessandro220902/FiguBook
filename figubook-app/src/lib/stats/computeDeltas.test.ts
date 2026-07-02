import { describe, it, expect } from 'vitest'
import { computeDeltas, type StatSnapshot } from './computeDeltas'

const snap = (date: string, have: number, doubles: number, missing: number): StatSnapshot =>
  ({ date, have, doubles, missing, total: 100 })

describe('computeDeltas', () => {
  it('storico vuoto → tutti null', () => {
    expect(computeDeltas([], '2026-07-02')).toEqual({
      haveDelta: null, doublesDelta: null, missingDelta: null,
    })
  })

  it('un solo punto → tutti null (niente base)', () => {
    expect(computeDeltas([snap('2026-07-02', 10, 2, 90)], '2026-07-02')).toEqual({
      haveDelta: null, doublesDelta: null, missingDelta: null,
    })
  })

  it('due punti a 3 giorni → delta = oggi - base', () => {
    const list = [snap('2026-07-02', 20, 5, 80), snap('2026-06-29', 14, 3, 86)]
    expect(computeDeltas(list, '2026-07-02')).toEqual({
      haveDelta: 6, doublesDelta: 2, missingDelta: -6,
    })
  })

  it('usa la base più vecchia entro 7 giorni, ignora quelle oltre', () => {
    const list = [
      snap('2026-07-02', 30, 8, 70),
      snap('2026-06-28', 22, 5, 78),
      snap('2026-06-20', 10, 1, 90),
    ]
    expect(computeDeltas(list, '2026-07-02')).toEqual({
      haveDelta: 8, doublesDelta: 3, missingDelta: -8,
    })
  })

  it('solo snapshot oltre 7 giorni → null (nessuna base valida)', () => {
    const list = [snap('2026-07-02', 30, 8, 70), snap('2026-06-20', 10, 1, 90)]
    expect(computeDeltas(list, '2026-07-02')).toEqual({
      haveDelta: null, doublesDelta: null, missingDelta: null,
    })
  })
})
