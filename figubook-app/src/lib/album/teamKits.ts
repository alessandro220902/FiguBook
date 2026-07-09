import type { Section } from '@/data/albums/types'

export const PATTERNS = ['solid', 'stripes', 'halves', 'sash', 'hoops'] as const
export type KitPattern = (typeof PATTERNS)[number]

export interface TeamKit {
  c1: string
  c2: string
  accent?: string
  pattern: KitPattern
  foil?: boolean
}

// Punto di verità: chiave = section.id. Curare qui le squadre; le altre cadono sul fallback.
export const KITS: Record<string, TeamKit> = {
  juventus: { c1: '#111111', c2: '#f4f4f4', pattern: 'stripes' },
}

export function kitFromColors(c1: string, c2: string): TeamKit {
  return { c1, c2, pattern: 'solid' }
}

// Alias per lo stesso team con id diversi tra album (Fase A: pochi, estendibile).
const ALIAS: Record<string, string> = {}

export function hasCuratedKit(id: string): boolean {
  return !!(KITS[id] ?? (ALIAS[id] && KITS[ALIAS[id]]))
}

export function kitForSection(section: Section): TeamKit {
  const key = ALIAS[section.id] ?? section.id
  return KITS[key] ?? kitFromColors(section.c1, section.c2)
}
