import { describe, it, expect } from 'vitest'
import { aggregateTeamProgress, type AlbumForTeam } from './teamProgress'

const interSec = (codes: string[]) => ({ id: 'inter', name: 'Inter', short: 'Inter', group: '', kind: 'team', codes, c1: '#000', c2: '#fff' })
const otherSec = { id: 'milan', name: 'Milan', short: 'Milan', group: '', kind: 'team', codes: ['M1'], c1: '#000', c2: '#fff' }

describe('aggregateTeamProgress', () => {
  it('somma solo le sezioni che risolvono al team, su piu album', () => {
    const albums: AlbumForTeam[] = [
      { albumId: 'a1', albumTitle: 'Cal 25/26', sections: [interSec(['I1','I2','I3']), otherSec],
        states: { I1: 'have', I2: 'have', M1: 'have' }, counts: {} },
      { albumId: 'a2', albumTitle: 'UCL', sections: [{ ...interSec(['UI1','UI2']), name: 'FC Internazionale Milano' }],
        states: { UI1: 'have' }, counts: {} },
    ]
    const p = aggregateTeamProgress(albums, 'inter')
    expect(p.total).toBe(5)
    expect(p.have).toBe(3)
    expect(p.pct).toBe(60)
    expect(p.appearsIn.map((x) => x.albumId)).toEqual(['a1', 'a2'])
  })
  it('total 0 e lista vuota se il team non compare', () => {
    const p = aggregateTeamProgress([], 'inter')
    expect(p).toEqual({ have: 0, total: 0, pct: 0, appearsIn: [] })
  })

  it('espone la prima sezione che matcha come matchedSection', () => {
    const albums: AlbumForTeam[] = [
      { albumId: 'a1', albumTitle: 'Cal 25/26', sections: [interSec(['I1','I2']), otherSec],
        states: {}, counts: {} },
    ]
    const p = aggregateTeamProgress(albums, 'inter')
    expect(p.matchedSection?.id).toBe('inter')
  })

  it('matchedSection undefined se il team non compare', () => {
    const p = aggregateTeamProgress([], 'inter')
    expect(p.matchedSection).toBeUndefined()
  })
})
