import type { CSSProperties } from 'react'

// CSS custom properties per il motore colore dinamico per-sezione.
export function sectionVars(c1: string, c2: string): CSSProperties {
  return { ['--t1' as string]: c1, ['--t2' as string]: c2 } as CSSProperties
}
// gradiente identità della sezione
export function sectionGradient(c1: string, c2: string): string {
  return `linear-gradient(150deg, ${c1}, ${c2})`
}
