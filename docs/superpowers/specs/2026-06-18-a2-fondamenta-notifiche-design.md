# A2.0 fondamenta + A2.1 notifiche live (design)

Data: 2026-06-18
Skill: brainstorming (approvato). Lente: debug+architect (port pulito coi fix audit).
Parte di Step 2 → A2 layer dati, primi due slice. Vedi [[no-buchi-costruzione-progressiva]], audit fondamenta.

## Obiettivo
Mettere le fondamenta del layer dati e rendere viva la campanella (pannello gia' costruito nel cluster), portando solo cio' che serve (YAGNI).

## A2.0 — fondamenta
- `src/lib/firebase.ts`: aggiungere `requireUid(): string` (throw se non autenticato). Uccide B4 (mai piu' `currentUser.uid` su null).
- `src/data/albumCatalog.ts`: `ALBUM_CATALOG` TIPIZZATO (solo catalogo, NON le SECTIONS/784 figurine → quello e' A2.2). Tipo `AlbumCatalogEntry` + mappa `albumById`. Portato da figubook-db.js:16-26 (fix B13: da window.* a modulo TS).

## A2.1 — notifiche live
Forma dati invariata (sito vecchio ancora live le scrive): `users/{uid}/notifications/{id}` con `{ fromUid, type, title, info?, href?, icon?, read, at }`.
- `src/lib/db/notifications.ts`:
  - tipo `FiguNotification`.
  - `subscribeNotifications(uid, cb)`: onSnapshot live; query `where at >= (now-7g)`, `orderBy at desc`, `limit 50`. Ritorna unsubscribe. (B8: nessuna delete in lettura.)
  - `markAllRead(uid)`: writeBatch update `read:true` sulle non lette.
  - `resolveHref(href?)`: mappa `figubook-scambia.html` → `/scambi`; default `/scambi`.
  - `timeAgo(at)`: "ora/5m fa/2h fa/3g fa".
  - `at` resta number (Date.now()) per compat; B9 serverTimestamp rimandato al cutover (in A2.1 si SCRIVE solo `read`, mai `at`).
- `src/hooks/useNotifications.ts`: prende uid da useAuth; ritorna `{ items: FiguNotification[], unread: number }`; gestisce subscribe/unsubscribe in useEffect.
- `src/components/ui/expandable-tabs.tsx`: estendere `Tab` con `dot?: boolean` → pallino lime in alto a destra dell'icona.
- `src/components/layout/TopRightMenu.tsx`:
  - usa `useNotifications`.
  - tab Notifiche con `dot: unread > 0`.
  - pannello Notifiche: lista reale (icona, titolo, info + timeAgo, link via resolveHref, evidenzia non lette); empty-state se vuota.
  - `markAllRead` quando il pannello Notifiche si apre.

## Verifica (zero-locale, no test runner)
`npm run build` + `npm run lint` (no nuovi errori miei) + live: pallino se non letto; pannello con lista reale; apertura → markAllRead → pallino sparisce; arrivo nuova notifica aggiorna live senza ricarico.

## Fix audit applicati
B4 (requireUid), B8 (no delete in getter), B13 (catalogo tipizzato). Rimandati: B9 (serverTimestamp, coesistenza vecchio), cleanup >7g separato.

## Self-review
Path esatti, nessun placeholder, deps gia' presenti (firebase, framer-motion, lucide). Scope ristretto: solo catalogo (no SECTIONS), solo notifiche (no proposte/album). Compat vecchio garantita.
