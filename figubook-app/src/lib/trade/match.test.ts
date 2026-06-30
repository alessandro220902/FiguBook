import { describe, it, expect } from 'vitest'
import { deriveInventory, computeMatch } from './match'

describe('deriveInventory', () => {
  it('estrae doubles e missing da states su tutti i codici album', () => {
    const allCodes = ['1', '2', '3', '4']
    const states = { '1': 'have', '2': 'double', '3': 'double' } // 4 mai toccato
    const inv = deriveInventory(allCodes, states)
    expect(inv.doubles.sort()).toEqual(['2', '3'])
    expect(inv.missing).toEqual(['4'])
  })
})

describe('computeMatch', () => {
  it('calcola receive (sue doubles ∩ mie missing) e give (mie doubles ∩ sue missing)', () => {
    const me = { doubles: ['10', '11'], missing: ['20', '21'] }
    const them = { doubles: ['20', '99'], missing: ['10', '88'] }
    const m = computeMatch(me, them, 100)
    expect(m.receive).toEqual(['20'])
    expect(m.give).toEqual(['10'])
    expect(m.receiveCount).toBe(1)
    expect(m.giveCount).toBe(1)
    expect(m.completionPct).toBe(1)
  })

  it('reciproco falso se una direzione è vuota', () => {
    const me = { doubles: [], missing: ['20'] }
    const them = { doubles: ['20'], missing: ['77'] }
    const m = computeMatch(me, them, 50)
    expect(m.reciprocal).toBe(false)
    expect(m.receiveCount).toBe(1)
    expect(m.giveCount).toBe(0)
  })
})
