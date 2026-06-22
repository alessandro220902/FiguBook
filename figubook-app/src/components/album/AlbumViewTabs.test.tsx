import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AlbumViewTabs } from './AlbumViewTabs'

describe('AlbumViewTabs', () => {
  it('rende 3 tab, il terzo disabilitato', () => {
    render(<AlbumViewTabs value="sections" onChange={() => {}} />)
    expect(screen.getByRole('tab', { name: 'Vista a sezioni' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Tutte le figurine' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /in arrivo/i })).toHaveAttribute('aria-disabled', 'true')
  })
  it('click sul tab piatto chiama onChange("flat")', async () => {
    const onChange = vi.fn()
    render(<AlbumViewTabs value="sections" onChange={onChange} />)
    await userEvent.click(screen.getByRole('tab', { name: 'Tutte le figurine' }))
    expect(onChange).toHaveBeenCalledWith('flat')
  })
  it('il tab disabilitato non chiama onChange', async () => {
    const onChange = vi.fn()
    render(<AlbumViewTabs value="sections" onChange={onChange} />)
    await userEvent.click(screen.getByRole('tab', { name: /in arrivo/i }))
    expect(onChange).not.toHaveBeenCalled()
  })
})
