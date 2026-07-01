import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Inbox } from 'lucide-react'
import { requireUid } from '@/lib/firebase'
import { fetchIndexUsers, type TradeIndexEntry } from '@/lib/db/tradeIndex'
import { subscribeAlbum } from '@/lib/db/albums'
import { useCollection } from '@/hooks/useCollection'
import { loadAlbumData } from '@/data/albums'
import { allCodesFromSections } from '@/lib/trade/albumCodes'
import { deriveInventory, computeMatch, type Inventory } from '@/lib/trade/match'
import { albumById } from '@/data/albumCatalog'
import { getPublicByUid } from '@/lib/db/publicProfiles'
import { getRating, getReviews, createReview, type Rating } from '@/lib/db/feedback'
import {
  createProposal, subscribeMyProposals, acceptProposal, declineProposal, confirmProposal,
  cancelProposal, updateProposalOffer, otherParticipant, type Proposal,
} from '@/lib/db/proposals'
import { proposalView } from '@/lib/trade/proposalView'
import { FilterChips, type TradeFilters } from '@/components/trade/FilterChips'
import { MatchCard } from '@/components/trade/MatchCard'
import { ComponiScambio } from '@/components/trade/ComponiScambio'
import { SwapCard, type Person } from '@/components/trade/SwapCard'
import { CardsDialog } from '@/components/trade/CardsDialog'
import { ReviewDialog } from '@/components/trade/ReviewDialog'

// Una riga = un utente candidato allo scambio, col match già calcolato.
interface Row {
  entry: TradeIndexEntry
  username: string
  avatarId?: string
  match: ReturnType<typeof computeMatch>
  rating: Rating
}

// Cache reputazione per sessione: evita riletture dello stesso uid.
const ratingCache = new Map<string, Rating>()
async function ratingFor(uid: string): Promise<Rating> {
  const cached = ratingCache.get(uid)
  if (cached) return cached
  const r = await getRating(uid)
  ratingCache.set(uid, r)
  return r
}

const btnPrimary = 'rounded-xl bg-lime px-3 py-1.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 active:scale-[0.98]'
const btnGhost = 'rounded-xl border border-white/15 px-3 py-1.5 text-sm text-ink transition-colors hover:bg-white/[0.05] active:scale-[0.98]'

// Notifica l'altro partecipante (secondaria: se fallisce non blocca l'azione).
// A livello modulo: evita che react-compiler la tratti come impura in render.
async function notifyTrade(fromUid: string, toUid: string, title: string) {
  try {
    const { addDoc, collection } = await import('firebase/firestore')
    const { db } = await import('@/lib/firebase')
    await addDoc(collection(db, 'users', toUid, 'notifications'), {
      fromUid, type: 'trade', title, icon: '🔄', href: '/scambi', read: false, at: Date.now(),
    })
  } catch (e) { console.error('notifica scambio', e) }
}

function Section({ title, items, render }: { title: string; items: Proposal[]; render: (p: Proposal) => React.ReactNode }) {
  if (items.length === 0) return null
  return (
    <section className="mt-10">
      <h2 className="mb-3 font-display text-xl font-bold tracking-tight text-ink">{title} <span className="text-muted-foreground">({items.length})</span></h2>
      <div className="grid gap-3 sm:grid-cols-2">{items.map(render)}</div>
    </section>
  )
}

export default function Scambi() {
  const uid = requireUid()
  const { albums, archived } = useCollection()
  const [albumId, setAlbumId] = useState<string | null>(null)
  const [myInv, setMyInv] = useState<Inventory | null>(null)
  const [names, setNames] = useState<Record<string, string>>({})
  const [rows, setRows] = useState<Row[]>([])
  const [filters, setFilters] = useState<TradeFilters>({ reciprocal: true, nearMe: false, minStars: false })
  const [composing, setComposing] = useState<Row | null>(null)
  const [myCitta, setMyCitta] = useState('')
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Le mie proposte (tutte le sezioni) + risoluzione persone/album/recensioni.
  const [props_, setProps_] = useState<Proposal[]>([])
  const [people, setPeople] = useState<Record<string, Person>>({})
  const [albumMeta, setAlbumMeta] = useState<Record<string, { title: string; cover?: string; names: Record<string, string> }>>({})
  const [viewing, setViewing] = useState<Proposal | null>(null)
  const [reviewed, setReviewed] = useState<Set<string>>(new Set())
  const [reviewing, setReviewing] = useState<Proposal | null>(null)
  const [editing, setEditing] = useState<Proposal | null>(null)
  // Candidati completi per la modifica: mie doppie∩sue mancanti e viceversa.
  const [editCand, setEditCand] = useState<{ receive: string[]; give: string[] } | null>(null)

  useEffect(() => subscribeMyProposals(uid, setProps_), [uid])

  // Quando apro "Modifica proposta": ricalcolo la lista completa dei candidati
  // reciproci per quell'album/utente, così posso aggiungere carte (non solo
  // quelle già offerte). Le carte già nella proposta restano pre-spuntate.
  useEffect(() => {
    if (!editing) return
    const p = editing
    const ou = otherParticipant(p.participants, uid)
    let off = false
    let unsub = () => {}
    ;(async () => {
      const data = await loadAlbumData(p.albumId)
      if (!data || off) return
      const allCodes = allCodesFromSections(data)
      const entries = await fetchIndexUsers(p.albumId, uid)
      const them = entries.find((e) => e.uid === ou)
      unsub = subscribeAlbum(uid, p.albumId, (d) => {
        const myInv = deriveInventory(allCodes, d.states)
        const m = computeMatch(myInv, { doubles: them?.doubles ?? [], missing: them?.missing ?? [] }, allCodes.length)
        if (!off) setEditCand({ receive: m.receive, give: m.give })
      })
    })()
    return () => { off = true; unsub(); setEditCand(null) }
  }, [editing, uid])

  // Album miei non archiviati (ogni album posseduto è scambiabile).
  const myAlbums = useMemo(
    () => albums.filter((a) => !archived.includes(a.id)),
    [albums, archived],
  )
  // La mia città (per il filtro "vicino a me").
  useEffect(() => { getPublicByUid(uid).then((p) => setMyCitta(p?.citta ?? '')) }, [uid])

  // Risolvo profili (username+rating), meta album (titolo/cover/nomi carte) e le
  // recensioni già lasciate da me, on-demand per le proposte presenti (con cache).
  useEffect(() => {
    let off = false
    ;(async () => {
      const uids = new Set<string>()
      const albums = new Set<string>()
      props_.forEach((p) => { p.participants.forEach((u) => uids.add(u)); albums.add(p.albumId) })
      const ppl: Record<string, Person> = { ...people }
      for (const u of uids) {
        if (ppl[u]) continue
        const pr = await getPublicByUid(u)
        const r = await getRating(u)
        ppl[u] = { uid: u, username: pr?.username ?? 'utente', rating: r.avg }
      }
      const meta = { ...albumMeta }
      for (const a of albums) {
        if (meta[a]) continue
        const data = await loadAlbumData(a)
        meta[a] = { title: albumById[a]?.title ?? a, cover: albumById[a]?.cover, names: data?.names ?? {} }
      }
      const done = new Set<string>()
      for (const p of props_.filter((x) => x.status === 'completed')) {
        const ou = otherParticipant(p.participants, uid)
        const revs = await getReviews(ou)
        if (revs.some((r) => r.id === p.id && r.fromUid === uid)) done.add(p.id)
      }
      if (!off) { setPeople(ppl); setAlbumMeta(meta); setReviewed(done) }
    })()
    return () => { off = true }
  }, [props_, uid]) // eslint-disable-line react-hooks/exhaustive-deps

  const notify = (toUid: string, title: string) => notifyTrade(uid, toUid, title)

  // Suddivisione in sezioni + etichette stato.
  const active = props_.filter((p) => p.status !== 'declined' && p.status !== 'cancelled')
  const received = active.filter((p) => p.status === 'pending' && p.turnUid === uid)
  const sent = active.filter((p) => p.status === 'pending' && p.turnUid !== uid)
  const inProgress = active.filter((p) => p.status === 'accepted')
  const completed = active.filter((p) => p.status === 'completed')

  const statusLabel = (p: Proposal) =>
    p.status === 'completed' ? 'Completato'
    : p.status === 'accepted' ? (p.confirmedBy.includes(uid) ? 'In attesa conferma' : 'Conferma quando fatto')
    : p.turnUid === uid ? 'Tocca a te' : 'In attesa di risposta'
  const statusClass = (p: Proposal) =>
    p.status === 'completed' ? 'border-lime/30 bg-lime/10 text-lime'
    : 'border-white/12 bg-white/[0.04] text-muted-foreground'

  // Quando scelgo un album: carico i suoi codici e mi sottoscrivo al mio inventario live.
  useEffect(() => {
    if (!albumId) return
    let unsub = () => {}
    loadAlbumData(albumId).then((data) => {
      if (!data) return
      const allCodes = allCodesFromSections(data)
      setNames(data.names ?? {})
      unsub = subscribeAlbum(uid, albumId, (d) => setMyInv(deriveInventory(allCodes, d.states)))
    })
    return () => unsub()
  }, [albumId, uid])

  // Ricalcolo i match quando cambia il mio inventario.
  useEffect(() => {
    if (!albumId || !myInv) return
    const total = albumById[albumId]?.total ?? 0
    fetchIndexUsers(albumId, uid).then(async (entries) => {
      const out: Row[] = []
      for (const e of entries) {
        const match = computeMatch(myInv, { doubles: e.doubles, missing: e.missing }, total)
        const p = await getPublicByUid(e.uid)
        const rating = await ratingFor(e.uid)
        out.push({ entry: e, username: p?.username ?? 'utente', avatarId: p?.avatarId, match, rating })
      }
      setRows(out)
    })
  }, [albumId, myInv, uid])

  const visible = useMemo(() => {
    return rows
      .filter((r) => (filters.reciprocal ? r.match.reciprocal : r.match.receiveCount + r.match.giveCount > 0))
      .filter((r) => (filters.nearMe ? r.entry.citta && r.entry.citta === myCitta : true))
      .filter((r) => (filters.minStars ? r.rating.avg >= 4 : true))
      .sort((a, b) =>
        b.match.receiveCount + b.match.giveCount - (a.match.receiveCount + a.match.giveCount))
  }, [rows, filters, myCitta])

  // Invia una proposta + notifica al destinatario.
  async function handleSend(row: Row, give: string[], receive: string[]) {
    setSending(true)
    setNotice(null)
    try {
      await createProposal(uid, row.entry.uid, albumId!, give, receive)
      // La notifica è secondaria: se fallisce non annulla la proposta.
      try {
        const { addDoc, collection } = await import('firebase/firestore')
        const { db } = await import('@/lib/firebase')
        await addDoc(collection(db, 'users', row.entry.uid, 'notifications'), {
          fromUid: uid, type: 'trade', title: 'Hai ricevuto una proposta di scambio',
          icon: '🔄', href: '/scambi', read: false, at: Date.now(),
        })
      } catch (e) { console.error('notifica scambio', e) }
      setComposing(null)
      setNotice({ type: 'ok', text: 'Proposta inviata! La trovi in "I miei scambi".' })
      setTimeout(() => setNotice(null), 4000)
    } catch (e) {
      console.error('invio proposta', e)
      setNotice({ type: 'err', text: 'Impossibile inviare la proposta. Verifica di aver confermato la tua email, poi riprova.' })
    } finally {
      setSending(false)
    }
  }

  // Stato 1: scelta dell'album (solo quelli attivati per gli scambi).
  if (!albumId) {
    return (
      <div className="mx-auto w-full max-w-[88rem]">
        <h1 className="font-display text-[34px] font-semibold tracking-tight text-ink sm:text-[42px]">I miei scambi</h1>
        <p className="mt-1.5 text-base text-ink-2">Scegli un album per proporre scambi, o gestisci le tue proposte qui sotto.</p>

        {myAlbums.length === 0 ? (
          <div className="mt-6 grid place-items-center gap-2 rounded-2xl border border-border bg-background px-4 py-12 text-center">
            <Inbox className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-semibold text-ink">Non hai ancora album</p>
            <p className="text-sm text-muted-foreground">
              Aggiungine uno da{' '}
              <Link to="/album" className="font-medium text-lime hover:underline">i tuoi album</Link>.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {myAlbums.map((a) => {
              const entry = a.entry
              return (
                <button
                  key={a.id}
                  onClick={() => setAlbumId(a.id)}
                  className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 text-left shadow-[0_18px_40px_-20px_rgba(0,0,0,0.7)] transition-transform duration-150 ease-out hover:-translate-y-0.5"
                  style={entry.cover ? undefined : { background: `linear-gradient(145deg, ${entry.c1} 0%, ${entry.c2} 100%)` }}
                >
                  {/* Copertina che riempie la card portrait; altrimenti gradiente colore. */}
                  {entry.cover && (
                    <img
                      src={entry.cover}
                      alt=""
                      className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                  {/* Sfumatura morbida e alta: stacco lieve, nessuna linea netta. */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.72) 22%, rgba(0,0,0,0.35) 48%, transparent 80%)' }}
                  />
                  {/* Testo direttamente sulla sfumatura (no pannello, no bordo). */}
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="font-mono text-[10px] uppercase tracking-wide text-white/70">{entry.editor}</div>
                    <h2 className="mt-0.5 truncate text-lg font-semibold tracking-tight text-white">{entry.title}</h2>
                    <div className="mt-1 flex items-center gap-3 text-sm text-white/90">
                      <span><span className="font-semibold tabular-nums">{a.have}</span> su {a.total}</span>
                      <span className="text-white/50">·</span>
                      <span><span className="font-semibold tabular-nums text-lime">{a.doubles}</span> doppie</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        <Section title="Proposte ricevute" items={received} render={(p) => (
          <SwapCard key={p.id} proposal={p} meUid={uid} people={people}
            albumTitle={albumMeta[p.albumId]?.title ?? ''} albumCover={albumMeta[p.albumId]?.cover}
            onViewCards={() => setViewing(p)} statusLabel={statusLabel(p)} statusClass={statusClass(p)}
            actions={<>
              <button onClick={async () => { await acceptProposal(p.id); await notify(otherParticipant(p.participants, uid), 'Proposta accettata') }} className={btnPrimary}>Accetta</button>
              <button onClick={() => declineProposal(p.id)} className={btnGhost}>Rifiuta</button>
              <button onClick={() => setEditing(p)} className={btnGhost}>Modifica proposta</button>
            </>} />
        )} />

        <Section title="Proposte inviate" items={sent} render={(p) => (
          <SwapCard key={p.id} proposal={p} meUid={uid} people={people}
            albumTitle={albumMeta[p.albumId]?.title ?? ''} albumCover={albumMeta[p.albumId]?.cover}
            onViewCards={() => setViewing(p)} statusLabel={statusLabel(p)} statusClass={statusClass(p)}
            actions={<>
              <button onClick={() => cancelProposal(p.id)} className={btnGhost}>Annulla scambio</button>
              <button onClick={() => setEditing(p)} className={btnGhost}>Modifica proposta</button>
            </>} />
        )} />

        <Section title="Scambi in corso" items={inProgress} render={(p) => (
          <SwapCard key={p.id} proposal={p} meUid={uid} people={people}
            albumTitle={albumMeta[p.albumId]?.title ?? ''} albumCover={albumMeta[p.albumId]?.cover}
            onViewCards={() => setViewing(p)} statusLabel={statusLabel(p)} statusClass={statusClass(p)}
            actions={!p.confirmedBy.includes(uid)
              ? <button onClick={() => confirmProposal(p, uid)} className={btnPrimary}>Conferma scambio fatto</button>
              : null} />
        )} />

        <Section title="Scambi completati" items={completed} render={(p) => (
          <SwapCard key={p.id} proposal={p} meUid={uid} people={people}
            albumTitle={albumMeta[p.albumId]?.title ?? ''} albumCover={albumMeta[p.albumId]?.cover}
            onViewCards={() => setViewing(p)} statusLabel={statusLabel(p)} statusClass={statusClass(p)}
            actions={reviewed.has(p.id)
              ? <span className="text-sm text-muted-foreground">Recensione inviata</span>
              : <button onClick={() => setReviewing(p)} className={btnPrimary}>Lascia recensione</button>} />
        )} />

        {viewing && (() => {
          const v = proposalView(viewing, uid)
          const nm = albumMeta[viewing.albumId]?.names ?? {}
          return <CardsDialog
            fromLabel={`${people[v.fromUid]?.username ?? 'utente'} dà`}
            toLabel={`${people[v.toUid]?.username ?? 'utente'} dà`}
            fromCodes={v.fromGives} toCodes={v.toGives} names={nm}
            onClose={() => setViewing(null)} />
        })()}

        {reviewing && (
          <div className="fixed inset-0 z-50 grid place-items-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setReviewing(null)} />
            <div className="relative w-full max-w-md">
              <ReviewDialog
                username={people[otherParticipant(reviewing.participants, uid)]?.username ?? 'utente'}
                onSubmit={async (r, c) => {
                  await createReview(otherParticipant(reviewing.participants, uid), reviewing.id, uid, r, c)
                  setReviewed((s) => new Set(s).add(reviewing.id)); setReviewing(null)
                }}
                onCancel={() => setReviewing(null)} />
            </div>
          </div>
        )}

        {editing && (() => {
          const meta = albumMeta[editing.albumId]
          const iAmFrom = editing.fromUid === uid
          const myGiveInit = iAmFrom ? editing.give : editing.receive
          const myRecvInit = iAmFrom ? editing.receive : editing.give
          // Lista completa candidati (unione con l'offerta corrente, così le carte
          // già proposte restano visibili anche se cambiassero gli inventari).
          const uniq = (a: string[], b: string[]) => Array.from(new Set([...a, ...b]))
          const recvCodes = uniq(editCand?.receive ?? [], myRecvInit)
          const giveCodes = uniq(editCand?.give ?? [], myGiveInit)
          return (
            <div className="fixed inset-0 z-50 grid place-items-center overflow-auto p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditing(null)} />
              <div className="relative w-full max-w-2xl">
                <ComponiScambio
                  username={people[otherParticipant(editing.participants, uid)]?.username ?? 'utente'}
                  albumNames={meta?.names ?? {}}
                  receiveCodes={recvCodes} giveCodes={giveCodes}
                  initialReceive={myRecvInit} initialGive={myGiveInit}
                  mode="edit"
                  onCancel={() => setEditing(null)}
                  onSend={async (give, receive) => {
                    const g = iAmFrom ? give : receive
                    const r = iAmFrom ? receive : give
                    await updateProposalOffer(editing, uid, g, r)
                    await notify(otherParticipant(editing.participants, uid), 'Proposta aggiornata')
                    setEditing(null)
                  }} />
              </div>
            </div>
          )
        })()}
      </div>
    )
  }

  // Stato 2: griglia dei match per l'album scelto (+ modale componi scambio).
  return (
    <div className="mx-auto w-full max-w-[88rem]">
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setAlbumId(null)}
          aria-label="Torna agli album"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/12 bg-white/[0.06] text-foreground transition-colors hover:bg-white/10 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="min-w-0 truncate font-display text-2xl font-bold tracking-tight text-ink">{albumById[albumId]?.title}</h1>
      </div>
      <div className="mb-5"><FilterChips filters={filters} onChange={setFilters} /></div>
      {notice && (
        <div
          className={
            'mb-4 inline-flex max-w-fit rounded-xl border px-3.5 py-2 text-sm ' +
            (notice.type === 'ok'
              ? 'border-lime/30 bg-lime/10 text-lime'
              : 'border-red-500/30 bg-red-500/10 text-red-300')
          }
        >
          {notice.text}
        </div>
      )}
      {composing ? (
        <ComponiScambio
          username={composing.username}
          albumNames={names}
          receiveCodes={composing.match.receive}
          giveCodes={composing.match.give}
          onSend={(g, r) => handleSend(composing, g, r)}
          onCancel={() => setComposing(null)}
          sending={sending}
        />
      ) : visible.length === 0 ? (
        <div className="grid place-items-center gap-2 rounded-2xl border border-border bg-background px-4 py-12 text-center">
          <Inbox className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-semibold text-ink">Nessuno scambio disponibile</p>
          <p className="text-sm text-muted-foreground">Prova a togliere i filtri o riprova più tardi.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((r) => (
            <MatchCard
              key={r.entry.uid}
              username={r.username}
              avatarId={r.avatarId}
              citta={r.entry.citta}
              match={r.match}
              rating={r.rating}
              onCompose={() => setComposing(r)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
