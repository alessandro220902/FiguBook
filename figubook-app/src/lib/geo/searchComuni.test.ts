import { describe, it, expect } from 'vitest'
import { searchComuni, isValidComune } from './searchComuni'

describe('searchComuni', () => {
  it('trova per prefisso, case-insensitive', () => {
    const r = searchComuni('rom', 8)
    expect(r.some((c) => c.label === 'Roma (RM)')).toBe(true)
  })
  it('i match per prefisso vengono prima dei contains', () => {
    const r = searchComuni('mila', 8)
    expect(r[0].label.toLowerCase().startsWith('mila')).toBe(true)
  })
  it('rispetta il cap max', () => {
    expect(searchComuni('a', 5).length).toBeLessThanOrEqual(5)
  })
  it('query vuota => nessun risultato', () => {
    expect(searchComuni('  ', 8)).toEqual([])
  })
})

describe('isValidComune', () => {
  it('true sul valore canonico', () => {
    expect(isValidComune('Roma (RM)')).toBe(true)
  })
  it('false su testo libero o vuoto', () => {
    expect(isValidComune('roma')).toBe(false)
    expect(isValidComune('Xyzville')).toBe(false)
    expect(isValidComune('')).toBe(false)
  })
})
