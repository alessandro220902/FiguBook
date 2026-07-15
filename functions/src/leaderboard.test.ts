import { describe, it, expect } from 'vitest'
import { seasonOf, monthStartMs, scopeQueryField } from './leaderboard.js'

describe('seasonOf / monthStartMs', () => {
  it('season = YYYY-MM in UTC', () => {
    expect(seasonOf(Date.UTC(2026, 6, 15))).toBe('2026-07')
  })
  it('monthStartMs = primo istante del mese UTC', () => {
    expect(monthStartMs(Date.UTC(2026, 6, 15, 12))).toBe(Date.UTC(2026, 6, 1))
  })
})

describe('scopeQueryField', () => {
  it('mappa scope a campo scores', () => {
    expect(scopeQueryField('citta')).toBe('citta')
    expect(scopeQueryField('squadra')).toBe('favTeam')
    expect(scopeQueryField('nazionale')).toBeNull()
    expect(scopeQueryField('amici')).toBeNull()
  })
})
