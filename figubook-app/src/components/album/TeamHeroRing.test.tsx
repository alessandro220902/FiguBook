import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { TeamHeroRing } from './TeamHeroRing'

afterEach(cleanup)

describe('TeamHeroRing', () => {
  it('mostra la percentuale e have/total', () => {
    const { container, getByText } = render(<TeamHeroRing pct={72} have={79} total={110} />)
    expect(container.querySelector('svg')).not.toBeNull()
    expect(getByText('72%')).not.toBeNull()
    expect(getByText(/79/)).not.toBeNull()
    expect(getByText(/110/)).not.toBeNull()
  })
})
