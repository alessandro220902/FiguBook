# Grafico ② doppie/nuove per giorno + drill-down torta per album

Data: 2026-07-11
Stato: approvato via dialogo, in attesa review spec

## Obiettivo

Nella sezione grafico della Home, aggiungere un **toggle** tra due viste:
- **① Aggiunte** (attuale): area chart delle figurine aggiunte al giorno (Δhave).
- **② Doppie/Nuove** (nuovo): grafico a **barre** per giorno con due barre affiancate —
  **doppioni in rosso**, **nuove in verde**.

Cliccando su una barra (di un giorno), si apre una **torta in sovraimpressione** che spiega
come sono state inserite le figurine di quel giorno, **divise per album** (legenda a destra coi
nomi album). Passando su una fetta (es. Calciatori 24/25) un tooltip mostra le statistiche di
quell'album quel giorno: es. "4 doppie · 2 nuove".

## Dato: snapshot giornaliero per album

Oggi `users/{uid}/stats/{date}` = `{date, have, doubles, missing, total}` (aggregato utente).
Si **estende** con il breakdown per album:

```
{
  date, have, doubles, missing, total,       // invariato (aggregato)
  albums: { [albumId]: { have: number, doubles: number } }
}
```

- `touchStatsSnapshot(uid, totals, perAlbum)` riceve anche la lista per-album (già disponibile in
  `AppLayout` da `useCollection().albums`, ognuno con `have`/`doubles`) e la scrive in `albums`.
- **Fix guard**: oggi riscrive solo se cambia `have`. Va esteso a "`have` **o** `doubles`", così i
  giorni in cui prendi solo doppie (have invariato) vengono registrati. Il marker localStorage
  diventa `${today}:${have}:${doubles}`.

**Limite accettato**: il breakdown per album esiste solo **dai giorni successivi all'attivazione**.
Gli snapshot storici restano solo aggregati → per quei giorni la torta non è disponibile (barra
cliccabile solo se il giorno ha il campo `albums`).

## Calcolo delta

Da due snapshot consecutivi (giorno precedente → giorno X):
- **nuove del giorno** (aggregato) = `have[X] - have[X-1]` (già fatto per il grafico ①).
- **doppie del giorno** (aggregato) = `doubles[X] - doubles[X-1]`.
- **per album**: `newAlbum = have_album[X] - have_album[X-1]`, `dblAlbum = doubles_album[X] - doubles_album[X-1]`.
  (Album assente il giorno prima → base 0. Delta negativi → clamp a 0.)

Modulo puro `dailyDoublesSeries(snapshots)` → `DayPoint[]` con
`{ date, nuove, doppie, perAlbum: { albumId: { nuove, doppie } } }`, testabile senza DB.

## UI

**Toggle vista** sopra il grafico: due chip "Aggiunte" / "Doppie e nuove" (o segmented control),
default "Aggiunte". Stato locale nel componente della sezione grafico.

**Grafico ②** (`recharts` BarChart, stile coerente con InsertedChart — stessi assi/tick/tema):
- Due `<Bar>` per giorno: `doppie` fill rosso (`var(--color-stat-missing)` o rosso dedicato),
  `nuove` fill verde (`var(--color-lime)` segue il tema oro/lime scoped).
- `onClick` su una barra → apre il modal torta per quel giorno (solo se il giorno ha `perAlbum`).

**Torta drill-down** (`recharts` PieChart in un overlay/modal centrato, chiudibile con X/backdrop):
- Fette = album, dimensione = **totale aggiunte di quel giorno per album** (`nuove + doppie`).
- Colori fetta = colore album (`albumById[id].c1`).
- **Legenda a destra** coi nomi album.
- **Tooltip su fetta**: "«Titolo album» — N doppie · M nuove" (dal `perAlbum` del giorno).
- Titolo modal: la data ("20 dicembre 2025").

## File coinvolti (indicativo, dettaglio nel piano)

- `src/lib/db/statsHistory.ts` — estendere doc + firma + guard
- `src/components/layout/AppLayout.tsx` — passare il per-album a `touchStatsSnapshot`
- `src/lib/stats/dailyDoubles.ts` (+ test) — modulo puro delta doppie/nuove per giorno/album
- `src/components/home/DoublesChart.tsx` — bar chart ②
- `src/components/home/DayAlbumPie.tsx` — torta drill-down (overlay)
- Sezione grafico in Home (dove ora vive `InsertedChart`) — aggiungere il toggle e il modal

## Fuori scope

- Log evento per-figurina (dettaglio della singola figurina/squadra) — non serve: il per-album
  basta. Se un domani si vuole la torta **per squadra**, servirà quello.
- Backfill del breakdown per album sui giorni storici (impossibile: il dato non c'è).

## Verifica

- Test unit `dailyDoublesSeries`: delta aggregati e per-album corretti, clamp, album nuovo.
- Manuale: aggiungi figurine (miste nuove/doppie) in 2 album → snapshot scrive `albums` →
  grafico ② mostra barre rosso/verde → click giorno → torta con 2 fette + tooltip corretti.
