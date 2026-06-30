# Scambi — Fase 1 (design)

Data: 2026-06-30
Contesto: FiguBook (SPA React/Vite + Firebase serverless, deploy GitHub Pages).
Sezione Scambi = core prodotto, finora placeholder vuoto (`pages/Scambi.tsx`).
Confine di sicurezza unico = `firestore.rules` + Firebase Auth.

## Obiettivo e posizionamento

Permettere a un utente di **completare l'album scambiando con sconosciuti**, non solo amici.
L'amicizia è un filtro di fiducia, non il canale. Il cuore = **discovery globale + matching
reciproco** tra utenti, con opt-in privacy.

Concorrenti analizzati: Doppy (doppy.it), unacollezione.it.
Dove li battiamo:
- **Match reciproco di default** — Doppy mostra anche scambi a senso unico (OFFRI 0 / RICEVI 239
  = impossibili). Noi nascondiamo di default chi non offre un match reale.
- **Tutto in-app** — unacollezione rimanda a un gruppo Telegram per chiudere lo scambio. Noi
  teniamo proposta→conferma dentro FiguBook.
- **UX filtri 2026** — niente form con dropdown + "Applica". Album-first + chip live.
- **Ordinamento per valore** — non per conteggio grezzo, ma per "quanto completi l'album".
- **Estetica** — minimalista Geist, curata; trasversale, non una fase.

## Fasatura (ogni fase = spec + plan + build separati)

- **FASE 1 (questo spec):** loop 1:1 globale completo — opt-in, discovery+matching, componi
  scambio, gestione proposte, conferma bilaterale.
- FASE 2: recensioni post-scambio, reputazione, badge.
- FASE 3: geo "vicino a te" reale (distanza), scambio di persona in evidenza.
- FASE 4: gruppi/bacheche di scambio (in-app, no fuga su Telegram).

## Architettura dati

### Indice di scambio per-album (approccio A)
`tradeIndex/{albumId}/users/{uid}` = `{ doubles: string[], missing: string[], city, rating, updatedAt }`
- Pubblicato SOLO per gli album che l'utente attiva (opt-in).
- `doubles` = codici figurina che l'utente ha in doppia (offre).
- `missing` = codici che gli mancano (cerca).
- Aggiornato quando: l'utente modifica l'album (doppie/mancanti cambiano) o cambia l'opt-in.
- Discovery legge SOLO gli utenti dell'album scelto → scala (niente lettura globale).

Scelta vs alternative:
- B (inventario unico per utente, lettura globale): non scala, scartato.
- C (match precalcolati via Cloud Function): richiede Blaze + complessità, prematuro su Spark.
  Migrazione futura possibile senza buttare A.

### Opt-in privacy
Doc dedicato `users/{uid}/meta/trade` = `{ tradeAlbums: string[] }` = album resi scambiabili.
Solo questi vengono scritti in `tradeIndex`. (Doc dedicato, non dentro `meta/profile`, così le
scritture frequenti d'inventario non toccano il profilo.)
Disattivare un album → rimuove il doc `tradeIndex/{albumId}/users/{uid}`.

### Proposte
`proposals/{proposalId}` = {
  participants: [uidA, uidB],   // immutabile dopo create
  fromUid,                      // chi propone (== creatore)
  toUid,                        // destinatario
  albumId,
  give: string[],              // codici che fromUid dà a toUid
  receive: string[],           // codici che fromUid riceve da toUid
  status: 'pending' | 'accepted' | 'completed' | 'declined',
  confirmedBy: string[],       // uid che hanno confermato "fatto" (solo in accepted→completed)
  createdAt, updatedAt
}

Ciclo di vita:
- create → sempre `pending`, `fromUid == auth.uid`.
- destinatario: Accetta (`accepted`) / Rifiuta (`declined`) / Controproponi (nuova revisione
  di give/receive, resta `pending` ma con campi aggiornati dal destinatario — vedi nota sotto).
- dopo `accepted`: entrambi premono "Conferma scambio fatto" → `confirmedBy` accumula → quando
  contiene entrambi i partecipanti → `completed`.

Nota controproposta Fase 1: la controproposta modifica `give`/`receive` della STESSA proposta
e la rimette `pending` con `fromUid` aggiornato a chi contropropone (così l'altro ora è il
destinatario che deve accettare). `participants`, `albumId`, `createdAt` restano immutabili.

## Schermate

### 1. Scambi (discovery) — `pages/Scambi.tsx`
- Stato iniziale: scelta **album** tra le proprie collezioni, come card visive (non dropdown).
  Solo album dove l'utente ha attivato gli scambi sono "pronti"; gli altri mostrano CTA "attiva".
- Scelto l'album → risultati **live** sotto: card utente con:
  - username, avatar, rating, città
  - **RICEVI** = |mie missing ∩ sue doubles|
  - **OFFRI** = |mie doubles ∩ sue missing|
  - "completi X%" = incremento % album se ricevi tutte le RICEVI
  - CTA "Componi scambio"
- Chip filtro in cima, live, senza bottone Applica:
  - `Reciproci` — attivo di default (mostra solo RICEVI≥1 E OFFRI≥1), togglibile (off = mostra
    anche scambi a senso unico).
  - `Vicino a me` — filtro città (match esatto città profilo in Fase 1; distanza vera = Fase 3).
  - `★ 4+` — rating minimo.
- Ordinamento default: per valore match (RICEVI + OFFRI, tie-break su "completi X%").

### 2. Componi scambio — modale/pagina da una card match
- Due liste **manuali**, pre-filtrate alle sole carte rilevanti:
  - **Ricevi** — sue doubles ∩ mie missing → spunto cosa voglio ricevere.
  - **Dai** — mie doubles ∩ sue missing → spunto cosa offro.
- Contatore live "Ricevi N · Dai M".
- CTA **Invia proposta** → crea `proposals/{id}` con give/receive selezionati, status pending.
- Invio bloccato se give vuoto E receive vuoto.

### 3. I miei scambi — gestione proposte
- Tab **In arrivo** / **Inviate**.
- In arrivo (pending): mostra give/receive → **Accetta** / **Rifiuta** / **Controproponi**
  (riapre Componi precompilato e modificabile).
- Accettate: bottone **Conferma scambio fatto** (per ciascun partecipante). Stato visibile
  ("In attesa che anche X confermi").
- Completate: badge "Completato". (Recensione = Fase 2.)

## Notifiche
Riuso del sistema esistente (`lib/db/notifications.ts`):
- "Hai una nuova proposta da {X}"
- "{X} ha accettato la tua proposta"
- "{X} ha confermato lo scambio"
- "{X} ha rifiutato la proposta"
Href verso `/scambi` (già whitelisted nelle regole notifiche).

## Sicurezza (firestore.rules)
- `tradeIndex/{albumId}/users/{uid}`: read se signedIn; write solo `isUser(uid)` (pubblichi solo il
  tuo). Niente dati sensibili (solo codici figurina + città/rating pubblici).
- `proposals/{id}`:
  - read: solo se `auth.uid in participants`.
  - create: `verified()` + `fromUid == auth.uid` + `auth.uid in participants` + `status == 'pending'`.
  - update: solo partecipante; `participants`/`albumId`/`createdAt` immutabili; `confirmedBy`
    solo subset di participants; `completed` SOLO se `confirmedBy` contiene entrambi i partecipanti
    (no auto-completamento unilaterale).
  - delete: false.
- Email verificata richiesta su create (helper `verified()` già esistente, vedi
  [[figubook-security-posture]]).

## Moduli (isolamento)
- `lib/db/tradeIndex.ts` — pubblica/rimuove indice album, deriva doubles/missing da album doc.
- `lib/trade/match.ts` — parte pura, testabile: calcola RICEVI/OFFRI/completi% date due liste.
- `lib/db/proposals.ts` — create/update/subscribe proposte, transizioni di stato.
- `pages/Scambi.tsx` — discovery (album-first + chip + risultati).
- `components/trade/ComponiScambio.tsx` — due liste manuali + invio.
- `pages/ScambiMiei.tsx` (o tab in Scambi) — gestione proposte.

## Fuori scope Fase 1
- Recensioni/reputazione (Fase 2).
- Geo-distanza reale (Fase 3; Fase 1 usa match città esatta).
- Gruppi/bacheche (Fase 4).
- Match precalcolati / Cloud Functions.
- Spedizioni/logistica.

## Rischi / note
- Scala lettura discovery: O(utenti dell'album). Ok per centinaia; a migliaia valutare Fase C.
- Sync indice: ogni modifica album deve aggiornare `tradeIndex`. Va agganciato al flush album
  esistente (`flushAlbumCounts`) per gli album opted-in.
- Coerenza doppie: `give`/`receive` sono snapshot al momento della proposta; tra proposta e
  conferma una doppia potrebbe non esserci più. Fase 1: nessun lock, è uno scambio fisico fuori
  app; la conferma bilaterale è l'unica verità. (Lock inventario = eventuale fase futura.)
