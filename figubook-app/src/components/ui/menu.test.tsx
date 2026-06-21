import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MenuRoot, MenuTrigger, MenuContent, MenuItem } from './menu'

function Harness({ onPick }: { onPick: () => void }) {
  return (
    <MenuRoot>
      <MenuTrigger aria-label="Azioni">⋮</MenuTrigger>
      <MenuContent>
        <MenuItem onClick={onPick}>Archivia</MenuItem>
        <MenuItem destructive onClick={() => {}}>Elimina</MenuItem>
      </MenuContent>
    </MenuRoot>
  )
}

describe('Menu', () => {
  it('apre al click sul trigger e mostra le voci', async () => {
    render(<Harness onPick={() => {}} />)
    await userEvent.click(screen.getByLabelText('Azioni'))
    expect(await screen.findByText('Archivia')).toBeInTheDocument()
    expect(screen.getByText('Elimina')).toBeInTheDocument()
  })
  it('click su una voce esegue onClick', async () => {
    const onPick = vi.fn()
    render(<Harness onPick={onPick} />)
    await userEvent.click(screen.getByLabelText('Azioni'))
    await userEvent.click(await screen.findByText('Archivia'))
    expect(onPick).toHaveBeenCalled()
  })
})
