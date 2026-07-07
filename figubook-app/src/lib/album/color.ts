import type { CSSProperties } from 'react'

// CSS custom properties per il motore colore dinamico per-sezione.
export function sectionVars(c1: string, c2: string): CSSProperties {
  return { ['--t1' as string]: c1, ['--t2' as string]: c2 } as CSSProperties
}
// gradiente identità della sezione
export function sectionGradient(c1: string, c2: string): string {
  return `linear-gradient(150deg, ${c1}, ${c2})`
}

// Luminanza percepita di un hex (0-255). Serve a scegliere il colore del testo
// sulle tile possedute: su gradienti chiari (giallo/bianco) il testo bianco non
// avrebbe contrasto AA -> testo scuro; su gradienti scuri -> testo bianco.
function lum(hex: string): number {
  const c = hex.replace('#', '')
  if (c.length < 6) return 128
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b
}

// true se il gradiente sezione è chiaro -> usa inchiostro scuro sul testo.
export function ownedInkIsDark(c1: string, c2: string): boolean {
  return (lum(c1) + lum(c2)) / 2 >= 150
}
