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

Voci (no Condividi):
- **Archivia** / **Ripristina** (label dipende da `archived.includes(id)`). Archivia esegue subito `archiveAlbum` (reversibile, niente conferma). Ripristina apre il dialog di conferma.
- **Elimina** (variante distruttiva, rosso) → apre il dialog di conferma.

## Dialog di conferma (elimina / ripristina)

Un solo componente generico `src/components/album/ConfirmActionDialog.tsx` (stile 21st `the-dialog/delete-account`), parametrizzato: `{ title, body, confirmLabel, destructive, onConfirm }`. Bloccante (modal); ESC e click backdrop = annulla. Due usi:

**Elimina** (`destructive: true`):
- Titolo: «Eliminare «{titolo}»?»
- Corpo: "Verranno cancellati per sempre tutti i dati di questo album: figurine possedute, doppie e progresso. L'operazione **non è reversibile** — se in futuro lo riaggiungi, riparti da zero."
- Azioni: `Annulla` · `Elimina` (rosso) → `removeAlbum` + chiude.

**Ripristina** (`destructive: false`):
- Titolo: «Ripristinare «{titolo}»?»
- Corpo: "L'album torna tra quelli attivi e ricompare nei filtri In corso/Completati. Nessun dato è andato perso durante l'archiviazione: ritrovi progresso e doppie esattamente com'erano."
- Azioni: `Annulla` · `Ripristina` → `unarchiveAlbum` + chiude.

Archivia non ha conferma (azione reversibile).

## UI primitives

Niente Radix; lo stack ha già `@base-ui/react`. Costruisco due wrapper riusabili in `src/components/ui/`:

- `dialog.tsx` — wrapper su Base UI `Dialog` (Root/Backdrop/Popup), tema album, anim framer-motion. Usato da NewAlbumDialog e ConfirmActionDialog.
- `menu.tsx` — wrapper su Base UI `Menu` (Root/Trigger/Popup/Item), supporto item distruttivo. Usato dal menu per-album.

Markup/animazioni adattati dai componenti 21st citati (one-button, the-dialog), riportati ai token del tema `.album-theme`. Icone da `lucide-react` (già in uso; swap Phosphor è rimandato, fuori scope).

## Error handling

- Scritture (`addAlbum`/`removeAlbum`/`archive`/`unarchive`): la lista è live via `onSnapshot`, quindi l'UI si aggiorna da sola a commit avvenuto (ottimismo implicito). Su errore di scrittura → `console.error` + feedback inline "Operazione non riuscita" sul dialog/menu. Niente rollback manuale (la fonte di verità resta lo snapshot).
- Filtri: indipendenti dai dati remoti; nessun nuovo stato d'errore.

## Testing

- `albums.*.test.ts` — `removeAlbum` chiama arrayRemove su ids+archived e deleteDoc; `archiveAlbum`/`unarchiveAlbum` arrayUnion/Remove su archived; `addAlbum` arrayUnion su ids. (Mock Firestore come nei test esistenti `albums.flush.test.ts`.)
- `LibraryFilters` — i predicati di bucket (logica pura `bucketOf(stats, archived)`); test sui conteggi.
- Build (`npm run build`) e lint puliti; `detect.mjs` (impeccable) `[]` sui nuovi file.

## File toccati / nuovi

Nuovi:
- `src/components/album/LibraryFilters.tsx`
- `src/components/album/NewAlbumDialog.tsx`
- `src/components/album/ConfirmActionDialog.tsx` (conferma generica: elimina/ripristina)
- `src/components/album/AlbumMenu.tsx` (trigger 3 punti + voci)
- `src/components/ui/dialog.tsx`
- `src/components/ui/menu.tsx`

Modificati:
- `src/pages/AlbumList.tsx` (barra filtri + bottone + refactor tile per il menu)
- `src/lib/db/albums.ts` (add/remove/archive/unarchive + `subscribeMyAlbumIds` con archived)
- `src/hooks/useCollection.ts` (espone `archived`)

## Fuori scope (rimandato)

- **Condividi** (lista mancanti/doppie) — tolto da questo slice, rimandato.
- Nomi giocatori / filtri figurine dentro l'album, layer scambi (slice separati).
- Swap icone Lucide→Phosphor.
- Persistenza del filtro selezionato.
