import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Inbox, Layers } from 'lucide-react'
import { requireUid } from '@/lib/firebase'
import { fetchIndexUsers, type TradeIndexEntry } from '@/lib/db/tradeIndex'
import { subscribeAlbum, subscribeMyAlbumIds } from '@/lib/db/albums'
import { loadAlbumData } from '@/data/albums'
import { allCodesFromSections } from '@/lib/trade/albumCodes'
import { deriveInventory, computeMatch, type Inventory } from '@/lib/trade/match'
import { albumById } from '@/data/albumCatalog'
import { getPublicByUid } from '@/lib/db/publicProfiles'
import { createProposal } from '@/lib/db/proposals'
import { FilterChips, type TradeFilters } from '@/components/trade/FilterChips'
import { MatchCard } from '@/components/trade/MatchCard'
import { ComponiScambio } from '@/components/trade/ComponiScambio'

// Una riga = un utente candidato allo scambio, col match già calcolato.
interface Row {
  entry: TradeIndexEntry
  username: string
  match: ReturnType<typeof computeMatch>
}

export default function Scambi() {
  const uid = requireUid()
  const [myAlbums, setMyAlbums] = useState<string[]>([])
  const [albumId, setAlbumId] = useState<string | null>(null)
  const [myInv, setMyInv] = useState<Inventory | null>(null)
  const [names, setNames] = useState<Record<string, string>>({})
  const [rows, setRows] = useState<Row[]>([])
  const [filters, setFilters] = useState<TradeFilters>({ reciprocal: true, nearMe: false })
  const [composing, setComposing] = useState<Row | null>(null)
  const [myCitta, setMyCitta] = useState('')

  // Album che ho attivato per gli scambi.
  useEffect(() => subscribeMyAlbumIds(uid, ({ ids }) => setMyAlbums(ids)), [uid])
  // La mia città (per il filtro "vicino a me").
  useEffect(() => { getPublicByUid(uid).then((p) => setMyCitta(p?.citta ?? '')) }, [uid])

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
        out.push({ entry: e, username: p?.username ?? 'utente', match })
      }
      setRows(out)
    })
  }, [albumId, myInv, uid])

  const visible = useMemo(() => {
    return rows
      .filter((r) => (filters.reciprocal ? r.match.reciprocal : r.match.receiveCount + r.match.giveCount > 0))
      .filter((r) => (filters.nearMe ? r.entry.citta && r.entry.citta === myCitta : true))
      .sort((a, b) =>
        b.match.receiveCount + b.match.giveCount - (a.match.receiveCount + a.match.giveCount))
  }, [rows, filters, myCitta])

  // Invia una proposta + notifica al destinatario.
  async function handleSend(row: Row, give: string[], receive: string[]) {
    await createProposal(uid, row.entry.uid, albumId!, give, receive)
    const { addDoc, collection } = await import('firebase/firestore')
    const { db } = await import('@/lib/firebase')
    await addDoc(collection(db, 'users', row.entry.uid, 'notifications'), {
      fromUid: uid, type: 'trade', title: 'Hai ricevuto una proposta di scambio',
      icon: '🔄', href: '/scambi/miei', read: false, at: Date.now(),
    })
    setComposing(null)
  }

  // Stato 1: scelta dell'album (solo quelli attivati per gli scambi).
  if (!albumId) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="font-display text-[34px] font-semibold tracking-tight text-ink sm:text-[42px]">Scambi</h1>
        <p className="mt-1.5 text-base text-ink-2">Scegli un album per trovare scambi.</p>

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
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
            {myAlbums.map((id) => (
              <button
                key={id}
                onClick={() => setAlbumId(id)}
                className="group flex flex-col gap-2 rounded-2xl border border-white/[0.08] bg-surface/40 p-4 text-left transition-colors hover:border-lime/40"
              >
                <Layers className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-lime" />
                <div>
                  <div className="font-semibold text-ink">{albumById[id]?.title ?? id}</div>
                  <div className="text-xs text-muted-foreground">{albumById[id]?.season}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Stato 2: griglia dei match per l'album scelto (+ modale componi scambio).
  return (
    <div className="mx-auto w-full max-w-5xl">
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
        <Link
          to="/scambi/miei"
          className="ml-auto shrink-0 rounded-full border border-white/12 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-white/30 hover:text-foreground"
        >
          I miei scambi
        </Link>
      </div>
      <div className="mb-5"><FilterChips filters={filters} onChange={setFilters} /></div>
      {composing ? (
        <ComponiScambio
          username={composing.username}
          albumNames={names}
          receiveCodes={composing.match.receive}
          giveCodes={composing.match.give}
          onSend={(g, r) => handleSend(composing, g, r)}
          onCancel={() => setComposing(null)}
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
              citta={r.entry.citta}
              match={r.match}
              onCompose={() => setComposing(r)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
