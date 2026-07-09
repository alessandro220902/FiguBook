import type { CSSProperties } from 'react'
import type { TeamKit } from './teamKits'

export function sectionVars(c1: string, c2: string): CSSProperties {
  return { ['--t1' as string]: c1, ['--t2' as string]: c2 } as CSSProperties
}
export function sectionGradient(c1: string, c2: string): string {
  return `linear-gradient(150deg, ${c1}, ${c2})`
}

export function kitGradient(kit: TeamKit): string {
  const { c1, c2 } = kit
  // Profondità tonale: sollevo l'angolo alto e approfondisco il basso, così il
  // gradiente ha modellazione di luce invece di sembrare piatto/sbiadito.
  // Interpolazione in oklab -> sfumature pulite, niente zona grigia a metà.
  const lift = `color-mix(in oklab, ${c1} 82%, white 18%)`
  const deep = `color-mix(in oklab, ${c2} 80%, black 20%)`
  if (kit.pattern === 'halves') {
    // Due colori squadra ma con banda di fusione morbida (niente stacco netto).
    return `linear-gradient(105deg in oklab, ${c1} 0 38%, ${c2} 62% 100%)`
  }
  return `linear-gradient(150deg in oklab, ${lift} 0%, ${c1} 34%, ${c2} 80%, ${deep} 100%)`
}

export function kitPattern(kit: TeamKit): string | undefined {
  const stripe = kit.accent ?? kit.c2
  const line = `color-mix(in srgb, ${stripe} 26%, transparent)`
  switch (kit.pattern) {
    case 'stripes':
      return `repeating-linear-gradient(90deg, ${line} 0 7px, transparent 7px 15px)`
    case 'hoops':
      return `repeating-linear-gradient(0deg, ${line} 0 7px, transparent 7px 15px)`
    case 'sash':
      // Banda diagonale con bordi sfumati -> niente taglio netto.
      return `linear-gradient(115deg, transparent 38%, ${line} 47% 53%, transparent 62%)`
    default:
      return undefined
  }
}

function lum(hex: string): number {
  const c = hex.replace('#', '')
  if (c.length < 6) return 128
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b
}

export function ownedInkIsDark(kit: TeamKit): boolean {
  return (lum(kit.c1) + lum(kit.c2)) / 2 >= 150
}
