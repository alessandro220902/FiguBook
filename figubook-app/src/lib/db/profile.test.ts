import { describe, expect, it, vi, beforeEach } from 'vitest'
import { isValidCap, saveProfileAccount } from './profile'

describe('isValidCap', () => {
  it('accetta 5 cifre', () => {
    expect(isValidCap('00184')).toBe(true)
  })
  it('accetta stringa vuota (CAP opzionale)', () => {
    expect(isValidCap('')).toBe(true)
    expect(isValidCap('   ')).toBe(true)
  })
  it('rifiuta lunghezze o caratteri errati', () => {
    expect(isValidCap('123')).toBe(false)
    expect(isValidCap('123456')).toBe(false)
    expect(isValidCap('abcde')).toBe(false)
  })
})

// ─── Mock di firebase/firestore ────────────────────────────────────────────
// Cattura le chiamate a tx.set per verificare i doc scritti.
const txSetCalls: Array<[unknown, unknown, unknown?]> = []
const mockTx = {
  get: vi.fn(),
  set: vi.fn((...args: unknown[]) => {
    txSetCalls.push(args as [unknown, unknown, unknown?])
  }),
  delete: vi.fn(),
}

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db: unknown, ...segments: string[]) => ({ path: segments.join('/') })),
  runTransaction: vi.fn((_db: unknown, fn: (tx: typeof mockTx) => Promise<void>) => fn(mockTx)),
  onSnapshot: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
}))

vi.mock('firebase/auth', () => ({
  updateProfile: vi.fn(),
}))

vi.mock('@/lib/firebase', () => ({
  db: {},
  auth: { currentUser: null },
}))

// isValidComune: accetta qualsiasi stringa non vuota nei test
vi.mock('@/lib/geo/searchComuni', () => ({
  isValidComune: (s: string) => s.trim().length > 0,
}))

describe('saveProfileAccount — provincia privata', () => {
  beforeEach(() => {
    txSetCalls.length = 0
    mockTx.get.mockReset()
    mockTx.set.mockReset()
    mockTx.set.mockImplementation((...args: unknown[]) => {
      txSetCalls.push(args as [unknown, unknown, unknown?])
    })
    mockTx.delete.mockReset()
    // profSnap: utente esistente con username 'mario'
    mockTx.get.mockResolvedValue({
      exists: () => true,
      data: () => ({ username: 'mario', isPublic: false, avatarId: '' }),
    })
  })

  it('scrive provincia sul doc privato ma NON su publicProfiles', async () => {
    await saveProfileAccount('uid123', {
      username: 'mario',
      nome: 'Mario Rossi',
      citta: 'Milano (MI)',
      bio: '',
      favTeam: '',
    })

    // Trova la chiamata al doc privato (path: users/uid123/meta/profile)
    const privateWrite = txSetCalls.find(
      ([ref]) => (ref as { path: string }).path === 'users/uid123/meta/profile',
    )
    // Trova la chiamata al doc pubblico (path: publicProfiles/uid123)
    const publicWrite = txSetCalls.find(
      ([ref]) => (ref as { path: string }).path === 'publicProfiles/uid123',
    )

    expect(privateWrite).toBeDefined()
    expect((privateWrite![1] as Record<string, unknown>).provincia).toBe('MI')

    expect(publicWrite).toBeDefined()
    expect((publicWrite![1] as Record<string, unknown>).provincia).toBeUndefined()
  })
})
