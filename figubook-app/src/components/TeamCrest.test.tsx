import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { TeamCrest } from './TeamCrest'

afterEach(cleanup)

describe('TeamCrest', () => {
  it('senza monogram non disegna testo (default retro-compatibile)', () => {
    const { container } = render(<TeamCrest c1="#000" c2="#fff" />)
    expect(container.querySelector('text')).toBeNull()
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('con monogram disegna la lettera', () => {
    const { container } = render(<TeamCrest c1="#000" c2="#fff" monogram="A" />)
    expect(container.querySelector('text')?.textContent).toBe('A')
  })

  it('pattern stripes disegna piu righe verticali', () => {
    const { container } = render(<TeamCrest c1="#1e71b8" c2="#000000" pattern="stripes" />)
    expect(container.querySelectorAll('rect').length).toBeGreaterThan(2)
  })

  it('pattern sash disegna una banda diagonale (path in piu oltre al contorno)', () => {
    const { container } = render(<TeamCrest c1="#12386b" c2="#fff" accent="#e30613" pattern="sash" />)
    expect(container.querySelectorAll('path').length).toBeGreaterThanOrEqual(2)
  })
})
