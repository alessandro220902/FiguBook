import { describe, it, expect, beforeEach } from 'vitest'
import { rememberReferrer, consumeReferrer, peekReferrer } from './referrer'

beforeEach(() => localStorage.clear())

describe('referrer', () => {
  it('salva e legge lo username referrer (lower, trim)', () => {
    rememberReferrer('  Marco ')
    expect(peekReferrer()).toBe('marco')
  })
  it('consume ritorna e cancella (one-shot)', () => {
    rememberReferrer('marco')
    expect(consumeReferrer()).toBe('marco')
    expect(peekReferrer()).toBe(null)
  })
  it('ignora referrer vuoto', () => {
    rememberReferrer('   ')
    expect(peekReferrer()).toBe(null)
  })
})
