import { describe, it, expect } from 'vitest'
import { searchCatalog, type SearchCard } from './search'
import type { AlbumCatalogEntry } from '@/data/albumCatalog'

const album = (over: Partial<AlbumCatalogEntry>): AlbumCatalogEntry => ({
  id: 'a', title: 'Calciatori 2025/26', editor: 'Panini', season: '2025/26',
  total: 1, href: '', missingParam: '', storageKey: '', tags: ['panini'],
  c1: '#000', c2: '#111', ...over,
})
const card = (over: Partial<SearchCard>): SearchCard => ({
  albumId: 'a', albumTitle: 'A', code: '1', name: '', sectionName: 'S',
  c1: '#000', c2: '#111', ...over,
})

const albums = [
  album({ id: 'cal', title: 'Calciatori 2025/26', tags: ['panini', '2526'] }),
  album({ id: 'mwc', title: 'FIFA World Cup 2022', editor: 'Panini', tags: ['panini'] }),
]
const cards = [
  card({ albumId: 'cal', code: '60', name: 'Rossi' }),
  card({ albumId: 'mwc', code: '60', name: 'Messi' }),
  card({ albumId: 'cal', code: '12', name: 'Rossini' }),
]

describe('searchCatalog', () => {
  it('query vuota -> niente', () => {
    expect(searchCatalog(albums, cards, '  ')).toEqual({ albums: [], cards: [] })
  })

  it('query numerica -> tutte le carte con quel numero, cross-album, niente album', () => {
    const r = searchCatalog(albums, cards, '60')
    expect(r.albums).toEqual([])
    expect(r.cards.map((c) => c.albumId)).toEqual(['cal', 'mwc'])
  })

  it('numero esatto, non prefisso (12 non matcha 120)', () => {
    const r = searchCatalog(albums, [...cards, card({ code: '120' })], '12')
    expect(r.cards.every((c) => c.code === '12')).toBe(true)
  })

  it('testo -> album per titolo (case-insensitive)', () => {
    const r = searchCatalog(albums, cards, 'world')
    expect(r.albums.map((a) => a.id)).toEqual(['mwc'])
  })

  it('testo -> carte per nome', () => {
    const r = searchCatalog(albums, cards, 'rossi')
    expect(r.cards.map((c) => c.name)).toEqual(['Rossi', 'Rossini'])
  })

  it('rispetta il limite', () => {
    const many = Array.from({ length: 20 }, (_, i) => card({ code: '7', name: `n${i}` }))
    expect(searchCatalog(albums, many, '7', 5).cards).toHaveLength(5)
  })
})
