# Social Fase 5 — Blocco utenti Implementation Design

Data: 2026-06-30
Stato: design approvato

## Obiettivo

Menu kebab (3 puntini) accanto al nome sulla vetrina `/u/:username` con azioni **Rimuovi amico**
(se amici) e **Blocca / Sblocca**. Blocco completo + sezione **Utenti bloccati** nel profilo
`/profilo` con possibilità di sbloccare.

## Modello dati

Riuso del campo già presente `blocked?: string[]` in `users/{uid}/meta/profile` (privato).
Nessuna collection nuova. `blocked` = array di uid che **io** ho bloccato.
- Vantaggi: live via `useProfile` (già sottoscritto), lista bloccati immediata client-side,
  sblocco = `arrayRemove`.
- Le firestore rules leggono questo doc privato via `get()` (le rules bypassano i read-perm).

## Comportamento (blocco completo)

`blockUser(me, otherUid)` esegue in sequenza:
1. `arrayUnion(otherUid)` su `meta/profile.blocked` (`setDoc` merge).
2. `unfriend(me, otherUid)` (rimuove eventuale amicizia).
3. cancella richieste pending nei due versi: `deleteDoc(friendRequests/{me__other})` e
   `deleteDoc(friendRequests/{other__me})` (le rules permettono delete a from o to).

`unblockUser(me, otherUid)` = `arrayRemove(otherUid)` su `meta/profile.blocked`.

## Effetti via regole Firestore

Le rules usano `get(/users/$(owner)/meta/profile).data.get('blocked', [])` (default lista vuota).

1. **Album** `users/{userId}/albums/{albumId}` — alla read non-owner aggiungere:
   `&& !(request.auth.uid in get(.../users/$(userId)/meta/profile).data.get('blocked', []))`.
   Così un bloccato non legge gli album anche se il proprietario è pubblico (l'amicizia è già
   stata rotta dal blocco).
2. **friendRequests** create — aggiungere:
   `&& !(request.resource.data.fromUid in get(.../users/$(request.resource.data.toUid)/meta/profile).data.get('blocked', []))`.
   Un bloccato non può inviarti richieste.

## UI

### Vetrina `/u/:username` (`src/pages/ProfiloPubblico.tsx`)
Nuovo componente `ProfileActionsMenu` (kebab) accanto al nome, visibile solo se `!isMe`:
- voce **Rimuovi amico** (solo se status `friends`) → `unfriend`
- voce **Blocca** (se non bloccato) → `blockUser` ; **Sblocca** (se bloccato) → `unblockUser`
Lo stato "ho bloccato questo utente" si ricava da `profile.blocked?.includes(otherUid)` (mio
profilo via `useProfile`). Quando bloccato, la sezione album mostra stato "Utente bloccato" +
Sblocca, niente album. `FriendButton` resta per Aggiungi/Accetta/etc; nascosto se bloccato.

### Profilo `/profilo` (`src/pages/Profilo.tsx`)
Nuova sezione "Utenti bloccati" (card): lista da `profile.blocked` risolta a username/avatar via
`getPublicByUid`, ogni riga con tasto **Sblocca**. Vuota → testo "Nessun utente bloccato".

### Ricerca (`src/hooks/useUserSearch.ts`)
Filtrare dai risultati gli uid in `profile.blocked` (so chi ho bloccato; lato mio).

## Limite v1 (accettato)
Il bloccato continua a vedere la mia card profilo e a trovarmi nella *sua* ricerca, ma non può
aggiungermi né vedere i miei album. Invisibilità totale lato suo richiederebbe denormalizzazione
(fuori scope).

## File toccati
- Create: `src/lib/db/blocks.ts` + `src/lib/db/blocks.test.ts`
- Create: `src/components/ProfileActionsMenu.tsx`
- Modify: `src/pages/ProfiloPubblico.tsx` (kebab + stato bloccato sezione album)
- Modify: `src/pages/Profilo.tsx` (sezione Utenti bloccati)
- Modify: `src/hooks/useUserSearch.ts` (filtro bloccati) — passare `blocked` dal chiamante
- Modify: `firestore.rules` (album + friendRequests)

## Verifica
- `npx tsc -b --noEmit` 0, `npm run lint` 0 error, `npm run build` 0.
- Manuale (due account): blocca da A→B; B non vede album di A né può mandare richiesta; A vede
  "Utente bloccato" sulla vetrina di B e B nella sezione Utenti bloccati; Sblocca ripristina.
