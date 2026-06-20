import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { subscribeAlbum, flushAlbumCounts } from '@/lib/db/albums'
import { counterOf } from '@/lib/album/stats'

const DEBOUNCE_MS = 800

// proietta i delta locali (code->count) sui campi states/counts (evita di
// perdere tap non ancora persistiti quando arriva uno snapshot dal server).
function projectStates(pending: Record<string, number>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [code, n] of Object.entries(pending)) {
    if (n === 1) out[code] = 'have'
    else if (n >= 2) out[code] = 'double'
  }
  return out
}
function projectCounts(pending: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [code, n] of Object.entries(pending)) if (n >= 2) out[code] = n
  return out
}

export function useAlbum(albumId: string) {
  const { user } = useAuth()
  const [states, setStates] = useState<Record<string, string>>({})
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  // delta non ancora persistiti: code -> count assoluto
  const pending = useRef<Record<string, number>>({})
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeAlbum(user.uid, albumId, (snap) => {
      // i delta locali vincono sullo snapshot server
      setStates({ ...snap.states, ...projectStates(pending.current) })
      setCounts({ ...snap.counts, ...projectCounts(pending.current) })
      setLoaded(true)
    })
    return () => { unsub() }
  }, [user, albumId])

  const flush = useCallback(async () => {
    if (!user) return
    const deltas = pending.current
    if (Object.keys(deltas).length === 0) return
    pending.current = {}
    try {
      await flushAlbumCounts(user.uid, albumId, deltas)
    } catch {
      // rollback: rimetti i delta in coda e segnala errore
      pending.current = { ...deltas, ...pending.current }
      setError(true)
    }
  }, [user, albumId])

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => { void flush() }, DEBOUNCE_MS)
  }, [flush])

  const setCount = useCallback((code: string, next: number) => {
    const n = Math.max(0, next)
    pending.current = { ...pending.current, [code]: n }
    if (n === 0) {
      setStates((s) => { const c = { ...s }; delete c[code]; return c })
      setCounts((s) => { const c = { ...s }; delete c[code]; return c })
    } else if (n === 1) {
      setStates((s) => ({ ...s, [code]: 'have' }))
      setCounts((s) => { const c = { ...s }; delete c[code]; return c })
    } else {
      setStates((s) => ({ ...s, [code]: 'double' }))
      setCounts((s) => ({ ...s, [code]: n }))
    }
    schedule()
  }, [schedule])

  const countOf = useCallback(
    (code: string) => counterOf(code, states, counts),
    [states, counts],
  )
  const increment = useCallback((code: string) => setCount(code, counterOf(code, states, counts) + 1), [setCount, states, counts])
  const decrement = useCallback((code: string) => setCount(code, counterOf(code, states, counts) - 1), [setCount, states, counts])

  // flush su cambio visibilità / chiusura pagina e su unmount
  useEffect(() => {
    const onHide = () => { void flush() }
    window.addEventListener('visibilitychange', onHide)
    window.addEventListener('beforeunload', onHide)
    return () => {
      window.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('beforeunload', onHide)
      if (timer.current) clearTimeout(timer.current)
      void flush()
    }
  }, [flush])

  return useMemo(
    () => ({ states, counts, loaded, error, countOf, increment, decrement, setCount, flush }),
    [states, counts, loaded, error, countOf, increment, decrement, setCount, flush],
  )
}
