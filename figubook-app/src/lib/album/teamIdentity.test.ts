import { describe, it, expect } from 'vitest'
import { TEAMS } from '@/lib/teams'
import { slugTeam, canonicalTeamId, hasTeamPage, teamDisplayName } from './teamIdentity'

const sec = (name: string) => ({ id: 'x', name, short: name, group: '', kind: 'team', codes: [], c1: '#000', c2: '#fff' })

describe('slugTeam', () => {
  it('invariante: slug del nome === id per ogni TEAMS', () => {
    for (const t of TEAMS) expect(slugTeam(t.name)).toBe(t.id)
  })
})
describe('canonicalTeamId', () => {
  it('slug del nome', () => {
    expect(canonicalTeamId(sec('Messico'))).toBe('messico')
    expect(canonicalTeamId(sec('Inter'))).toBe('inter')
  })
  it('unifica varianti via ALIAS', () => {
    expect(canonicalTeamId(sec('FC Internazionale Milano'))).toBe('inter')
  })
})
describe('hasTeamPage', () => {
  it('true per squadra reale, false per id ignoto', () => {
    expect(hasTeamPage('inter')).toBe(true)
    expect(hasTeamPage('intro')).toBe(false)
  })
})
describe('teamDisplayName', () => {
  it('nome da TEAMS, fallback all id', () => {
    expect(teamDisplayName('inter')).toBe('Inter')
    expect(teamDisplayName('zzz-ignoto')).toBe('zzz-ignoto')
  })
})
