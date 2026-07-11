import { describe, expect, it } from 'vitest'
import { hasComune, needsOnboarding, showCompleteBanner, profileCompletion } from './status'
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
  it('profileCompletion: 25% per campo (comune/cap/squadra/avatar)', () => {
    expect(profileCompletion(base)).toBe(0)
    expect(profileCompletion({ ...base, citta: 'Roma (RM)' })).toBe(25)
    expect(profileCompletion({ ...base, citta: 'Roma (RM)', cap: '00125' })).toBe(50)
    expect(profileCompletion({ ...base, citta: 'Roma (RM)', cap: '00125', favTeam: 'inter', avatarId: 'a1' })).toBe(100)
    expect(profileCompletion({ ...base, cap: '123' })).toBe(0)
  })
  it('showCompleteBanner: finché il profilo non è completo al 100%', () => {
    expect(showCompleteBanner(base)).toBe(true)
    expect(showCompleteBanner({ ...base, citta: 'Roma (RM)' })).toBe(true)
    expect(showCompleteBanner({ ...base, citta: 'Roma (RM)', cap: '00125', favTeam: 'inter', avatarId: 'a1' })).toBe(false)
  })
})
