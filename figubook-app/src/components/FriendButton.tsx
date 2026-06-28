import { useEffect, useState } from 'react'
import { UserPlus, Clock, Check, UserCheck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import {
  subscribeFriendStatus,
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  unfriend,
  type FriendStatus,
} from '@/lib/db/friends'

// Bottone amicizia su una vetrina: mostra/gestisce lo stato me<->other.
export function FriendButton({ otherUid }: { otherUid: string }) {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [status, setStatus] = useState<FriendStatus>('none')
  const [busy, setBusy] = useState(false)
  const me = user?.uid
  const myUsername = profile?.username || user?.displayName || 'Un collezionista'

  useEffect(() => {
    if (!me || me === otherUid) return
    return subscribeFriendStatus(me, otherUid, setStatus)
  }, [me, otherUid])

  if (!me || me === otherUid) return null

  async function run(fn: () => Promise<void>) {
    if (busy) return
    setBusy(true)
    try {
      await fn()
    } finally {
      setBusy(false)
    }
  }

  const base =
    'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-semibold transition-opacity disabled:opacity-50'

  if (status === 'friends') {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => run(() => unfriend(me, otherUid))}
        className={base + ' border border-white/15 text-ink hover:bg-white/10'}
      >
        <UserCheck className="h-4 w-4" /> Amici
      </button>
    )
  }
  if (status === 'incoming') {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => run(() => acceptFriendRequest(otherUid, me, myUsername))}
          className={base + ' bg-lime text-lime-ink'}
        >
          <Check className="h-4 w-4" /> Accetta
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => run(() => rejectFriendRequest(otherUid, me))}
          className={base + ' border border-white/15 text-ink-2 hover:text-ink'}
        >
          Rifiuta
        </button>
      </div>
    )
  }
  if (status === 'outgoing') {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => run(() => cancelFriendRequest(me, otherUid))}
        className={base + ' border border-white/15 text-ink-2 hover:text-ink'}
      >
        <Clock className="h-4 w-4" /> Richiesta inviata
      </button>
    )
  }
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => run(() => sendFriendRequest(me, otherUid, myUsername))}
      className={base + ' bg-lime text-lime-ink'}
    >
      <UserPlus className="h-4 w-4" /> Aggiungi amico
    </button>
  )
}
