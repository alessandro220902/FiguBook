import { app } from './firebase'

// Consenso cookie/analytics. GDPR + ePrivacy: Google Analytics parte SOLO dopo
// consenso esplicito. Scelta salvata in localStorage, revocabile.
const KEY = 'figubook.cookieConsent'

export type Consent = 'granted' | 'denied'

export function getConsent(): Consent | null {
  const v = localStorage.getItem(KEY)
  return v === 'granted' || v === 'denied' ? v : null
}

export function setConsent(value: Consent) {
  localStorage.setItem(KEY, value)
  if (value === 'granted') void initAnalytics()
}

// Inizializza Google Analytics una sola volta. Import dinamico: il bundle
// analytics si carica solo se l'utente accetta.
let started = false
export async function initAnalytics() {
  if (started) return
  started = true
  const { getAnalytics, isSupported } = await import('firebase/analytics')
  if (await isSupported()) getAnalytics(app)
}

// Da chiamare all'avvio: se il consenso era già stato dato, riattiva GA.
export function initConsentedAnalytics() {
  if (getConsent() === 'granted') void initAnalytics()
}
