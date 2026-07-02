# Home — grafico "figurine inserite giorno per giorno" (spazio a destra del deck)

Data: 2026-07-02
Ambito: nuovo componente nello spazio `lg` a destra del carosello album in `Home.tsx`.
Riusa gli snapshot giornalieri già salvati (`users/{uid}/stats/{YYYY-MM-DD}`).

## Obiettivo

Area-chart in stile 21st public-stats (Recharts) che mostra quante figurine hai inserito
ogni giorno negli ultimi 7 giorni (rolling, oggi a destra). Dà un andamento dinamico
(sale/scende), a differenza della crescita cumulativa (sempre in salita, scartata).

## Dati

- Fonte: snapshot giornalieri `{ date, have, doubles, missing, total }` già scritti da
  `touchStatsSnapshot`. Nessun nuovo dato lato scrittura.
- Serie giornaliera: per ciascuno dei 7 giorni della finestra rolling (oggi−6 … oggi):
  - se esiste snapshot per quel giorno → `count = have(giorno) − have(snapshot precedente esistente)`
  - se non esiste snapshot (giorno saltato) → `count = 0`
  - se è il primo snapshot in assoluto (nessun precedente) → `count = 0`
  - `count` negativo (rimozioni) → clampato a `0` per la visualizzazione.
- Il salto accumulato dopo giorni saltati si posa sul giorno di rientro (comportamento
  voluto: saltato = 0, rientro = aumento dall'ultimo snapshot).
- Forma serie: `{ date: 'YYYY-MM-DD', count: number }[]`, ordine ascendente (vecchio→oggi).

### Limite noto (accettato)
Lo snapshot si salva solo all'apertura app (1×/giorno). Le carte inserite in giorni in cui
non apri finiscono nel delta del giorno di rientro. Non è un registro carta-per-carta.

## Asse Y a buckets (non-lineare)

Buckets `[5, 20, 50, 100, 200]` con "200+" come cap in cima. Serve perché i giorni normali
sono piccoli (poche carte) e i bustoni possono essere 100+: la scala lineare schiaccerebbe i
giorni piccoli.

Realizzazione: funzione pura `bucketScale(count)` che mappa un conteggio a una posizione
0..N su spaziatura uniforme dei bucket (piecewise-linear tra i confini). Il valore plottato è
la posizione scalata; i tick dell'asse Y sono alle posizioni intere, etichettati `5·20·50·100·200+`.
Il tooltip mostra il conteggio reale, non la posizione.

## Asse X

Rolling 7 giorni, oggi all'estrema destra. Etichetta sotto ogni punto: iniziale giorno
(L/M/M/G/V/S/D) + numero giorno. Data completa (es. "2 lug 2026") nel tooltip.

## Componenti / file

- `src/lib/stats/dailyInserted.ts` — puro: `dailyInsertedSeries(snapshots, todayIso)` → serie 7 punti;
  `bucketScale(count)` + `BUCKETS` + label tick. Testato (vitest).
- `src/lib/db/statsHistory.ts` — modifica `fetchRecentSnapshots(uid, count=14)` (param opzionale;
  14 per coprire finestra 7gg anche con buchi).
- `src/components/home/InsertedChart.tsx` — Recharts area-chart, empty-state, tooltip, asse Y buckets.
  Riceve la serie già calcolata (presentazionale + un po' di config Recharts).
- `src/hooks/useInsertedSeries.ts` — hook: legge snapshot (fetchRecentSnapshots), calcola serie
  con `dailyInsertedSeries`, ritorna `{date,count}[]`.
- `src/pages/Home.tsx` — monta `<InsertedChart>` nella colonna destra `lg` (sostituisce il div
  vuoto `aria-hidden`).

## Empty-state

Serie con < 2 punti utili (meno di 2 giorni di storico) → card con testo "Il grafico crescerà
nei prossimi giorni" nello stile del riquadro (coerente con NewsPanel).

## Mobile
Rimandato. Per ora il grafico appare solo su `lg` (come lo spazio a destra). Mobile deciso dopo.

## Verifica
- `npx tsc -b --noEmit` 0; lint 0; `npx vitest run` verde (nuovi test dailyInserted/bucketScale);
  `npm run build` ok.
- Live: oggi 1 punto → empty-state; dopo ≥2 giorni compare l'area-chart.

## Fuori scope
Vista "crescita" cumulativa (scartata), frecce per settimane passate, timestamp per-carta,
grafico su mobile.
