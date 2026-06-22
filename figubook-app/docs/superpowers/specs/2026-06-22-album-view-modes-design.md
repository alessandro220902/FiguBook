# Album view modes — legenda tab + vista piatta paginata

Data: 2026-06-22

## Obiettivo

Nella pagina dettaglio album (`src/pages/Album.tsx`), sopra l'indice "Sezioni album",
aggiungere una legenda a tab icon-only (3 bottoni) che commuta la modalità di vista.

## Modalità

1. **Tab 1 — Sezioni** (default): vista attuale invariata. Sidebar squadre +
   `SectionHero` (filtri per-sezione + inserimento) + `StickerGrid` della sezione attiva.
2. **Tab 2 — Tutte le figurine**: rimuove sidebar/indice-per-squadra. Griglia piatta
   di tutte le carte dell'album. Filtri **generici (totali album)**:
   - Tutte = total · Mancanti = missing · Doppie = doubles · Possedute = have
     (da `computeStats(albumId, states, counts)`).
   - Le box carte mantengono il **colore della loro squadra/sezione** (c1/c2 per code).
   - Toggle **Inserimento rapido** come nella vista sezioni.
   - **Paginazione 60 carte/pagina** (custom), reset a pagina 1 al cambio filtro.
3. **Tab 3 — disabilitato/morto**: presente nella legenda ma `disabled`. Da costruire dopo.

## Componenti

- **Riuso `src/components/ui/tabs.tsx`** (Tabs su `@base-ui/react`, già in repo, oggi
  inutilizzato). Niente nuova dipendenza, niente HeroUI.
- **`src/components/album/AlbumViewTabs.tsx`** (nuovo): wrapper legenda icon-only,
  3 trigger con icone lucide + `aria-label`, tab3 `disabled`. Controllato via props
  `value` / `onChange`.
- **`src/components/album/AlbumFlatView.tsx`** (nuovo): griglia piatta + barra filtri
  totali + toggle inserimento + paginazione. Costruisce mappa `code -> section`
  (per c1/c2) dalle `data.sections`. Usa `StickerCard`.
- **`src/components/ui/pagination.tsx`** (nuovo): paginazione custom leggera,
  Prev · numeri · Next, attivo = lime, chevron lucide. Stile token Album.
- **`src/lib/album/filter.ts`** (nuovo): estrae il predicato `passes(filter, count)`
  oggi in `StickerGrid.tsx`; riuso in `StickerGrid` e `AlbumFlatView`.
- **`src/pages/Album.tsx`**: stato `view: 'sections' | 'flat'` (default `'sections'`).
  Renderizza la legenda sempre sopra l'indice; commuta il corpo. Heading condizionale.

## Dati

- Tutti i codici: `data.sections.flatMap(s => s.codes)`.
- Mappa code→section per colore: derivata una volta da `data.sections`.
- Conteggi/stati: `useAlbum(albumId)` (già presente: `countOf`, `increment`, `decrement`,
  `states`, `counts`).
- Totali filtro: `computeStats(albumId, album.states, album.counts)`.

## Test (TDD)

- `passes` (filter.ts): all/missing(0)/have(>=1)/double(>=2).
- `AlbumViewTabs`: render 3 tab, tab3 disabled non commuta, onChange su tab1/tab2.
- `AlbumFlatView`: paginazione (60/pagina, conteggio pagine), reset pagina al cambio
  filtro, filtro mancanti/doppie/possedute riduce le carte, colore per-sezione applicato.
- `Pagination`: prev/next disabilitati ai bordi, click numero cambia pagina attiva.

## Fuori scope

- Tab 3 (logica futura).
- Persistenza della modalità selezionata tra reload/navigazione.
