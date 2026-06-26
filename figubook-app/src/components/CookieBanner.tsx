import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getConsent, setConsent, type Consent } from '@/lib/consent'

// Banner consenso cookie. Appare solo se nessuna scelta è stata fatta.
// Google Analytics resta spento finché l'utente non accetta.
export function CookieBanner() {
  const [visible, setVisible] = useState(() => getConsent() === null)

  if (!visible) return null

  function choose(value: Consent) {
    setConsent(value)
    setVisible(false)
  }

  return (
    <div
      role="dialog"
      aria-label="Consenso cookie"
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-[560px] rounded-xl border border-white/10 bg-[#0d100d]/95 p-4 text-[#f4efe6] shadow-2xl backdrop-blur sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
    >
      <p className="text-[13px] leading-relaxed text-[#d8d2c6]">
        Usiamo cookie tecnici necessari e, solo col tuo consenso, Google Analytics per
        statistiche anonime di utilizzo. Vedi la{' '}
        <Link to="/cookie" className="underline underline-offset-2 hover:text-foreground">
          Cookie Policy
        </Link>
        .
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => choose('granted')}
          className="flex-1 rounded-lg bg-lime-400 px-4 py-2 text-[13px] font-semibold text-black transition-colors hover:bg-lime-300"
          style={{ outline: 'none' }}
        >
          Accetta
        </button>
        <button
          onClick={() => choose('denied')}
          className="flex-1 rounded-lg border border-white/15 px-4 py-2 text-[13px] font-semibold text-[#d8d2c6] transition-colors hover:border-white/30 hover:text-foreground"
          style={{ outline: 'none' }}
        >
          Rifiuta
        </button>
      </div>
    </div>
  )
}
