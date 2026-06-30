import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

// vi.hoisted ensures these are initialised before vi.mock hoisting runs.
const { addAlbum, removeAlbum, archiveAlbum, unarchiveAlbum } = vi.hoisted(() => ({
  addAlbum: vi.fn(() => Promise.resolve()),
  removeAlbum: vi.fn(() => Promise.resolve()),
  archiveAlbum: vi.fn(() => Promise.resolve()),
  unarchiveAlbum: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/lib/db/albums', () => ({ addAlbum, removeAlbum, archiveAlbum, unarchiveAlbum }))
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }))

const entry = (id: string, title: string) => ({ id, title, editor: 'Panini', season: '2024/25', c1: '#111', c2: '#222' })
let mockData: { albums: unknown[]; archived: string[]; loading: boolean; error: boolean }
vi.mock('@/hooks/useCollection', () => ({ useCollection: () => mockData }))

import AlbumList from './AlbumList'

const stats = (over: Partial<{ pct: number; have: number; missing: number }> = {}) => ({ have: 1, doubles: 0, missing: 1, total: 2, pct: 50, ...over })

beforeEach(() => {
  vi.clearAllMocks()
  mockData = {
    albums: [
      { id: 'a-progress', entry: entry('a-progress', 'In Corso A'), ...stats({ pct: 50 }) },
      { id: 'a-done', entry: entry('a-done', 'Completo B'), ...stats({ pct: 100, have: 2, missing: 0 }) },
      { id: 'a-arch', entry: entry('a-arch', 'Archiviato C'), ...stats({ pct: 30 }) },
    ],
    archived: ['a-arch'],
    loading: false,
    error: false,
  }
})

function setup() {
  return render(<MemoryRouter><AlbumList /></MemoryRouter>)
}

describe('AlbumList', () => {
  it('default In corso: mostra in-progress (non completati, non archiviati)', () => {
    setup()
    expect(screen.getByText('In Corso A')).toBeInTheDocument()
    expect(screen.queryByText('Completo B')).toBeNull()
    expect(screen.queryByText('Archiviato C')).toBeNull()
  })
  it('filtro Archivio mostra solo archiviati', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: /Archivio/ }))
    expect(screen.getByText('Archiviato C')).toBeInTheDocument()
    expect(screen.queryByText('In Corso A')).toBeNull()
  })
  it('elimina: menu -> Elimina -> conferma chiama removeAlbum(uid,id)', async () => {
    setup()
    await userEvent.click(screen.getByLabelText('Azioni album'))
    await userEvent.click(await screen.findByText('Elimina'))
    await userEvent.click(await screen.findByRole('button', { name: 'Elimina' }))
    expect(removeAlbum).toHaveBeenCalledWith('u1', 'a-progress')
  })
})
