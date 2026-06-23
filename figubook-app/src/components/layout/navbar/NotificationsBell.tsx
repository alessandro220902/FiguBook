import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CheckCircle2, ThumbsUp, ArrowLeftRight, PencilLine, XCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { markAllRead, resolveHref, timeAgo } from '@/lib/db/notifications'

// Stile alert-toast (21st/lavikatiyar): stripe colorata a sinistra + icona lucide
// per tipo, niente emoji. Colore = accento, non riempimento.
const NOTIF_META: Record<string, { color: string; Icon: LucideIcon }> = {
  completed: { color: '#a3e635', Icon: CheckCircle2 },   // lime
  accepted: { color: '#34d399', Icon: ThumbsUp },        // emerald
  proposal: { color: '#38bdf8', Icon: ArrowLeftRight },  // sky
  revise: { color: '#fbbf24', Icon: PencilLine },        // amber
  rejected: { color: '#f87171', Icon: XCircle },         // red
}
const notifMeta = (type?: string) => NOTIF_META[type ?? ''] ?? { color: '#9ca3af', Icon: Bell }

type Tab = 'all' | 'unread' | 'read'
const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'Tutte' },
  { key: 'unread', label: 'Non lette' },
  { key: 'read', label: 'Lette' },
]

// Campanella navbar: badge numero + pannello con filtro Tutte/Non lette/Lette.
// Adattato da ruixenui/notifications-filter, dati live da useNotifications.
export function NotificationsBell() {
  const { user } = useAuth()
  const { items, unread } = useNotifications()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('all')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!ref.current || ref.current.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  // Aprendo: segna tutto letto (come il comportamento precedente).
  useEffect(() => {
    if (open && user && unread > 0) void markAllRead(user.uid)
  }, [open, user, unread])

  const counts = { all: items.length, unread, read: items.length - unread }
  const list = tab === 'all' ? items : items.filter((n) => (tab === 'unread' ? !n.read : n.read))

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Notifiche"
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-10 w-10 place-items-center rounded-full text-foreground transition-colors hover:bg-white/8"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 grid h-[17px] min-w-[17px] place-items-center rounded-full border-2 border-background bg-destructive px-1 text-[10px] font-bold leading-none text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed right-2 top-[4.5rem] z-50 w-[min(20rem,calc(100vw-1rem))] rounded-2xl border border-border bg-card p-2 shadow-2xl md:absolute md:right-auto md:left-1/2 md:top-12 md:w-[22rem] md:-translate-x-1/2">
          <div className="flex items-center justify-between px-2 py-1.5">
            <p className="font-display text-base font-bold">Notifiche</p>
          </div>

          <div className="flex gap-1.5 px-1 pb-2">
            {TABS.map((t) => {
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
            <div className="grid place-items-center gap-1 rounded-xl border border-border bg-background px-4 py-8 text-center">
              <Bell className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-semibold">Niente qui</p>
            </div>
          ) : (
            <div className="flex max-h-80 flex-col gap-1.5 overflow-y-auto">
              {list.map((n) => {
                const m = notifMeta(n.type)
                return (
                  <Link
                    key={n.id}
                    to={resolveHref(n.href)}
                    onClick={() => setOpen(false)}
                    style={{ borderLeftColor: m.color }}
                    className={
                      'flex items-start gap-3 rounded-xl border border-l-[3px] border-border px-3 py-2 transition-colors hover:bg-muted ' +
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
      )}
    </div>
  )
}
