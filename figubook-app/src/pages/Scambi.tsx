import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { requireUid } from '@/lib/firebase'
import { subscribeTradeAlbums } from '@/lib/db/trade'
import { fetchIndexUsers, type TradeIndexEntry } from '@/lib/db/tradeIndex'
import { subscribeAlbum } from '@/lib/db/albums'
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
  const [tradeAlbums, setTradeAlbums] = useState<string[]>([])
  const [albumId, setAlbumId] = useState<string | null>(null)
  const [myInv, setMyInv] = useState<Inventory | null>(null)
  const [names, setNames] = useState<Record<string, string>>({})
  const [rows, setRows] = useState<Row[]>([])
  const [filters, setFilters] = useState<TradeFilters>({ reciprocal: true, nearMe: false })
  const [composing, setComposing] = useState<Row | null>(null)
  const [myCitta, setMyCitta] = useState('')

  // Album che ho attivato per gli scambi.
  useEffect(() => subscribeTradeAlbums(uid, setTradeAlbums), [uid])
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
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-1">Scambi</h1>
        <p className="text-muted-foreground mb-6">Scegli un album per trovare scambi.</p>
        {tradeAlbums.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nessun album attivo per gli scambi. Attivali da{' '}
            <Link to="/album" className="text-lime underline">i tuoi album</Link>.
          </p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {tradeAlbums.map((id) => (
            <button
              key={id}
              onClick={() => setAlbumId(id)}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:border-lime/40 transition"
            >
              <div className="font-semibold">{albumById[id]?.title ?? id}</div>
              <div className="text-xs text-muted-foreground">{albumById[id]?.season}</div>
            </button>
          ))}
        </div>
      </main>
    )
  }

  // Stato 2: griglia dei match per l'album scelto (+ modale componi scambio).
  return (
    <main className="max-w-5xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setAlbumId(null)} className="text-sm text-muted-foreground">← Album</button>
        <h1 className="text-2xl font-bold">{albumById[albumId]?.title}</h1>
        <Link to="/scambi/miei" className="ml-auto text-sm text-lime underline">I miei scambi</Link>
      </div>
      <div className="mb-4"><FilterChips filters={filters} onChange={setFilters} /></div>
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
        <p className="text-muted-foreground">Nessuno scambio disponibile per ora.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
    </main>
  )
}
