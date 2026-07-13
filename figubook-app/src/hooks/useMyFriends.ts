import { useEffect, useState } from 'react'
import { subscribeMyFriends } from '@/lib/db/friends'
import { getPublicByUid } from '@/lib/db/publicProfiles'
import { useAuth } from '@/hooks/useAuth'
import type { PublicProfile } from '@/lib/db/profile'

export function useMyFriends() {
  const { user } = useAuth()
  const [friends, setFriends] = useState<PublicProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    return subscribeMyFriends(user.uid, async (uids) => {
      const profs = await Promise.all(uids.map((u) => getPublicByUid(u)))
      setFriends(profs.filter((p): p is PublicProfile => !!p))
      setLoading(false)
    })
  }, [user])

  return { friends, loading }
}
