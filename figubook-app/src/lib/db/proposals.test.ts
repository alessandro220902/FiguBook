import { describe, it, expect } from 'vitest'
import { addConfirmation, isCompleted } from './proposals'

describe('addConfirmation', () => {
  it('aggiunge un uid a confirmedBy senza duplicati', () => {
    expect(addConfirmation(['a'], 'b').sort()).toEqual(['a', 'b'])
    expect(addConfirmation(['a'], 'a')).toEqual(['a'])
  })
})

describe('isCompleted', () => {
  it('completo solo se entrambi i partecipanti hanno confermato', () => {
    expect(isCompleted(['a', 'b'], ['a'])).toBe(false)
    expect(isCompleted(['a', 'b'], ['a', 'b'])).toBe(true)
  })
})
