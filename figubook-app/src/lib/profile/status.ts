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

// Il banner ricorda finché manca il comune, anche dopo aver saltato l'onboarding.
export function showCompleteBanner(profile: ProfileDoc | null): boolean {
  return !hasComune(profile)
}
