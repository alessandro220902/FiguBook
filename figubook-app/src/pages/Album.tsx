// figubook-app/src/pages/Album.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { albumById } from '@/data/albumCatalog'
import { loadAlbumData } from '@/data/albums'
import type { AlbumData } from '@/data/albums/types'
import { useAlbum } from '@/hooks/useAlbum'
import { sectionStats } from '@/lib/album/stats'
import { computeStats } from '@/lib/db/albums'
import { sectionVars } from '@/lib/album/color'
import { AlbumLanding } from '@/components/album/AlbumLanding'
import { Breadcrumb } from '@/components/Breadcrumb'
import { SectionSidebar } from '@/components/album/SectionSidebar'
import { SectionAccordion } from '@/components/album/SectionAccordion'
import { SectionHero } from '@/components/album/SectionHero'
import { StickerGrid, type Filter } from '@/components/album/StickerGrid'
import { StickerInfoOverlay } from '@/components/album/StickerInfoOverlay'
import { AlbumViewTabs, type AlbumView } from '@/components/album/AlbumViewTabs'
import { AlbumFlatView } from '@/components/album/AlbumFlatView'

export default function Album() {
  const { albumId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const entry = albumById[albumId]
  // Carico tipato per albumId: i derivati sono validi solo se loadState.id === albumId,
  // così cambiando album torno a "loading" senza setState sincrono dentro l'effetto.
  const [loadState, setLoadState] = useState<{ id: string; data: AlbumData | null; error: boolean }>({ id: '', data: null, error: false })
  const [activeId, setActiveId] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [view, setView] = useState<AlbumView>('sections')
  const [insertOn, setInsertOn] = useState(false)
  const [infoCode, setInfoCode] = useState<string | null>(null)
  // Accordion mobile: id sezione aperta (single-open), null = tutte chiuse.
  const [openId, setOpenId] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const gridScrollRef = useRef<HTMLDivElement>(null)

  // Cambio sezione: porto il pannello in cima (sotto la navbar) e resetto lo scroll
  // interno della griglia in alto. rAF: dopo che React ha renderizzato la sezione.
  function selectSection(id: string) {
    setActiveId(id)
    void album.flush()
    requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      if (gridScrollRef.current) gridScrollRef.current.scrollTop = 0
    })
  }

  // Accordion mobile single-open: ritap chiude; aprire sincronizza la sezione attiva.
  function toggleSection(id: string) {
    if (openId === id) {
      setOpenId(null)
    } else {
      setOpenId(id)
      setActiveId(id)
      void album.flush()
    }
  }

  const album = useAlbum(albumId)

  useEffect(() => {
    let active = true
    loadAlbumData(albumId)
      .then((d) => {
        if (!active) return
        setLoadState({ id: albumId, data: d, error: !d })
        if (d) {
          const first = d.sections[0]?.id ?? ''
          setActiveId(first)
          // Mobile: accordion tutto chiuso all'ingresso -> si vede prima il
          // landing (statistiche), non si entra dritti nella prima sezione.
          setOpenId(null)
        }
      })
      .catch(() => { if (active) setLoadState({ id: albumId, data: null, error: true }) })
    return () => { active = false }
  }, [albumId])

  // Deep-link da ricerca navbar: /album/:id?code=N apre la sezione che contiene
  // la carta e ne mostra l'overlay. Consumo il param così il refresh non ri-apre.
  useEffect(() => {
    if (loadState.id !== albumId || !loadState.data) return
    const code = searchParams.get('code')
    if (!code) return
    const sec = loadState.data.sections.find((s) => s.codes.includes(code))
    const raf = requestAnimationFrame(() => {
      if (sec) {
        setActiveId(sec.id)
        setOpenId(sec.id)
        setInfoCode(code)
      }
      setSearchParams({}, { replace: true })
    })
    return () => cancelAnimationFrame(raf)
  }, [loadState, albumId, searchParams, setSearchParams])

  const ready = loadState.id === albumId
  const data = ready ? loadState.data : null
  const dataError = ready ? loadState.error : false

  const section = useMemo(() => data?.sections.find((s) => s.id === activeId) ?? data?.sections[0], [data, activeId])
  const sectionIndex = useMemo(() => (data && section ? data.sections.indexOf(section) : 0), [data, section])

  if (!entry) {
    return <Centered>Album sconosciuto. <Link className="text-lime underline" to="/home">Torna alla home</Link></Centered>
  }
  if (dataError) {
    return <Centered>Dati album non disponibili.</Centered>
  }
  if (!data || !section) {
    return <Centered>Caricamento album…</Centered>
  }

  const albumStats = computeStats(albumId, album.states, album.counts)
  const secStats = sectionStats(album.states, album.counts, section.codes)
  const infoSection = infoCode ? data.sections.find((s) => s.codes.includes(infoCode)) ?? section : section

  // Codici per la condivisione: mancanti = count 0, doppie = count >= 2 (su tutto l'album)
  const allCodes = data.sections.flatMap((s) => s.codes)
  const missingCodes = allCodes.filter((c) => album.countOf(c) === 0)
  const doubleCodes = allCodes.filter((c) => album.countOf(c) >= 2)

  return (
    <main className="album-theme w-full px-0 pb-16 pt-6">
      <Breadcrumb items={[{ label: 'Album', to: '/album' }, { label: entry.title }]} />
      <AlbumLanding entry={entry} stats={albumStats} missingCodes={missingCodes} doubleCodes={doubleCodes} />

      <div className="mt-8 flex items-center justify-center">
        <AlbumViewTabs value={view} onChange={setView} />
      </div>

      {view === 'flat' ? (
        <AlbumFlatView
          data={data}
          stats={albumStats}
          countOf={album.countOf}
          onAdd={album.increment}
          onRemove={album.decrement}
          onInfo={(code) => setInfoCode(code)}
        />
      ) : (
        (() => {
          const hero = (
            <SectionHero section={section} index={sectionIndex} stats={secStats} filter={filter} onFilter={setFilter} insertOn={insertOn} onToggleInsert={() => setInsertOn((v) => !v)} />
          )
          const grid = (
            <StickerGrid
              section={section}
              names={data.names}
              countOf={album.countOf}
              insertOn={insertOn}
              filter={filter}
              onAdd={album.increment}
              onRemove={album.decrement}
              onInfo={(code) => setInfoCode(code)}
            />
          )
          return (
            <>
              {/* Desktop: pannello ad altezza schermo (sticky), sidebar + griglia con
                  scroll interni -> la pagina non cresce. */}
              <div
                ref={panelRef}
                className="mt-4 hidden scroll-mt-24 gap-5 md:grid md:grid-cols-[15rem_1fr] md:items-start"
                style={sectionVars(section.c1, section.c2)}
              >
                {/* Sidebar sticky a tutta altezza (scroll interno se lunga);
                    la griglia scorre con la pagina -> niente carte tagliate. */}
                <div className="md:sticky md:top-24 md:h-[calc(100vh-7rem)]">
                  <SectionSidebar data={data} states={album.states} counts={album.counts} activeId={section.id} onSelect={selectSection} />
                </div>
                <div ref={gridScrollRef} className="flex min-w-0 flex-col">
                  {hero}
                  <div className="mt-4">{grid}</div>
                </div>
              </div>

              {/* Mobile: accordion single-open. Solo la sezione aperta mostra hero+carte,
                  così la pagina resta compatta e le carte non finiscono in fondo. */}
              <div className="mt-4 md:hidden" style={sectionVars(section.c1, section.c2)}>
                <SectionAccordion
                  data={data}
                  states={album.states}
                  counts={album.counts}
                  openId={openId}
                  onToggle={toggleSection}
                  renderDetail={() => (
                    <>
                      {hero}
                      <div className="mt-4">{grid}</div>
                    </>
                  )}
                />
              </div>
            </>
          )
        })()
      )}

      <StickerInfoOverlay
        open={infoCode !== null}
        code={infoCode ?? ''}
        name={infoCode ? data.names[infoCode] : undefined}
        sectionName={infoSection.name}
        c1={infoSection.c1}
        c2={infoSection.c2}
        count={infoCode ? album.countOf(infoCode) : 0}
        onAdd={() => infoCode && album.increment(infoCode)}
        onRemove={() => infoCode && album.decrement(infoCode)}
        onClose={() => setInfoCode(null)}
      />
    </main>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return <main className="grid min-h-[60vh] place-items-center px-4 text-center text-muted-foreground">{children}</main>
}
