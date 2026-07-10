# Team Kit Fase C1 — Scheda squadra — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pagina canonica `/squadra/:teamId` per ogni squadra — crest + kit identità, anagrafica (4 campi), progressi cross-album — linkata dalla sezione squadra nell'album.

**Architecture:** Identità canonica derivata da `slug(section.name)` + ALIAS (in `teamIdentity.ts`), coerente con `src/lib/teams.ts` (id = slug(name)). Fatti curati opzionali in `teamFacts.ts` (graceful hide). Progressi aggregati riusando le primitive esistenti (`subscribeMyAlbumIds`/`loadAlbumData`/`sectionStats`). Baseline universale (crest/kit/progress) per tutte le squadre; anagrafica progressiva.

**Tech Stack:** React 18 + TS, Vite, react-router-dom, Firestore, Vitest.

Spec: `docs/superpowers/specs/2026-07-10-team-kit-fase-c1-scheda-squadra-design.md`

Regole sessione: commit+push su main dopo ogni task; `git add` path espliciti (mai `-A` da root); dev dir `figubook-app`.

Riferimenti reali del codice:
- `src/lib/teams.ts`: `export interface Team { id; name; c1; c2 }`, `export const TEAMS: Team[]`. id = slug(name).
- `src/data/albums/types.ts`: `Section { id; name; short; group; kind; codes; c1; c2 }`.
- `src/lib/album/teamKits.ts`: `kitFromColors(c1,c2): TeamKit`.
- `src/lib/album/color.ts`: `kitGradient(kit): string`, `kitPattern(kit): string|undefined`.
- `src/components/TeamCrest.tsx`: `TeamCrest({ c1, c2, className })`.
- `src/lib/album/stats.ts`: `sectionStats(states, counts, codes): SectionStats { have, missing, doubles, total, pct }`.
- `src/lib/db/albums.ts`: `subscribeMyAlbumIds(uid, cb, err)`, `subscribeAlbum(uid, albumId, cb)`.
- `src/data/albums/index.ts`: `loadAlbumData(albumId): Promise<AlbumData|null>`.
- `src/data/albumCatalog.ts`: `albumById[id].title`.
- `src/lib/stats/pctColor.ts`: `pctColor(pct)`.
- App routes protette in `src/App.tsx` (es. `<Route path="/album/:albumId" element={<Album />} />`).

---

## File Structure

- `src/lib/album/teamIdentity.ts` — CREA: slug + alias + canonicalTeamId + hasTeamPage + teamDisplayName.
- `src/lib/album/teamIdentity.test.ts` — CREA.
- `src/data/teamFacts.ts` — CREA: tipo TeamFacts + TEAM_FACTS record + factsForTeam.
- `src/data/teamFacts.test.ts` — CREA.
- `src/lib/album/teamProgress.ts` — CREA: pura `aggregateTeamProgress`.
- `src/lib/album/teamProgress.test.ts` — CREA.
- `src/hooks/useTeamProgress.ts` — CREA: hook con subscription.
- `src/pages/Squadra.tsx` — CREA: pagina.
- `src/App.tsx` — MODIFICA: route `/squadra/:teamId`.
- `src/components/album/SectionHero.tsx` — MODIFICA: link+crest verso la scheda.

---

## Task 1: `teamIdentity.ts` — identità canonica

**Files:**
- Create: `src/lib/album/teamIdentity.ts`
- Test: `src/lib/album/teamIdentity.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/album/teamIdentity.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { TEAMS } from '@/lib/teams'
import { slugTeam, canonicalTeamId, hasTeamPage, teamDisplayName } from './teamIdentity'

const sec = (name: string) => ({ id: 'x', name, short: name, group: '', kind: 'team', codes: [], c1: '#000', c2: '#fff' })

describe('slugTeam', () => {
  it('invariante: slug del nome === id per ogni TEAMS', () => {
    for (const t of TEAMS) expect(slugTeam(t.name)).toBe(t.id)
  })
})

describe('canonicalTeamId', () => {
  it('slug del nome', () => {
    expect(canonicalTeamId(sec('Messico'))).toBe('messico')
    expect(canonicalTeamId(sec('Inter'))).toBe('inter')
  })
  it('unifica varianti via ALIAS', () => {
    expect(canonicalTeamId(sec('FC Internazionale Milano'))).toBe('inter')
  })
})

describe('hasTeamPage', () => {
  it('true per squadra reale, false per id ignoto', () => {
    expect(hasTeamPage('inter')).toBe(true)
    expect(hasTeamPage('intro')).toBe(false)
  })
})

describe('teamDisplayName', () => {
  it('nome da TEAMS, fallback all id', () => {
    expect(teamDisplayName('inter')).toBe('Inter')
    expect(teamDisplayName('zzz-ignoto')).toBe('zzz-ignoto')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/album/teamIdentity.test.ts`
Expected: FAIL — modulo/inesistente.

- [ ] **Step 3: Implement**

Create `src/lib/album/teamIdentity.ts`. Deriva `slugTeam` in modo che l'invariante `slugTeam(team.name) === team.id` valga per TUTTI i TEAMS. Regola base: minuscolo, rimuovi accenti (NFD), non-alfanumerico → trattino, collassa/rifila i trattini. **Esegui il test dell'invariante e, se qualche squadra non combacia, aggiungi i casi mancanti a `TEAM_ALIAS` NON allo slug** (lo slug resta generico; le eccezioni-nome vanno in ALIAS).

```ts
import type { Section } from '@/data/albums/types'
import { TEAMS } from '@/lib/teams'

// slug coerente con genteams: minuscolo, senza accenti, non-alfanumerico -> trattino.
export function slugTeam(name: string): string {
  return name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Varianti-nome (slug) che indicano la stessa squadra canonica.
export const TEAM_ALIAS: Record<string, string> = {
  'fc-internazionale-milano': 'inter',
}

const TEAM_IDS = new Set(TEAMS.map((t) => t.id))
const NAME_BY_ID = new Map(TEAMS.map((t) => [t.id, t.name]))

// Sezione -> id canonico: slug(name) poi ALIAS.
export function canonicalTeamId(section: Section): string {
  const s = slugTeam(section.name)
  return TEAM_ALIAS[s] ?? s
}

// true se l'id canonico è una squadra reale (in TEAMS).
export function hasTeamPage(canonicalId: string): boolean {
  return TEAM_IDS.has(canonicalId)
}

// Nome squadra da TEAMS, fallback all'id.
export function teamDisplayName(canonicalId: string): string {
  return NAME_BY_ID.get(canonicalId) ?? canonicalId
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/album/teamIdentity.test.ts`
Expected: PASS. Se l'invariante fallisce per qualche squadra, aggiungi la variante a `TEAM_ALIAS` (mappando lo slug ottenuto all'id reale in TEAMS) finché verde. NON modificare `teams.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/album/teamIdentity.ts src/lib/album/teamIdentity.test.ts
git commit -m "feat(album): teamIdentity — id canonico squadra (slug nome + alias)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

---

## Task 2: `teamFacts.ts` — anagrafica (scaffold)

**Files:**
- Create: `src/data/teamFacts.ts`
- Test: `src/data/teamFacts.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/data/teamFacts.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { factsForTeam, TEAM_FACTS } from './teamFacts'

describe('factsForTeam', () => {
  it('oggetto vuoto per id assente', () => {
    expect(factsForTeam('zzz-ignoto')).toEqual({})
  })
  it('ritorna i fatti se presenti', () => {
    TEAM_FACTS['inter'] = { city: 'Milano', founded: 1908, stadium: 'San Siro', nickname: 'Nerazzurri' }
    expect(factsForTeam('inter').city).toBe('Milano')
    expect(factsForTeam('inter').founded).toBe(1908)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/teamFacts.test.ts`
Expected: FAIL — modulo inesistente.

- [ ] **Step 3: Implement**

Create `src/data/teamFacts.ts`:

```ts
export interface TeamFacts {
  city?: string
  founded?: number
  stadium?: string
  nickname?: string
}

// chiave = id canonico (slug nome, vedi teamIdentity). Campi opzionali: assente => nascosto.
// Popolato progressivamente (Wikidata CC0 / conoscenza / web) — vedi Task 7.
export const TEAM_FACTS: Record<string, TeamFacts> = {}

export function factsForTeam(canonicalId: string): TeamFacts {
  return TEAM_FACTS[canonicalId] ?? {}
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/teamFacts.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/teamFacts.ts src/data/teamFacts.test.ts
git commit -m "feat(album): teamFacts scaffold (anagrafica squadra, campi opzionali)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

---

## Task 3: `teamProgress.ts` — aggregazione pura

**Files:**
- Create: `src/lib/album/teamProgress.ts`
- Test: `src/lib/album/teamProgress.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/album/teamProgress.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { aggregateTeamProgress, type AlbumForTeam } from './teamProgress'

const interSec = (codes: string[]) => ({ id: 'inter', name: 'Inter', short: 'Inter', group: '', kind: 'team', codes, c1: '#000', c2: '#fff' })
const otherSec = { id: 'milan', name: 'Milan', short: 'Milan', group: '', kind: 'team', codes: ['M1'], c1: '#000', c2: '#fff' }

describe('aggregateTeamProgress', () => {
  it('somma solo le sezioni che risolvono al team, su piu album', () => {
    const albums: AlbumForTeam[] = [
      { albumId: 'a1', albumTitle: 'Cal 25/26', sections: [interSec(['I1','I2','I3']), otherSec],
        states: { I1: 'have', I2: 'have', M1: 'have' }, counts: {} },
      { albumId: 'a2', albumTitle: 'UCL', sections: [{ ...interSec(['UI1','UI2']), name: 'FC Internazionale Milano' }],
        states: { UI1: 'have' }, counts: {} },
    ]
    const p = aggregateTeamProgress(albums, 'inter')
    expect(p.total).toBe(5)      // 3 + 2, esclude milan
    expect(p.have).toBe(3)       // I1,I2,UI1
    expect(p.pct).toBe(60)
    expect(p.appearsIn.map((x) => x.albumId)).toEqual(['a1', 'a2'])
  })
  it('total 0 e lista vuota se il team non compare', () => {
    const p = aggregateTeamProgress([], 'inter')
    expect(p).toEqual({ have: 0, total: 0, pct: 0, appearsIn: [] })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/album/teamProgress.test.ts`
Expected: FAIL — modulo inesistente.

- [ ] **Step 3: Implement**

Create `src/lib/album/teamProgress.ts`:

```ts
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
}

// Aggrega le figurine del team (id canonico) su tutte le sezioni squadra corrispondenti,
// in tutti gli album passati. Riusa sectionStats.
export function aggregateTeamProgress(albums: AlbumForTeam[], canonicalId: string): TeamProgressResult {
  let have = 0
  let total = 0
  const appearsIn: TeamProgressResult['appearsIn'] = []
  for (const a of albums) {
    for (const s of a.sections) {
      if (s.kind !== 'team' || canonicalTeamId(s) !== canonicalId) continue
      const st = sectionStats(a.states, a.counts, s.codes)
      have += st.have
      total += st.total
      appearsIn.push({ albumId: a.albumId, albumTitle: a.albumTitle, sectionName: s.name, pct: st.pct })
    }
  }
  const pct = total > 0 ? Math.min(100, Math.round((have / total) * 100)) : 0
  return { have, total, pct, appearsIn }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/album/teamProgress.test.ts`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
git add src/lib/album/teamProgress.ts src/lib/album/teamProgress.test.ts
git commit -m "feat(album): aggregateTeamProgress — progressi squadra cross-album

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

---

## Task 4: `useTeamProgress` — hook con subscription

**Files:**
- Create: `src/hooks/useTeamProgress.ts`

- [ ] **Step 1: Implement (no unit test — è I/O; la logica pura è già testata in Task 3)**

Create `src/hooks/useTeamProgress.ts`. Segue il pattern di `src/hooks/useCollection.ts`:
sottoscrivi gli album dell'utente, carica le sezioni (loadAlbumData), sottoscrivi
states/counts per album, poi calcola con `aggregateTeamProgress`.

```ts
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { albumById } from '@/data/albumCatalog'
import { loadAlbumData } from '@/data/albums'
import type { Section } from '@/data/albums/types'
import { subscribeMyAlbumIds, subscribeAlbum } from '@/lib/db/albums'
import { aggregateTeamProgress, type AlbumForTeam, type TeamProgressResult } from '@/lib/album/teamProgress'

export interface TeamProgress extends TeamProgressResult {
  loading: boolean
}

export function useTeamProgress(canonicalId: string): TeamProgress {
  const { user } = useAuth()
  const [ids, setIds] = useState<string[]>([])
  const [idsLoaded, setIdsLoaded] = useState(false)
  const [sectionsMap, setSectionsMap] = useState<Record<string, Section[]>>({})
  const [dataMap, setDataMap] = useState<Record<string, { states: Record<string, string>; counts: Record<string, number> }>>({})

  // Album dell'utente (live).
  useEffect(() => {
    if (!user) return
    let active = true
    const unsub = subscribeMyAlbumIds(user.uid, (next) => {
      if (active) { setIds(next.ids); setIdsLoaded(true) }
    }, () => {})
    return () => { active = false; unsub(); setIds([]); setIdsLoaded(false); setSectionsMap({}); setDataMap({}) }
  }, [user])

  // Sezioni per album (statiche).
  useEffect(() => {
    let active = true
    for (const id of ids) {
      if (sectionsMap[id]) continue
      loadAlbumData(id).then((d) => {
        if (active && d) setSectionsMap((m) => ({ ...m, [id]: d.sections }))
      })
    }
    return () => { active = false }
  }, [ids, sectionsMap])

  // states/counts per album (live).
  useEffect(() => {
    if (!user) return
    const unsubs = ids.map((id) =>
      subscribeAlbum(user.uid, id, ({ states, counts }) =>
        setDataMap((m) => ({ ...m, [id]: { states, counts } })),
      ),
    )
    return () => unsubs.forEach((u) => u())
  }, [user, ids])

  const albums: AlbumForTeam[] = ids
    .filter((id) => albumById[id] && sectionsMap[id] && dataMap[id])
    .map((id) => ({
      albumId: id,
      albumTitle: albumById[id].title,
      sections: sectionsMap[id],
      states: dataMap[id].states,
      counts: dataMap[id].counts,
    }))

  const result = aggregateTeamProgress(albums, canonicalId)
  const loading = !!user && (!idsLoaded || ids.some((id) => albumById[id] && (!sectionsMap[id] || !dataMap[id])))
  return { ...result, loading }
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useTeamProgress.ts
git commit -m "feat(album): useTeamProgress — hook progressi squadra cross-album

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

---

## Task 5: `Squadra.tsx` + route

**Files:**
- Create: `src/pages/Squadra.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create the page**

Create `src/pages/Squadra.tsx`. Tema `.album-theme`, Midnight Gold, minimalista. Crest grande su gradiente+pattern kit; anagrafica coi soli campi presenti; progressi + lista appearsIn.

```tsx
import { useParams, Link } from 'react-router-dom'
import { TEAMS } from '@/lib/teams'
import { TEAM_ALIAS, hasTeamPage, teamDisplayName } from '@/lib/album/teamIdentity'
import { factsForTeam } from '@/data/teamFacts'
import { kitFromColors } from '@/lib/album/teamKits'
import { kitGradient, kitPattern } from '@/lib/album/color'
import { TeamCrest } from '@/components/TeamCrest'
import { useTeamProgress } from '@/hooks/useTeamProgress'
import { pctColor } from '@/lib/stats/pctColor'

export default function Squadra() {
  const { teamId = '' } = useParams()
  const id = TEAM_ALIAS[teamId] ?? teamId
  const team = TEAMS.find((t) => t.id === id)
  const progress = useTeamProgress(id)

  if (!hasTeamPage(id) || !team) {
    return (
      <div className="album-theme mx-auto w-full max-w-[64rem]">
        <div className="mt-10 rounded-xl border border-white/[0.07] bg-bg-elev px-6 py-16 text-center">
          <div className="type-h3 text-ink">Squadra non trovata</div>
          <Link to="/album" className="mt-4 inline-block type-body text-ink-2 underline">Torna agli album</Link>
        </div>
      </div>
    )
  }

  const kit = kitFromColors(team.c1, team.c2)
  const pattern = kitPattern(kit)
  const facts = factsForTeam(id)
  const hasFacts = facts.city || facts.founded || facts.stadium || facts.nickname

  return (
    <div className="album-theme mx-auto w-full max-w-[64rem]">
      {/* Header identità */}
      <header className="relative overflow-hidden rounded-2xl border border-white/10 p-6 sm:p-8" style={{ backgroundImage: kitGradient(kit) }}>
        {pattern && <div aria-hidden className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-70" style={{ backgroundImage: pattern }} />}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(0,0,0,0.52)_0%,rgba(0,0,0,0.34)_55%,rgba(0,0,0,0.22)_100%)]" />
        <div className="relative z-10 flex items-center gap-4">
          <TeamCrest c1={team.c1} c2={team.c2} className="h-16 w-16 drop-shadow-md sm:h-20 sm:w-20" />
          <h1 className="font-display text-3xl font-bold tracking-tight text-white drop-shadow-sm sm:text-4xl">{teamDisplayName(id)}</h1>
        </div>
      </header>

      {/* Anagrafica */}
      {hasFacts && (
        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {facts.city && <Fact label="Città" value={facts.city} />}
          {facts.founded && <Fact label="Fondazione" value={String(facts.founded)} />}
          {facts.stadium && <Fact label="Stadio" value={facts.stadium} />}
          {facts.nickname && <Fact label="Soprannome" value={facts.nickname} />}
        </dl>
      )}

      {/* Progressi */}
      <section className="mt-6 rounded-2xl border border-white/[0.07] bg-bg-elev p-5">
        <h2 className="type-h3 text-ink">I tuoi progressi</h2>
        {progress.loading ? (
          <div className="mt-4 h-2 w-full animate-pulse rounded-full bg-white/10" />
        ) : progress.total === 0 ? (
          <p className="mt-2 type-body text-ink-2">Non è in nessuno dei tuoi album.</p>
        ) : (
          <>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/30">
                <div className="h-full rounded-full" style={{ width: `${Math.max(2, progress.pct)}%`, background: pctColor(progress.pct) }} />
              </div>
              <span className="type-stat shrink-0 font-display text-2xl text-ink">{progress.pct}<span className="text-base text-ink-2">%</span></span>
            </div>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-ink-2">{progress.have} / {progress.total} figurine</p>
            <ul className="mt-4 space-y-1">
              {progress.appearsIn.map((x) => (
                <li key={`${x.albumId}-${x.sectionName}`} className="flex items-center justify-between type-body text-ink-2">
                  <span className="truncate">{x.albumTitle}</span>
                  <span className="shrink-0 font-mono text-xs">{x.pct}%</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-bg-elev px-4 py-3">
      <dt className="font-mono text-[10px] uppercase tracking-wide text-ink-2">{label}</dt>
      <dd className="type-body mt-0.5 font-semibold text-ink">{value}</dd>
    </div>
  )
}
```

- [ ] **Step 2: Add the route in `src/App.tsx`**

Add the lazy/direct import near the other page imports:
```ts
import Squadra from '@/pages/Squadra'
```
Add inside the protected route group (next to `<Route path="/album/:albumId" element={<Album />} />`):
```tsx
        <Route path="/squadra/:teamId" element={<Squadra />} />
```

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc -b --noEmit && npm run build`
Expected: exit 0 (solo warning preesistente `INEFFECTIVE_DYNAMIC_IMPORT` su firebase.ts).

- [ ] **Step 4: Commit**

```bash
git add src/pages/Squadra.tsx src/App.tsx
git commit -m "feat(album): pagina /squadra/:teamId (crest+kit, anagrafica, progressi)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

---

## Task 6: Link + crest in `SectionHero`

**Files:**
- Modify: `src/components/album/SectionHero.tsx`

- [ ] **Step 1: Import identity + crest + Link**

Add:
```ts
import { Link } from 'react-router-dom'
import { canonicalTeamId, hasTeamPage } from '@/lib/album/teamIdentity'
import { TeamCrest } from '@/components/TeamCrest'
```

- [ ] **Step 2: Compute link target**

In `SectionHero`, after `const kit = kitForSection(section)`:
```ts
  const teamId = section.kind === 'team' ? canonicalTeamId(section) : ''
  const linkTeam = teamId && hasTeamPage(teamId)
```

- [ ] **Step 3: Render crest + link on the title**

Replace the title block:
```tsx
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-bold tracking-tight text-white drop-shadow-sm sm:text-4xl">{section.name}</h1>
            <p className="mt-1 text-sm text-white/85">{section.codes[0]} – {section.codes[section.codes.length - 1]} · {section.codes.length} figurine</p>
          </div>
```
with:
```tsx
          <div className="min-w-0">
            {linkTeam ? (
              <Link
                to={`/squadra/${teamId}`}
                className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
                aria-label={`Scheda squadra ${section.name}`}
              >
                <TeamCrest c1={section.c1} c2={section.c2} className="h-8 w-8 shrink-0 drop-shadow-sm sm:h-9 sm:w-9" />
                <h1 className="font-display text-3xl font-bold tracking-tight text-white drop-shadow-sm underline-offset-4 hover:underline sm:text-4xl">{section.name}</h1>
              </Link>
            ) : (
              <h1 className="font-display text-3xl font-bold tracking-tight text-white drop-shadow-sm sm:text-4xl">{section.name}</h1>
            )}
            <p className="mt-1 text-sm text-white/85">{section.codes[0]} – {section.codes[section.codes.length - 1]} · {section.codes.length} figurine</p>
          </div>
```

(Match the exact existing whitespace of the title block in the file.)

- [ ] **Step 4: Typecheck + build**

Run: `npx tsc -b --noEmit && npm run build`
Expected: exit 0 (solo warning preesistente firebase.ts).

- [ ] **Step 5: Commit**

```bash
git add src/components/album/SectionHero.tsx
git commit -m "feat(album): link+crest da SectionHero alla scheda squadra

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

---

## Task 7: Popolamento `TEAM_FACTS` (dati, iterativo)

**Files:**
- Modify: `src/data/teamFacts.ts`

Obiettivo: riempire i 4 campi per le squadre del catalogo. **Iterativo, batch per lega.**
Nessun dato inventato: campo omesso se non verificabile. Fonte preferita **Wikidata (CC0)**;
in mancanza, conoscenza consolidata; ricerca web per i buchi e i soprannomi.

- [ ] **Step 1: Enumera le squadre canoniche da curare**

Script una-tantum (in scratchpad, non committato) per elencare gli id canonici presenti nel
catalogo:
```bash
node -e "
const { TEAMS } = require('./src/lib/teams');
" 2>/dev/null || true
```
In pratica: caricare tutte le `AlbumData`, raccogliere le sezioni `kind:'team'`, mappare con
`canonicalTeamId`, ottenere l'insieme unico. Elencare gli id per prioritizzare (Serie A prima).

- [ ] **Step 2: Batch Serie A (Calciatori 24/25 + 25/26)**

Per ciascuna squadra Serie A, reperire `city`, `founded`, `stadium`, `nickname` (Wikidata/
web) e aggiungere a `TEAM_FACTS`. Esempio di forma:
```ts
export const TEAM_FACTS: Record<string, TeamFacts> = {
  'inter': { city: 'Milano', founded: 1908, stadium: 'San Siro', nickname: 'Nerazzurri' },
  'juventus': { city: 'Torino', founded: 1897, stadium: 'Allianz Stadium', nickname: 'Bianconeri' },
  // …tutte le squadre Serie A
}
```
Campo non verificabile ⇒ ometterlo (non stringa vuota).

- [ ] **Step 3: Verifica build + commit batch Serie A**

Run: `npx tsc -b --noEmit`
Expected: exit 0.
```bash
git add src/data/teamFacts.ts
git commit -m "data(album): anagrafica squadre Serie A (teamFacts)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

- [ ] **Step 4: Batch successivi (Serie B, UCL europee, nazionali Mondiali)**

Ripetere Step 2–3 per lega/gruppo, un commit per batch. Chiudere quando il catalogo è
coperto; le squadre residue restano al baseline (nessun fatto, nessun buco visivo).

---

## Task 8: Verifica finale

- [ ] **Step 1: Suite completa**

Run:
```bash
npx vitest run src/lib/album/teamIdentity.test.ts src/data/teamFacts.test.ts src/lib/album/teamProgress.test.ts && npx tsc -b --noEmit && npm run build
```
Expected: tutti PASS, tsc 0, build 0 (solo warning preesistente firebase.ts).

- [ ] **Step 2: Cache-bust (se asset versionati manualmente toccati)**

Vedi memory `cache-bust-assets`: bump `?v=N` solo se toccati asset locali versionati a mano.
Fase C1 crea moduli TS (Vite hasha in build) → di norma non serve. Saltare se non applicabile.

- [ ] **Step 3: Verifica live (se richiesta dall'utente)**

Vedi memory `browser-probe-figubook`. Controllare: in una sezione squadra dell'album il
titolo mostra crest + è cliccabile → apre `/squadra/:id`; la scheda mostra crest/kit,
anagrafica (dove presente) e progressi cross-album; sezione non-squadra non ha link.

---

## Self-review

- **Spec coverage:** identità canonica slug+alias (T1) · teamFacts opzionali (T2) · progressi cross-album puro (T3) + hook (T4) · pagina+route (T5) · entry point SectionHero solo squadre (T6) · popolamento fatti Wikidata/web (T7) · baseline universale = T5 usa kitFromColors+TEAMS+progress senza richiedere fatti (graceful) · verifica (T8). Tutto coperto.
- **Placeholder:** nessuno — codice reale in ogni step; T7 è un task-dati genuino, non un buco.
- **Type consistency:** `canonicalTeamId(section: Section)`, `hasTeamPage(id)`, `teamDisplayName(id)`, `slugTeam(name)`, `TEAM_ALIAS`; `factsForTeam(id): TeamFacts`; `aggregateTeamProgress(albums, id): TeamProgressResult`, `AlbumForTeam`; `useTeamProgress(id): TeamProgress`. Coerenti tra T1/T3/T4/T5/T6.
