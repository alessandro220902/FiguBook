import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRightLeft } from 'lucide-react'
import { requireUid } from '@/lib/firebase'
import {
  subscribeMyProposals, acceptProposal, declineProposal, confirmProposal, type Proposal,
} from '@/lib/db/proposals'

export default function ScambiMiei() {
  const uid = requireUid()
  const [tab, setTab] = useState<'in' | 'out'>('in')
  const [list, setList] = useState<Proposal[]>([])

  useEffect(() => subscribeMyProposals(uid, setList), [uid])

  const incoming = list.filter((p) => p.toUid === uid)
  const outgoing = list.filter((p) => p.fromUid === uid)
  const shown = tab === 'in' ? incoming : outgoing

  const statusLabel = (p: Proposal) =>
    p.status === 'completed' ? 'Completato'
    : p.status === 'declined' ? 'Rifiutato'
    : p.status === 'accepted'
      ? (p.confirmedBy.includes(uid) ? 'In attesa che l\'altro confermi' : 'Accettato — conferma quando fatto')
      : 'In attesa'

  // Colore del badge stato (semantico, coerente coi token brand).
  const statusClass = (p: Proposal) =>
    p.status === 'completed' ? 'border-lime/30 bg-lime/10 text-lime'
    : p.status === 'declined' ? 'border-stat-missing/30 bg-stat-missing/10 text-stat-missing'
    : 'border-white/12 bg-white/[0.04] text-muted-foreground'

  const tabBtn = (active: boolean) =>
    'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors active:scale-95 ' +
    (active ? 'bg-lime text-black' : 'border border-white/12 text-muted-foreground hover:text-foreground')

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-5 flex items-center gap-3">
        <Link
          to="/scambi"
          aria-label="Torna agli scambi"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/12 bg-white/[0.06] text-foreground transition-colors hover:bg-white/10 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">I miei scambi</h1>
      </div>

      <div className="mb-5 flex gap-2">
        <button type="button" onClick={() => setTab('in')} className={tabBtn(tab === 'in')}>
          In arrivo <span className="opacity-70">{incoming.length}</span>
        </button>
        <button type="button" onClick={() => setTab('out')} className={tabBtn(tab === 'out')}>
          Inviate <span className="opacity-70">{outgoing.length}</span>
        </button>
      </div>

      {shown.length === 0 ? (
        <div className="grid place-items-center gap-2 rounded-2xl border border-border bg-background px-4 py-12 text-center">
          <ArrowRightLeft className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-semibold text-ink">
            {tab === 'in' ? 'Nessuna proposta in arrivo' : 'Nessuna proposta inviata'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map((p) => (
            <div key={p.id} className="rounded-2xl border border-white/[0.08] bg-surface/40 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className={'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ' + statusClass(p)}>
                  {statusLabel(p)}
                </span>
                <span className="text-sm text-muted-foreground">
                  Ricevi <span className="font-semibold text-ink">{p.receive.length}</span> · Dai{' '}
                  <span className="font-semibold text-ink">{p.give.length}</span>
                </span>
              </div>
              {((tab === 'in' && p.status === 'pending') ||
                (p.status === 'accepted' && !p.confirmedBy.includes(uid))) && (
                <div className="mt-3 flex gap-2">
                  {tab === 'in' && p.status === 'pending' && (
                    <>
                      <button onClick={() => acceptProposal(p.id)} className="rounded-xl bg-lime px-3 py-1.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 active:scale-[0.98]">Accetta</button>
                      <button onClick={() => declineProposal(p.id)} className="rounded-xl border border-white/15 px-3 py-1.5 text-sm text-ink transition-colors hover:bg-white/[0.05] active:scale-[0.98]">Rifiuta</button>
                    </>
                  )}
                  {p.status === 'accepted' && !p.confirmedBy.includes(uid) && (
                    <button onClick={() => confirmProposal(p, uid)} className="rounded-xl bg-lime px-3 py-1.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 active:scale-[0.98]">Conferma scambio fatto</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
