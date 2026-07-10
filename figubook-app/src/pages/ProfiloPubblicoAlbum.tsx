import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Breadcrumb } from '@/components/Breadcrumb'
import { getPublicByUsername } from '@/lib/db/publicProfiles'
import { getOtherAlbum } from '@/lib/db/otherAlbums'
import { loadAlbumData } from '@/data/albums'
import { computeStats, type AlbumDoc } from '@/lib/db/albums'
import { counterOf } from '@/lib/album/stats'
import { albumById } from '@/data/albumCatalog'
import type { AlbumData } from '@/data/albums/types'
import type { PublicProfile } from '@/lib/db/profile'
import { FadeIn } from '@/components/home/FadeIn'

export default function ProfiloPubblicoAlbum() {
  const { username = '', albumId = '' } = useParams()
  return <Inner key={`${username}/${albumId}`} username={username} albumId={albumId} />
}

function Inner({ username, albumId }: { username: string; albumId: string }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [album, setAlbum] = useState<AlbumDoc | null>(null)
  const [data, setData] = useState<AlbumData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      const p = await getPublicByUsername(username)
      if (!active) return
      setProfile(p)
      if (p) {
        const [a, d] = await Promise.all([getOtherAlbum(p.uid, albumId), loadAlbumData(albumId)])
        if (!active) return
        setAlbum(a)
        setData(d)
      }
      setLoading(false)
    })()
    return () => { active = false }
  }, [username, albumId])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <div className="h-40 animate-pulse rounded-2xl bg-bg-elev" />
      </div>
    )
  }

  const entry = albumById[albumId]
  if (!profile || !album || !data || !entry) {
    return (
      <div className="mx-auto w-full max-w-3xl py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Album non disponibile</h1>
        <p className="mt-2 text-ink-2">Questo album non e' visibile o non esiste.</p>
        <Link
          to={`/u/${username}`}
          className="mt-5 inline-block rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-ink-2 hover:text-ink"
        >
          Torna al profilo
        </Link>
      </div>
    )
  }

  const stats = computeStats(albumId, album.states, album.counts)
  const allCodes = data.sections.flatMap((s) => s.codes)
  const missingCodes = allCodes.filter((c) => counterOf(c, album.states, album.counts) === 0)
  const doubleCodes = allCodes.filter((c) => counterOf(c, album.states, album.counts) >= 2)

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Breadcrumb items={[{ label: 'Community', to: '/community' }, { label: profile.username, to: `/u/${username}` }, { label: entry.title }]} />

      <FadeIn>
        <div className="rounded-2xl border border-white/[0.1] bg-surface/40 p-6 sm:p-7">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">{entry.title}</h1>
          <p className="mt-1 text-sm text-ink-2">{entry.editor} · {entry.season}</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-lime" style={{ width: `${stats.pct}%` }} />
            </div>
            <span className="text-sm font-semibold text-ink">{stats.pct}%</span>
          </div>
          <p className="mt-1.5 text-sm text-ink-2">{stats.have}/{stats.total} · {stats.missing} mancanti · {stats.doubles} doppie</p>
        </div>
      </FadeIn>

      <CodeSection title="Mancanti" codes={missingCodes} names={data.names} />
      <CodeSection title="Doppie" codes={doubleCodes} names={data.names} counts={album.counts} />
    </div>
  )
}

function CodeSection({
  title, codes, names, counts,
}: {
  title: string
  codes: string[]
  names: Record<string, string>
  counts?: Record<string, number>
}) {
  return (
    <FadeIn>
      <div className="mt-6 rounded-2xl border border-white/[0.08] bg-surface/40 p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-ink">
          {title} <span className="text-ink-2">({codes.length})</span>
        </h2>
        {codes.length === 0 ? (
          <p className="mt-2 text-sm text-ink-2">Nessuna.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {codes.map((c) => (
              <li
                key={c}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-sm text-ink"
              >
                <span className="font-mono text-xs text-ink-2">{c}</span>
                <span className="truncate max-w-[10rem]">{names[c] ?? '—'}</span>
                {counts && counts[c] > 2 && (
                  <span className="rounded bg-lime/15 px-1.5 text-xs font-semibold text-lime">×{counts[c] - 1}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </FadeIn>
  )
}
