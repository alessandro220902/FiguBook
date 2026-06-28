import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, UserPlus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { Avatar } from '@/components/Avatar'
import {
  subscribeIncomingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  type IncomingRequest,
} from '@/lib/db/friends'
import { getPublicByUid } from '@/lib/db/publicProfiles'
import type { PublicProfile } from '@/lib/db/profile'

// Sezione "Amicizia": richieste ricevute con Accetta/Rifiuta inline.
export function IncomingRequests() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [reqs, setReqs] = useState<IncomingRequest[]>([])
  const [people, setPeople] = useState<Record<string, PublicProfile>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const me = user?.uid
  const myUsername = profile?.username || user?.displayName || 'Un collezionista'

  useEffect(() => {
    if (!me) return
    return subscribeIncomingRequests(me, setReqs)
  }, [me])

  // Risolvi avatar/username dei mittenti mancanti.
  useEffect(() => {
    const missing = reqs.map((r) => r.fromUid).filter((u) => !people[u])
    if (missing.length === 0) return
    let active = true
    Promise.all(missing.map((u) => getPublicByUid(u))).then((list) => {
      if (!active) return
      const add: Record<string, PublicProfile> = {}
      list.forEach((p) => p && (add[p.uid] = p))
      if (Object.keys(add).length) setPeople((prev) => ({ ...prev, ...add }))
    })
    return () => {
      active = false
    }
  }, [reqs, people])

  if (!me || reqs.length === 0) return null

  async function act(fromUid: string, accept: boolean) {
    if (busy) return
    setBusy(fromUid)
    try {
      if (accept) await acceptFriendRequest(fromUid, me!, myUsername)
      else await rejectFriendRequest(fromUid, me!, myUsername)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mt-4">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
        <UserPlus className="h-4 w-4 text-lime" /> Richieste di amicizia
        <span className="rounded-full bg-lime/15 px-2 py-0.5 text-xs text-lime">{reqs.length}</span>
      </h2>
      <div className="flex flex-col gap-1.5">
        {reqs.map((r) => {
          const p = people[r.fromUid]
          return (
            <div
              key={r.fromUid}
              className="flex items-center gap-3 rounded-xl border border-border bg-white/[0.03] px-3 py-2.5"
            >
              <Link to={p ? `/u/${p.username}` : '#'} className="shrink-0">
                <Avatar
                  id={p?.avatarId}
                  name={p?.username || '?'}
                  className="h-10 w-10 overflow-hidden rounded-full"
                />
              </Link>
              <Link to={p ? `/u/${p.username}` : '#'} className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {p?.username || 'Collezionista'}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  vuole aggiungerti agli amici
                </span>
              </Link>
              <button
                type="button"
                disabled={busy === r.fromUid}
                onClick={() => act(r.fromUid, true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-lime px-3.5 py-2 text-sm font-semibold text-lime-ink disabled:opacity-50"
              >
                <Check className="h-4 w-4" /> Accetta
              </button>
              <button
                type="button"
                disabled={busy === r.fromUid}
                onClick={() => act(r.fromUid, false)}
                className="rounded-full border border-white/15 px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                Rifiuta
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
