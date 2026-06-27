import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AlbumButton } from './Button'

describe('AlbumButton', () => {
  it('rende children e gestisce il click', async () => {
    const onClick = vi.fn()
    render(<AlbumButton onClick={onClick}>Apri</AlbumButton>)
    await userEvent.click(screen.getByRole('button', { name: 'Apri' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('primary usa bordo+testo lime, ghost usa bordo', () => {
    const { rerender } = render(<AlbumButton variant="primary">P</AlbumButton>)
    expect(screen.getByRole('button')).toHaveClass('text-lime')
    rerender(<AlbumButton variant="ghost">G</AlbumButton>)
    expect(screen.getByRole('button')).toHaveClass('border')
  })

  it('disabled non chiama onClick', async () => {
    const onClick = vi.fn()
    render(<AlbumButton disabled onClick={onClick}>X</AlbumButton>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    await userEvent.click(btn).catch(() => {})
    expect(onClick).not.toHaveBeenCalled()
  })
})
