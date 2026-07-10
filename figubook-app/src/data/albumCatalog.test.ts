import { describe, it, expect } from 'vitest'
import { isNewRelease, type AlbumCatalogEntry } from './albumCatalog'

const base: AlbumCatalogEntry = {
  id: 'x', title: 'X', editor: 'Panini', season: '2025/26', total: 100,
  href: '', missingParam: '', storageKey: '', tags: [], c1: '#000', c2: '#fff',
}
const now = new Date('2026-07-10T12:00:00Z')

describe('isNewRelease', () => {
  it('false senza addedAt', () => {
    expect(isNewRelease(base, now)).toBe(false)
  })
  it('true dentro la finestra 30gg', () => {
    expect(isNewRelease({ ...base, addedAt: '2026-07-01' }, now)).toBe(true)
  })
  it('false al confine esatto 30gg', () => {
    expect(isNewRelease({ ...base, addedAt: '2026-06-10' }, now)).toBe(false)
  })
  it('false oltre 30gg', () => {
    expect(isNewRelease({ ...base, addedAt: '2026-05-01' }, now)).toBe(false)
  })
  it('false per data futura', () => {
    expect(isNewRelease({ ...base, addedAt: '2026-08-01' }, now)).toBe(false)
  })
  it('false per addedAt non parsabile', () => {
    expect(isNewRelease({ ...base, addedAt: 'boh' }, now)).toBe(false)
  })
})
