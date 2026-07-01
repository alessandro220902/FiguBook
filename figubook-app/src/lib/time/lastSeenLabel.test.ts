import { describe, it, expect } from 'vitest'
import { lastSeenLabel } from './lastSeenLabel'

const NOW = new Date('2026-07-01T12:00:00Z').getTime()
const day = 86_400_000

describe('lastSeenLabel', () => {
  it('vuoto se timestamp mancante o 0', () => {
    expect(lastSeenLabel(undefined, NOW)).toBe('')
    expect(lastSeenLabel(0, NOW)).toBe('')
  })
  it('oggi se < 24h', () => {
    expect(lastSeenLabel(NOW - 2 * 3_600_000, NOW)).toBe('Attivo oggi')
  })
  it('ieri se 24-48h', () => {
    expect(lastSeenLabel(NOW - 30 * 3_600_000, NOW)).toBe('Attivo ieri')
  })
  it('N giorni fa se < 7g', () => {
    expect(lastSeenLabel(NOW - 3 * day, NOW)).toBe('Attivo 3 giorni fa')
  })
  it('data gg/mm oltre 7 giorni', () => {
    expect(lastSeenLabel(NOW - 20 * day, NOW)).toMatch(/^Attivo il \d\d\/\d\d$/)
  })
})
