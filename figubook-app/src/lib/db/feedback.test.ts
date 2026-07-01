import { describe, it, expect } from 'vitest'
import { aggregateRating } from './feedback'

describe('aggregateRating', () => {
  it('media e conteggio', () => {
    expect(aggregateRating([{ rating: 5 }, { rating: 4 }, { rating: 3 }])).toEqual({ avg: 4, count: 3 })
  })
  it('vuoto -> avg 0 count 0', () => {
    expect(aggregateRating([])).toEqual({ avg: 0, count: 0 })
  })
})
