import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NewAlbumDialog } from './NewAlbumDialog'

describe('NewAlbumDialog', () => {
  it('elenca solo gli album NON posseduti', () => {
    render(<NewAlbumDialog open ownedIds={['calciatori-25-26']} onOpenChange={() => {}} onAdd={() => {}} />)
    expect(screen.queryByText('Calciatori 2025/26')).toBeNull()
    expect(screen.getByText('Calciatori 2024/25')).toBeInTheDocument()
  })
  it('click su un album chiama onAdd con id', async () => {
    const onAdd = vi.fn()
    render(<NewAlbumDialog open ownedIds={[]} onOpenChange={() => {}} onAdd={onAdd} />)
    await userEvent.click(screen.getByText('Calciatori 2024/25'))
    expect(onAdd).toHaveBeenCalledWith('calciatori-24-25')
  })
  it('tutti posseduti: stato vuoto', () => {
    const all = ['calciatori-25-26','calciatori-24-25','calciatori-23-24','calciatori-22-23','mondiali-2026','mondiali-2022','calb-25-26','adrenalyn-25-26','match-attax-ucl']
    render(<NewAlbumDialog open ownedIds={all} onOpenChange={() => {}} onAdd={() => {}} />)
    expect(screen.getByText(/Hai già tutti gli album/i)).toBeInTheDocument()
  })
})
