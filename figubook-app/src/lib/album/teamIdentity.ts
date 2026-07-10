import type { Section } from '@/data/albums/types'
import { TEAMS } from '@/lib/teams'

// slug: minuscolo, senza accenti (NFD), non-alfanumerico -> trattino, rifila i trattini.
export function slugTeam(name: string): string {
  return name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const TEAM_ALIAS: Record<string, string> = {
  'fc-internazionale-milano': 'inter',
}

const TEAM_IDS = new Set(TEAMS.map((t) => t.id))
const NAME_BY_ID = new Map(TEAMS.map((t) => [t.id, t.name]))

export function canonicalTeamId(section: Section): string {
  const s = slugTeam(section.name)
  return TEAM_ALIAS[s] ?? s
}
export function hasTeamPage(canonicalId: string): boolean {
  return TEAM_IDS.has(canonicalId)
}
export function teamDisplayName(canonicalId: string): string {
  return NAME_BY_ID.get(canonicalId) ?? canonicalId
}
