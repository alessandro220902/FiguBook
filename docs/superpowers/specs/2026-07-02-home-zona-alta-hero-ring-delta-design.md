# Home — zona alta: Hero Ring + tile con delta + snapshot storico

Data: 2026-07-02
Ambito: solo la zona sopra il carosello album (`AlbumDeck`) in `figubook-app/src/pages/Home.tsx` +
`src/components/home/StatTicker.tsx`. Non tocca deck, NewsPanel, GroupsPanel.

## Obiettivo

Rendere la riga stat più fresca e dinamica: un anello "hero" per il completamento
globale al posto del riquadro Possedute, tile Doppie/Mancanti con delta settimanale
↑↓, Doppie che porta agli Scambi, e il riquadro Scambi che diventa "Scambi completati"
senza link. I delta vengono da uno snapshot giornaliero salvato in Firestore.

## Componenti

### 1. Hero Ring (sostituisce il riquadro Possedute)
- Anello circolare (SVG) che mostra `totals.pct`. Colore riempimento = colore squadra
  (`team.c1`), fallback lime se nessuna squadra.
- Al centro dell'anello: percentuale grande con count-up (riuso `AnimatedNumber`).
- A fianco: label "Collezione totale", numero `have` count-up + `/ total`.
- Pill "+N settimana" sotto (delta di `have` sugli ultimi 7 giorni). Nascosta se non
  c'è ancora storico sufficiente.
- Occupa lo spazio della vecchia tile primaria (col-span come ora su mobile).

### 2. Tile Doppie / Mancanti (delta ↑↓)
- Stesso layout tile attuale + riga delta: `↑ +N` verde per Doppie, `↓ -N` rosso per
  Mancanti (colore segue la direzione, non la metrica). Delta = valore oggi − valore ≤7gg fa.
- Delta nascosto se manca storico.
- **Doppie** diventa `Link` a `/scambi` (freccia → coerente come oggi su Scambi).
- **Mancanti** resta non cliccabile (solo stato). Motivo: senza reciprocità un mancante
  non è azionabile da solo.

### 3. Tile Album
- Invariata. Resta stat semplice (nessun link oggi; opzionale link `/album` in seguito).

### 4. Tile "Scambi completati" (ex Scambi)
- Rimosso il `Link` a `/scambi`. Label da "Scambi" a "Scambi completati". Solo numero
  (`useTradesCount`, che già conta i `status === 'completed'`). Niente freccia.

### 5. Snapshot storico giornaliero (nuovo modulo dati)
- Nuovo file `src/lib/db/statsHistory.ts`.
- `touchStatsSnapshot(uid, totals)`: throttle 1×/giorno via localStorage
  (`figubook:statsDay:${uid}` = YYYY-MM-DD). Se il giorno è già salvato, esce.
  Altrimenti `setDoc(doc(db,'users',uid,'stats',<YYYY-MM-DD>), {date, have, doubles, missing, total})`.
- `subscribeStatsDeltas(uid, cb)` oppure fetch una tantum: legge gli ultimi ~8 doc
  (`orderBy(date desc) limit 8`), restituisce `{ haveDelta, doublesDelta, missingDelta }`
  confrontando il valore odierno col più vecchio entro 7 giorni. Se < 2 punti dati o
  base mancante → `null` per quel delta (UI nasconde).
- Chiamato da `Home.tsx` (o da un hook `useStatsDeltas`) dopo che `totals` è pronto e
  non in loading/errore. Snapshot scritto con i `totals` correnti.

## Firestore rules
- Aggiungere `match /users/{uid}/stats/{day}` : `allow read, write: if request.auth.uid == uid`.
  Documenti privati, solo il proprietario. Deploy via CLI.

## Dati / tipi
- `AlbumStats` già espone `have, doubles, missing, total, pct` — nessun nuovo campo.
- Snapshot doc: `{ date: 'YYYY-MM-DD', have, doubles, missing, total }`.

## Unità e confini
- `statsHistory.ts` — puro I/O Firestore + throttle. Testabile: la logica di calcolo
  delta va in una funzione pura `computeDeltas(snapshots): {haveDelta,doublesDelta,missingDelta}`
  in `src/lib/stats/computeDeltas.ts`, con test vitest (storico vuoto, 1 punto, 7+ giorni,
  buchi tra i giorni).
- `HeroRing.tsx` — presentazionale, prende `pct, have, total, delta, color`.
- `StatTicker.tsx` — orchestrazione riga: monta HeroRing + tile.

## Fuori scope (rimandato)
- Streak "7 giorni di fila" e "+12 carte oggi" (l'utente li piazza altrove).
- Spotlight rotante (direzione C).
- Sparkline dentro le tile (solo delta numerico per ora).
- Pannello Attività (blocco separato, altra sessione).

## Verifica
- `npx tsc -b --noEmit` exit 0, `npm run lint` 0 error, `npx vitest run` verde (nuovi test
  computeDeltas), `npm run build` ok.
- Delta nascosti al primo accesso; compaiono dopo ≥2 giorni di snapshot.
