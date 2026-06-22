import { describe, it, expect } from 'vitest'
import { passes } from './filter'

describe('passes', () => {
  it('all: sempre true', () => {
    expect(passes('all', 0)).toBe(true)
    expect(passes('all', 5)).toBe(true)
  })
  it('missing: solo count 0', () => {
    expect(passes('missing', 0)).toBe(true)
    expect(passes('missing', 1)).toBe(false)
  })
  it('have: count >= 1', () => {
    expect(passes('have', 0)).toBe(false)
    expect(passes('have', 1)).toBe(true)
  })
  it('double: count >= 2', () => {
    expect(passes('double', 1)).toBe(false)
    expect(passes('double', 2)).toBe(true)
  })
})
