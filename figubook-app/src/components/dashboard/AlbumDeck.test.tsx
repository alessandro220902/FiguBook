import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AlbumDeck } from './AlbumDeck'
import type { PerAlbumStats } from '@/lib/db/albums'

function mk(id: string, title: string, missing: number): PerAlbumStats {
  return {
    id, pct: 60, have: 545, total: 886, missing, doubles: 205,
    entry: { id, title, editor: 'Panini', season: '24/25', c1: '#1b6fb8', c2: '#0a3d2e' },
  } as unknown as PerAlbumStats
}

function Loc() {
  const l = useLocation()
  return <div data-testid="loc">{l.pathname}</div>
}

function setup(albums: PerAlbumStats[]) {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <AlbumDeck albums={albums} />
      <Routes>
        <Route path="*" element={<Loc />} />
      </Routes>
    </MemoryRouter>,
  )
}

// ordine: sort per missing asc => [a(10), b(20), c(30)]
const albums = [mk('a', 'Alpha', 10), mk('b', 'Beta', 20), mk('c', 'Gamma', 30)]

describe('AlbumDeck', () => {
  it('colonna nomi: un chip per album; copertina mostra %, frazione e doppie', () => {
    setup(albums)
    expect(screen.getByRole('button', { name: 'Alpha' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Beta' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gamma' })).toBeInTheDocument()
    expect(screen.getAllByText('60%').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/545/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/886/).length).toBeGreaterThan(0)
  })

  it('tap sulla copertina attiva apre /album/:id', async () => {
    setup(albums)
    await userEvent.click(screen.getByRole('button', { name: /Apri Alpha/ }))
    expect(screen.getByTestId('loc')).toHaveTextContent('/album/a')
  })

  it('tap su nome cambia attivo senza navigare', async () => {
    setup(albums)
    await userEvent.click(screen.getByRole('button', { name: 'Gamma' }))
    expect(screen.getByTestId('loc')).toHaveTextContent('/dashboard')
    // Gamma ora attiva: la sua copertina è quella apribile
    expect(screen.getByRole('button', { name: /Apri Gamma/ })).toBeInTheDocument()
  })

  it('tap su copertina laterale la centra senza navigare', async () => {
    setup(albums)
    await userEvent.click(screen.getByRole('button', { name: /Vai a Beta/ }))
    expect(screen.getByTestId('loc')).toHaveTextContent('/dashboard')
  })

  it('bottone pausa alterna label', async () => {
    setup(albums)
    const btn = screen.getByRole('button', { name: 'Pausa' })
    await userEvent.click(btn)
    expect(screen.getByRole('button', { name: 'Riprendi' })).toBeInTheDocument()
  })
})
