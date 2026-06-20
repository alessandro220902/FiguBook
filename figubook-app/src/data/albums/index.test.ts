import { describe, it, expect } from 'vitest'
import { ALBUM_CATALOG } from '@/data/albumCatalog'
import { hasAlbumData } from './index'

describe('album data loaders', () => {
  // Invariante anti-regressione: se un album è nel catalogo (quindi apribile dalla
  // dashboard via /album/:id) DEVE avere un loader dati, altrimenti Album.tsx mostra
  // "Dati album non disponibili" e sembra che il tasto Apri non funzioni.
  it('ogni album del catalogo ha un loader dati', () => {
    const senzaDati = ALBUM_CATALOG.filter((a) => !hasAlbumData(a.id)).map((a) => a.id)
    expect(senzaDati).toEqual([])
  })
})
