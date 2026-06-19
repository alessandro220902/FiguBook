import type { AlbumData } from './types'

// import dinamico per non caricare gli 8 dataset insieme.
// NB: mondiali-2026 escluso — la sorgente album-data-fwc2026.js ha un bug di
// sintassi (apostrofo non escaped); va corretta a monte prima di poterla portare.
const loaders: Record<string, () => Promise<{ default: AlbumData }>> = {
  'calciatori-22-23': () => import('./calciatori-22-23'),
  'calciatori-23-24': () => import('./calciatori-23-24'),
  'calciatori-24-25': () => import('./calciatori-24-25'),
  'mondiali-2022': () => import('./mondiali-2022'),
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
