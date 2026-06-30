import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  EmailAuthProvider, reauthenticateWithCredential, updatePassword, sendPasswordResetEmail, authObj,
} = vi.hoisted(() => ({
  EmailAuthProvider: { credential: vi.fn((email: string, pw: string) => ({ email, pw })) },
  reauthenticateWithCredential: vi.fn(() => Promise.resolve()),
  updatePassword: vi.fn(() => Promise.resolve()),
  sendPasswordResetEmail: vi.fn(() => Promise.resolve()),
  authObj: { currentUser: null as null | { email: string | null } },
}))

vi.mock('firebase/auth', () => ({
  EmailAuthProvider, reauthenticateWithCredential, updatePassword, sendPasswordResetEmail,
}))
vi.mock('@/lib/firebase', () => ({ auth: authObj }))

import { hasPasswordProvider, changePassword, sendReset } from './password'

beforeEach(() => {
  vi.clearAllMocks()
  authObj.currentUser = null
})

describe('hasPasswordProvider', () => {
  it('true se providerData contiene password', () => {
    expect(hasPasswordProvider({ providerData: [{ providerId: 'password' }] } as never)).toBe(true)
  })
  it('false per solo google o user nullo', () => {
    expect(hasPasswordProvider({ providerData: [{ providerId: 'google.com' }] } as never)).toBe(false)
    expect(hasPasswordProvider(null)).toBe(false)
  })
})

describe('changePassword', () => {
  it('riautentica poi aggiorna', async () => {
    authObj.currentUser = { email: 'a@b.it' }
    await changePassword('vecchia', 'nuova123')
    expect(EmailAuthProvider.credential).toHaveBeenCalledWith('a@b.it', 'vecchia')
    expect(reauthenticateWithCredential).toHaveBeenCalled()
    expect(updatePassword).toHaveBeenCalledWith(authObj.currentUser, 'nuova123')
  })
  it('throw se nessun utente', async () => {
    authObj.currentUser = null
    await expect(changePassword('x', 'y')).rejects.toThrow()
  })
})

describe('sendReset', () => {
  it('chiama sendPasswordResetEmail', async () => {
    await sendReset('a@b.it')
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(authObj, 'a@b.it')
  })
})
