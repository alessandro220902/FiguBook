// figubook-app/src/components/album/AlbumLanding.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AlbumLanding } from './AlbumLanding'
import type { AlbumCatalogEntry } from '@/data/albumCatalog'

const entry: AlbumCatalogEntry = {
  id: 'mondiali-2022', title: 'FIFA World Cup 2022', editor: 'Panini', season: '2022',
  total: 670, href: 'x.html', missingParam: 'fwc2022', storageKey: 'k', tags: [], c1: '#7a1538', c2: '#c9a227',
}
const stats = { have: 400, doubles: 12, missing: 270, total: 670, pct: 60 }

describe('AlbumLanding', () => {
  it('mostra titolo, percentuale e numeri statistiche', () => {
    render(<AlbumLanding entry={entry} stats={stats} />)
    expect(screen.getByRole('heading', { name: /FIFA World Cup 2022/ })).toBeInTheDocument()
    expect(screen.getAllByText('60%').length).toBeGreaterThan(0)
    expect(screen.getByText('400')).toBeInTheDocument()
    expect(screen.getByText('270')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })
})
