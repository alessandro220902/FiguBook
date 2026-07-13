# Community — Fase 1 "la cerchia" — Design

Data: 2026-07-13
Stato: approvato (brainstorm), pronto per writing-plans

## Contesto

Community = hub sociale a 360° (scoperta persone, feed, gruppi, status). Non è
un marketplace di scambio (quello FiguBook ce l'ha già in Scambi). Costruzione
progressiva in 4 fasi; questa è **Fase 1 "la cerchia"**: le fondamenta social.

Oggi `src/pages/Community.tsx` = solo barra ricerca username (guscio). Plumbing
amicizie **già completo** in `src/lib/db/friends.ts` (richieste, friendship,
stato live, notifiche). Raccolta dati profilo già fatta dall'onboarding:
`citta` (comune, pubblico), `cap` (privato) su `ProfileDoc`.

## Obiettivo Fase 1

Trasformare Community da guscio a pagina viva: invita amici (attribuzione vera),
gestisci amici e richieste, e — per battere il cold-start — un teaser di
collezionisti vicini quando non hai ancora amici.

## Decisioni prese

- **Attribuzione invito vera** (non conteggio click): un iscritto conta solo se
  arriva davvero e crea l'account.
- **Pagina singola a sezioni scrollabili** (no tab): tutto a colpo d'occhio,
  mobile-first.
- **Teaser prossimità con scala a priorità live**: CAP → provincia → squadra →
  (niente ⇒ solo CTA invita). I più vicini hanno priorità; nuovi iscritti più
  vicini salgono in cima.
- **CAP mai esposto**: match server-side via Cloud Function, il numero di CAP non
  lascia mai il server. Si mostra "vicino a te", mai il CAP.
- **Discoverability default-on per i profili pubblici**; i privati restano fuori
  dalla scoperta (toggle `isPublic` esistente). Responsabilità dell'utente per ciò
  che avviene fuori dall'app; nota di sicurezza al momento del contatto/scambio
  (requisito piazzato in Fase 3 chat / Scambi, non in questa fase).
- **Contatore inviti = solo numero** in Fase 1 ("Hai invitato N amici"). Lista di
  chi hai invitato + ricompense → Fase 4.

## Coerenza visiva (vincolo)

La UI riusa il linguaggio delle altre 3 sezioni principali (Home, Album, Scambi):
token `type-*`, stile card (`rounded-2xl`, bordi `white/[0.08]`, `bg-surface`),
minimalismo Geist, accento `lime`. **Azioni dirette** (Invita, CTA, Accetta) con
la **freccia animata** che scivola all'hover (standard app). Skill design/impeccable
da invocare in implementazione.

---

## Architettura

### A. Pagina Community (`src/pages/Community.tsx`)

Singola, scrollabile, `max-w-3xl`, mobile-first. Ordine dall'alto:

1. **Header** — titolo "Community" + CTA **Invita un amico** (freccia animata) con
   contatore inline ("Hai invitato 3 amici" / "Invita il tuo primo amico").
2. **Richieste in arrivo** — visibile solo se >0. Card per richiesta con avatar,
   username, squadra + azioni Accetta / Rifiuta. Fonte: `subscribeIncomingRequests`
   (già esistente) → risolvo i `fromUid` in `publicProfiles`.
3. **Barra ricerca** username — quella attuale, spostata qui (invariata nella
   meccanica: `useUserSearch`).
4. **I miei amici** — lista amici; se vuota → **teaser prossimità** (sezione B).

Nuovi hook lato client:
- `useMyFriends()` — sottoscrive `friendships where users array-contains me`,
  risolve gli altri uid in `publicProfiles`. (Richiede indice se non presente.)
- `useIncomingRequestProfiles()` — wrappa `subscribeIncomingRequests` + risoluzione
  profili.
- `useInviteCount()` — query `invites where inviterUid == me`, conteggio live.

### B. Teaser prossimità (empty state amici)

**Cloud Function `nearbyCollectors`** (callable onCall, `europe-west1`, stesso
package `functions/`):
- Input: nessuno (usa `auth.uid`).
- Legge il doc privato del chiamante: `cap`, `provincia`, `favTeam`.
- Query server-side su `users` per tier, in ordine, accumulando fino a 6 risultati:
  1. `cap == mio` (se presente)
  2. `provincia == mia` (se presente)
  3. `favTeam == mio` (se presente)
- Esclude: me stesso, amici (da `friendships`), bloccati, profili con
  `isPublic == false`.
- Output: **solo lista di uid** ordinata (tier più vicino prima), max 6. Il CAP non
  è mai nel payload.
- Il client rende le card leggendo `publicProfiles/{uid}`; tap → `/u/:username` →
  richiesta amicizia.
- Se tutti i tier vuoti → il teaser mostra solo la CTA "Invita un amico →".

Dato derivato nuovo:
- `provincia` sul doc privato `users/{uid}`, ricavata dal comune (`citta`) alla
  scrittura profilo/onboarding, tramite il dataset comuni già presente
  (`src/data/` / `searchComuni`). Provincia è grossolana → nessun rischio a
  tenerla server-side (comunque non entra in `publicProfiles`).

Indici Firestore: su `users` per `cap`, `provincia`, `favTeam` (per le query della
function).

### C. Invito tracciato

**Route pubblica `/invita/:username`** (accessibile senza auth):
- **Non loggato**: landing FiguBook "@marco ti invita" (avatar + squadra di marco,
  letti da `publicProfiles`) + bottone Registrati (freccia animata). Il referrer
  (`marco`) viene salvato: URL → `localStorage` (`figubook.invitedBy`), sopravvive
  attraverso registrazione → verifica email → onboarding.
- **Loggato**: redirect a `/u/marco`. Nessun credito (già iscritto).

**Attribuzione** a creazione account (nel flusso di register esistente):
- Risolvo `username → uid` dell'invitante da `usernames`/`publicProfiles`.
- Scrivo edge immutabile `invites/{nuovoUid} = { inviterUid, at }`.
- Nessuna scrittura sul doc dell'invitante ⇒ nessun problema di regole.
- Contatore invitante = query `invites where inviterUid == me` (vedi `useInviteCount`).
- Consumo `figubook.invitedBy` da localStorage dopo la scrittura (one-shot).

## Modello dati (Firestore)

- `invites/{invitedUid}` = `{ inviterUid: string, at: number }` — create-only,
  immutabile. Leggibile: l'invitato (proprio doc) e l'invitante (query per
  `inviterUid`).
- `users/{uid}` — aggiunta `provincia?: string` (privato, non in `publicProfiles`).
- Nessun campo nuovo in `publicProfiles`.

## Regole Firestore (aggiunte)

- `invites/{invitedUid}`:
  - create: `request.auth.uid == invitedUid` && payload = `{inviterUid, at}` con
    `inviterUid` stringa non vuota; immutabile (no update/delete lato client).
  - read: `request.auth.uid == invitedUid || request.auth.uid == resource.data.inviterUid`.
- `friendships` / `friendRequests`: invariati.

## Sicurezza

- CAP: mai in `publicProfiles`, mai nel payload della function; usato solo come
  chiave di match server-side.
- Discoverability limitata ai profili `isPublic == true`.
- Nota di sicurezza al contatto/scambio: **requisito registrato per Fase 3/Scambi**,
  fuori dallo scope di questa fase.

## Testing

- Unit: `useInviteCount`, risoluzione profili (amici/richieste), consumo referrer
  one-shot da localStorage.
- Function `nearbyCollectors`: ordine dei tier, esclusioni (me/amici/bloccati/
  privati), limit 6, tier mancanti (cap/provincia/squadra assenti), payload senza CAP.
- Regole: create `invites` solo dal proprio uid, immutabilità, read solo
  invitato/invitante.
- Derivazione `provincia` dal comune.

## Fuori scope (fasi successive)

- Fase 2: filtri scoperta espliciti, ranking CAP fine, suggeriti.
- Fase 3: chat 1-a-1 + nota di sicurezza al contatto.
- Fase 4: lista invitati, livelli/ricompense che spendono il contatore.
- Gruppi/Club, feed sociale.
