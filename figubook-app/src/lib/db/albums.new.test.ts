import { describe, it, expect } from 'vitest'
import { isNewInList } from './albums'

describe('isNewInList', () => {
  const my = { ids: ['a', 'b'], archived: [], opened: ['a'] }
  it('true se in ids e non in opened', () => {
    expect(isNewInList(my, 'b')).toBe(true)
  })
  it('false se già in opened', () => {
    expect(isNewInList(my, 'a')).toBe(false)
  })
  it('false se non in ids', () => {
    expect(isNewInList(my, 'z')).toBe(false)
  })
})
