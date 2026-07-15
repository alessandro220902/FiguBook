import { describe, it, expect } from 'vitest'
import { tradesFromProposals, albumsFromDocs, baselineHaveOf } from './collect.js'

describe('tradesFromProposals', () => {
  it('tiene solo completed dove uid è participant, mappa partner+at', () => {
    const docs = [
      { participants: ['me', 'x'], status: 'completed', updatedAt: 5 },
      { participants: ['me', 'y'], status: 'pending', updatedAt: 6 },
      { participants: ['a', 'b'], status: 'completed', updatedAt: 7 },
    ]
    const t = tradesFromProposals(docs as any, 'me')
    expect(t).toEqual([{ partner: 'x', at: 5 }])
  })
})

describe('albumsFromDocs', () => {
  it('conta have dallo schema states e prende total dal catalogo', () => {
    const docs = [{ id: 'calb-25-26', states: { '1': 'have', '2': 'double', '3': 'have' }, counts: {} }]
    const a = albumsFromDocs(docs as any, () => 440, () => 0)
    expect(a[0].have).toBe(3)
    expect(a[0].total).toBe(440)
  })
})

describe('baselineHaveOf', () => {
  it('prende gli have dallo snapshot più vecchio del mese', () => {
    const docs = [
      { id: '2026-06-30', albums: { a: { have: 5 } } },
      { id: '2026-07-03', albums: { a: { have: 20 }, b: { have: 4 } } },
      { id: '2026-07-10', albums: { a: { have: 40 } } },
    ]
    expect(baselineHaveOf(docs as any, '2026-07-01')).toEqual({ a: 20, b: 4 })
  })
  it('nessuno snapshot nel mese => mappa vuota', () => {
    expect(baselineHaveOf([{ id: '2026-06-30', albums: { a: { have: 5 } } }] as any, '2026-07-01')).toEqual({})
  })
})
