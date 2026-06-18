// Catalogo album condiviso — fonte unica per nome/editore/totale di ogni album.
// Portato da figubook-db.js (window.ALBUM_CATALOG) a modulo TS tipizzato (fix B13).
// NB: solo il catalogo, NON le SECTIONS/figurine (quelle arrivano in A2.2).
export interface AlbumCatalogEntry {
  id: string
  title: string
  editor: string
  season: string
  total: number
  href: string
  missingParam: string
  storageKey: string
  tags: string[]
  c1: string
  c2: string
}

export const ALBUM_CATALOG: AlbumCatalogEntry[] = [
  { id: 'calciatori-25-26', title: 'Calciatori 2025/26', editor: 'Panini', season: '2025/26', total: 784, href: 'figubook-calciatori-2526.html', missingParam: '2526', storageKey: 'figubook-calciatori-2526-v1', tags: ['panini', '2526'], c1: '#1b6fb8', c2: '#0a3d2e' },
  { id: 'calciatori-24-25', title: 'Calciatori 2024/25', editor: 'Panini', season: '2024/25', total: 886, href: 'figubook-calciatori-2425.html', missingParam: '2425', storageKey: 'figubook-calciatori-2425-v1', tags: ['panini', '2425'], c1: '#f2c200', c2: '#1a1a1a' },
  { id: 'calciatori-23-24', title: 'Calciatori 2023/24', editor: 'Panini', season: '2023/24', total: 816, href: 'figubook-calciatori-2324.html', missingParam: '2324', storageKey: 'figubook-calciatori-2324-v1', tags: ['panini'], c1: '#1f7a4d', c2: '#c8d400' },
  { id: 'calciatori-22-23', title: 'Calciatori 2022/23', editor: 'Panini', season: '2022/23', total: 739, href: 'figubook-calciatori-2223.html', missingParam: '2223', storageKey: 'figubook-calciatori-2223-v1', tags: ['panini'], c1: '#2e8b57', c2: '#d4451f' },
  { id: 'mondiali-2026', title: 'FIFA World Cup 2026', editor: 'Panini', season: '2026', total: 992, href: 'figubook-fwc2026.html', missingParam: 'fwc2026', storageKey: 'figubook-fwc2026-v1', tags: ['panini', '2526'], c1: '#d4451f', c2: '#1b6fb8' },
  { id: 'mondiali-2022', title: 'FIFA World Cup 2022', editor: 'Panini', season: '2022', total: 670, href: 'figubook-fwc2022.html', missingParam: 'fwc2022', storageKey: 'figubook-mondiali-2022-v1', tags: ['panini'], c1: '#7a1538', c2: '#c9a227' },
  { id: 'calb-25-26', title: 'Calciatori Serie B 2025/26', editor: 'Panini', season: '2025/26', total: 440, href: 'figubook-serieb-2526.html', missingParam: 'serieb', storageKey: 'figubook-serieb-2526-v1', tags: ['panini', '2526'], c1: '#1f8a4d', c2: '#4a5560' },
  { id: 'adrenalyn-25-26', title: 'Adrenalyn XL 2025/26', editor: 'Panini', season: '2025/26', total: 728, href: 'figubook-adrenalyn-2526.html', missingParam: 'adrenalyn2526', storageKey: 'figubook-adrenalyn-2526-v1', tags: ['panini', '2526'], c1: '#6db82e', c2: '#1a1a1a' },
  { id: 'match-attax-ucl', title: 'Match Attax UCL 25/26', editor: 'Topps', season: '2025/26', total: 584, href: 'figubook-matchattax-2526.html', missingParam: 'matchattax2526', storageKey: 'figubook-matchattax-ucl-2526-v1', tags: ['topps', '2526'], c1: '#2a1b6c', c2: '#c0297a' },
]

export const albumById: Record<string, AlbumCatalogEntry> = Object.fromEntries(
  ALBUM_CATALOG.map((a) => [a.id, a]),
)
