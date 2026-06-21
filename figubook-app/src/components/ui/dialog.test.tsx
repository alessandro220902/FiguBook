import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './dialog'

describe('Modal', () => {
  it('mostra il contenuto quando open', () => {
    render(<Modal open onOpenChange={() => {}}><p>ciao</p></Modal>)
    expect(screen.getByText('ciao')).toBeInTheDocument()
  })
  it('non monta il contenuto quando chiuso', () => {
    render(<Modal open={false} onOpenChange={() => {}}><p>ciao</p></Modal>)
    expect(screen.queryByText('ciao')).toBeNull()
  })
  it('ESC chiama onOpenChange(false, ...)', async () => {
    const onOpenChange = vi.fn()
    render(<Modal open onOpenChange={onOpenChange}><p>ciao</p></Modal>)
    await userEvent.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalled()
    expect(onOpenChange.mock.calls[0][0]).toBe(false)
  })
})
