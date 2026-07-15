# Albo d'Oro — Design (Community Fase 4, v1)

Data: 2026-07-15
Stato: approvato in brainstorm, pronto per il piano.

## Obiettivo

Aggiungere alla Community una terza sezione — **Albo d'Oro** — con punteggio, classifiche e stagioni. È il pilastro "classifiche & status" della roadmap Community, riletto in chiave **originale** (non clone di Doppy LevelUp).

Fuori v1: **ricompense** (avatar/immagini profilo per stagione) e **Gruppi** → spec separate successive. Fuori v1 anche card/achievement digitali.

## Differenziazione vs Doppy

Doppy premia il *movimento* (proposta inviata +0.2, login +1) più del *valore*; le figurine vere non danno punti; una sola classifica nazionale opaca (#251); punti eterni (cold-start morto per i nuovi).

FiguBook ribalta:
1. **Il punteggio nasce dal COMPLETARE, non dal cliccare.** Il blocco collezione domina.
2. **Due assi** invece di un numero solo: *Collezionista* (completamento) e *Scambista* (attività/rete). Default mostrato = **Totale**, con filtro per asse.
3. **Classifiche multiple locali:** Nazionale · Città · Squadra · Amici. Ognuno è #1 da qualche parte. (Sfrutta dati zona+squadra già presenti.)
4. **Stagioni mensili:** i punti ripartono da 0 ogni mese; albo d'oro storico dei vincitori. I nuovi hanno sempre speranza.
5. **Anti-grinding come feature:** punti scambio solo da scambi realmente completati con partner diversi; cap giornalieri. Classifica credibile.

(Scartata l'idea "rarità pesata" — non in v1.)

## Punteggio

### 🏆 Collezionista (completamento)
| Azione | Punti |
|---|---|
| Album completato 100% | +50 |
| Traguardo 25/50/75% di un album | +5 ognuno |
| Prima figurina di un nuovo album | +2 |
| Figurina inserita | +0.1 (cap 5/giorno) |
| **Derby**: punti su album/sezioni della squadra del cuore | **×1.5** su quei punti |

### 🔄 Scambista (attività + rete)
| Azione | Punti |
|---|---|
| Scambio completato (con partner diverso) | +5 |
| Primo scambio con un nuovo partner | +3 |
| Amico invitato che si iscrive | +20 |
| Amicizia accettata | +1 |
| Attività giornaliera | +1 (cap 1/giorno) |
| Profilo completo (comune+CAP+squadra+avatar) | +5 (una tantum) |

### Totale
`totale = collezionista + scambista`. Vista di default della classifica. Filtro per mostrare un singolo asse.

## Modello di calcolo — derivato dallo stato

Scoperta chiave: il punteggio è quasi interamente **funzione dello stato attuale**, non di un log di eventi. Niente ledger event-sourced (a differenza di Doppy). Vantaggi: semplice, e a prova di cheat (non si farma un evento; il punteggio riflette ciò che possiedi davvero).

Fonti dati esistenti:
- **Completamento album:** `users/{uid}/albums/{albumId} = {states, counts}` + `_my-albums.ids`; totale dal catalogo (`data/albumCatalog.ts`, `albumById[id].total`); `computeStats()` → pct/have/total. → punti Collezionista.
- **Derby / squadra:** sezioni `kind:'team'` + `canonicalTeamId` (`lib/album/teamProgress.ts`); `favTeam` sul profilo. → moltiplicatore ×1.5 sui punti derivati da sezioni della squadra del cuore.
- **Scambi:** collection `proposals`, `status:'completed'` quando `participants ⊆ confirmedBy`; ha `participants`, `updatedAt`, `albumId`. → Scambista: `+5 × (scambi completati)` + `+3 × (partner distinti)`. Stagionale via `updatedAt` nel mese corrente.
- **Inviti:** `invites/{invitedUid} = {inviterUid, at}` (già contati da `subscribeInviteCount`). → +20 ciascuno; stagionale via `at`.
- **Amicizie / profilo completo:** `friends.ts`, `ProfileDoc`.
- **Filtri classifica:** `citta`, `provincia`, `favTeam`, `username`, `avatarId`, `isPublic` da `publicProfiles`.

### Assi derivati
- **Collezionista (cumulativo):** somma sui propri album di: 50 per ogni album 100%, 5 per soglia raggiunta (25/50/75%), 2 per album iniziato, 0.1×figurine (cap 5/giorno *solo per la componente "figurina inserita" del giorno*), ×1.5 sulle quote provenienti da sezioni della squadra del cuore.
- **Scambista (cumulativo):** 5×scambi_completati + 3×partner_distinti + 20×inviti + 1×amicizie + 1×giorni_attivi(cap) + 5 se profilo completo.
- **Stagionale (mensile):** stessa formula filtrata al mese corrente. Album: delta di completamento dal **baseline di inizio mese** (snapshot già disponibile — `users/{uid}/stats/{date}` da `statsHistory.ts` — si prende lo snapshot più vecchio del mese come baseline). Scambi/inviti/amicizie: eventi con timestamp nel mese.

### Nota onestà cap giornalieri
I cap (figurina +0.1 max 5/g, attività +1/g) richiedono conteggio per-giorno. Deriviamo dagli snapshot giornalieri esistenti (`users/{uid}/stats/{date}`) invece di un contatore separato dove possibile. Dettaglio esatto rifinito in fase di piano.

## Architettura punteggio e classifiche

### Persistenza
`scores/{uid}` (nuova collection, denormalizzata per query classifica e rendering):
```
{
  uid, username, avatarId, favTeam, citta, provincia, isPublic,
  collezionista, scambista, totale,                 // stagione corrente
  collezionistaAllTime, scambistaAllTime, totaleAllTime,
  season: 'YYYY-MM',
  updatedAt
}
```
`isPublic:false` → escluso dalle classifiche pubbliche (coerente con privacy esistente; resta visibile solo in "Amici").

### Freschezza (requisito founder: "al secondo quando entro")
Onestà: ricalcolare *tutti* al secondo non scala. Strategia:
- **Il tuo score → ricalcolato live all'apertura** di Albo d'Oro (callable legge i tuoi album+scambi+inviti ora) e riscrive `scores/{me}`.
- **Scope locali (Città/Squadra/Amici = insiemi piccoli)** → la callable può ricalcolare live i membri dello scope → *davvero al secondo*.
- **Nazionale** → ordina gli `scores/{uid}` salvati (top-N), aggiornati all'ultimo evento/apertura di ciascuno.
- Evoluzione futura (a crescita utenti): trigger Firestore on-event per aggiornare `scores` in background.

### Cloud Functions (europe-west1, v2, `getFirestore()`)
- `computeScore(uid)` — funzione pura server-side: legge album/proposals/invites/friends/profile, applica le formule (assi + stagionale + derby + cap), ritorna `{collezionista, scambista, totale, allTime...}`. **Testabile in isolamento** (vitest, come `nearbyCollectors`/`rankCandidates`).
- `leaderboard({ scope, axis, limit })` — callable:
  1. ricalcola e persiste lo score del chiamante;
  2. risolve l'insieme utenti dello scope (nazionale=globale top-N; città=stesso `citta`; squadra=stesso `favTeam`; amici=lista amici del chiamante);
  3. per scope locali ricalcola live i membri; per nazionale legge `scores` salvati;
  4. ritorna righe ordinate `[{uid, username, avatarId, favTeam, citta, value, rank}]` + `me` (posizione del chiamante) + `hasMore`.
  - `axis ∈ {totale, collezionista, scambista}`; `scope ∈ {nazionale, citta, squadra, amici}`.
- **Catalogo totali lato functions:** le functions non importano `data/albumCatalog.ts` dell'app. Serve una mappa minima `albumId → total` condivisa/duplicata in `functions/src`. Da definire nel piano (preferibile fonte unica riusata, o generata).

### Client
- `useLeaderboard(scope, axis)` — chiama la callable, gestisce loading/paginazione (pattern come `useNearbyCollectors`).
- Ricalcolo del proprio score all'ingresso nella tab → posizione live.

## UI

### Sub-navbar Community
Community acquisisce sub-tab a pill sotto l'header "Il mondo di FiguBook":
**Amici · Gruppi · Albo d'Oro**.
- Route: `/community` (default → Amici), `/community/gruppi`, `/community/albo-doro`. Deep-link, back-button.
- Il contenuto attuale di Community (invito, ricerca, richieste, amici, collezionisti-per-te) si sposta nel tab **Amici**.
- **Gruppi** = placeholder "Presto" (spec separata).
- NON replicare la navbar top (niente doppia navbar): pill leggere a segmenti.

### Tab Albo d'Oro
1. **Header status (stat-tiles):** badge Punti Totali (stagione) · Posizione (#) · asse dominante. Ispirato a Doppy LevelUp / componente `points-badge` (riadattato nel design system: lime/dark, `<Avatar>`, `<TeamCrest>`).
2. **Filtri:**
   - Scope: `Nazionale · Città · Squadra · Amici` (pill/segment).
   - Asse: `Totale (default) · Collezionista · Scambista`.
3. **Podio top-3** (1° al centro, 2°-3° ai lati) — riferimento visivo `leaderboard-podium` di Trophy.so, **riscritto** nel design system (avatar via `avatarId`, crest squadra, comune sotto il nome).
4. **Lista rankings** sotto il podio (riferimento `leaderboard-rankings`): riga = rank, avatar, username, crest squadra, comune, valore. Riga del chiamante evidenziata. "Mostra altri" (paginazione, pattern esistente).
5. **Stato stagione:** solo etichetta mese corrente in v1. **Storico vincitori delle stagioni → rimandato a v1.1** (deciso).
6. **Empty/incompleto:** senza comune/squadra → banner "Completa il profilo" verso `/profilo` (pattern già presente in Community).

I codici dei componenti Trophy.so **non sono copiabili** (paywall) → ricreati da riferimento visivo nel design system FiguBook.

## Regole Firestore / indici
- `scores/{uid}`: lettura pubblica dei doc `isPublic:true` (o lettura mediata solo dalla callable — preferibile per non esporre l'intera collection); scrittura solo da Cloud Function (admin). Da decidere nel piano: se la callable è l'unico lettore, `scores` può essere chiusa in lettura al client.
- Indici: query `scores` per `citta`+`totale desc`, `favTeam`+`totale desc`, `totale desc` (nazionale). Definiti nel piano.
- Coerenza privacy: `isPublic:false` fuori dalle classifiche pubbliche; resta in "Amici".

## Testing
- `computeScore` puro → unit test vitest (album 100%, soglie, derby ×1.5, partner distinti, stagionale, cap giornalieri, profilo incompleto).
- `leaderboard` scope resolution + ordinamento + posizione `me`.
- Client: rendering podio/lista, switch filtri, empty/incompleto.
- Non regressione: `AlbumList.test.tsx` (3 fail preesistenti) resta fuori scope.

## Sicurezza minori / privacy
- Nessun nuovo dato sensibile esposto: la classifica mostra solo dati già pubblici (username, avatar, squadra, comune). CAP mai mostrato (resta chiave di prossimità server-side).
- `isPublic:false` non compare nelle classifiche pubbliche.

## Rimandato (post-v1)
- **Ricompense**: avatar/immagini profilo sbloccabili per stagione (+ achievement-card/list di Trophy.so). Spec a sé.
- **Gruppi**: sottosistema pesante, spec a sé.
- **Storico vincitori** stagioni → **v1.1** (deciso).
- **Trigger on-event** per scalare la freschezza classifiche a molti utenti.
