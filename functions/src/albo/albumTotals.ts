// functions/src/albo/albumTotals.ts
// Duplicato minimo dei totali catalogo (le functions non importano l'app).
// Fonte: figubook-app/src/data/albumCatalog.ts — tenere allineato.
export const ALBUM_TOTALS: Record<string, number> = {
  'calciatori-25-26': 784,
  'calciatori-24-25': 886,
  'calciatori-23-24': 816,
  'calciatori-22-23': 739,
  'mondiali-2026': 992,
  'mondiali-2022': 670,
  'calb-25-26': 440,
  'adrenalyn-25-26': 728,
  'match-attax-ucl': 584,
}
export function totalOf(albumId: string): number {
  return ALBUM_TOTALS[albumId] ?? 0
}
