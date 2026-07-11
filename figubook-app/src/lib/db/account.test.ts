import { describe, expect, it } from 'vitest'
import { usernameMatches } from './account'

describe('usernameMatches', () => {
  it('combacia ignorando maiuscole e spazi', () => {
    expect(usernameMatches('  Mario ', 'mario')).toBe(true)
    expect(usernameMatches('MARIO', 'mario')).toBe(true)
  })
  it('non combacia se diverso o vuoto', () => {
    expect(usernameMatches('luigi', 'mario')).toBe(false)
    expect(usernameMatches('', 'mario')).toBe(false)
  })
})
