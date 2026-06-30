import type { AlbumData } from '@/data/albums/types'

// Tutti i codici figurina di un album, in ordine di sezione.
export function allCodesFromSections(data: AlbumData): string[] {
  return data.sections.flatMap((s) => s.codes)
}
