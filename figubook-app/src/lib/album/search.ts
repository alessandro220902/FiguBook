// Ricerca globale navbar: album + carte cross-album.
// La logica di ranking è pura (searchCatalog) e testabile; l'indice delle carte
// si costruisce on-demand caricando i 9 dataset una volta sola (buildCardIndex).
import { ALBUM_CATALOG, type AlbumCatalogEntry } from '@/data/albumCatalog'
import { loadAlbumData } from '@/data/albums'

export interface SearchCard {
  albumId: string
  albumTitle: string
  code: string
  name: string // '' se il dataset non ha nomi
  sectionName: string
  c1: string
  c2: string
}

export interface SearchResults {
  albums: AlbumCatalogEntry[]
  cards: SearchCard[]
}

const norm = (s: string) => s.toLowerCase().trim()
const isNumeric = (s: string) => /^\d+$/.test(s)

// Ranking puro: dato il catalogo + l'indice carte (anche vuoto), filtra per query.
// - query numerica ("60") -> tutte le carte con quel numero esatto, un album ciascuno.
// - query testo -> album per titolo/editore/stagione/tag + carte per nome.
export function searchCatalog(
  albums: AlbumCatalogEntry[],
  cards: SearchCard[],
  rawQuery: string,
  limit = 8,
): SearchResults {
  const q = norm(rawQuery)
  if (!q) return { albums: [], cards: [] }

  if (isNumeric(q)) {
    const exact = cards.filter((c) => c.code === q)
    return { albums: [], cards: exact.slice(0, limit) }
  }

  const albumHits = albums.filter((a) =>
    [a.title, a.editor, a.season, ...a.tags].some((f) => norm(f).includes(q)),
  )
  const cardHits = cards.filter((c) => c.name && norm(c.name).includes(q))
  return { albums: albumHits.slice(0, limit), cards: cardHits.slice(0, limit) }
}

// Indice carte cross-album: cache a livello modulo (promise condivisa) così i
// dataset si caricano una sola volta anche con più focus della search.
let cardIndexPromise: Promise<SearchCard[]> | null = null

export function buildCardIndex(): Promise<SearchCard[]> {
  if (cardIndexPromise) return cardIndexPromise
  cardIndexPromise = (async () => {
    const datasets = await Promise.all(
      ALBUM_CATALOG.map(async (a) => ({ entry: a, data: await loadAlbumData(a.id) })),
    )
    const cards: SearchCard[] = []
    for (const { entry, data } of datasets) {
      if (!data) continue
      for (const sec of data.sections) {
        for (const code of sec.codes) {
          cards.push({
            albumId: entry.id,
            albumTitle: entry.title,
            code,
            name: data.names[code] ?? '',
            sectionName: sec.name,
            c1: sec.c1,
            c2: sec.c2,
          })
        }
      }
    }
    return cards
  })()
  return cardIndexPromise
}
