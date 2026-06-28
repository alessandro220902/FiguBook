import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { subscribeProfile, type ProfileDoc } from '@/lib/db/profile'

// Lettura live del doc profilo dell'utente loggato.
export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileDoc | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    return subscribeProfile(user.uid, (p) => {
      setProfile(p)
      setLoading(false)
    })
  }, [user])

  return { profile, loading }
}
