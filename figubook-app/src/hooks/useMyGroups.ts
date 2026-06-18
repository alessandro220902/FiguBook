import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'

export interface MyGroup {
  id: string
  name: string
}

// Gruppi a cui partecipo: users/{uid}/groups (forma del sito vecchio). Live.
export function useMyGroups(): { groups: MyGroup[]; loading: boolean } {
  const { user } = useAuth()
  const [groups, setGroups] = useState<MyGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const col = collection(db, 'users', user.uid, 'groups')
    return onSnapshot(
      col,
      (snap) => {
        setGroups(snap.docs.map((d) => ({ id: d.id, name: (d.data().name as string) || 'Gruppo' })))
        setLoading(false)
      },
      (err) => {
        console.error('gruppi', err)
        setGroups([])
        setLoading(false)
      },
    )
  }, [user])

  return { groups, loading }
}
