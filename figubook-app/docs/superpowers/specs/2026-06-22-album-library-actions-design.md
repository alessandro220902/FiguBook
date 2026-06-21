# Album Library Actions — Design

Data: 2026-06-22
Scope slice: gestione libreria album (CRUD + filtri). Editor figurine (StickerGrid/StickerCard) già fatto, fuori scope.

## Obiettivo

Nella pagina `src/pages/AlbumList.tsx` ("I tuoi album"):

1. Barra filtri per stato album.
2. Bottone "Nuovo album" per aggiungere un album dal catalogo.
3. Menu azioni per ogni album (archivia / condividi / elimina) con conferma distruttiva su elimina.

## Modello dati

Doc esistente `users/{uid}/albums/_my-albums` oggi = `{ ids: string[] }`. Aggiungo un campo:

```
{ ids: string[], archived: string[] }   // archived ⊆ ids
```

- `ids` = tutti gli album posseduti (invariato).
- `archived` = sottoinsieme di `ids` marcato come archiviato. Un album archiviato resta in `ids` (dati intatti) ma è escluso dai filtri non-archivio.

Dati album invariati: `users/{uid}/albums/{albumId}` = `{ states, counts, ts }`.

### Nuove funzioni in `src/lib/db/albums.ts`

Tutte scrivono su `_my-albums` con `setDoc(..., { merge: true })` usando `arrayUnion`/`arrayRemove`, eccetto il wipe.

- `addAlbum(uid, id)` → `arrayUnion(id)` su `ids`.
- `removeAlbum(uid, id)` → `arrayRemove(id)` su `ids` **e** `archived`, poi `deleteDoc(users/{uid}/albums/{id})`. Wipe **irreversibile**: re-add riparte da doc vuoto.
- `archiveAlbum(uid, id)` → `arrayUnion(id)` su `archived`.
- `unarchiveAlbum(uid, id)` → `arrayRemove(id)` su `archived`.

Ordine in `removeAlbum`: prima rimuovi da `_my-albums` (così sparisce subito dalla lista live), poi `deleteDoc` del doc dati. Se il `deleteDoc` fallisce, l'id è già fuori lista; il doc orfano verrà sovrascritto/vuoto al re-add (merge). Accettabile.

### `useCollection` (`src/hooks/useCollection.ts`)

- `subscribeMyAlbumIds` deve restituire anche `archived` oltre a `ids`. Cambio la callback in `(data: { ids: string[]; archived: string[] }) => void`.
- L'hook espone `archived: string[]` nel valore di ritorno. `PerAlbumStats` resta invariato; il flag archiviato si calcola in pagina con `archived.includes(id)`.

## Barra filtri

Componente nuovo `src/components/album/LibraryFilters.tsx`. Pills con badge conteggio. Stato selezionato in `useState` locale nella pagina (no persistenza).

Ordine e default (da mockup utente, corretto):

| Pill | Default | Predicato |
|------|---------|-----------|
| In corso | **selezionato** | `!archived && pct < 100` (include album appena aggiunti a 0%) |
| Tutti | | `!archived` |
| Completati | | `!archived && pct === 100` |
| Archivio | | `archived` |

Rimosso "Appena usciti" del mockup. Ogni pill mostra il conteggio del proprio bucket. Pill attivo = sfondo chiaro/pieno; inattivo = bordo sottile su trasparente (come da foto utente). Touch target ≥ 44px.

A destra della barra, allineato in fondo: il **bottone "Nuovo album"**.

## Nuovo album

- Trigger: bottone stile 21st `one-button/with-leading-icon` (icona "+" leading + label "Nuovo album"), a destra della barra filtri.
- Click → **dialog picker**: elenco catalogo (`ALBUM_CATALOG`) MENO gli `ids` posseduti. Ogni riga = mini-card (titolo/editore/totale). Click su una riga → `addAlbum` + chiude il dialog.
- Se tutti gli album sono già posseduti → stato vuoto "Hai già tutti gli album disponibili".

Componente `src/components/album/NewAlbumDialog.tsx` (usa il Dialog primitivo, sotto).

## Menu azioni per-album

Sostituisce la "×" del mockup con un trigger a 3 punti (icona `MoreVertical` lucide) in alto a destra della card, sopra lo scrim. Base UI `Menu`.

Il trigger e il menu vivono **fuori** dal `<Link>` (oggi l'intera tile è un `Link`). Refactor: la tile diventa un `<div>` relativo; l'area cliccabile-apri-album è un `<Link>` che copre la card; il bottone menu è un fratello con `z-index` superiore e `stopPropagation`, così il click sul menu non naviga.

Voci:
- **Archivia** / **Ripristina** (label dipende da `archived.includes(id)`) → `archiveAlbum`/`unarchiveAlbum`.
- **Condividi** → vedi sotto.
- **Elimina** (variante distruttiva, rosso) → apre il dialog di conferma.

## Condividi

Costruisce e condivide la lista **mancanti + doppie** dell'album.

Flusso (async, on-click):
1. `getDoc` (one-shot) di `users/{uid}/albums/{id}` → `states`, `counts`.
2. `loadAlbumData(id)` → `sections[].codes` + `names`.
3. Calcola:
   - **mancanti** = codici presenti nelle sezioni con stato ≠ `have`/`double`.
   - **doppie** = codici con stato `double`, quantità `counts[code] - 1` (≥1).
4. Formatta testo:
   ```
   FiguBook — {titolo album}
   Mancanti ({n}): code1, code2, …
   Doppie ({n}): code3 ×2, code4 ×1, …
   ```
   I codici sono le label figurina (numero/sigla del catalogo, già lo schema usato nell'editor).
5. `navigator.share({ title, text })` se disponibile; altrimenti `navigator.clipboard.writeText(text)` + feedback inline (testo "Copiato" temporaneo sul menu/bottone). Nessuna lib toast.

Logica pura estraibile e testabile: `buildShareText(entry, albumData, states, counts): string` in `src/lib/album/share.ts`. Il wrapper che fa I/O (getDoc + share/clipboard) sta nel componente o in un piccolo helper.

## Dialog elimina

Conferma distruttiva stile 21st `the-dialog/delete-account`. Contenuto:
- Titolo: "Eliminare {titolo}?"
- Corpo: avviso che l'operazione è **irreversibile** e cancella tutti i dati (figurine, doppie, progresso).
- Azioni: "Annulla" (chiude) + "Elimina" (distruttivo/rosso) → `removeAlbum` + chiude.
- Bloccante (modal). ESC e click backdrop = annulla.

Componente `src/components/album/DeleteAlbumDialog.tsx`.

## UI primitives

Niente Radix; lo stack ha già `@base-ui/react`. Costruisco due wrapper riusabili in `src/components/ui/`:

- `dialog.tsx` — wrapper su Base UI `Dialog` (Root/Backdrop/Popup), tema album, anim framer-motion. Usato da NewAlbumDialog e DeleteAlbumDialog.
- `menu.tsx` — wrapper su Base UI `Menu` (Root/Trigger/Popup/Item), supporto item distruttivo. Usato dal menu per-album.

Markup/animazioni adattati dai componenti 21st citati (one-button, the-dialog), riportati ai token del tema `.album-theme`. Icone da `lucide-react` (già in uso; swap Phosphor è rimandato, fuori scope).

## Error handling

- Scritture (`addAlbum`/`removeAlbum`/`archive`): la lista è live via `onSnapshot`, quindi l'UI si aggiorna da sola a commit avvenuto (ottimismo implicito). Su errore di scrittura → `console.error` + feedback inline "Operazione non riuscita" sul dialog/menu. Niente rollback manuale (la fonte di verità resta lo snapshot).
- Condividi: se `getDoc`/`loadAlbumData` falliscono o `navigator.share` viene annullato dall'utente (`AbortError`) → nessun errore mostrato per l'abort; per fallimento dati → feedback "Non riuscito".
- Filtri: indipendenti dai dati remoti; nessun nuovo stato d'errore.

## Testing

- `share.test.ts` — `buildShareText`: mancanti/doppie corrette, quantità doppie = count−1, album pieno → "Mancanti (0)", formato stringa.
- `albums.*.test.ts` — `removeAlbum` chiama arrayRemove su ids+archived e deleteDoc; `archiveAlbum`/`unarchiveAlbum` arrayUnion/Remove su archived; `addAlbum` arrayUnion su ids. (Mock Firestore come nei test esistenti `albums.flush.test.ts`.)
- `LibraryFilters` — i predicati di bucket (logica pura `bucketOf(stats, archived)`); test sui conteggi.
- Build (`npm run build`) e lint puliti; `detect.mjs` (impeccable) `[]` sui nuovi file.

## File toccati / nuovi

Nuovi:
- `src/components/album/LibraryFilters.tsx`
- `src/components/album/NewAlbumDialog.tsx`
- `src/components/album/DeleteAlbumDialog.tsx`
- `src/components/album/AlbumMenu.tsx` (trigger 3 punti + voci)
- `src/components/ui/dialog.tsx`
- `src/components/ui/menu.tsx`
- `src/lib/album/share.ts`

Modificati:
- `src/pages/AlbumList.tsx` (barra filtri + bottone + refactor tile per il menu)
- `src/lib/db/albums.ts` (add/remove/archive/unarchive + `subscribeMyAlbumIds` con archived)
- `src/hooks/useCollection.ts` (espone `archived`)

## Fuori scope (rimandato)

- Nomi giocatori / filtri figurine dentro l'album, layer scambi (slice separati).
- Link pubblico read-only dell'album (Condividi qui = solo testo).
- Swap icone Lucide→Phosphor.
- Persistenza del filtro selezionato.
