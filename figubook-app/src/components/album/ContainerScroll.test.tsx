// figubook-app/src/components/album/ContainerScroll.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const reduceMock = vi.fn(() => false)
vi.mock('framer-motion', async (orig) => ({
  ...(await orig<typeof import('framer-motion')>()),
  useReducedMotion: () => reduceMock(),
}))
import { ContainerScroll } from './ContainerScroll'

describe('ContainerScroll', () => {
  it('rende header e children', () => {
    render(<ContainerScroll header={<h2>Header X</h2>}><p>Contenuto Y</p></ContainerScroll>)
    expect(screen.getByText('Header X')).toBeInTheDocument()
    expect(screen.getByText('Contenuto Y')).toBeInTheDocument()
  })

  it('reduced-motion: niente card 3D (statico)', () => {
    reduceMock.mockReturnValueOnce(true)
    render(<ContainerScroll header={null}><p>Flat</p></ContainerScroll>)
    expect(screen.getByText('Flat')).toBeInTheDocument()
    expect(screen.queryByTestId('cscroll-card')).toBeNull()
  })

  it('motion attivo: card 3D presente', () => {
    reduceMock.mockReturnValue(false)
    render(<ContainerScroll header={null}><p>Tilt</p></ContainerScroll>)
    expect(screen.getByTestId('cscroll-card')).toBeInTheDocument()
  })
})
