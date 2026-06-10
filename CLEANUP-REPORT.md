# FiguBook Cleanup Report — S3 Prep

Data: 2026-06-09
Obiettivo: Rimozione chirurgica del JS che gestisce dati (localStorage, Firebase, FiguBookCore) da ogni HTML.

---

## figubook-dashboard.html

### Script src rimossi
- `firebase-config.js`
- `figubook-core.js`

### Blocchi `<script>` rimossi
**Blocco unico** (riga ~983–2080 originale)
- Funzioni: `requireSession`, `_dashFirebaseInit`, `renderAlbumsScroller`, `renderDashboardQuickStats`, `renderObjectives`, `renderTodoList`, `renderActivityRows`, `renderMatchSection`, `renderMissionCard`, `renderBadges`, `renderProgressChart`, `renderSessionsWidget`, `initNotifDot`, `clearNotifDot`, `openNotifPanel`, `closeNotifPanel`, `openProfileMenu`, `closeProfileMenu`, `loadMsgConversations`, `saveMsgConversations`, `renderMsgConvList`, `openMsgChat`, `backToMsgConvList`, `sendMsg`, `openMsgPanel`, `closeMsgPanel`, `buildSearchIndex`, `renderSearchResults`, `initSearchPanel`, `showToast`
- ID DOM toccati: `#greetingH1`, `#avatarBtn`, `#albumsScroller`, `#qstatFigurine`, `#qstatDoppie`, `#qstatMancanti`, `#objEmptyMsg`, `#objHero`, `#objBody`, `#objSecHead`, `#objEditor`, `#objTitle`, `#objTotal`, `#objPct`, `#objList`, `#objDots`, `#objPrev`, `#objNext`, `#objPageLabel`, `#objFilterMissing`, `#objFilterComplete`, `#todoList`, `#activityRows`, `#activityToggleBtn`, `#activityChevron`, `#matchListContainer`, `#matchEmptyMsg`, `#missionCard`, `#missionSecHead`, `#badgesGrid`, `#chartWrap`, `#progressChart`, `#chartLegend`, `#sessOpens`, `#sessAvg`, `#sessStreak`, `#sessStreakLabel`, `#footerYear`, `#toast`, `#notifBtn`, `#notifPanel`, `#markReadBtn`, `#profileMenu`, `#pmProfilo`, `#pmImpostazioni`, `#pmEsci`, `#msgBtn`, `#msgPanel`, `#msgOverlay`, `#msgConvList`, `#msgChatView`, `#msgChatMsgs`, `#msgInput`, `#msgSendBtn`, `#msgBackBtn`, `#msgPanelTitle`, `#msgCloseBtn`, `#searchBtn`, `#searchPanel`, `#searchInput`, `#searchResults`
- Motivo rimozione: tocca Firebase (onAuthStateChanged, firestore), FiguBookCore (requireSession, getSession, setNotifRead, saveMessages, getMessages), localStorage (implicito via FiguBookCore)

### Blocchi `<script>` conservati
- Blocco TweaksPanel `type="text/babel"`: UI puro, rendering React panel variante/font

### Script aggiunti prima di `</body>`
- `firebase-init.js`, `figubook-db.js`, `figubook-dashboard.js`

---

## figubook-album.html

### Script src rimossi
- `firebase-config.js`
- `figubook-core.js`

### Blocchi `<script>` rimossi
**Blocco 1** (riga ~754–1661 originale)
- Funzioni: `requireSession`, `loadStatsFromFirestore`, `renderAlbums`, `updateFilterCounts`, `updateHeaderStats`, `loadLiveStats`, `loadUserAlbums`, `saveUserAlbums`, `persistRemovedAlbums`, `persistAlbumState`, `initNavbar`, `buildSearchIndex`, `renderSearchResults`, `showToast`, `openCollShare`, `closeCollShare`, `escapeHtml`
- ID DOM toccati: `#avatarBtn`, `#albumsContainer`, `#statsTotal`, `#statsDoubles`, `#statsMissing`, `#addAlbumBtn`, `#filterAll`, `#filterActive`, `#filterDone`, `#filterArchived`, `#removeAlbumModal`, `#searchBtn`, `#searchPanel`, `#searchInput`, `#searchResults`, `#notifBtn`, `#notifPanel`, `#profileMenu`, `#pmProfilo`, `#pmImpostazioni`, `#pmEsci`, `#msgBtn`, `#toast`
- Motivo rimozione: tocca FiguBookCore (requireSession, getMyAlbums, saveMyAlbums, initAutoSync, onStatsUpdate), Firebase (firestore, onAuthStateChanged), localStorage

**Blocco 2** (riga ~1662–1790 originale)
- Funzioni: `buildCollectionText`, `openCollShare`, `closeCollShare`, `FiguBookFirebase.initMyAlbumsSync`, `loadLiveStats`, `updateFilterCounts`, `updateHeaderStats`, `renderAlbums`
- ID DOM toccati: `#shareCollBtn`, `#collShareClose`, `#collShareBackdrop`, `#collShareModal`, `#collShareText`, `#collShareCopy`, `#collShareWA`, `#collShareMail`, `#toast`
- Motivo rimozione: tocca Firebase (initMyAlbumsSync, onAuthStateChanged, firestore), localStorage (via FiguBookCore.ALBUM_STORAGE_KEYS)

### Blocchi `<script>` conservati
- Blocco TweaksPanel `type="text/babel"`: UI puro

### Script aggiunti prima di `</body>`
- `firebase-init.js`, `figubook-db.js`, `figubook-album.js`

---

## figubook-scambia.html

### Script src rimossi
- `firebase-config.js`
- `figubook-core.js`

### Blocchi `<script>` rimossi
**Blocco unico** (riga ~645–1244 originale)
- Funzioni: `_buildAlbumsRefFromFirestore`, `_initScambiaFromFirebase`, `renderMatchCards`, `renderProfileCards`, `renderHub`, `openDetail`, `filterMatches`, `initNavbar`, `buildSearchIndex`, `renderSearchResults`, `updateNotifDot`, `openProfileMenu`, `closeAllPanels`, `showToast`, `escapeHtml`, `requireSession`
- ID DOM toccati: `#matchesList`, `#profilesList`, `#hubHeader`, `#albumFilterChips`, `#searchBtn`, `#searchPanel`, `#searchInput`, `#searchResults`, `#notifBtn`, `#notifPanel`, `#markReadBtn`, `#avatarBtn`, `#profileMenu`, `#pmProfilo`, `#pmImpostazioni`, `#pmEsci`, `#msgBtn`, `#toast`
- Motivo rimozione: tocca Firebase (firestore, onAuthStateChanged), FiguBookCore (requireSession, getNotifRead, setNotifRead, clearSession)

### Blocchi `<script>` conservati
- Blocco TweaksPanel `type="text/babel"`: UI puro

### Script aggiunti prima di `</body>`
- `firebase-init.js`, `figubook-db.js`, `figubook-scambia.js`

---

## figubook-scambia-dettaglio.html

### Script src rimossi
- `figubook-core.js`

### Blocchi `<script>` rimossi
**Blocco unico** (riga ~703–1129 originale)
- Funzioni: `getParam`, `escapeHtml`, `renderProposalDetail`, `renderUserProfile`, `renderStickerChip`, `initNavbar`, `buildSearchIndex`, `renderSearchResults`, `updateNotifDot`, `openProfileMenu`, `closeAllPanels`, `confirmTrade`, `acceptTrade`, `rejectTrade`
- ID DOM toccati: `#proposalDetail`, `#userProfile`, `#confirmBtn`, `#rejectBtn`, `#searchBtn`, `#searchPanel`, `#searchInput`, `#searchResults`, `#notifBtn`, `#notifPanel`, `#markReadBtn`, `#avatarBtn`, `#profileMenu`, `#pmProfilo`, `#pmImpostazioni`, `#pmEsci`, `#msgBtn`, `#toast`
- Motivo rimozione: blocco misto — contiene FiguBookCore.getNotifRead/setNotifRead/clearSession anche se è prevalentemente rendering statico; rimosso per coerenza con la regola "blocco misto → rimuovi"

### Blocchi `<script>` conservati
- Blocco TweaksPanel `type="text/babel"`: UI puro

### Script aggiunti prima di `</body>`
- `firebase-init.js`, `figubook-db.js`, `figubook-scambia.js`

---

## figubook-benvenuto.html

### Script src rimossi
- `firebase-config.js`
- `figubook-core.js`

### Blocchi `<script>` rimossi
**Blocco unico** (riga ~577–789 originale)
- Funzioni: `renderSlogan`, `buildDots`, `tick`, `restartTimer`, `setMode`, `showAuthError`, `clearAuthError`, `setButtonLoading`, `mapFirebaseError`, `saveSession`, `handleSubmit`, `handleGoogle`, `togglePass`, `updateRegisterEnabled`
- ID DOM toccati: `#slogan`, `#slogCount`, `#slogDots`, `#tabs`, `#authTitle`, `#authSub`, `.top-meta`, `#topGoRegister`, `#topGoLogin`, `#loginEmail`, `#loginPassword`, `#loginError`, `#regUsername`, `#regEmail`, `#regPassword`, `#regError`, `#registerBtn`, `#regTerms`
- Motivo rimozione: blocco misto — contiene slogans/tabs (UI) ma anche auth Firebase (signInWithEmailAndPassword, createUserWithEmailAndPassword) e FiguBookCore.setSession

### Blocchi `<script>` conservati
- Nessuno (il blocco era unico e misto)

### Script aggiunti prima di `</body>`
- `firebase-init.js`, `figubook-db.js`, `figubook-benvenuto.js`

---

## figubook-mancanti.html

### Script src rimossi
- `figubook-core.js`

### Blocchi `<script>` conservati
- Blocco routing album-data (riga ~448–461): usa `document.write` per caricare il file dati corretto — puro routing, nessun accesso dati diretto
- Blocco TweaksPanel `type="text/babel"`: UI puro

### Blocchi `<script>` rimossi
**Blocco principale** (riga ~463–904 originale)
- Funzioni: routing breadcrumb, `getAllMissing`, `matchesSearch`, `renderStats`, `buildCard`, `markFound`, `render`, `getMissingText`, `openMissShareModal`, `closeMissShareModal`, `initNavbar`, `buildSearchIndex`, `renderSearchResults`, `updateNotifDot`, `openProfileMenu`, `closeAllPanels`
- ID DOM toccati: `#crumbAlbum`, `#pageSubtitle`, `#totalMissing`, `#totalSquads`, `#checkedToday`, `#missingWrap`, `#searchEl`, `#groupChips`, `#copiaMancanti`, `#missShareModal`, `#missShareBackdrop`, `#missShareClose`, `#missShareTextBox`, `#missShareCopyBtn`, `#missShareTxtBtn`, `#missShareXlsxBtn`, `#missShareWhatsappBtn`, `#missShareMailBtn`, `#searchBtn`, `#searchPanel`, `#searchInput`, `#searchResults`, `#notifBtn`, `#notifPanel`, `#markReadBtn`, `#notifDot`, `#avatarBtn`, `#profileMenu`, `#pmProfilo`, `#pmImpostazioni`, `#pmEsci`, `#msgBtn`, `#toast`
- Motivo rimozione: tocca `window.STICKER_STATES` (stato dati album), `window.saveAlbum` (persistenza), FiguBookCore (getNotifRead/setNotifRead/clearSession), localStorage (nel buildSearchIndex)

### Script aggiunti prima di `</body>`
- `firebase-init.js`, `figubook-db.js`, `figubook-mancanti.js`

---

## figubook-catalogo.html

### Script src rimossi
- `figubook-core.js`

### Blocchi `<script>` rimossi
**Blocco unico** (riga ~161–405 originale)
- Funzioni: `requireSession`, `getMyAlbums`, `getRemovedAlbums`, `setMyAlbums`, `setRemovedAlbums`, `getAlbumStats`, `renderCatalog`, `addAlbum`, `removeAlbum`, `filterCatalog`, `renderFilters`, `showToast`
- ID DOM toccati: `#footerYear`, `#catalogGrid`, `#filterBar`, `#searchCatalog`, `#toast`
- Motivo rimozione: tocca FiguBookCore (requireSession), localStorage diretto (getItem/setItem per 'figubook-my-albums-v1', 'figubook-removed-albums-v1', storageKey album stats)

### Blocchi `<script>` conservati
- Nessuno (era l'unico blocco inline)

### Script aggiunti prima di `</body>`
- `firebase-init.js`, `figubook-db.js`, `figubook-catalogo.js`

---

## figubook-calciatori-2526.html

### Script src rimossi
- `firebase-config.js`
- `figubook-core.js`
- `figubook-doubles.js`
- `album-app.js`
- `figubook-album-enhancements.js`

### Blocchi `<script>` conservati
- Blocco scrollTo patch (riga ~898–912): UI puro — intercetta `window.scrollTo` per offset navbar. Nessun accesso dati.
- Blocco TweaksPanel `type="text/babel"`: UI puro

### Blocchi `<script>` rimossi
**Blocco principale** (riga ~918–1084 originale)
- Funzioni: `initNavbar`, `buildSearchIndex`, `renderSearchResults`, `updateNotifDot`, `closeAllPanels`, `FiguBookDoubles.init`, `FiguBookFirebase.initAlbumSync`
- ID DOM toccati: `#searchBtn`, `#searchPanel`, `#searchInput`, `#searchResults`, `#msgBtn`, `#notifBtn`, `#notifPanel`, `#notifDot`, `#markReadBtn`, `#avatarBtn`, `#profileMenu`, `#pmProfilo`, `#pmImpostazioni`, `#pmEsci`, `#fbDblTrigger`
- Motivo rimozione: tocca FiguBookCore (getNotifRead/setNotifRead/clearSession), FiguBookDoubles.init, FiguBookFirebase.initAlbumSync, localStorage (via buildSearchIndex)

### Script aggiunti prima di `</body>`
- `firebase-init.js`, `figubook-db.js`, `figubook-album-single.js`

---

## figubook-calciatori-2425.html

Identica struttura a figubook-calciatori-2526.html.

### Script src rimossi
- `firebase-config.js`, `figubook-core.js`, `figubook-doubles.js`, `album-app.js`, `figubook-album-enhancements.js`

### Blocchi `<script>` conservati
- scrollTo patch (UI puro)
- TweaksPanel `type="text/babel"` (UI puro)

### Blocchi `<script>` rimossi
- Navbar JS + FiguBookDoubles.init + FiguBookFirebase.initAlbumSync (stesso pattern di 2526)

### Script aggiunti prima di `</body>`
- `firebase-init.js`, `figubook-db.js`, `figubook-album-single.js`

---

## figubook-calciatori-2324.html

Identica struttura.

### Script src rimossi
- `firebase-config.js`, `figubook-core.js`, `figubook-doubles.js`, `album-app.js`, `figubook-album-enhancements.js`

### Blocchi `<script>` conservati
- scrollTo patch (UI puro), TweaksPanel `type="text/babel"` (UI puro)

### Blocchi `<script>` rimossi
- Navbar JS + FiguBookDoubles/Firebase init (stesso pattern)

### Script aggiunti prima di `</body>`
- `firebase-init.js`, `figubook-db.js`, `figubook-album-single.js`

---

## figubook-calciatori-2223.html

Identica struttura.

### Script src rimossi
- `firebase-config.js`, `figubook-core.js`, `figubook-doubles.js`, `album-app.js`, `figubook-album-enhancements.js`

### Blocchi `<script>` conservati
- scrollTo patch (UI puro), TweaksPanel `type="text/babel"` (UI puro)

### Blocchi `<script>` rimossi
- Navbar JS + FiguBookDoubles/Firebase init (stesso pattern)

### Script aggiunti prima di `</body>`
- `firebase-init.js`, `figubook-db.js`, `figubook-album-single.js`

---

## figubook-fwc2026.html

Identica struttura ai file calciatori.

### Script src rimossi
- `firebase-config.js`, `figubook-core.js`, `figubook-doubles.js`, `album-app.js`, `figubook-album-enhancements.js`

### Blocchi `<script>` conservati
- scrollTo patch (UI puro), TweaksPanel `type="text/babel"` (UI puro)

### Blocchi `<script>` rimossi
- Navbar JS + FiguBookDoubles/Firebase init

### Script aggiunti prima di `</body>`
- `firebase-init.js`, `figubook-db.js`, `figubook-album-single.js`

---

## figubook-serieb-2526.html

Identica struttura.

### Script src rimossi
- `firebase-config.js`, `figubook-core.js`, `figubook-doubles.js`, `album-app.js`, `figubook-album-enhancements.js`

### Blocchi `<script>` conservati
- scrollTo patch (UI puro), TweaksPanel `type="text/babel"` (UI puro)

### Blocchi `<script>` rimossi
- Navbar JS + FiguBookDoubles/Firebase init

### Script aggiunti prima di `</body>`
- `firebase-init.js`, `figubook-db.js`, `figubook-album-single.js`

---

## figubook-adrenalyn-2526.html

Identica struttura.

### Script src rimossi
- `firebase-config.js`, `figubook-core.js`, `figubook-doubles.js`, `album-app.js`, `figubook-album-enhancements.js`

### Blocchi `<script>` conservati
- scrollTo patch (UI puro), TweaksPanel `type="text/babel"` (UI puro)

### Blocchi `<script>` rimossi
- Navbar JS + FiguBookDoubles/Firebase init

### Script aggiunti prima di `</body>`
- `firebase-init.js`, `figubook-db.js`, `figubook-album-single.js`

---

## figubook-matchattax-2526.html

Identica struttura.

### Script src rimossi
- `firebase-config.js`, `figubook-core.js`, `figubook-doubles.js`, `album-app.js`, `figubook-album-enhancements.js`

### Blocchi `<script>` conservati
- scrollTo patch (UI puro), TweaksPanel `type="text/babel"` (UI puro)

### Blocchi `<script>` rimossi
- Navbar JS + FiguBookDoubles/Firebase init

### Script aggiunti prima di `</body>`
- `firebase-init.js`, `figubook-db.js`, `figubook-album-single.js`

---

## index.html

Nessuna modifica — la pagina è la landing/login con solo React/Babel CDN e file JSX locali (data.jsx, components.jsx, app.jsx). Non ha script da rimuovere e nessun nuovo script da aggiungere secondo le regole.

---

## File JS stub creati

| File | Contenuto |
|------|-----------|
| `firebase-init.js` | `// firebase-init.js — S3` |
| `figubook-db.js` | `// figubook-db.js — S3` |
| `figubook-dashboard.js` | `// figubook-dashboard.js — S3` |
| `figubook-album.js` | `// figubook-album.js — S3` |
| `figubook-scambia.js` | `// figubook-scambia.js — S3` |
| `figubook-benvenuto.js` | `// figubook-benvenuto.js — S3` |
| `figubook-mancanti.js` | `// figubook-mancanti.js — S3` |
| `figubook-catalogo.js` | `// figubook-catalogo.js — S3` |
| `figubook-album-single.js` | `// figubook-album-single.js — S3` |
| `figubook-doubles.js` | **NON sovrascritto** — file esistente mantenuto |

---

# S3 — Collegamenti al data layer Firestore

Sessione 3: ogni pagina è collegata a `window.FB` (firebase-init.js) e
`window.DB` (figubook-db.js). Nessun localStorage/sessionStorage in alcun
file `figubook-*.js` (verificato: solo occorrenze in commenti). Ogni pagina
attende `window.FB.onReady(...)` prima di leggere/scrivere o aggiornare la UI.
Nome utente sempre da `DB.getUserName()` / `DB.getUserInitial()`.

## Infrastruttura condivisa (figubook-db.js)
- Aggiunto `window.ALBUM_CATALOG` (fonte unica: id, title, editor, season,
  total, href, missingParam, storageKey, tags) e `window.ALBUM_BY_ID`.
- `ALBUM_TOTALS` ora derivato dal catalogo. I `total` sono stati **contati**
  dai file `album-data*.js` (`Object.keys(STICKER_STATES).length`, che il file
  dati popola con OGNI codice, incluse le speciali). Valori:
  calciatori-25-26=784, 24-25=655, 23-24=686, 22-23=649, mondiali-2026=992,
  calb-25-26=440, adrenalyn-25-26=649, match-attax-ucl=584.
- `_getAlbumTotal` ricalcola il totale **live** dalla variabile dati
  (`FB_STORAGE_KEY` + `window.STICKER_STATES`) quando il file dati dell'album
  è caricato nella pagina; altrimenti usa `ALBUM_TOTALS`.

## figubook-album-single.js
(calciatori-2526/2425/2324/2223, fwc2026, serieb-2526, adrenalyn-2526, matchattax-2526)
- **Costante condivisa** `KEY_TO_ALBUM_ID` (storage key → albumId Firestore).
- AlbumId risolto leggendo il globale `FB_STORAGE_KEY` (scope lessicale del
  file dati) via `typeof`.
- Funzioni DB: `getAlbumData`, `saveCardState`, `resetAlbum`, `getUserInitial`.
  Lettura nomi: doc `users/{uid}/albums/{albumId}` campo `names`.
- Override runtime dei globali del file dati (NON editati): `window.saveAlbum`
  (no-op localStorage → diff per-carta su Firestore), `window.resetAlbum`
  (DB.resetAlbum + azzera globali + re-render).
- **album-app.js reiniettato dinamicamente** (era stato rimosso in S2): viene
  caricato DOPO il popolamento dei globali, così avvolge la nostra `saveAlbum`
  e fa il primo render coi dati veri. Chiamato `window.renderAlbum()`.
- ID DOM popolati: `#avatarBtn` (iniziale), `#pmEsci` (logout). Tutta la griglia
  è renderizzata da album-app.js sui globali.
- Persistenza nomi: merge diretto campo `names` (saveCardState non gestisce i nomi).

## figubook-dashboard.js
- Funzioni DB: `getEverHadAlbum`, `getUserName`, `getUserInitial`,
  `getAllStats`, `getMyAlbums`, `getAlbumStats`.
- ID popolati: `#greetingH1` (Benvenuto/Ciao + nome), `#avatarBtn`,
  `#footerYear`, `#qstatFigurine`, `#qstatDoppie`, `#qstatMancanti`,
  `#albumsScroller` (card reali), `#todoList` (suggerimenti reali o empty
  compatto), `#activityRows` (riepilogo reale).
- Empty state compatto se 0 album. Niente dati demo: nascosti
  `#objectivesWrap`, `#missionCard`, `#badgesGrid` e la riga `.cols` di
  grafico/sessioni (dati non disponibili lato dashboard); `#matchListContainer`
  nascosto, `#matchEmptyMsg` mostrato.

## figubook-album.js (lista "I miei album")
- Funzioni DB: `getMyAlbums`, `getAllStats`, `getAlbumStats`, `addAlbum`
  (via redirect al catalogo), `removeAlbum`, `getUserInitial`.
- ID popolati (REALI, il report S2 aveva id obsoleti): `#avatarBtn`,
  `#albumsGrid` (card), `#statFigurine`, `#statCompletati`, `#albumHeaderSub`,
  contatori filtro in `#filterChips .chip[data-filter] .ct`.
- Rimozione album dalla card (× → DB.removeAlbum + re-render). "Aggiungi album"
  (`#addAlbumBtn`) → figubook-catalogo.html. Filtri (all/active/done/new/archived)
  calcolati dai dati reali (archived sempre 0: nessun sistema d'archivio).
- Empty state compatto con link al catalogo.

## figubook-catalogo.js
- Funzioni DB: `getMyAlbums`, `addAlbum`, `removeAlbum`, `getUserInitial`.
- ID popolati: `#avatarBtn`, `#footerYear`, `#catGrid` (card da ALBUM_CATALOG),
  filtri `#filterBar .filter-btn[data-f]`.
- Ogni card mostra stato posseduto/non e bottone Aggiungi/Rimuovi → re-render.

## figubook-mancanti.js
- AlbumId risolto come album-single (`FB_STORAGE_KEY` + `KEY_TO_ALBUM_ID`).
- Funzioni DB: `getAlbumData`, `saveCardState` (state 'have'), `getUserInitial`.
- ID popolati: `#avatarBtn`, `#crumbAlbum`, `#totalMissing`, `#totalSquads`,
  `#checkedToday`, `#missingWrap` (lista carte mancanti), ricerca `#searchEl`,
  toggle `#groupChips .chip[data-group]`, copia `#copiaMancanti`.
- "Trovata" → STICKER_STATES[code]='have' + DB.saveCardState + UI update.
- Empty state compatto: "Album completo" quando non manca nulla.

## figubook-scambia.js (hub + dettaglio)
- Caricato sia da figubook-scambia.html sia da figubook-scambia-dettaglio.html
  (rilevamento pagina via `#dealTitle`). Nessun file dettaglio separato.
- Funzioni DB: `getUserInitial`.
- ID popolati: `#avatarBtn`, `#pmEsci` (logout), `#cards` (empty state onesto),
  contatori tab/chips azzerati (`#tabCountMatch/Received/Sent/Confirmed`,
  `#ctAll/ctNearby/ctFriends`). Dettaglio: `<main>` → "Funzione in arrivo".
- Rimosso ogni dato demo (Giada/Federico/… ) — nessun matching multi-utente ancora.

## figubook-benvenuto.js (login/registrazione)
- Unica pagina accessibile da non autenticati. `FB.onReady` → redirect a
  dashboard se già loggato; redirect esplicito dopo login/registrazione.
- Auth: `signInWithEmailAndPassword`, `createUserWithEmailAndPassword` +
  `updateProfile({displayName})` + doc `users/{uid}/meta/profile`
  `{displayName, username, ts}`, Google `signInWithPopup(GoogleAuthProvider)`.
- Funzioni globali per gli handler inline dell'HTML: `window.handleSubmit`,
  `window.handleGoogle`, `window.togglePass`, `window.updateRegisterEnabled`.
- UI: `renderSlogan`/`buildDots`/`tick` (slogan rotante), `setMode` (tabs).
- ID toccati: `#slogan`, `#slogCount`, `#slogDots`, `#tabs`, `#authTitle`,
  `#authSub`, `.top-meta` (#topGoRegister/#topGoLogin), `#loginEmail`,
  `#loginPassword`, `#loginError`, `#regUsername`, `#regEmail`, `#regPassword`,
  `#regError`, `#registerBtn`, `#regTerms`.
- Errori Firebase mappati in italiano (wrong-password, user-not-found,
  invalid-credential, email-already-in-use, invalid-email, weak-password, …).
