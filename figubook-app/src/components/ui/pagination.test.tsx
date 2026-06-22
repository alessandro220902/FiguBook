import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from './pagination'

describe('Pagination', () => {
  it('rende un bottone per pagina + prev/next', () => {
    render(<Pagination page={1} totalPages={3} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Pagina 1' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Pagina 3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Precedente' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Successiva' })).not.toBeDisabled()
  })
  it('disabilita Successiva sull ultima pagina', () => {
    render(<Pagination page={3} totalPages={3} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Successiva' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Precedente' })).not.toBeDisabled()
  })
  it('click su numero chiama onChange con quella pagina', async () => {
    const onChange = vi.fn()
    render(<Pagination page={1} totalPages={3} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Pagina 2' }))
    expect(onChange).toHaveBeenCalledWith(2)
  })
  it('non rende nulla con una sola pagina', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onChange={() => {}} />)
    expect(container.firstChild).toBeNull()
  })
})
