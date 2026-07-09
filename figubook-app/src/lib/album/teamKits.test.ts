import { describe, it, expect } from 'vitest'
import { KITS, kitFromColors, kitForSection, PATTERNS } from './teamKits'
import type { Section } from '@/data/albums/types'

const HEX = /^#[0-9a-fA-F]{6}$/

function section(partial: Partial<Section>): Section {
  return { id: 'x', name: 'X', short: 'X', group: 'G', kind: 'team', codes: ['1'], c1: '#0a3a8b', c2: '#1a1a1a', ...partial }
}

describe('teamKits', () => {
  it('ogni kit ha colori hex validi e pattern ammesso', () => {
    for (const [id, kit] of Object.entries(KITS)) {
      expect(kit.c1, id).toMatch(HEX)
      expect(kit.c2, id).toMatch(HEX)
      if (kit.accent) expect(kit.accent, id).toMatch(HEX)
      expect(PATTERNS, id).toContain(kit.pattern)
    }
  })
  it('kitFromColors deriva un kit solid dai due colori', () => {
    expect(kitFromColors('#111111', '#eeeeee')).toEqual({ c1: '#111111', c2: '#eeeeee', pattern: 'solid' })
  })
  it('kitForSection usa il kit curato quando esiste', () => {
    expect(kitForSection(section({ id: 'juventus' }))).toBe(KITS['juventus'])
  })
  it('kitForSection fa fallback ai c1/c2 della sezione quando il kit manca', () => {
    expect(kitForSection(section({ id: 'sezione-ignota', c1: '#123456', c2: '#654321' }))).toEqual({ c1: '#123456', c2: '#654321', pattern: 'solid' })
  })
})
