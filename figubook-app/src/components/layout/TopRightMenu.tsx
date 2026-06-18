import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { User, Bell, Settings, LifeBuoy, LogOut } from 'lucide-react'
import { ExpandableTabs, type TabItem } from '@/components/ui/expandable-tabs'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { markAllRead, resolveHref, timeAgo } from '@/lib/db/notifications'

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!ref.current || ref.current.contains(e.target as Node)) return
      handler()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [ref, handler])
}

export function TopRightMenu() {
  const [selected, setSelected] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { items, unread } = useNotifications()

  useClickOutside(ref, () => setSelected(null))

  // Apertura pannello Notifiche -> segna tutto letto.
  useEffect(() => {
    if (selected === 1 && user && unread > 0) void markAllRead(user.uid)
  }, [selected, user, unread])

  const name = user?.displayName?.trim() || (user?.email || '').split('@')[0] || 'Collezionista'
  const initial = name.charAt(0).toUpperCase()

  // Indici: 0 Profilo · 1 Notifiche · 2 separator · 3 Impostazioni · 4 Supporto
  const TABS: TabItem[] = [
    { title: 'Profilo', icon: User },
    { title: 'Notifiche', icon: Bell, dot: unread > 0 },
    { type: 'separator' },
    { title: 'Impostazioni', icon: Settings },
    { title: 'Supporto', icon: LifeBuoy },
  ]

  async function handleLogout() {
    await signOut(auth)
    navigate('/login', { replace: true })
  }

  return (
    <div ref={ref} className="fixed right-4 top-4 z-50 flex flex-col items-end gap-2 sm:right-6 sm:top-6">
      <ExpandableTabs tabs={TABS} selected={selected} onSelect={setSelected} />

      {/* Pannello Profilo */}
      {selected === 0 && (
        <div className="w-72 rounded-2xl border border-border bg-card p-4 shadow-2xl">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-lime font-display text-lg font-extrabold text-lime-ink">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-bold leading-tight">{name}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="my-3 h-px bg-border" />
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-muted"
          >
            <LogOut className="h-4 w-4" /> Esci
          </button>
        </div>
      )}

      {/* Pannello Notifiche (live) */}
      {selected === 1 && (
        <div className="w-80 rounded-2xl border border-border bg-card p-4 shadow-2xl">
          <p className="mb-3 font-display text-lg font-bold">Notifiche</p>
          {items.length === 0 ? (
            <div className="grid place-items-center gap-1 rounded-xl border border-border bg-background px-4 py-8 text-center">
              <Bell className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-semibold">Nessuna notifica</p>
              <p className="text-xs text-muted-foreground">Le proposte di scambio appariranno qui</p>
            </div>
          ) : (
            <div className="flex max-h-80 flex-col gap-1.5 overflow-y-auto">
              {items.map((n) => (
                <Link
                  key={n.id}
                  to={resolveHref(n.href)}
                  onClick={() => setSelected(null)}
                  className={
                    'flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors hover:bg-muted ' +
                    (n.read ? 'border-border bg-background' : 'border-lime/30 bg-lime/5')
                  }
                >
                  <span className="text-lg leading-none">{n.icon || '🔄'}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold leading-snug text-foreground">{n.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {(n.info ? n.info + ' · ' : '') + timeAgo(n.at)}
                    </span>
                  </span>
                  {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-lime" />}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
      {/* selected 3 (Impostazioni) e 4 (Supporto): nessun pannello, di proposito */}
    </div>
  )
}
