import { useEffect, useRef, useState } from 'react'
import { MoreVertical, UserMinus, Ban, RotateCcw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { subscribeFriendStatus, unfriend, type FriendStatus } from '@/lib/db/friends'
import { blockUser, unblockUser } from '@/lib/db/blocks'

// Menu kebab sulla vetrina: Rimuovi amico (se amici) + Blocca/Sblocca.
export function ProfileActionsMenu({ otherUid }: { otherUid: string }) {
  const { user } = useAuth()
  const { profile } = useProfile()
  const me = user?.uid
  const [status, setStatus] = useState<FriendStatus>('none')
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!me || me === otherUid) return
    return subscribeFriendStatus(me, otherUid, setStatus)
  }, [me, otherUid])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  if (!me || me === otherUid) return null

  const meUid = me
  const isBlocked = profile?.blocked?.includes(otherUid) ?? false

  async function run(fn: () => Promise<void>) {
    if (busy) return
    setBusy(true)
    try { await fn() } finally { setBusy(false); setOpen(false) }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Altre azioni"
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-ink-2 transition-colors hover:bg-white/10 hover:text-ink"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-white/10 bg-surface shadow-xl">
          {status === 'friends' && !isBlocked && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => unfriend(meUid, otherUid))}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-ink hover:bg-white/[0.06] disabled:opacity-50"
            >
              <UserMinus className="h-4 w-4" /> Rimuovi amico
            </button>
          )}
          {isBlocked ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => unblockUser(meUid, otherUid))}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-ink hover:bg-white/[0.06] disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" /> Sblocca
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => blockUser(meUid, otherUid))}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-stat-missing hover:bg-stat-missing/10 disabled:opacity-50"
            >
              <Ban className="h-4 w-4" /> Blocca
            </button>
          )}
        </div>
      )}
    </div>
  )
}
