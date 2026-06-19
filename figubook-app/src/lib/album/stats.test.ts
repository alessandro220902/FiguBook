import { describe, it, expect } from 'vitest'
import { counterOf, countToFields, sectionStats } from './stats'

describe('counterOf', () => {
  it('mancante=0, have=1, double=counts||2', () => {
    expect(counterOf('A', {}, {})).toBe(0)
    expect(counterOf('A', { A: 'have' }, {})).toBe(1)
    expect(counterOf('A', { A: 'double' }, {})).toBe(2)
    expect(counterOf('A', { A: 'double' }, { A: 4 })).toBe(4)
  })
})

describe('countToFields', () => {
  it('0 => rimuove state+count', () => {
    expect(countToFields(0)).toEqual({ state: null, count: null })
  })
  it('1 => have, no count', () => {
    expect(countToFields(1)).toEqual({ state: 'have', count: null })
  })
  it('3 => double, count 3', () => {
    expect(countToFields(3)).toEqual({ state: 'double', count: 3 })
  })
  it('negativo => clamp 0', () => {
    expect(countToFields(-2)).toEqual({ state: null, count: null })
  })
})

describe('sectionStats', () => {
  it('conta have/missing/doppie sui codici sezione', () => {
    const codes = ['A', 'B', 'C', 'D']
    const states = { A: 'have', B: 'double', C: 'double' }
    const counts = { B: 2, C: 4 }
    // B count 2 => 1 doppia, C count 4 => 3 doppie => 4 doppie totali
    expect(sectionStats(states, counts, codes)).toEqual({
      have: 3, missing: 1, doubles: 4, total: 4, pct: 75,
    })
  })
})
