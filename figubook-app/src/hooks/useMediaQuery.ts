import { useEffect, useState } from 'react'

// Match di una media query. SSR-safe (parte false), si aggiorna al mount e ai cambi.
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}

// "Desktop" = solo PC: puntatore fine (mouse) + hover reale. Esclude telefono e iPad
// a prescindere dalla larghezza. Vedi regola breakpoint-mobile-include-ipad.
export function useIsDesktop(): boolean {
  return useMediaQuery('(hover: hover) and (pointer: fine)')
}
