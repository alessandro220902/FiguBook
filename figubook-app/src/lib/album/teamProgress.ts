import type { Section } from '@/data/albums/types'
import { sectionStats } from '@/lib/album/stats'
import { canonicalTeamId } from '@/lib/album/teamIdentity'

export interface AlbumForTeam {
  albumId: string
  albumTitle: string
  sections: Section[]
  states: Record<string, string>
  counts: Record<string, number>
}

export interface TeamProgressResult {
  have: number
  total: number
  pct: number
  appearsIn: { albumId: string; albumTitle: string; sectionName: string; pct: number }[]
  matchedSection?: Section
}

/**
 * Aggrega le figurine del team (id canonico) su tutte le sezioni squadra corrispondenti,
 * in tutti gli album passati. Riusa sectionStats.
 */
export function aggregateTeamProgress(albums: AlbumForTeam[], canonicalId: string): TeamProgressResult {
  let have = 0
  let total = 0
  const appearsIn: TeamProgressResult['appearsIn'] = []
  let matchedSection: Section | undefined

  for (const a of albums) {
    for (const s of a.sections) {
      if (s.kind !== 'team' || canonicalTeamId(s) !== canonicalId) continue
      if (!matchedSection) matchedSection = s
      const st = sectionStats(a.states, a.counts, s.codes)
      have += st.have
      total += st.total
      appearsIn.push({ albumId: a.albumId, albumTitle: a.albumTitle, sectionName: s.name, pct: st.pct })
    }
  }

  const pct = total > 0 ? Math.min(100, Math.round((have / total) * 100)) : 0
  return { have, total, pct, appearsIn, matchedSection }
}
