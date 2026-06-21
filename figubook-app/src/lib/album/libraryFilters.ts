export type LibraryFilter = 'in-corso' | 'tutti' | 'completati' | 'archivio'

export const LIBRARY_FILTERS: { key: LibraryFilter; label: string }[] = [
  { key: 'in-corso', label: 'In corso' },
  { key: 'tutti', label: 'Tutti' },
  { key: 'completati', label: 'Completati' },
  { key: 'archivio', label: 'Archivio' },
]

export const DEFAULT_FILTER: LibraryFilter = 'in-corso'

// Predicato puro: un album (pct + flag archiviato) appartiene al bucket?
export function inBucket(
  filter: LibraryFilter,
  album: { pct: number; archived: boolean },
): boolean {
  if (filter === 'archivio') return album.archived
  if (album.archived) return false
  if (filter === 'tutti') return true
  if (filter === 'completati') return album.pct === 100
  return album.pct < 100 // in-corso
}
