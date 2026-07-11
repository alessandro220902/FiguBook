import { describe, expect, it } from 'vitest'
import { isValidCap } from './profile'

describe('isValidCap', () => {
  it('accetta 5 cifre', () => {
    expect(isValidCap('00184')).toBe(true)
  })
  it('accetta stringa vuota (CAP opzionale)', () => {
    expect(isValidCap('')).toBe(true)
    expect(isValidCap('   ')).toBe(true)
  })
  it('rifiuta lunghezze o caratteri errati', () => {
    expect(isValidCap('123')).toBe(false)
    expect(isValidCap('123456')).toBe(false)
    expect(isValidCap('abcde')).toBe(false)
  })
})
