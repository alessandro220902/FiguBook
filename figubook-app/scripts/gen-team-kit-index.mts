// Genera src/lib/album/teamKitIndex.ts: mappa id canonico squadra -> kit curato
// (colori+pattern), aggregando tutte le sezioni kind:'team' di tutti gli album.
// Preferisce il kit CURATO (KITS) quando la stessa squadra compare in piu album.
// Run: npx vite-node scripts/gen-team-kit-index.mts
import { writeFileSync } from 'node:fs'
import { loadAlbumData } from '../src/data/albums/index'
import { canonicalTeamId } from '../src/lib/album/teamIdentity'
import { kitForSection, hasCuratedKit } from '../src/lib/album/teamKits'

const albumIds = [
  'calciatori-25-26', 'calciatori-22-23', 'calciatori-23-24', 'calciatori-24-25',
  'mondiali-2022', 'mondiali-2026', 'calb-25-26', 'adrenalyn-25-26', 'match-attax-ucl',
]

type Lite = { c1: string; c2: string; accent?: string; pattern: string }
const map: Record<string, Lite> = {}
const isCurated: Record<string, boolean> = {}

for (const aid of albumIds) {
  const d = await loadAlbumData(aid)
  if (!d) continue
  for (const s of d.sections) {
    if (s.kind !== 'team') continue
    const id = canonicalTeamId(s)
    const curated = hasCuratedKit(s.id)
    // se ho gia un kit curato per questa squadra, non lo sovrascrivo con un fallback
    if (map[id] && isCurated[id] && !curated) continue
    const k = kitForSection(s)
    map[id] = { c1: k.c1, c2: k.c2, ...(k.accent ? { accent: k.accent } : {}), pattern: k.pattern }
    isCurated[id] = curated || !!isCurated[id]
  }
}

const sorted = Object.keys(map).sort().reduce<Record<string, Lite>>((o, k) => {
  o[k] = map[k]
  return o
}, {})

const body = `// AUTO-GENERATO da scripts/gen-team-kit-index.mts. Non modificare a mano.
// Mappa id canonico squadra -> kit curato (colori+pattern) per crest coerente ovunque.
import type { KitPattern } from './teamKits'

export interface TeamKitLite { c1: string; c2: string; accent?: string; pattern: KitPattern }

export const TEAM_KIT_INDEX: Record<string, TeamKitLite> = ${JSON.stringify(sorted, null, 2)}
`

writeFileSync(new URL('../src/lib/album/teamKitIndex.ts', import.meta.url), body)
console.log('teams:', Object.keys(sorted).length)
