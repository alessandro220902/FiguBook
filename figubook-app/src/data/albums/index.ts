import type { AlbumData } from './types'

// import dinamico per non caricare i dataset insieme.
// Una chiave per ogni id del catalogo: se manca, /album/:id mostra "Dati non
// disponibili" (vedi src/data/albums/index.test.ts che blocca la regressione).
const loaders: Record<string, () => Promise<{ default: AlbumData }>> = {
  'calciatori-25-26': () => import('./calciatori-25-26'),
  'calciatori-22-23': () => import('./calciatori-22-23'),
  'calciatori-23-24': () => import('./calciatori-23-24'),
  'calciatori-24-25': () => import('./calciatori-24-25'),
  'mondiali-2022': () => import('./mondiali-2022'),
  'mondiali-2026': () => import('./mondiali-2026'),
  'calb-25-26': () => import('./calb-25-26'),
  'adrenalyn-25-26': () => import('./adrenalyn-25-26'),
  'match-attax-ucl': () => import('./match-attax-ucl'),
}

export async function loadAlbumData(albumId: string): Promise<AlbumData | null> {
  const l = loaders[albumId]
  if (!l) return null
  return (await l()).default
}
export function hasAlbumData(albumId: string): boolean {
  return albumId in loaders
}
