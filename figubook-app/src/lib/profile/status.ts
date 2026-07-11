import { isValidComune } from '@/lib/geo/searchComuni'
import type { ProfileDoc } from '@/lib/db/profile'

// Il comune è il dato-base della Community: profilo "completo" = comune valido.
export function hasComune(profile: ProfileDoc | null): boolean {
  return isValidComune((profile?.citta ?? '').trim())
}

// Forziamo l'onboarding solo la prima volta: manca il comune E non l'ha mai visto.
export function needsOnboarding(profile: ProfileDoc | null): boolean {
  return !hasComune(profile) && !(profile?.onboarded ?? false)
}

// Completamento profilo in % sui 4 campi dell'onboarding (25% ciascuno).
export function profileCompletion(profile: ProfileDoc | null): number {
  if (!profile) return 0
  const checks = [
    hasComune(profile),
    /^\d{5}$/.test((profile.cap ?? '').trim()),
    !!profile.favTeam,
    !!profile.avatarId,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

// Il banner nudge resta finché il profilo non è completo al 100%.
export function showCompleteBanner(profile: ProfileDoc | null): boolean {
  return profileCompletion(profile) < 100
}
