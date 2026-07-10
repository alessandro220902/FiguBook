import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { markAllRead, resolveHref, timeAgo } from '@/lib/db/notifications'
import { notifMeta, NOTIF_TABS, type Tab } from '@/lib/db/notifMeta'
import { IncomingRequests } from '@/components/IncomingRequests'
import { Breadcrumb } from '@/components/Breadcrumb'

// Pagina notifiche dedicata (mobile): stessa logica/render del pannello desktop
// (useNotifications + filtri).
export default function Notifiche() {
  const { user } = useAuth()
  const { items, unread } = useNotifications()
  const [tab, setTab] = useState<Tab>('all')

  // Entrando: segna tutto letto (come l'apertura del pannello).
  useEffect(() => {
    if (user && unread > 0) void markAllRead(user.uid)
  }, [user, unread])

  const counts = { all: items.length, unread, read: items.length - unread }
  const list = tab === 'all' ? items : items.filter((n) => (tab === 'unread' ? !n.read : n.read))

  return (
    <div className="mx-auto w-full max-w-xl">
      <Breadcrumb items={[{ label: 'Notifiche' }]} />

      {/* Sezione Amicizia: richieste ricevute con Accetta/Rifiuta */}
      <IncomingRequests />

      <div className="mt-4 flex gap-1.5">
        {NOTIF_TABS.map((t) => {
          const on = tab === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ' +
                (on ? 'bg-white text-neutral-900' : 'border border-white/12 text-muted-foreground hover:text-foreground')
              }
            >
              {t.label} <span className="opacity-70">{counts[t.key]}</span>
            </button>
          )
        })}
      </div>

      {list.length === 0 ? (
        <div className="mt-4 grid place-items-center gap-1 rounded-2xl border border-border bg-background px-4 py-12 text-center">
          <Bell className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-semibold">Nessuna notifica</p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-1.5">
          {list.map((n) => {
            const m = notifMeta(n.type)
            return (
              <Link
                key={n.id}
                to={resolveHref(n.href)}
                style={{ borderLeftColor: m.color }}
                className={
                  'flex items-start gap-3 rounded-xl border border-l-[3px] border-border px-3 py-2.5 transition-colors hover:bg-muted ' +
                  (n.read ? 'bg-background' : 'bg-white/[0.03]')
                }
              >
                <m.Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: m.color }} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-snug text-foreground">{n.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{(n.info ? n.info + ' · ' : '') + timeAgo(n.at)}</span>
                </span>
                {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: m.color }} />}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
