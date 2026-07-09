import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StickerCard } from './StickerCard'
import type { TeamKit } from '@/lib/album/teamKits'

const kit: TeamKit = { c1: '#8a1538', c2: '#5a0d24', pattern: 'solid' }
const base = { code: 'QAT1', name: 'Foto squadra', kit }

describe('StickerCard', () => {
  it('mancante: mostra codice, niente badge possesso', () => {
    render(<StickerCard {...base} count={0} insertOn={false} onAdd={() => {}} onRemove={() => {}} onInfo={() => {}} />)
    expect(screen.getByText('QAT1')).toBeInTheDocument()
    expect(screen.queryByTestId('owned-badge')).toBeNull()
  })
  it('doppia: badge ×(count-1)', () => {
    render(<StickerCard {...base} count={3} insertOn={false} onAdd={() => {}} onRemove={() => {}} onInfo={() => {}} />)
    expect(screen.getByTestId('dup-badge')).toHaveTextContent('×2')
  })
  it('insert ON: tap card chiama onAdd', async () => {
    const onAdd = vi.fn(); const onInfo = vi.fn()
    render(<StickerCard {...base} count={0} insertOn onAdd={onAdd} onRemove={() => {}} onInfo={onInfo} />)
    // ancora ^QAT1 per colpire solo il bottone-card (i +/- iniziano con Aggiungi/Rimuovi)
    await userEvent.click(screen.getByRole('button', { name: /^QAT1/ }))
    expect(onAdd).toHaveBeenCalledOnce()
    expect(onInfo).not.toHaveBeenCalled()
  })
  it('insert ON posseduta: striscia rimuovi, niente stepper +', () => {
    render(<StickerCard {...base} count={2} insertOn onAdd={() => {}} onRemove={() => {}} onInfo={() => {}} />)
    expect(screen.getByRole('button', { name: /Rimuovi una copia/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Aggiungi/ })).toBeNull()
  })
  it('insert OFF: tap card chiama onInfo', async () => {
    const onAdd = vi.fn(); const onInfo = vi.fn()
    render(<StickerCard {...base} count={1} insertOn={false} onAdd={onAdd} onRemove={() => {}} onInfo={onInfo} />)
    await userEvent.click(screen.getByRole('button', { name: /^QAT1/ }))
    expect(onInfo).toHaveBeenCalledOnce()
    expect(onAdd).not.toHaveBeenCalled()
  })
  it('mostra il layer pattern quando il kit non è solid', () => {
    const striped: TeamKit = { c1: '#111', c2: '#eee', pattern: 'stripes' }
    const { container } = render(<StickerCard {...base} kit={striped} count={1} insertOn={false} onAdd={()=>{}} onRemove={()=>{}} onInfo={()=>{}} />)
    expect(container.querySelector('[data-testid="kit-pattern"]')).not.toBeNull()
  })
})
