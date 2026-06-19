// Palette stat dashboard — unica fonte hex (recharts vuole stringhe, non var CSS).
// Allineata ai token --color-stat-* in index.css.
export const STAT_COLORS = {
  have: '#3fb96b',    // verde: possedute / completamento
  missing: '#ff5b5b', // rosso: mancanti
  double: '#c2f23d',  // lime: doppie
  gold: '#e6b73c',    // oro foil: SOLO completamento 100% (raro => resta speciale)
  track: 'rgba(255,255,255,0.2)', // traccia anello: bianco chiaro => completa il cerchio
} as const
