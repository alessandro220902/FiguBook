import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AlbumFlatView } from './AlbumFlatView'
import type { AlbumData } from '@/data/albums/types'

// 70 codici in 2 sezioni con colori diversi -> 2 pagine (60/pagina)
const codesA = Array.from({ length: 40 }, (_, i) => `A${i + 1}`)
const codesB = Array.from({ length: 30 }, (_, i) => `B${i + 1}`)
const data = {
  names: {},
  sections: [
    { id: 'a', name: 'Sez A', group: 'G', c1: '#111111', c2: '#222222', codes: codesA },
    { id: 'b', name: 'Sez B', group: 'G', c1: '#333333', c2: '#444444', codes: codesB },
  ],
} as unknown as AlbumData

const stats = { total: 70, missing: 70, doubles: 0, have: 0 }

describe('AlbumFlatView', () => {
  it('pagina 1 mostra 60 carte, pagina 2 le restanti 10', async () => {
    render(<AlbumFlatView data={data} stats={stats} countOf={() => 0} onAdd={() => {}} onRemove={() => {}} onInfo={() => {}} />)
    expect(screen.getByRole('button', { name: /^A1\b/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^B30\b/ })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Pagina 2' }))
    expect(screen.getByRole('button', { name: /^B30\b/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^A1\b/ })).toBeNull()
  })

  it('filtro Possedute riduce alle carte con count>=1 e resetta a pagina 1', async () => {
    render(
      <AlbumFlatView
        data={data}
        stats={stats}
        countOf={(c) => (c === 'A1' ? 1 : 0)}
        onAdd={() => {}}
        onRemove={() => {}}
        onInfo={() => {}}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Possedute/ }))
    expect(screen.getByRole('button', { name: /^A1\b/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^A2\b/ })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Pagina 2' })).toBeNull()
  })
})
