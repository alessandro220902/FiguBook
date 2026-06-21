import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LibraryFilters } from './LibraryFilters'

const counts = { 'in-corso': 4, tutti: 6, completati: 2, archivio: 1 }

describe('LibraryFilters', () => {
  it('mostra le 4 pill in ordine con conteggi (no "Appena usciti")', () => {
    render(<LibraryFilters active="in-corso" counts={counts} onChange={() => {}} onNew={() => {}} />)
    const labels = screen.getAllByRole('button').map((b) => b.textContent)
    expect(labels.join(' ')).toContain('In corso')
    expect(labels.join(' ')).toContain('Archivio')
    expect(labels.join(' ')).not.toContain('Appena usciti')
  })
  it('click pill chiama onChange con la key', async () => {
    const onChange = vi.fn()
    render(<LibraryFilters active="in-corso" counts={counts} onChange={onChange} onNew={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /Completati/ }))
    expect(onChange).toHaveBeenCalledWith('completati')
  })
  it('bottone Nuovo album chiama onNew', async () => {
    const onNew = vi.fn()
    render(<LibraryFilters active="in-corso" counts={counts} onChange={() => {}} onNew={onNew} />)
    await userEvent.click(screen.getByRole('button', { name: /Nuovo album/ }))
    expect(onNew).toHaveBeenCalled()
  })
})
