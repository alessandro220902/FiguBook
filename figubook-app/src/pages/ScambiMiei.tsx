import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/scambi" className="text-sm text-muted-foreground">← Scambi</Link>
        <h1 className="text-2xl font-bold">I miei scambi</h1>
      </div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('in')} className={`px-3 py-1 rounded-full ${tab==='in'?'bg-lime text-black':'border border-white/15'}`}>In arrivo</button>
        <button onClick={() => setTab('out')} className={`px-3 py-1 rounded-full ${tab==='out'?'bg-lime text-black':'border border-white/15'}`}>Inviate</button>
      </div>
      {shown.length === 0 && <p className="text-muted-foreground">Niente qui.</p>}
      <div className="flex flex-col gap-3">
        {shown.map((p) => (
          <div key={p.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-sm text-muted-foreground mb-2">{statusLabel(p)}</div>
            <div className="text-sm">Ricevi {p.receive.length} · Dai {p.give.length}</div>
            <div className="flex gap-2 mt-3">
              {tab === 'in' && p.status === 'pending' && (
                <>
                  <button onClick={() => acceptProposal(p.id)} className="rounded-xl px-3 py-1 bg-lime text-black font-semibold">Accetta</button>
                  <button onClick={() => declineProposal(p.id)} className="rounded-xl px-3 py-1 border border-white/15">Rifiuta</button>
                </>
              )}
              {p.status === 'accepted' && !p.confirmedBy.includes(uid) && (
                <button onClick={() => confirmProposal(p, uid)} className="rounded-xl px-3 py-1 bg-lime text-black font-semibold">Conferma scambio fatto</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
