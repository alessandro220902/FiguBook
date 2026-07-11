import { describe, expect, it } from 'vitest'
import { hasComune, needsOnboarding, showCompleteBanner } from './status'
import type { ProfileDoc } from '@/lib/db/profile'

const base: ProfileDoc = { displayName: 'x', username: 'x', ts: 0 }

describe('profile status', () => {
  it('hasComune true solo con comune valido', () => {
    expect(hasComune({ ...base, citta: 'Roma (RM)' })).toBe(true)
    expect(hasComune({ ...base, citta: 'non-esiste-xyz' })).toBe(false)
    expect(hasComune(base)).toBe(false)
    expect(hasComune(null)).toBe(false)
  })
  it('needsOnboarding: manca comune e non ancora onboarded', () => {
    expect(needsOnboarding(base)).toBe(true)
    expect(needsOnboarding({ ...base, onboarded: true })).toBe(false)
    expect(needsOnboarding({ ...base, citta: 'Roma (RM)' })).toBe(false)
  })
  it('showCompleteBanner: ogni volta che manca il comune', () => {
    expect(showCompleteBanner(base)).toBe(true)
    expect(showCompleteBanner({ ...base, onboarded: true })).toBe(true)
    expect(showCompleteBanner({ ...base, citta: 'Roma (RM)' })).toBe(false)
  })
})
