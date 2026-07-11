# Elimina account — cascade delete (Cloud Function)

Data: 2026-07-11
Stato: approvato, pronto per il piano

## Obiettivo

Dare all'utente un modo per **eliminare definitivamente il proprio profilo**, pulendo
*tutti* i dati che la registrazione e l'uso dell'app creano — nessun dato orfano, in
particolare la prenotazione dello username (`usernames/{lower}`) che altrimenti resta
occupata per sempre e impedisce la ri-registrazione.

Motivazione immediata: il founder deve poter testare il flusso di registrazione end-to-end
(crea → cancella → rifai). Ma si costruisce la versione "vera" (cascade completo lato admin),
non un delete di comodo lato client, perché serve comunque prima del lancio pubblico.

## Approccio

**Callable Cloud Function** (`deleteAccount`), region `europe-west`, TypeScript, con Admin SDK.
Il client chiama la function autenticato; la function fa l'intero cascade e infine elimina
l'utente auth. L'Admin SDK bypassa il requisito Firebase di "recent login", quindi niente
re-autenticazione con password.

Il setup `functions/` non esiste ancora nel repo: va inizializzato (TypeScript) e `firebase.json`
esteso con il blocco `functions`. Deploy via CLI (già loggata).

## Mappa del cascade (uid `U`, username lower `L`)

**Albero utente** — `admin.firestore().recursiveDelete(users/U)`:
- `users/U/meta/profile`
- `users/U/albums/*`
- `users/U/stats/*`
- `users/U/notifications/*`
- `users/U/feedback/*`

**Globali con chiave uid:**
- `publicProfiles/U` (da qui si legge `L` prima di cancellare)
- `usernames/L` — libera lo username
- `tradeIndex/{albumId}/users/U` — collectionGroup `users`, doc id == `U`, su tutti gli album

**Dove altri referenziano U:**
- `friendRequests` dove `fromUid == U` **o** `toUid == U` (due query)
- `friendships` dove `users` array-contains `U`
- `proposals` dove `participants` array-contains `U`
- `notifications` altrui dove `fromUid == U` (collectionGroup `notifications`, pulizia)

**Auth:** `admin.auth().deleteUser(U)`.

La function è **idempotente**: rieseguirla su dati già parzialmente cancellati non fallisce
(delete su doc inesistenti è no-op; query vuote non fanno nulla).

## Ordine di esecuzione

1. Leggi `L` da `publicProfiles/U` (fallback: leggi da `users/U/meta/profile`).
2. Cancella cross-reference (friendRequests, friendships, proposals, tradeIndex, notifiche altrui).
3. `recursiveDelete(users/U)`.
4. Cancella `publicProfiles/U` e `usernames/L`.
5. `deleteUser(U)`.

Firestore prima, auth per ultimo: se l'auth delete fallisce l'utente può ritentare; se
Firestore fallisce a metà, la function è idempotente e ritentabile senza aver già perso l'auth.

## Client (UI)

Pagina **Profilo** (`/profilo`, `src/pages/Profilo.tsx`), in fondo al form, sotto il toggle
"Profilo privato": sezione **"Zona pericolosa"**.

- Bottone `Elimina account` (stile distruttivo, rosso/danger, non lime).
- Click → **modale di conferma**: testo che spiega irreversibilità + campo input
  "digita il tuo username per confermare". Bottone conferma disabilitato finché il testo
  digitato non combacia (case-insensitive) con lo username.
- Conferma → chiama `deleteAccount` (httpsCallable) → `signOut(auth)` → redirect a landing.
- Stati: loading durante la call, errore inline se la function fallisce.

## Sicurezza

- La function verifica `context.auth`; opera **solo** sull'uid del chiamante
  (`context.auth.uid`) — nessun parametro uid dal client, impossibile cancellare altri.
- Nessuna password richiesta (admin delete bypassa recent-login); la conferma "digita username"
  è la barriera anti-click-accidentale.

## Fuori scope

- Grace period / soft-delete / recupero account.
- Export dati pre-cancellazione (GDPR portability) — valutare prima del lancio, non ora.
- Cancellazione di feedback/recensioni che *altri* hanno scritto e che citano U come autore
  già coperto dall'albero utente; recensioni lasciate da U su altri restano (decisione: si
  tengono, sono contenuto della controparte). Rivedere se emergono problemi.
