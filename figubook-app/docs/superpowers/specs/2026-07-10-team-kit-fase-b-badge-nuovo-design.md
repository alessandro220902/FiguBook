# Team Kit — Fase B: badge "Nuovo" su album

Data: 2026-07-10
Stato: approvato per implementazione
Segue: `2026-07-09-team-kit-identity-design.md` (Fase A completata)

## Contesto

Fase A ha dato identità visiva alle squadre (kit colore + pattern). Fase B aggiunge un
segnale di **freschezza** a livello album, per comunicare novità e spingere engagement.
Scope Fase B: **solo album** (nessun badge di sezione — rimandato a eventuale fase futura).

## Due badge distinti, due significati

1. **"Nuova uscita"** — novità *oggettiva del sito*: un album appena inserito nel catalogo.
   Uguale per tutti gli utenti. Statico, guidato dal catalogo.
2. **"Nuovo"** — novità *personale*: un album che l'utente ha appena aggiunto alla propria
   lista e non ha ancora aperto. Per-utente.

### Funnel naturale (niente collisione di badge)

Le due etichette vivono su superfici diverse e si susseguono nel flusso:

- **Catalogo / discovery** → mostra **"Nuova uscita"** (finestra 30 giorni da `addedAt`).
- Utente **aggiunge** l'album → entra nella sua lista → mostra **"Nuovo"**.
- Utente **apre** l'album (mount di `Album.tsx`) → il badge "Nuovo" sparisce per sempre.

Regola di superficie: la card in **lista utente** mostra solo "Nuovo"; la card in
**discovery** mostra solo "Nuova uscita". Così non appaiono mai due badge sulla stessa card.

## Regole di scadenza

- **"Nuova uscita"**: finestra tempo fissa. Visibile finché `now - addedAt < 30 giorni`.
  Nessun flag manuale, nessun override. Album senza `addedAt` non mostra mai il badge.
- **"Nuovo" (lista)**: visibile finché l'utente non apre l'album almeno una volta.
  Nessuna scadenza temporale.

## Modello dati

### Catalogo — `src/data/albumCatalog.ts`

Nuovo campo opzionale sull'entry:

```ts
export interface AlbumCatalogEntry {
  // …campi esistenti…
  /** data ISO (YYYY-MM-DD) di inserimento nel catalogo; abilita il badge "Nuova uscita" per 30gg */
  addedAt?: string
}
```

Popolato a mano quando inserisco un album nuovo. Gli album già presenti restano senza
`addedAt` (nessun badge retroattivo) salvo scelta esplicita.

### Lista utente — doc `_my-albums`

Il doc `users/{uid}/albums/_my-albums` oggi ha `ids: string[]` e `archived: string[]`.
Aggiungo un terzo array:

```
opened: string[]   // id degli album che l'utente ha già aperto almeno una volta
```

`opened` NON usa timestamp: la sola presenza dell'id segna "già visto". Approccio identico
a `ids`/`archived` (arrayUnion), coerente con il modulo esistente.

## Logica

### `src/data/albumCatalog.ts` (o helper vicino)

```ts
// puro, testabile, niente Date.now() interno (now iniettato)
export function isNewRelease(entry: AlbumCatalogEntry, now: Date): boolean
```

- `false` se `addedAt` assente o non parsabile.
- `true` se `now - addedAt >= 0` e `< 30 giorni` (2 592 000 000 ms).
- Confine: esattamente 30 giorni ⇒ `false` (finestra semiaperta).

### `src/lib/db/albums.ts`

```ts
// arrayUnion(id) in opened del doc _my-albums
export async function markAlbumOpened(uid: string, id: string): Promise<void>
```

Idempotente (arrayUnion). Merge come le altre mutation.

La subscription esistente a `_my-albums` espone già `ids`/`archived`; estendere per leggere
`opened` e derivare il flag "Nuovo" per card:

```
isNewInList(id) = ids.includes(id) && !opened.includes(id)
```

## Componente UI

`<AlbumBadge variant="new-release" | "new" />` — chip Midnight Gold (oro su near-black),
riuso dello stile chip già usato per il badge ×N doppie in `StickerCard.tsx`
(scuro/oro alto contrasto). Posizionato nell'angolo alto della card album. Elemento
decorativo: `aria-label` descrittivo ("Nuova uscita" / "Nuovo nella tua lista"), nessun
tap target dedicato.

Testo:
- `new-release` → "Nuova uscita"
- `new` → "Nuovo"

## Punti di applicazione

- `src/pages/AlbumList.tsx` — card della lista utente: badge "Nuovo" quando `isNewInList`.
- Superficie discovery / `LibraryFilters` (add) — badge "Nuova uscita" quando `isNewRelease`.
- `src/pages/Album.tsx` — al mount, se l'album è nella lista dell'utente, chiama
  `markAlbumOpened(uid, id)` (idempotente; una scrittura al primo apri, poi no-op locale).

## Firestore

`opened` è un campo dentro `users/{uid}/albums/_my-albums`, già scrivibile solo dall'owner
con le regole esistenti. **Verificare** che le rules non elenchino i campi consentiti in
modo restrittivo (whitelist); se lo fanno, aggiungere `opened`. Altrimenti nessuna modifica.

## Testing

- `albumCatalog.test.ts` (nuovo o esteso): `isNewRelease` — no `addedAt` ⇒ false; dentro
  finestra ⇒ true; confine 30gg ⇒ false; data futura ⇒ false.
- `albums.mutations.test.ts` (esistente): aggiungere `markAlbumOpened` — verifica setDoc
  merge con `opened: arrayUnion(id)` sul ref corretto.
- Logica badge lista: `isNewInList` — in ids & non in opened ⇒ true; in opened ⇒ false;
  non in ids ⇒ false.

## Consegna Fase B

1. `addedAt?` + `isNewRelease` nel catalogo.
2. `opened` + `markAlbumOpened` + `isNewInList` in `albums.ts` / subscription.
3. `<AlbumBadge>` (stile chip Midnight Gold riusato).
4. Applicato a AlbumList (Nuovo), discovery (Nuova uscita), Album.tsx (markAlbumOpened).
5. Test verdi, `tsc -b --noEmit` e `npm run build` puliti.
6. Cache-bust asset, commit+push su main dopo ogni step (git add path espliciti).

## Note di processo

- Skill estetiche in implementazione per il chip badge (`design-taste-frontend` + audit
  `impeccable`); tema Midnight Gold, minimalista, no slop.
- Commit+push su main dopo ogni modifica; `git add` path espliciti (mai `-A` da root).

## Rischi

- **Scrittura al mount rumorosa:** `markAlbumOpened` solo se id in lista e non già in
  `opened` (guardia locale) → una sola scrittura reale per album.
- **Badge retroattivo indesiderato:** album esistenti senza `addedAt` non mostrano nulla;
  scelta esplicita per-album.
- **Collisione badge:** esclusa dalla separazione di superficie (lista vs discovery).
