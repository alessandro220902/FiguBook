import { describe, it, expect } from 'vitest'
import { applyTradeToAlbum } from './applyTradeToAlbum'

describe('applyTradeToAlbum', () => {
  it('receive: +1 sui conteggi correnti', () => {
    const states = { '5': 'have' }
    const counts = {}
    const out = applyTradeToAlbum(states, counts, { give: [], receive: ['5', '9'] })
    expect(out['5']).toBe(2)
    expect(out['9']).toBe(1)
  })
  it('give: -1 con floor a 0', () => {
    const states = { '5': 'double', '9': 'have' }
    const counts = { '5': 3 }
    const out = applyTradeToAlbum(states, counts, { give: ['5', '9'], receive: [] })
    expect(out['5']).toBe(2)
    expect(out['9']).toBe(0)
  })
  it('stesso codice in give e receive si compensa', () => {
    const states = { '7': 'have' }
    const out = applyTradeToAlbum(states, {}, { give: ['7'], receive: ['7'] })
    expect(out['7']).toBe(1)
  })
})
