import type { Team } from '@/lib/teams'

// Helper visuali per la squadra del cuore (file separato: teams.ts è generato).
// Base + percentuali di mix vengono dai token --team-mix-* (theme-aware):
// scuri di default, chiari/pastello nello scope .home-light. Fallback scuri se
// i token mancano (es. superfici fuori dallo scope app).

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
  const base = 'var(--team-mix-base, #0a120e)'
  const p = 'var(--team-mix-page, 42%)'
  const top = `color-mix(in srgb, ${t.c1} ${p}, ${base})`
  const bot = `color-mix(in srgb, ${t.c2} ${p}, ${base})`
  return `linear-gradient(to bottom, ${top} 0%, transparent 34%, transparent 64%, ${bot} 100%)`
}

// Sfondo card identità: gradiente c1->c2 miscelato con la base del tema (pieno
// colore squadra su scuro; pastello leggibile su chiaro).
export function teamCardBg(t: Team): string {
  const base = 'var(--team-mix-base, #0a120e)'
  const a = `color-mix(in srgb, ${t.c1} var(--team-mix-strong, 60%), ${base})`
  const b = `color-mix(in srgb, ${t.c2} var(--team-mix-soft, 48%), ${base})`
  return `linear-gradient(160deg, ${a}, ${b})`
}
