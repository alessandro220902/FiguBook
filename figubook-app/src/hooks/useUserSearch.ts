import { useEffect, useState } from 'react'
import { searchUsers } from '@/lib/db/publicProfiles'
import { useProfile } from '@/hooks/useProfile'
import type { PublicProfile } from '@/lib/db/profile'

// Ricerca utenti debounced per prefisso username. results vuoto se query corta.
// Esclude gli utenti che ho bloccato.
export function useUserSearch(q: string, max = 8) {
  const { profile } = useProfile()
  const [results, setResults] = useState<PublicProfile[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const term = q.trim()
    let active = true
    const t = setTimeout(() => {
      if (term.length < 2) {
        setResults([])
        setLoading(false)
        return
      }
      setLoading(true)
      searchUsers(term, max)
        .then((r) => active && setResults(r))
        .catch(() => active && setResults([]))
        .finally(() => active && setLoading(false))
    }, 200)
    return () => {
      active = false
      clearTimeout(t)
    }
  }, [q, max])

  const blocked = profile?.blocked ?? []
  const filtered = blocked.length ? results.filter((r) => !blocked.includes(r.uid)) : results
  return { results: filtered, loading }
}
