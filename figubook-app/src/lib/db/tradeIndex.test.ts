import { describe, it, expect } from 'vitest'
import { buildIndexDoc } from './tradeIndex'

describe('buildIndexDoc', () => {
  it('costruisce il doc indice con doubles/missing/citta/updatedAt', () => {
    const d = buildIndexDoc({ doubles: ['2'], missing: ['4'] }, 'Roma', 123)
    expect(d.doubles).toEqual(['2'])
    expect(d.missing).toEqual(['4'])
    expect(d.citta).toBe('Roma')
    expect(d.updatedAt).toBe(123)
  })
})
