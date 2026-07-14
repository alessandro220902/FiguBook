# Community — Fase 2 "Suggeriti sempre-on" — Design

Data: 2026-07-14
Stato: approvato (brainstorm), pronto per writing-plans

## Contesto

Fase 1 "la cerchia" costruita e pushata: pagina Community a sezioni, invito
tracciato, lista amici/richieste, e un **teaser di prossimità** mostrato solo in
empty-state (zero amici) via la Cloud Function `nearbyCollectors`
(`functions/src/nearbyCollectors.ts`, `europe-west1`, live). La function scala
i tier CAP→provincia→squadra server-side, il CAP non lascia mai il server, e
ritorna max 6 uid tier-ranked.

Fase 2 = **motore scoperta**. Scope ristretto dal founder alla sola voce
**"Suggeriti sempre-on"**: la scoperta smette di essere un ripiego da empty-state
e diventa una sezione permanente della pagina, con "Mostra altri" per sfogliare
oltre i primi 6.

## Obiettivo Fase 2

Rendere "Collezionisti per te" una sezione **sempre visibile** sotto la lista
amici, con paginazione "Mostra altri" che carica batch successivi senza ripetere
chi hai già visto. Battere il cold-start non solo per chi ha zero amici, ma per
tutti: anche con amici, continui a scoprire persone vicine.

## Decisioni prese

- **Solo suggeriti sempre-on.** Fuori scope in Fase 2 (rimandati): filtri
  espliciti squadra/zona, ranking CAP fine (distanza reale), ricerca avanzata,
  dismiss di un singolo, esclusione delle richieste amicizia pendenti.
- **Posizione: sotto "I miei amici", sempre.** L'empty-state di prossimità di
  Fase 1 diventa una sezione autonoma e permanente.
- **Paginazione: approccio stateless "exclude seenUids"** (opzione A). Il client
  tiene i già-visti e li passa alla function come `exclude`; la function riempie
  il batch successivo scendendo i tier. Niente stato/cursore lato server.
- **Pannello onboarding 3-step (cold-start reale)** resta, ma appare solo quando
  `friends.length === 0 && suggeriti.length === 0 && !loading` — cioè densità
  zero effettiva, non solo "nessun amico".

## Coerenza visiva (vincolo)

Riusa il linguaggio delle altre sezioni: token `type-*`, card `rounded-2xl` con
bordi `white/[0.08]` su `bg-surface`, minimalismo Geist, accento `lime`. Il
bottone "Mostra altri" usa la **freccia animata** standard (scivola all'hover),
come le altre azioni dirette. `PersonRow` esistente riusato per le card.

---

## Architettura

### A. Cloud Function `nearbyCollectors` (modifica)

File: `functions/src/nearbyCollectors.ts`.

**Input** (oggi: nessuno): payload opzionale `{ exclude?: string[], limit?: number }`.
- `exclude`: uid già mostrati al client, da non ripresentare.
- `limit`: dimensione batch, default `6`, **cap a 12** (clamp server-side per
  evitare payload abusivi).

**Logica pura `rankCandidates`** — unica modifica: il parametro `exclude`
confluisce nel set di esclusione insieme a `me.uid`, `friends`, `blocked`. Firma:

```ts
export function rankCandidates(
  me: Me, cands: Cand[], friends: string[], blocked: string[],
  exclude: string[], limit: number,
): string[]
```

Ordinamento per tier e slice a `limit` restano invariati.

**`fetchCandidates`** invariato: continua a leggere i tier presenti via
`collectionGroup('meta')` con `.limit(50)` per tier. A questa densità 50 basta a
coprire i visti accumulati; se in futuro non bastasse, si alza il limit (nota
registrata, non implementata ora).

**Output** (oggi: `{ uids }`): `{ uids: string[], hasMore: boolean }` con
`hasMore = uids.length === limit`. Segnale semplice: batch pieno ⇒ forse c'è
altro; batch corto ⇒ fine. Un eventuale "Mostra altri" finale a vuoto (batch
pieno ma nessun candidato residuo) è accettato: costo trascurabile, il client
nasconde il bottone al primo batch vuoto/corto successivo.

Handler: legge `exclude`/`limit` dal payload, li clampa, li passa a
`rankCandidates`, calcola `hasMore`.

### B. Client — accesso alla function

File: `figubook-app/src/lib/functions/nearby.ts`.

`fetchNearbyUids` cambia firma:

```ts
export async function fetchNearbyUids(
  exclude: string[], limit: number,
): Promise<{ uids: string[]; hasMore: boolean }>
```

Passa `{ exclude, limit }` alla callable; ritorna `{ uids, hasMore }` con default
difensivi (`uids ?? []`, `hasMore ?? false`).

### C. Client — hook accumulatore

File: `figubook-app/src/hooks/useNearbyCollectors.ts`.

Da "una tantum in empty-state" a **accumulatore paginato**:

```ts
export function useNearbyCollectors(): {
  people: PublicProfile[]
  hasMore: boolean
  loading: boolean
  loadMore: () => void
}
```

- Stato: `people`, `hasMore`, `loading`, più un set/ref interno `seenUids`.
- **Primo fetch al mount** (non più condizionato a `enabled`): la sezione è
  sempre attiva.
- `loadMore()`: se `loading` o `!hasMore` → no-op. Altrimenti chiama
  `fetchNearbyUids([...seenUids], PAGE=6)`, risolve gli uid in
  `publicProfiles` via `getPublicByUid`, **appende** i profili nuovi a `people`,
  aggiorna `seenUids` e `hasMore`. Dedup difensivo per uid.
- Concorrenza: guardia `active`/flag per evitare append da fetch obsoleti (come
  già fa l'hook Fase 1).

### D. Pagina Community

File: `figubook-app/src/pages/Community.tsx`.

- Rimuove `enabled` da `useNearbyCollectors()` (sempre attivo); destruttura
  `{ people, hasMore, loading, loadMore }`.
- **Sezione "I miei amici"**: mostra solo la lista amici quando presente; se
  vuota, non ingloba più il teaser (il teaser diventa sezione D2 autonoma). Se
  nessun amico, o niente titolo o un hint minimale — la scoperta sta sotto.
- **Sezione D2 "Collezionisti per te"** (nuova, sempre renderizzata se
  `people.length > 0`): titolo `type-h2`, griglia di `PersonRow`, bottone
  "Mostra altri" (freccia animata) visibile solo se `hasMore`, disabilitato
  durante `loading`.
- **Pannello onboarding 3-step**: reso solo quando
  `friends.length === 0 && people.length === 0 && !loading`. Contenuto e CTA
  invito invariati rispetto a Fase 1.

Ordine finale della pagina: header (+CTA invito/contatore) → richieste in arrivo
→ ricerca → I miei amici → Collezionisti per te → pannello 3-step (solo cold-start
reale).

## Modello dati (Firestore)

Nessuna modifica. `users/{uid}/meta/profile` (privato: `cap`, `provincia`,
`favTeam`, `blocked`, `isPublic`), `publicProfiles`, `friendships` restano come
Fase 1. Nessun campo nuovo, nessuna regola nuova, nessun indice nuovo (gli indici
collection-group `meta` su `cap`/`provincia`/`favTeam` sono già deployati).

## Sicurezza

- Invarianti Fase 1 preservate: CAP mai nel payload/`publicProfiles`, usato solo
  come chiave di match server-side; scoperta limitata ai profili `isPublic == true`.
- `exclude`/`limit` sono input non fidati: `limit` clampato `[1, 12]` server-side;
  `exclude` usato solo per filtrare (nessuna scrittura, nessun leak — sono uid che
  il client ha già ricevuto).

## Testing

- **`rankCandidates`** (unit, logica pura):
  - `exclude` rimuove gli uid indicati dal risultato.
  - `exclude` combinato con `friends`/`blocked` (unione corretta).
  - ordine tier CAP→provincia→squadra preservato dopo l'esclusione.
  - `limit` rispettato; `limit` clampato oltre 12.
- **Function `nearbyCollectors`** (stile Fase 1):
  - payload con `exclude` non ripresenta i visti.
  - `hasMore === true` quando `uids.length === limit`; `false` quando corto.
  - payload assente/parziale → default `limit 6`, `exclude []`.
- **`useNearbyCollectors`** (client):
  - accumula senza duplicati su `loadMore` ripetuti.
  - `loadMore` passa i `seenUids` correnti come `exclude`.
  - `hasMore === false` ferma il bottone / rende `loadMore` no-op.

## Fuori scope (fasi/decisioni successive)

- Filtri espliciti squadra/zona; ranking CAP fine (distanza reale).
- Dismiss di un suggerito; esclusione delle richieste amicizia pendenti.
- Ricerca avanzata (squadra+zona combinati, browse).
- Fase 3: chat 1-a-1 + nota sicurezza al contatto. Fase 4: livelli/ricompense.
