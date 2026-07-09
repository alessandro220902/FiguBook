import { describe, it, expect } from 'vitest'
import { kitGradient, kitPattern, ownedInkIsDark, contrastRatio, inkForKit } from './color'
import type { TeamKit } from './teamKits'

const solid: TeamKit = { c1: '#0a3a8b', c2: '#1a1a1a', pattern: 'solid' }
const stripes: TeamKit = { c1: '#111111', c2: '#f4f4f4', pattern: 'stripes' }
const light: TeamKit = { c1: '#fcc500', c2: '#f4f4f4', pattern: 'solid' }

describe('color engine da kit', () => {
  it('kitGradient solid = gradiente diagonale profondo con oklab e i due colori', () => {
    const g = kitGradient(solid)
    expect(g).toContain('150deg in oklab')
    expect(g).toContain('#0a3a8b')
    expect(g).toContain('#1a1a1a')
    expect(g).toContain('white') // stop di lift in alto
    expect(g).toContain('black') // stop di profondità in basso
  })
  it('kitGradient halves = banda morbida (oklab, niente stacco netto a 50%)', () => {
    const g = kitGradient({ ...solid, pattern: 'halves' })
    expect(g).toContain('105deg in oklab')
    expect(g).toContain('#0a3a8b 0 38%')
    expect(g).toContain('#1a1a1a 62% 100%')
    expect(g).not.toContain('50%')
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
  it('contrastRatio: nero/bianco = 21, uguali = 1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
    expect(contrastRatio('#123456', '#123456')).toBeCloseTo(1, 5)
  })
  it('inkForKit sceglie chiaro sul kit scuro e scuro sul kit chiaro', () => {
    expect(inkForKit(solid).isDark).toBe(false)
    expect(inkForKit(light).isDark).toBe(true)
  })
})
