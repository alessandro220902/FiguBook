import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'

// Conta gli scambi completati (gruppi + diretti): proposte con status 'completed'
// in cui sono partecipante. Query solo su participants (array-contains) e filtro
// status lato client => nessun indice composito richiesto. Live.
export function useTradesCount(): number {
  const { user } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'proposals'),
      where('participants', 'array-contains', user.uid),
    )
    return onSnapshot(
      q,
      (snap) => setCount(snap.docs.filter((d) => d.data().status === 'completed').length),
      (err) => {
        console.error('scambi completati', err)
        setCount(0)
      },
    )
  }, [user])

  return count
}
