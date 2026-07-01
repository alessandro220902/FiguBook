# Scambi — pagina unificata + swap-card + modifica proposta

Data: 2026-07-01
Stato: design approvato (sezioni 1-3), pronto per piano.

## Obiettivo

Rifondare la sezione Scambi in **una sola pagina** con:
1. Titolo "I miei scambi"
2. Picker album (discovery, invariato)
3. Tre rettangoli: Proposte ricevute · Proposte inviate · Scambi completati

Card proposta ridisegnata in stile **swap** (rif. 21st.dev crypto-swap: pannello FROM
sopra, TO sotto, icona swap centrale, glassmorphic) ma dentro i token brand FiguBook
(lime + superfici scure, niente gradienti blu/viola del demo).

Nuova feature: **Modifica proposta** (contro-proposta / riedizione), che aggiorna lo
stesso documento proposta e rimette la palla all'altro partecipante.

Elimina la route separata `/scambi/miei` (oggi doppione confuso). Il contenuto confluisce
nella pagina `/scambi`.

## Struttura pagina (`/scambi`)

```
I miei scambi
─────────────────────────────
Album su cui scambiare           (picker attuale, discovery → apre /scambi/:albumId)
[Calciatori] [Adrenalyn] ...
─────────────────────────────
Proposte ricevute (n)
Proposte inviate (n)
Scambi completati (n)
```

- Sezioni vuote nascoste (o riga leggera "Nessuna proposta ...").
- Ordine fisso: ricevute (richiede azione) → inviate (attesa) → completate (storico).
- La discovery per singolo album (selezione carte + invio proposta) resta su `/scambi/:albumId`
  invariata (`Scambi.tsx` attuale, che gestisce match + ComponiScambio).

## Card scambio (componente nuovo: `SwapCard`)

```
┌─────────────────────────────────────┐
│ [cover] Adrenalyn XL 2025/26         │  header: mini-copertina + nome album
├─────────────────────────────────────┤
│ [avatar] Alessandro22        ⭐ 4.8  │  FROM = lastEditedBy (chi ha mandato ultima versione)
│ Dà 3 carte          [Visualizza →]   │  solo conteggio + apertura dialog
│              ↕                        │  icona ArrowUpDown centrale
│ [avatar] yepes                       │  TO = altro partecipante
│ Riceve 1 carta      [Visualizza →]   │
├─────────────────────────────────────┤
│ [stato pill]              [azioni]   │  footer
└─────────────────────────────────────┘
```

Regole visuali:
- **FROM sempre in alto = chi manda l'ultima versione** (`lastEditedBy`); **TO in basso = altro**.
  Coerente in tutte e tre le sezioni.
- Avatar + username cliccabili → profilo pubblico (`/u/:username` esistente). Reputazione ⭐
  accanto al nome FROM/TO se disponibile.
- Nessuna lista figurine inline: ogni pannello mostra il **conteggio** ("Dà 3 carte") + bottone
  **"Visualizza carte"**.
- **Dialog "Visualizza carte"**: unico, mostra entrambe le liste (Dà / Riceve) con nomi veri
  (`#19 Logo`, ...). Card resta compatta anche con molte figurine.
- Glassmorphic morbido su token brand: `bg-surface/40`, `border-white/[0.08]`, blur leggero.
  NIENTE gradienti blu/viola del demo. Rispetta minimalismo Geist/Outfit del progetto.

### Prospettiva viewer
`give`/`receive` sono memorizzati **relativi a `fromUid`** (immutabili — vedi rules).
La card mappa in base a `lastEditedBy` e a chi guarda:
- pannello FROM (lastEditedBy) mostra "Dà N" = le carte che lastEditedBy cede;
- pannello TO mostra "Riceve N" = le stesse carte.
Con contro-proposta `lastEditedBy` può diventare il destinatario originale: la logica di
mapping deve derivare "cosa dà/riceve ciascuno" dai campi `give`/`receive` + `fromUid`, non
assumere che chi guarda sia il mittente.

### Azioni per sezione
- **Ricevute** (status `pending`, `turnUid == me`): `Accetta` · `Rifiuta` · `Modifica proposta`
- **Inviate** (status `pending`, `turnUid != me`, io = lastEditedBy): `Annulla scambio` · `Modifica proposta`
- **In corso** (status `accepted`, non ancora confermato da me): `Conferma scambio fatto` (bilaterale, invariato)
- **Completati** (status `completed`): `Lascia recensione` / ⭐ se già data + data scambio
- Chi **non è di turno** (`turnUid != me` in stato pending) vede pill "In attesa di risposta",
  nessun bottone d'azione (solo Modifica/Annulla se è lastEditedBy).

## Modello dati

Documento `proposals/{id}` — campi nuovi:
- `lastEditedBy: string` (uid) — chi ha mandato l'ultima versione. Alla creazione = `fromUid`.
- `turnUid: string` (uid) — di chi è il turno di rispondere = l'altro rispetto a `lastEditedBy`.
  Alla creazione = `toUid`.
- `status`: estendere a `'pending' | 'accepted' | 'completed' | 'declined' | 'cancelled'`.

Campi invariati: `participants`, `fromUid`, `toUid`, `albumId`, `give`, `receive`,
`confirmedBy`, `createdAt`, `updatedAt`.

## Flussi

### Creazione (invariata, + nuovi campi)
`createProposal` scrive anche `lastEditedBy = fromUid`, `turnUid = toUid`.

### Modifica proposta (stesso doc)
1. Apre `ComponiScambio` precompilato con le carte attuali (mappate nella prospettiva di chi modifica).
2. Su salva → `updateProposalOffer(id, give, receive, editorUid)`:
   - `give`, `receive` aggiornati (sempre nel frame `fromUid`)
   - `status = 'pending'`, `confirmedBy = []`
   - `lastEditedBy = editorUid`, `turnUid = altroPartecipante(editorUid)`
   - `updatedAt = now`
3. Notifica all'altro: "Proposta aggiornata da {username}".

Vale identico per ricevute (contro-proposta) e inviate (riedizione): differisce solo chi è
`editorUid`. Il documento resta unico (nessun doppione).

### Annulla scambio (inviate)
`cancelProposal(id)` → `status = 'cancelled'`, `updatedAt = now`. Sparisce dalle liste attive.
(Rules delete = false, quindi soft-cancel via stato.)

### Accetta / Rifiuta / Conferma (invariati)
`acceptProposal` (`status='accepted'`), `declineProposal` (`status='declined'`),
`confirmProposal` (bilaterale → `completed` + `applyTradeToAlbum`). Su accept: `turnUid`
non più rilevante (entrambi devono confermare).

## Editor riuso (`ComponiScambio`)
Aggiungere prop opzionali:
- `initialGive?: string[]`, `initialReceive?: string[]` — precompilano `useSelection`.
- `mode?: 'create' | 'edit'` — cambia label bottone: "Invia proposta" vs "Salva modifiche".
Comportamento create invariato quando le prop non sono passate.

## Risoluzione nomi figurine
Per ogni proposta serve mappa `codice → nome` dell'album (`albumId`). Caricare i dati album
on-demand per gli `albumId` presenti nelle proposte, con cache locale (Map per albumId) per
non ricaricare. Riusa la pipeline album-data esistente (`src/data/albums/*`).

## Notifiche (riuso `users/{uid}/notifications`)
Eventi che generano notifica: nuova proposta, proposta modificata, accettata, completata.
Formato invariato (`fromUid`, `type:'trade'`, `title`, `icon`, `href:'/scambi'`, `read`, `at`).

## Firestore rules (deploy separato)
- Ammettere `status` in {`pending`,`accepted`,`completed`,`declined`,`cancelled`} dove oggi
  è vincolato.
- Su `update` proposals: consentire i nuovi campi `lastEditedBy`/`turnUid` mantenendo il
  divieto di cambiare `participants`/`fromUid`/`toUid`/`albumId`/`createdAt` (vincoli attuali).
- `verified()` resta requisito per create (invariato).

## Componenti / file coinvolti
- `src/pages/Scambi.tsx` — split: landing (`/scambi`) con 3 sezioni + picker; il flusso per
  album (`/scambi/:albumId`) resta.
- `src/pages/ScambiMiei.tsx` — **rimosso** (contenuto confluisce nella landing); rimuovere route.
- `src/components/trade/SwapCard.tsx` — **nuovo**, card swap + azioni.
- `src/components/trade/CardsDialog.tsx` — **nuovo**, dialog "Visualizza carte".
- `src/components/trade/ComponiScambio.tsx` — prop initialGive/initialReceive/mode.
- `src/lib/db/proposals.ts` — nuovi campi + `updateProposalOffer`, `cancelProposal`, helper turno.
- `src/lib/trade/proposalView.ts` — **nuovo** (puro, testabile): dato proposal + uid corrente,
  deriva FROM/TO, conteggi dà/riceve, mapping prospettiva. Con test.
- `firestore.rules` — vedi sopra.

## Testing
- `proposalView.ts`: unit test mapping FROM/TO e conteggi per: io=fromUid, io=toUid,
  dopo contro-proposta (lastEditedBy invertito).
- `proposals.ts` helper turno (`otherParticipant`, transizioni stato) — unit.
- Editor: precompilazione initialGive/initialReceive.
- E2e manuale a 2 account: invio → modifica (contro-proposta) → accetta → conferma bilaterale
  → completato → recensione.

## Fuori scope (YAGNI)
- Cronologia versioni della trattativa (solo stato corrente).
- Chat/messaggi tra le parti.
- Annullamento dopo accettazione (per ora annulla solo in pending).
```
