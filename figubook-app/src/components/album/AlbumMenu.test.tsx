import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AlbumMenu } from './AlbumMenu'

const cbs = () => ({ onArchive: vi.fn(), onUnarchive: vi.fn(), onDelete: vi.fn() })

describe('AlbumMenu', () => {
  it('non archiviato: voce Archivia (no conferma) + Elimina', async () => {
    const c = cbs()
    render(<AlbumMenu title="X" archived={false} {...c} />)
    await userEvent.click(screen.getByLabelText('Azioni album'))
    await userEvent.click(await screen.findByText('Archivia'))
    expect(c.onArchive).toHaveBeenCalled()
  })
  it('archiviato: Ripristina apre conferma, conferma chiama onUnarchive', async () => {
    const c = cbs()
    render(<AlbumMenu title="X" archived {...c} />)
    await userEvent.click(screen.getByLabelText('Azioni album'))
    await userEvent.click(await screen.findByText('Ripristina'))
    await userEvent.click(await screen.findByRole('button', { name: 'Ripristina' }))
    expect(c.onUnarchive).toHaveBeenCalled()
  })
  it('Elimina apre conferma distruttiva, conferma chiama onDelete', async () => {
    const c = cbs()
    render(<AlbumMenu title="X" archived={false} {...c} />)
    await userEvent.click(screen.getByLabelText('Azioni album'))
    await userEvent.click(await screen.findByText('Elimina'))
    await userEvent.click(await screen.findByRole('button', { name: 'Elimina' }))
    expect(c.onDelete).toHaveBeenCalled()
  })
})
