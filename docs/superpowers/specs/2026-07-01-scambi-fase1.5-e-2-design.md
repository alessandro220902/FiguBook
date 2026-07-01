# Scambi — Fase 1.5 (aggiornamento album) + Fase 2 (rating/recensioni) — design

Data: 2026-07-01
Contesto: FiguBook SPA React/Vite + Firebase serverless. Fase 1 Scambi già in produzione
(discovery, match, proposte, conferma bilaterale). Confine sicurezza = `firestore.rules`.
Riferimenti: docs/superpowers/specs/2026-06-30-scambi-fase1-design.md.

## Fase 1.5 — Aggiornamento album alla conferma

Quando l'utente preme **"Conferma scambio fatto"** (`confirmProposal`), oltre a segnare la
conferma, applica le modifiche **al SOLO album dell'utente che conferma** (ognuno aggiorna il
proprio, quando conferma — le regole permettono solo la scrittura del proprio album).

Regola di aggiornamento, dato lo scambio {give, receive, albumId}:
- Per ogni codice in **receive** (ricevo): nuovo conteggio = corrente + 1.
- Per ogni codice in **give** (do via): nuovo conteggio = max(0, corrente − 1).

Conteggio → stato via `countToFields` (già esistente): 0 = mancante (deleteField), 1 = have,
≥2 = double. Il conteggio corrente si legge con `counterOf(code, states, counts)`.

Implementazione:
- Leggo l'album doc dell'utente una volta (`subscribeAlbum`, unsub immediato).
- Calcolo la mappa `code -> nuovoConteggioAssoluto` per i soli codici in give/receive.
- Un solo `flushAlbumCounts(uid, albumId, mappa)` (già batcha in un setDoc merge).
- Questo scatena anche il re-sync dell'indice scambi via l'hook afterFlush esistente.

Ordine: prima applico l'album, poi (o insieme) aggiorno lo stato proposta. Se l'album fallisce,
non blocco la conferma? → Applico album E conferma in `confirmProposal`; se l'album fallisce,
logga errore ma la conferma prosegue (lo scambio fisico è avvenuto). L'aggiornamento album è una
comodità, non deve impedire il completamento.

Idempotenza: un utente conferma UNA volta (il bottone sparisce dopo la conferma, perché
`confirmedBy.includes(uid)`), quindi l'aggiornamento album avviene una sola volta per utente.

Modulo: `lib/trade/applyTradeToAlbum.ts` — parte pura testabile che, dato
{states, counts, give, receive}, ritorna la mappa dei nuovi conteggi assoluti. Il wrapper vive
in `proposals.ts` (confirmProposal) o in un nuovo `lib/db/tradeApply.ts`.

## Fase 2 — Rating e recensioni

### Dati
Recensione in `users/{toUid}/feedback/{fid}` (subcollection del recensito) =
`{ fromUid, proposalId, rating: number (1-5), comment: string (≤500), createdAt }`.
Le regole esistono già: create/update valido solo da `fromUid == auth.uid`, `auth.uid != toUid`,
rating 1-5, comment ≤500, e SOLO se `proposalId` punta a una proposta `completed` con entrambi
tra i participants. Read: signedIn.

Una recensione per scambio: uso `fid = proposalId` (doc id = proposalId) → un utente può
recensire una sola volta per proposta (riscrivere sovrascrive, ma è la stessa recensione).
Nota: `users/{toUid}/feedback/{proposalId}` — chi recensisce scrive nel doc id = proposalId.

### Reputazione
La reputazione di un utente = media `rating` + conteggio delle recensioni ricevute
(`users/{uid}/feedback`). Helper `getRating(uid) -> { avg, count }` che legge la subcollection.
- Mostrata su: profilo pubblico, card match in Scambi, pagina "I miei scambi".
- Il chip **★ 4+** in Scambi diventa reale: filtra i candidati con `avg >= 4`.
- Nessun aggregato precalcolato (no cross-user write, no Cloud Function). Lettura on-demand,
  cache in una mappa lato client. Le liste match sono piccole → costo accettabile.

### UI
- **"I miei scambi"**: le proposte `completed` mostrano **"Lascia recensione"** (se non già
  lasciata) → dialog con stelle 1-5 (obbligatorie) + testo (facoltativo, ≤500) → scrive feedback.
  Se già recensita, mostra "Recensione inviata" con le stelle date.
- **MatchCard** (Scambi discovery): accanto a username, `★ avg (count)` se count>0, altrimenti
  "Nuovo".
- **Profilo pubblico**: blocco reputazione (media + numero recensioni) + lista ultime recensioni
  (stella + testo + data).

### Moduli
- `lib/db/feedback.ts` — createReview(toUid, proposalId, fromUid, rating, comment),
  getRating(uid), subscribeReviews(uid) / getReviews(uid).
- `components/trade/ReviewDialog.tsx` — stelle + testo + invio.
- `components/trade/StarRating.tsx` — display/inputo stelle riutilizzabile.
- Aggiornare MatchCard, ScambiMiei, ProfiloPubblico.

## Sicurezza
- Feedback: regole già presenti e corrette. Nessuna modifica alle rules necessaria.
- Album update in 1.5: scrive solo `users/{uid}/albums/{albumId}` del proprietario → già coperto.

## Fuori scope
- Aggregato rating precalcolato / Cloud Functions (Fase futura se scala).
- Badge/livelli reputazione (dopo).
- Geo distanza (Fase 3), gruppi (Fase 4).

## Rischi
- Rating on-demand: N letture feedback per N candidati in discovery. Liste piccole ora; a scala
  valutare denormalizzazione. Cache client per sessione mitiga.
- Album update basato sulla conferma soggettiva: accettato by design (lo scambio è fisico, la
  conferma è l'affermazione dell'utente). Non silenzioso: parte solo dal tap "Conferma".
