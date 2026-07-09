import { describe, it, expect } from 'vitest'
import { kitGradient, kitPattern, ownedInkIsDark } from './color'
import type { TeamKit } from './teamKits'

const solid: TeamKit = { c1: '#0a3a8b', c2: '#1a1a1a', pattern: 'solid' }
const stripes: TeamKit = { c1: '#111111', c2: '#f4f4f4', pattern: 'stripes' }
const light: TeamKit = { c1: '#fcc500', c2: '#f4f4f4', pattern: 'solid' }

describe('color engine da kit', () => {
  it('kitGradient solid = gradiente 150deg tra i due colori', () => {
    expect(kitGradient(solid)).toBe('linear-gradient(150deg, #0a3a8b, #1a1a1a)')
  })
  it('kitGradient halves = split netto', () => {
    expect(kitGradient({ ...solid, pattern: 'halves' })).toBe('linear-gradient(105deg, #0a3a8b 0 50%, #1a1a1a 50% 100%)')
  })
  it('kitPattern solid = undefined', () => {
    expect(kitPattern(solid)).toBeUndefined()
  })
  it('kitPattern stripes = stringa non vuota', () => {
    const p = kitPattern(stripes)
    expect(typeof p).toBe('string')
    expect(p).toContain('repeating-linear-gradient')
  })
  it('ownedInkIsDark true su kit chiaro, false su kit scuro', () => {
    expect(ownedInkIsDark(light)).toBe(true)
    expect(ownedInkIsDark(solid)).toBe(false)
  })
})
