import { describe, it, expect } from 'vitest'
import { inBucket, LIBRARY_FILTERS } from './libraryFilters'

describe('inBucket', () => {
  it('in-corso: non archiviato e pct < 100 (incluso 0%)', () => {
    expect(inBucket('in-corso', { pct: 0, archived: false })).toBe(true)
    expect(inBucket('in-corso', { pct: 62, archived: false })).toBe(true)
    expect(inBucket('in-corso', { pct: 100, archived: false })).toBe(false)
    expect(inBucket('in-corso', { pct: 50, archived: true })).toBe(false)
  })
  it('tutti: tutti i non archiviati', () => {
    expect(inBucket('tutti', { pct: 0, archived: false })).toBe(true)
    expect(inBucket('tutti', { pct: 100, archived: false })).toBe(true)
    expect(inBucket('tutti', { pct: 50, archived: true })).toBe(false)
  })
  it('completati: pct === 100 e non archiviato', () => {
    expect(inBucket('completati', { pct: 100, archived: false })).toBe(true)
    expect(inBucket('completati', { pct: 99, archived: false })).toBe(false)
    expect(inBucket('completati', { pct: 100, archived: true })).toBe(false)
  })
  it('archivio: solo archiviati', () => {
    expect(inBucket('archivio', { pct: 100, archived: true })).toBe(true)
    expect(inBucket('archivio', { pct: 0, archived: false })).toBe(false)
  })
  it('ordine e default', () => {
    expect(LIBRARY_FILTERS.map((f) => f.key)).toEqual(['in-corso', 'tutti', 'completati', 'archivio'])
    expect(LIBRARY_FILTERS[0].key).toBe('in-corso')
  })
})
