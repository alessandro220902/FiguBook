import { describe, it, expect } from 'vitest'
import { KITS, kitFromColors, kitForSection, PATTERNS, hasCuratedKit } from './teamKits'
import type { Section, AlbumData } from '@/data/albums/types'
import calciatori2526 from '@/data/albums/calciatori-25-26'
import calciatori2223 from '@/data/albums/calciatori-22-23'
import calciatori2324 from '@/data/albums/calciatori-23-24'
import calciatori2425 from '@/data/albums/calciatori-24-25'
import mondiali2022 from '@/data/albums/mondiali-2022'
import mondiali2026 from '@/data/albums/mondiali-2026'
import calb2526 from '@/data/albums/calb-25-26'
import adrenalyn2526 from '@/data/albums/adrenalyn-25-26'
import matchAttaxUcl from '@/data/albums/match-attax-ucl'

const ALBUMS: AlbumData[] = [
  calciatori2526,
  calciatori2223,
  calciatori2324,
  calciatori2425,
  mondiali2022,
  mondiali2026,
  calb2526,
  adrenalyn2526,
  matchAttaxUcl,
]

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
  it('ogni squadra di ogni album ha un kit curato', () => {
    const uncovered: string[] = []
    for (const a of ALBUMS)
      for (const s of a.sections)
        if (s.kind === 'team' && !hasCuratedKit(s.id)) uncovered.push(s.id)
    expect(uncovered, `senza kit: ${[...new Set(uncovered)].join(', ')}`).toHaveLength(0)
  })
})
