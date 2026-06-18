# Audit fondamenta + login — pre-migrazione React

Data: 2026-06-18
Lente: senior debugging engineer (debug-lens). Obiettivo: NON portare bug del vecchio nel nuovo, NON introdurne di nuovi.
File auditati: `firebase-init.js`, `figubook-db.js`, `firestore.rules`, `album-data.js`, `figubook-benvenuto.js` (vecchio) ↔ `figubook-app/src/pages/Login.tsx`, `App.tsx`, `hooks/useAuth.tsx` (nuovo).

---

## PARTE A — Fondamenta (vecchio)

### Critici (NON portare in React)
- **B1 — `saveCardState` scrive a cascata per ogni tap** (`figubook-db.js:189`). 1 tap = set album + read tutti i gruppi + read album + write inventory ogni gruppo. 800 carte = migliaia di op. → React: store ottimistico + flush debounced batch + inventory sync 1 volta a fine raffica.
- **B2 — `acceptProposal` read-modify-write non atomico** (`figubook-db.js:582`). Due accettazioni concorrenti → lost update su `confirmedBy` → mai `completed`. → `runTransaction` + arrayUnion.
- **B3 — XSS stored cross-utente notifiche** (`figubook-db.js:375` + `firestore.rules:22`). `renderNotifPanel` inietta `href`/`icon` raw in innerHTML; le rules non li validano. → JSX (auto-escape) + rules stringono href (whitelist) e icon (set chiuso).

### Alti
- **B4 — `_uid()` assume currentUser non-null** (`figubook-db.js:52`). Throw prima di auth resolve / dopo logout. → gate tutte le call DB dietro stato authenticated.
- **B5 — createGroup/joinGroup/leaveGroup non atomici** (`figubook-db.js:397-439`). Multi-write sequenziali; `leaveGroup` ingoia errori (`.catch(()=>{})`) → memberCount drift. createGroup invite-code while-loop TOCTOU. → writeBatch/transaction.
- **B6 — Rules: auto-completamento proposta** (`firestore.rules:112`). Handshake `completed` solo client; rules lasciano a un partecipante mettere status=completed da solo → aggira anti-review-bombing (feedback richiede completed). → enforce transizioni di stato nelle rules.
- **B7 — `reviseProposal` id revisione = `revs.size`** (`figubook-db.js:563`). Revisioni concorrenti collidono. → id auto / transaction.

### Medi
- B8 `db.js:330` getNotifications cancella vecchi durante la GET (side-effect nel getter), legge tutto senza limit.
- B9 timestamp = `Date.now()` (clock client) per campi ordine-critici → usare serverTimestamp().
- B10 `.limit(500)` + filtro client (db.js:295,553) → query server-side + paginazione.
- B11 `removeAlbum` non pulisce inventory nei gruppi → scambi fantasma.
- B12 auth-guard accoppiato al filename HTML (init.js:30) → in React = route guard.
- B13 `_getAlbumTotal` dipende da global window.STICKER_STATES/FB_STORAGE_KEY → passare album tipato.

### Bassi / pulizia
- album-data.js:87 saveAlbum/resetAlbum = no-op morti.
- album-data.js:71 vs db.js:220 = due implementazioni stats divergenti.
- db.js:670 _rdCache profilo pubblico mai invalidata su setMyPublicProfile.
- init.js:49 onReady leak minore.

### Da tenere fedele (è buono)
- `ALBUM_CATALOG` fonte unica album.
- Logica match scambi `_matchOnAlbum`/`_matchMember` (corretta, pulita).
- Struttura collezioni Firestore (users/{uid}/albums, groups, proposals).
- Impianto rules anti-abuso (va completato, non rifatto).

---

## PARTE B — Login (vecchio benvenuto.js ↔ nuovo Login.tsx)

### Parità OK (nuovo copre il vecchio)
email/pass login, register (username+email+pass), Google, updateProfile displayName, profilo in users/{uid}/meta/profile, mappa errori, checkbox termini gate register, 14 anni, toggle password, redirect se già autenticato. In più il nuovo aggiunge persistenza "Rimani connesso" (vecchio NON ce l'aveva) = miglioria.

### 🔴 G0 — Nessun ProtectedRoute (REGRESSIONE introdotta dalla migrazione)
`App.tsx`: /dashboard, /album, /scambi, /community sono aperte a non autenticati. Il vecchio guard globale (firebase-init.js redirige a benvenuto) NON è replicato. → aggiungere `<ProtectedRoute>` che usa useAuth (loading→spinner, !user→Navigate /login). Collega anche B4/B12.

### 🟠 G1 — Google sovrascrive il profilo a ogni login (regressione)
Vecchio: scrive profilo solo se `additionalUserInfo.isNewUser`. Nuovo (`Login.tsx:135`): setDoc merge displayName=name a OGNI login Google → se l'utente cambia displayName, il re-login lo riporta al nome Google. → scrivere solo se nuovo, o non sovrascrivere displayName esistente.

### 🟡 Minori
- G2 username `regUser.trim()` può diventare vuoto (spazi) pur passando `required` → validare non-vuoto dopo trim (vale anche nel vecchio).
- G3 `ts: Date.now()` client clock nel profilo (eredita B9). Minore.
- G4 password: input minLength=8 ma Firebase enforce solo 6 — stricter lato UI ok, coerente.
- G5 nessuna email di verifica (scelta prodotto, da decidere).
- G6 publicProfile NON settato al signup (né vecchio né nuovo qui) → l'onboarding React deve chiamare setMyPublicProfile (serve a scambi/community).

---

## Principi migrazione (tre decisioni d'architettura)
1. Scritture: store ottimistico + debounce + batch (B1/B2/B7).
2. Modello dati: da window.* global a moduli TS tipati importati (B13, cleanup).
3. Sicurezza nelle rules, non nel client (B3/B6/G0).

Performance-lens NON applicata (prematura: pochi utenti). Vedi memory [[senior-engineer-lenses]], [[use-superpowers-skills]].
