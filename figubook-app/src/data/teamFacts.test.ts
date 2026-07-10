import { describe, it, expect } from 'vitest'
import { factsForTeam, TEAM_FACTS } from './teamFacts'

describe('factsForTeam', () => {
  it('oggetto vuoto per id assente', () => {
    expect(factsForTeam('zzz-ignoto')).toEqual({})
  })
  it('ritorna i fatti se presenti', () => {
    TEAM_FACTS['inter'] = { city: 'Milano', founded: 1908, stadium: 'San Siro', nickname: 'Nerazzurri' }
    expect(factsForTeam('inter').city).toBe('Milano')
    expect(factsForTeam('inter').founded).toBe(1908)
  })
})
