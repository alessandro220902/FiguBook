import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateAlbumMenu } from './CreateAlbumMenu'

describe('CreateAlbumMenu', () => {
  it('apre il pannello e mostra solo gli album NON posseduti', async () => {
    render(<CreateAlbumMenu ownedIds={['calciatori-25-26']} onAdd={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /Nuovo album/ }))
    expect(screen.queryByText('Calciatori 2025/26')).toBeNull()
    expect(screen.getByText('Calciatori 2024/25')).toBeInTheDocument()
  })

  it('filtro editore restringe il catalogo (Topps → solo Match Attax)', async () => {
    render(<CreateAlbumMenu ownedIds={[]} onAdd={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /Nuovo album/ }))
    await userEvent.click(screen.getByRole('button', { name: /Tutti gli editori/ }))
    await userEvent.click(screen.getByRole('option', { name: 'Topps' }))
    expect(screen.getByText('Match Attax UCL 25/26')).toBeInTheDocument()
    expect(screen.queryByText('Calciatori 2024/25')).toBeNull()
  })

  it('filtro anno usa anno d\'inizio: 2024 → Calciatori 2024/25, non 2025/26', async () => {
    render(<CreateAlbumMenu ownedIds={[]} onAdd={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /Nuovo album/ }))
    await userEvent.click(screen.getByRole('button', { name: /Tutti gli anni/ }))
    await userEvent.click(screen.getByRole('option', { name: '2024' }))
    expect(screen.getByText('Calciatori 2024/25')).toBeInTheDocument()
    expect(screen.queryByText('Calciatori 2025/26')).toBeNull()
  })

  it('la ricerca filtra per nome', async () => {
    render(<CreateAlbumMenu ownedIds={[]} onAdd={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /Nuovo album/ }))
    await userEvent.type(screen.getByRole('textbox', { name: /Cerca album/ }), 'adrenalyn')
    expect(screen.getByText('Adrenalyn XL 2025/26')).toBeInTheDocument()
    expect(screen.queryByText('Calciatori 2024/25')).toBeNull()
  })

  it('click su un album chiama onAdd con id', async () => {
    const onAdd = vi.fn()
    render(<CreateAlbumMenu ownedIds={[]} onAdd={onAdd} />)
    await userEvent.click(screen.getByRole('button', { name: /Nuovo album/ }))
    await userEvent.click(screen.getByText('Calciatori 2024/25'))
    expect(onAdd).toHaveBeenCalledWith('calciatori-24-25')
  })

  it('tutti posseduti: stato vuoto', async () => {
    const all = ['calciatori-25-26','calciatori-24-25','calciatori-23-24','calciatori-22-23','mondiali-2026','mondiali-2022','calb-25-26','adrenalyn-25-26','match-attax-ucl']
    render(<CreateAlbumMenu ownedIds={all} onAdd={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /Nuovo album/ }))
    expect(screen.getByText(/Hai già tutti gli album/i)).toBeInTheDocument()
  })
})
