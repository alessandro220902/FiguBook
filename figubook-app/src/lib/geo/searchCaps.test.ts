import { describe, expect, it } from 'vitest'
import { searchCaps, isKnownCap } from './searchCaps'

describe('searchCaps', () => {
  it('trova per prefisso di CAP con il comune di riferimento', () => {
    const hits = searchCaps('35031', 5)
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0].cap).toBe('35031')
    expect(hits[0].nome).toBe('Abano Terme')
    expect(hits[0].comune).toContain('(PD)')
  })
  it('tutti i risultati iniziano col prefisso, rispettando max', () => {
    const hits = searchCaps('00', 5)
    expect(hits.length).toBeLessThanOrEqual(5)
    expect(hits.every((h) => h.cap.startsWith('00'))).toBe(true)
  })
  it('query vuota = lista iniziale (primi max)', () => {
    expect(searchCaps('', 5)).toHaveLength(5)
    expect(searchCaps('   ', 5)).toHaveLength(5)
  })
})

describe('isKnownCap', () => {
  it('true per un CAP presente, false altrimenti', () => {
    expect(isKnownCap('35031')).toBe(true)
    expect(isKnownCap('99999')).toBe(false)
  })
})
