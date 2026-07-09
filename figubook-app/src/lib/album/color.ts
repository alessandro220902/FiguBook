import type { CSSProperties } from 'react'
import type { TeamKit } from './teamKits'

export function sectionVars(c1: string, c2: string): CSSProperties {
  return { ['--t1' as string]: c1, ['--t2' as string]: c2 } as CSSProperties
}
export function sectionGradient(c1: string, c2: string): string {
  return `linear-gradient(150deg, ${c1}, ${c2})`
}

const NEAR_WHITE = 224

// Inchiostro chiaro/scuro usati sul testo delle figurine possedute.
export const DARK_INK = '#14110a'
export const LIGHT_INK = '#ffffff'

// ---- utility colore (parse, mix, luminanza, contrasto WCAG) ----

interface Rgb { r: number; g: number; b: number }

function rgb(hex: string): Rgb {
  const c = hex.replace('#', '')
  return {
    r: parseInt(c.slice(0, 2), 16),
    g: parseInt(c.slice(2, 4), 16),
    b: parseInt(c.slice(4, 6), 16),
  }
}

// Luminanza percepita rapida (0-255) — usata per le scelte di gradiente.
function lum(hex: string): number {
  const c = hex.replace('#', '')
  if (c.length < 6) return 128
  const { r, g, b } = rgb(hex)
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function toHex(n: number): string {
  return Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0')
}

// Mix lineare di due hex (t=0 -> a, t=1 -> b).
function mixHex(a: string, b: string, t: number): string {
  const A = rgb(a)
  const B = rgb(b)
  return `#${toHex(A.r + (B.r - A.r) * t)}${toHex(A.g + (B.g - A.g) * t)}${toHex(A.b + (B.b - A.b) * t)}`
}

// Colore c2 "effettivo": il secondo colore quasi bianco viene rimappato a
// un'ombra profonda del primario (coerente con kitGradient).
function effectiveC2(kit: TeamKit): string {
  return lum(kit.c2) >= NEAR_WHITE && lum(kit.c1) < NEAR_WHITE
    ? mixHex(kit.c1, '#000000', 0.42)
    : kit.c2
}

// Luminanza relativa WCAG (0-1).
function relLum(hex: string): number {
  const { r, g, b } = rgb(hex)
  const lin = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

// Rapporto di contrasto WCAG tra due colori (1..21).
export function contrastRatio(a: string, b: string): number {
  const l1 = relLum(a)
  const l2 = relLum(b)
  const hi = Math.max(l1, l2)
  const lo = Math.min(l1, l2)
  return (hi + 0.05) / (lo + 0.05)
}

// ---- gradiente ----

export function kitGradient(kit: TeamKit): string {
  const { c1 } = kit
  const c2 = lum(kit.c2) >= NEAR_WHITE && lum(c1) < NEAR_WHITE
    ? `color-mix(in oklab, ${c1} 58%, black 42%)`
    : kit.c2
  // Profondità tonale (no piatto). oklab -> sfumature pulite. Lift in alto per
  // luminosità del kit: scuri -> velo bianco (sheen); chiari -> scurisco.
  const light = lum(c1) >= 150
  const top = light
    ? `color-mix(in oklab, ${c1} 86%, black 14%)`
    : `color-mix(in oklab, ${c1} 82%, white 18%)`
  const deep = `color-mix(in oklab, ${c2} 76%, black 24%)`
  if (kit.pattern === 'halves') {
    // Due colori squadra con banda di fusione morbida (niente stacco netto).
    return `linear-gradient(105deg in oklab, ${c1} 0 38%, ${c2} 62% 100%)`
  }
  // Più corpo di colore (c1 fino al 30%, c2 dal 76%) -> sfondo più pieno.
  return `linear-gradient(150deg in oklab, ${top} 0%, ${c1} 30%, ${c2} 76%, ${deep} 100%)`
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

// ---- scelta inchiostro + lastra ----

// Il testo delle figurine è display bold + nome 15px bold + drop-shadow -> "testo
// grande" WCAG, soglia AA 3:1. La lastra scatta solo sotto questa.
const AA = 3

export interface KitInk {
  isDark: boolean       // true -> inchiostro scuro (DARK_INK), false -> chiaro (LIGHT_INK)
  needsPlate: boolean   // true -> serve una lastra dietro il testo per garantire AA
}

// Sceglie l'inchiostro col miglior contrasto WCAG reale sui colori effettivi del
// gradiente (c1, c2 effettivo, e il loro punto medio dove sta il testo). Se
// nemmeno il migliore raggiunge 4.5:1 nel punto peggiore, segnala la lastra.
// Colori reali del gradiente dove sta il testo (c1, c2 effettivo, punto medio).
export function kitInkSamples(kit: TeamKit): string[] {
  const c2 = effectiveC2(kit)
  return [kit.c1, c2, mixHex(kit.c1, c2, 0.5)]
}

export function inkForKit(kit: TeamKit): KitInk {
  const samples = kitInkSamples(kit)
  const minWith = (ink: string) => Math.min(...samples.map((s) => contrastRatio(ink, s)))
  const dark = minWith(DARK_INK)
  const lightC = minWith(LIGHT_INK)
  const isDark = dark >= lightC
  const best = Math.max(dark, lightC)
  return { isDark, needsPlate: best < AA }
}

// Retrocompatibilità: alcune viste chiamano ancora ownedInkIsDark.
export function ownedInkIsDark(kit: TeamKit): boolean {
  return inkForKit(kit).isDark
}
