import { useEffect, useState } from 'react'
import { subscribeInviteCount } from '@/lib/db/invites'
import { useAuth } from '@/hooks/useAuth'

export function useInviteCount(): number {
  const { user } = useAuth()
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!user) return
    return subscribeInviteCount(user.uid, setN)
  }, [user])
  return n
}
