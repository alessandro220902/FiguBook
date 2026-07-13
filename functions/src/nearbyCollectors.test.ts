import { describe, it, expect } from 'vitest'
import { rankCandidates } from './nearbyCollectors.js'

type C = { uid: string; cap?: string; provincia?: string; favTeam?: string; isPublic: boolean }

const me = { uid: 'me', cap: '20100', provincia: 'MI', favTeam: 'inter' }

describe('rankCandidates', () => {
  it('ordina CAP prima di provincia prima di squadra', () => {
    const cands: C[] = [
      { uid: 'team', favTeam: 'inter', provincia: 'RM', cap: '00100', isPublic: true },
      { uid: 'prov', favTeam: 'milan', provincia: 'MI', cap: '20200', isPublic: true },
      { uid: 'cap', favTeam: 'milan', provincia: 'MI', cap: '20100', isPublic: true },
    ]
    const r = rankCandidates(me, cands, ['friendUid'], ['blockedUid'], 6)
    expect(r).toEqual(['cap', 'prov', 'team'])
  })
  it('esclude me, amici, bloccati e privati', () => {
    const cands: C[] = [
      { uid: 'me', cap: '20100', isPublic: true },
      { uid: 'friendUid', cap: '20100', isPublic: true },
      { uid: 'blockedUid', cap: '20100', isPublic: true },
      { uid: 'priv', cap: '20100', isPublic: false },
      { uid: 'ok', cap: '20100', isPublic: true },
    ]
    const r = rankCandidates(me, cands, ['friendUid'], ['blockedUid'], 6)
    expect(r).toEqual(['ok'])
  })
  it('rispetta il limite', () => {
    const cands: C[] = Array.from({ length: 10 }, (_, i) => ({
      uid: 'u' + i, favTeam: 'inter', isPublic: true,
    }))
    expect(rankCandidates(me, cands, [], [], 6)).toHaveLength(6)
  })
  it('nessun tier disponibile → vuoto', () => {
    const cands: C[] = [{ uid: 'x', favTeam: 'juve', provincia: 'TO', cap: '10100', isPublic: true }]
    expect(rankCandidates(me, cands, [], [], 6)).toEqual([])
  })
})
