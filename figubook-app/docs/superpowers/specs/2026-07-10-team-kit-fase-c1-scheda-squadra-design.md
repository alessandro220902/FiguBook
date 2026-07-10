# Team Kit — Fase C1: scheda squadra (identità + anagrafica + progressi)

Data: 2026-07-10
Stato: approvato per implementazione
Segue: Fase A (identità kit) e Fase B (badge) — vedi `2026-07-09-team-kit-identity-design.md`, `2026-07-10-team-kit-fase-b-badge-nuovo-design.md`

## Contesto

FiguBook è collezionismo **solo sport**: l'identità squadra è il vantaggio competitivo.
Fase A ha dato colori/pattern fedeli alle sezioni. Fase C aggiunge una **scheda squadra**
canonica: analisi una-per-squadra con crest, anagrafica e i progressi del collezionista.

**Fase C1 = questo spec.** Fuori scope (fasi successive): silhouette stadio line-art SVG
(C2), trivia estese (C3). Nessuna foto d'agenzia, nessun logo ufficiale (copyright) — si
usa lo scudo astratto 2-colori esistente (`TeamCrest`).

## Obiettivo

- Ogni squadra ha una pagina canonica `/squadra/:teamId`, linkata dalla sua sezione
  nell'album.
- "Tutto il sito" da subito via **baseline universale** (funziona per tutte le ~130
  squadre coi dati già presenti: crest, kit, progressi) + **arricchimento progressivo**
  con 4 fatti curati (città, fondazione, stadio, soprannome) dove reperiti.
- Zero buchi: campo/fatto mancante si nasconde; nessun dato inventato.

## Problema d'identità (centrale)

La stessa squadra ha `section.id`/nome diversi tra album: Inter è `inter` in Calciatori
ma `fc-internazionale-milano` in UCL; Hellas Verona è `verona`/`hellas`; le nazionali dei
Mondiali 2026 hanno id `girone-<lettera>-<cod3>`. Serve un **id canonico** unico per
squadra così la scheda è una sola.

Fase A ha `resolveKey`/`ALIAS` in `teamKits.ts`, ma solo per il fallback-colore del kit
(bastavano i colori, non serviva unire `inter`/`internazionale`). Fase C richiede
un'unificazione esplicita e più ampia.

## Modello dati

### `src/lib/album/teamIdentity.ts` (nuovo) — punto di verità dell'identità

```ts
import type { Section } from '@/data/albums/types'

// id canonico = quello usato in src/lib/teams.ts (es. 'inter', 'juventus', 'italy').
// Alias: id-sezione noti che indicano la stessa squadra ma con chiave diversa.
export const TEAM_ALIAS: Record<string, string> = {
  'fc-internazionale-milano': 'inter',
  'internazionale': 'inter',
  'verona': 'hellas-verona',
  'hellas': 'hellas-verona',
  // …popolato durante l'implementazione per tutti i doppioni reali del catalogo
}

// Risolve un id-sezione all'id canonico: alias espliciti, poi il formato
// Mondiali 'girone-<lettera>-<cod3>' -> nazionale 'cod3', altrimenti l'id stesso.
export function canonicalTeamId(sectionId: string): string

// true se l'id canonico corrisponde a una squadra reale (in TEAMS) — abilita il link.
export function hasTeamPage(canonicalId: string): boolean

// Nome visualizzato della squadra canonica (da TEAMS), fallback all'id.
export function teamDisplayName(canonicalId: string): string
```

Note:
- `canonicalTeamId` accetta l'id-sezione (string) per essere testabile senza un intero
  `Section`. Il chiamante passa `section.id`.
- `hasTeamPage` guarda `TEAMS` di `src/lib/teams.ts` (già dedotto per squadra).
- L'alias di Fase A (`teamKits.ts` `resolveKey`) resta invariato per il kit; NON viene
  toccato. `teamIdentity.ts` è il resolver di identità, separato per responsabilità.

### `src/data/teamFacts.ts` (nuovo) — anagrafica curata

```ts
export interface TeamFacts {
  city?: string       // città (es. 'Milano')
  founded?: number    // anno fondazione (es. 1908)
  stadium?: string    // nome stadio (es. 'San Siro')
  nickname?: string   // soprannome (es. 'Nerazzurri')
}

// chiave = id canonico. Ogni campo opzionale: assente => nascosto in UI.
export const TEAM_FACTS: Record<string, TeamFacts>

export function factsForTeam(canonicalId: string): TeamFacts
```

Popolamento (in implementazione, task dedicato): **Wikidata (CC0)** per città/fondazione/
stadio della maggioranza; conoscenza del modello per i club noti; ricerca web per i buchi
e per il soprannome. Dato non affidabile ⇒ campo omesso. Nessuna licenza a rischio (CC0 +
testo fattuale breve).

## Progressi cross-album

### `src/hooks/useTeamProgress.ts` (nuovo)

Per un `canonicalId`, aggrega le figurine dell'utente su **tutte le sezioni che risolvono
a quella squadra, in tutti i suoi album**.

- Sottoscrive `subscribeMyAlbumIds` (già esistente) per gli album dell'utente.
- Per ogni album: `loadAlbumData(albumId)` (già esistente) per le sezioni;
  `subscribeAlbum(uid, albumId, …)` per `states`/`counts`.
- Filtra le sezioni con `kind:'team'` e `canonicalTeamId(section.id) === canonicalId`;
  per ciascuna `sectionStats(states, counts, section.codes)` (già esistente) e somma.

Output:

```ts
export interface TeamProgress {
  have: number
  total: number
  pct: number
  appearsIn: { albumId: string; albumTitle: string; sectionName: string; pct: number }[]
  loading: boolean
}
export function useTeamProgress(canonicalId: string): TeamProgress
```

`appearsIn` alimenta la lista "compare in: Calciatori 24/25 · UCL …". `pct` totale =
`round(have/total*100)` con `total>0`, altrimenti 0. Se l'utente non possiede album con
quella squadra: `total=0`, lista vuota (UI mostra "Non è in nessuno dei tuoi album").

Riuso delle primitive esistenti — nessuna nuova logica di conteggio.

## Pagina

### `src/pages/Squadra.tsx` (nuovo) + route

- Route in `src/App.tsx`, dentro il gruppo protetto (come `/album/:albumId`):
  `<Route path="/squadra/:teamId" element={<Squadra />} />`.
- `teamId` param → normalizzato con `canonicalTeamId` (robusto se qualcuno arriva con un
  alias). Se `!hasTeamPage(canonical)` ⇒ stato "Squadra non trovata" con link indietro.
- Layout (tema Midnight Gold, minimalista, `.album-theme`):
  1. **Header identità** — `TeamCrest` grande (c1/c2 da `TEAMS`) su sfondo
     `kitGradient(kit)` + `kitPattern(kit)` (motore Fase A; il kit si ottiene da un
     `Section`-like costruito dai colori del team, o via `kitFromColors(c1,c2)` se non
     curato). Nome squadra (`teamDisplayName`).
  2. **Anagrafica** — i 4 campi da `factsForTeam`, ognuno mostrato **solo se presente**
     (città · fondazione · stadio · soprannome). Se `TeamFacts` è vuoto: sezione omessa.
  3. **Progressi** — barra `pct` (riuso `pctColor`) + have/total, e lista `appearsIn`
     ("compare in …"). Se `total=0`: messaggio "Non è in nessuno dei tuoi album".
- Contrasto testo AA garantito come nelle altre superfici kit (scrim scuro sopra il
  gradiente, come `SectionHero`).

### Entry point — `src/components/album/SectionHero.tsx`

- Il titolo/crest della sezione diventa un `<Link to={`/squadra/${canonicalTeamId(section.id)}`}>`
  **solo se** `section.kind === 'team'` e `hasTeamPage(canonicalTeamId(section.id))`.
- Sezioni non-squadra (Introduzione, Speciali, leghe): nessun link, invariate.
- Aggiungere un piccolo `TeamCrest` accanto al nome nell'hero come affordance visiva del
  link (oggi l'hero non mostra crest). Affordance azione: freccia/hover secondo
  [[azioni-dirette-freccia-animata]] non richiesta qui (è navigazione, non azione diretta);
  basta il pattern Link con focus-visible già usato.

## Testing

- `teamIdentity.test.ts` (nuovo):
  - `canonicalTeamId('fc-internazionale-milano') === 'inter'`, `'verona' === 'hellas-verona'`,
    `'girone-a-ita' === 'ita'`-style (secondo formato reale), id sconosciuto → sé stesso.
  - `hasTeamPage` true per squadra reale, false per id non-squadra.
  - `teamDisplayName` da TEAMS, fallback all'id.
- `teamFacts.test.ts` (nuovo): `factsForTeam` ritorna `{}` per id assente; forma dei campi
  (types) per un paio di team popolati (es. inter → city 'Milano', founded 1908).
- `useTeamProgress` — test unitario della funzione di aggregazione pura estratta (vedi
  sotto): dato un set di sezioni+states di più album, somma corretta e `appearsIn`.
  Per testabilità, estrarre la pura `aggregateTeamProgress(albums, canonicalId)` da
  `useTeamProgress` (l'hook resta il wrapper con le subscription).
- `Squadra.tsx` — smoke test opzionale (render con team curato e con team senza fatti;
  la sezione anagrafica appare/non appare).

## Consegna Fase C1

1. `teamIdentity.ts` (canonical + alias + hasTeamPage + display) — test.
2. `teamFacts.ts` (tipo + record vuoto/seed) — test forma.
3. **Popolamento fatti** — riempire `TEAM_FACTS` per le squadre del catalogo via
   Wikidata/conoscenza/web, con campi omessi dove incerti (task a sé, ampio).
4. `useTeamProgress` (+ pura `aggregateTeamProgress`) — test aggregazione.
5. `Squadra.tsx` + route in `App.tsx`.
6. Link in `SectionHero` (solo sezioni squadra curabili) + crest affordance.
7. Test verdi, `tsc -b --noEmit` e `npm run build` puliti; cache-bust se serve.

## Note di processo

- Skill estetiche in implementazione (layout scheda, crest grande, gradiente): richiamare
  `design-taste-frontend` + audit `impeccable`. Minimalista, tema Midnight Gold, no slop.
- Contrasto AA sempre; tap target ≥44px per il link/entry point.
- "PC" include iPad (layout a `md`), vedi [[pc-uguale-pc-piu-ipad-md]].
- Commit+push su main dopo ogni step; `git add` path espliciti (mai `-A` da root).
- I `.ts` di teams sono generati (vedi [[album-data-pipeline]]): `teamIdentity`/`teamFacts`
  sono file NUOVI curati a mano, non generati — non confonderli con `teams.ts`.

## Rischi

- **Accuratezza fatti:** mitigata da sorgente CC0/verificata + campo omesso se incerto +
  validazione utente a campione. Nessun dato inventato.
- **Alias incompleti:** un doppione non mappato mostra due schede separate (degrada, non
  rompe). Mitigazione: durante il popolamento, elencare tutte le sezioni `kind:'team'` del
  catalogo e verificare le collisioni di squadra prima di chiudere.
- **Costo progressi cross-album:** l'hook apre un listener per album dell'utente (come
  `useCollection`); riuso dello stesso pattern, nessun fan-out extra oltre gli album già
  in lista.
- **Scope creep verso stadio/trivia:** esplicitamente rimandati a C2/C3.
