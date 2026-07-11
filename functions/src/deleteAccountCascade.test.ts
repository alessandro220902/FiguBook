import { describe, expect, it } from 'vitest'
import { isTradeIndexUserDoc } from './deleteAccountCascade.js'

describe('isTradeIndexUserDoc', () => {
  it("riconosce un doc tradeIndex dell'utente", () => {
    expect(isTradeIndexUserDoc('tradeIndex/calciatori-25-26/users/U', 'U')).toBe(true)
  })
  it('ignora un doc tradeIndex di un altro utente', () => {
    expect(isTradeIndexUserDoc('tradeIndex/calciatori-25-26/users/OTHER', 'U')).toBe(false)
  })
  it('ignora la collezione root users (albero utente)', () => {
    expect(isTradeIndexUserDoc('users/U/notifications/n1', 'U')).toBe(false)
    expect(isTradeIndexUserDoc('users/U', 'U')).toBe(false)
  })
})
