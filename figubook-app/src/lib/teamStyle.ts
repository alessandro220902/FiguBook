import type { Team } from '@/lib/teams'

// Helper visuali per la squadra del cuore (file separato: teams.ts è generato).
// Base scura del sito (per miscelare gli sfondi e tenerli leggibili).
const DARK = '#0a120e'

function lum(hex: string): number {
  const c = hex.replace('#', '')
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b
}

// Accento VIVACE leggibile su scuro: il più chiaro tra c1/c2; se entrambi
// scurissimi ripiega su bianco sporco. Per ring avatar / stemma / linee.
export function teamAccent(t: Team): string {
  const a = lum(t.c1) >= lum(t.c2) ? t.c1 : t.c2
  return lum(a) < 70 ? '#e8ece0' : a
}

// Sfondo pagina: c1 in alto -> trasparente in mezzo (resta il verde del sito)
// -> c2 in basso. Colori miscelati verso lo scuro = tinti ma leggibili.
export function teamPageBg(t: Team): string {
  const top = `color-mix(in srgb, ${t.c1} 42%, ${DARK})`
  const bot = `color-mix(in srgb, ${t.c2} 42%, ${DARK})`
  return `linear-gradient(to bottom, ${top} 0%, transparent 34%, transparent 64%, ${bot} 100%)`
}

// Sfondo card identità: gradiente c1->c2 miscelato scuro (pieno colore squadra).
export function teamCardBg(t: Team): string {
  const a = `color-mix(in srgb, ${t.c1} 60%, ${DARK})`
  const b = `color-mix(in srgb, ${t.c2} 48%, ${DARK})`
  return `linear-gradient(160deg, ${a}, ${b})`
}
