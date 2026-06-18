// Palette stat dashboard — unica fonte hex (recharts vuole stringhe, non var CSS).
// Allineata ai token --color-stat-* in index.css.
export const STAT_COLORS = {
  have: '#3fb96b',    // verde: possedute / completamento
  missing: '#ff5b5b', // rosso: mancanti
  double: '#c2f23d',  // lime: doppie
  track: 'rgba(255,255,255,0.2)', // traccia anello: bianco chiaro => completa il cerchio
} as const
