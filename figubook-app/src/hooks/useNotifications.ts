import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { subscribeNotifications, type FiguNotification } from '@/lib/db/notifications'

export function useNotifications() {
  const { user } = useAuth()
  const [items, setItems] = useState<FiguNotification[]>([])

  useEffect(() => {
    if (!user) return
    return subscribeNotifications(user.uid, setItems)
  }, [user])

  // Senza utente esponi vuoto senza setState in effect (lint-clean).
  const list = user ? items : []
  const unread = list.filter((n) => !n.read).length
  return { items: list, unread }
}
