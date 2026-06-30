import { describe, it, expect } from 'vitest'
import { allCodesFromSections } from './albumCodes'

describe('allCodesFromSections', () => {
  it('concatena i codici di tutte le sezioni in ordine', () => {
    const data = {
      sections: [
        { id: 'a', codes: ['1', '2'] },
        { id: 'b', codes: ['3'] },
      ],
    } as any
    expect(allCodesFromSections(data)).toEqual(['1', '2', '3'])
  })
})
