# Social Fase 4 — Vetrina album altrui (sola vista)

Data: 2026-06-30
Stato: design approvato

## Obiettivo

Sulla vetrina pubblica `/u/:username` mostrare gli album di un altro collezionista e,
cliccando dentro un album, le sue figurine **Mancanti** e **Doppie**. Scopo: scambio-discovery
(vedo cosa posso prendergli / dargli). Accessibile solo se il profilo è `isPublic` oppure
siamo amici accettati. Sola vista, nessuna azione di scambio (rimandata a costruzione scambi).

## Decisioni prese

- **Approccio B** (lettura diretta album, non riassunto denormalizzato): serve il dettaglio
  carta-per-carta, che richiede i dati grezzi `states/counts`. Il riassunto aggregato non basta.
- Dettaglio album = **rotta nuova** `/u/:username/album/:albumId` (non modal).
- Sola vista: niente CTA "Proponi scambio" in Fase 4.

## Modello dati (esistente, invariato)

- `users/{uid}/albums/_my-albums` = `{ ids: string[], archived: string[] }`
- `users/{uid}/albums/{albumId}` = `{ states: Record<code,string>, counts: Record<code,number> }`
- Catalogo: `src/data/albumCatalog.ts` (nome/editore/total/cover per id)
- Figurine: `src/data/albums/{id}.ts` (lazy) = `{ sections, groups, names: Record<code,nome> }`
- Stat: `computeStats(albumId, states, counts)` in `src/lib/db/albums.ts`
- Amicizie: `friendships/{pair}` con `pair = [a,b].sort().join('__')`, doc `{ users:[a,b], ... }`

## Componenti

### 1. Regole Firestore — `firestore.rules`
Aprire la lettura di `users/{userId}/albums/{albumId}` ad altri utenti loggati quando il
proprietario è pubblico OPPURE amico. Le regole non sanno ordinare gli uid per costruire il
pairId, quindi si provano entrambi gli ordini.

```
match /albums/{albumId} {
  allow read: if isUser(userId)
    || get(/databases/$(database)/documents/publicProfiles/$(userId)).data.isPublic == true
    || exists(/databases/$(database)/documents/friendships/$(userId + '__' + request.auth.uid))
    || exists(/databases/$(database)/documents/friendships/$(request.auth.uid + '__' + userId));
  allow write: if isUser(userId);   // invariato: solo owner scrive
}
```
Nota: `get()` su publicProfiles costa 1 read in valutazione; accettabile. Deploy via
`firebase deploy --only firestore:rules` (confermato con l'utente prima del deploy).

### 2. Accesso dati — `src/lib/db/otherAlbums.ts` (nuovo)
Isolato da `albums.ts` (che resta owner-only, live). Letture one-shot (`getDoc`, non onSnapshot):
- `getOtherAlbumIds(uid): Promise<string[]>` — legge `_my-albums.ids` (filtra archived).
- `getOtherAlbum(uid, albumId): Promise<AlbumDoc | null>` — legge states/counts.
- Permesso negato (privato non-amico) → ritorna `null` / `[]`, trattato come gated.

### 3. Vetrina `/u/:username` — `src/pages/ProfiloPubblico.tsx`
Sostituire il placeholder "Album e attività":
- gating-ok (`isPublic || amico`) → carica `getOtherAlbumIds`, per ogni id mostra card
  (cover/nome dal catalogo + % completo da `computeStats`), `<Link>` a `/u/:username/album/:id`.
- altrimenti → lock attuale ("Aggiungilo come amico…").
Lo stato amicizia è già osservabile (`subscribeFriendStatus` / FriendButton); riusare per il gate.

### 4. Dettaglio `/u/:username/album/:albumId` — `src/pages/ProfiloPubblicoAlbum.tsx` (nuovo)
Rotta in `App.tsx`. Carica in parallelo: profilo (`getPublicByUsername`), album altrui
(`getOtherAlbum`), dati figurine (lazy `src/data/albums/{id}`).
- Header: nome album + % + barra completamento.
- **Mancanti**: codici con `count === 0` → numero + `data.names[code]`.
- **Doppie**: codici con `count >= 2` → numero + nome + quantità (`count`).
- Stati: loading skeleton; album non trovato; gated/privato → redirect o lock.
- Sola vista, nessun bottone scambio.

## Confini (lente architettura)
- `otherAlbums.ts` non condivide stato con `albums.ts`; nessuna scrittura.
- Le pagine vetrina non parlano direttamente con Firestore se non via `db/` helpers.
- Logica missing/double riusa le stesse regole di `Album.tsx` (`countOf===0`, `>=2`).

## Fuori scope (rimandato)
- CTA "Proponi scambio" sulle liste (a costruzione sezione scambi).
- Stat live al secondo (one-shot read è sufficiente).
- Attività/feed altrui.

## Verifica
- `npx tsc -b --noEmit` exit 0, `npm run lint` 0 error, `npm run build` exit 0.
- Manuale: profilo pubblico altrui → vedo album → click → liste Mancanti/Doppie corrette.
- Manuale: profilo privato non-amico → lock, nessuna lettura album (regola nega).
- Manuale: dopo accettazione amicizia → album visibili.
