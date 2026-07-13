import { useEffect, useState } from 'react'
import { subscribeIncomingRequests } from '@/lib/db/friends'
import { getPublicByUid } from '@/lib/db/publicProfiles'
import { useAuth } from '@/hooks/useAuth'
import type { PublicProfile } from '@/lib/db/profile'

export function useIncomingRequestProfiles() {
  const { user } = useAuth()
  const [reqs, setReqs] = useState<PublicProfile[]>([])
  useEffect(() => {
    if (!user) return
    return subscribeIncomingRequests(user.uid, async (list) => {
      const profs = await Promise.all(list.map((r) => getPublicByUid(r.fromUid)))
      setReqs(profs.filter((p): p is PublicProfile => !!p))
    })
  }, [user])
  return reqs
}
