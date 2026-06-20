// figubook-app/src/pages/Album.tsx
import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { albumById } from '@/data/albumCatalog'
import { loadAlbumData } from '@/data/albums'
import type { AlbumData } from '@/data/albums/types'
import { useAlbum } from '@/hooks/useAlbum'
import { sectionStats } from '@/lib/album/stats'
import { computeStats } from '@/lib/db/albums'
import { sectionVars } from '@/lib/album/color'
import { AlbumLanding } from '@/components/album/AlbumLanding'
import { SectionSidebar } from '@/components/album/SectionSidebar'
import { SectionHero } from '@/components/album/SectionHero'
import { AlbumToolbar } from '@/components/album/AlbumToolbar'
import { StickerGrid, type Filter } from '@/components/album/StickerGrid'
import { StickerInfoOverlay } from '@/components/album/StickerInfoOverlay'
import { ContainerScroll } from '@/components/album/ContainerScroll'

export default function Album() {
  const { albumId = '' } = useParams()
  const entry = albumById[albumId]
  // Carico tipato per albumId: i derivati sono validi solo se loadState.id === albumId,
  // così cambiando album torno a "loading" senza setState sincrono dentro l'effetto.
  const [loadState, setLoadState] = useState<{ id: string; data: AlbumData | null; error: boolean }>({ id: '', data: null, error: false })
  const [activeId, setActiveId] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [insertOn, setInsertOn] = useState(false)
  const [infoCode, setInfoCode] = useState<string | null>(null)

  const album = useAlbum(albumId)

  useEffect(() => {
    let active = true
    loadAlbumData(albumId)
      .then((d) => {
        if (!active) return
        setLoadState({ id: albumId, data: d, error: !d })
        if (d) setActiveId(d.sections[0]?.id ?? '')
      })
      .catch(() => { if (active) setLoadState({ id: albumId, data: null, error: true }) })
    return () => { active = false }
  }, [albumId])

  const ready = loadState.id === albumId
  const data = ready ? loadState.data : null
  const dataError = ready ? loadState.error : false

  const section = useMemo(() => data?.sections.find((s) => s.id === activeId) ?? data?.sections[0], [data, activeId])
  const sectionIndex = useMemo(() => (data && section ? data.sections.indexOf(section) : 0), [data, section])

  if (!entry) {
    return <Centered>Album sconosciuto. <Link className="text-lime underline" to="/dashboard">Torna alla dashboard</Link></Centered>
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

  return (
    <main className="w-full px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <AlbumLanding entry={entry} stats={albumStats} />

      <ContainerScroll
        className="mt-8"
        header={
          <div className="text-center">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Editor figurine</div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">Le sezioni dell'album</h2>
          </div>
        }
      >
        <div className="grid gap-5 lg:grid-cols-[15rem_1fr]" style={section ? sectionVars(section.c1, section.c2) : undefined}>
          <SectionSidebar data={data} states={album.states} counts={album.counts} activeId={section.id} onSelect={(id) => { setActiveId(id); void album.flush() }} />
          <div>
            <SectionHero section={section} index={sectionIndex} stats={secStats} />
            <AlbumToolbar filter={filter} onFilter={setFilter} insertOn={insertOn} onToggleInsert={() => setInsertOn((v) => !v)} stats={secStats} />
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
          </div>
        </div>
      </ContainerScroll>

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
