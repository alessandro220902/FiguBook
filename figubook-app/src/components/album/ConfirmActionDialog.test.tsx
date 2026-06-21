import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmActionDialog } from './ConfirmActionDialog'

const base = {
  open: true,
  title: 'Eliminare «X»?',
  body: 'Operazione irreversibile.',
  confirmLabel: 'Elimina',
  destructive: true,
  onOpenChange: () => {},
}

describe('ConfirmActionDialog', () => {
  it('mostra titolo, corpo e label conferma', () => {
    render(<ConfirmActionDialog {...base} onConfirm={() => {}} />)
    expect(screen.getByText('Eliminare «X»?')).toBeInTheDocument()
    expect(screen.getByText('Operazione irreversibile.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Elimina' })).toBeInTheDocument()
  })
  it('Conferma chiama onConfirm', async () => {
    const onConfirm = vi.fn()
    render(<ConfirmActionDialog {...base} onConfirm={onConfirm} />)
    await userEvent.click(screen.getByRole('button', { name: 'Elimina' }))
    expect(onConfirm).toHaveBeenCalled()
  })
  it('Annulla chiama onOpenChange(false), non onConfirm', async () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()
    render(<ConfirmActionDialog {...base} onOpenChange={onOpenChange} onConfirm={onConfirm} />)
    await userEvent.click(screen.getByRole('button', { name: 'Annulla' }))
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
