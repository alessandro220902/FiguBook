# Security Audit — Fix applicati + azioni residue

Data: 2026-06-30
Contesto: audit senior security engineer su FiguBook (SPA React + Firebase serverless).
Confine di sicurezza unico = `firestore.rules` + Firebase Auth.

## Fix APPLICATI (codice, deployati + pushati)

### #1 — PII: nome reale di profili privati esposto (Alta) ✅
`publicProfiles` è leggibile da ogni utente loggato; `nome` veniva scritto sempre.
Fix: `nome` mirrorato solo se `isPublic` (come città/bio), in `profile.ts`
(`saveProfileAccount` + `savePrivacy`). `register.ts` già scriveva `nome:''`.
Commit `5cc78cc`.
**Caveat dati esistenti:** i profili privati creati prima del fix mantengono il `nome`
in `publicProfiles` finché non rifanno un Salva o toggle visibilità (savePrivacy ri-mirrora
pulito). Non è ribaltabile da qui (solo il proprietario scrive il proprio publicProfiles).

### #3 — Race unicità username a registrazione (Media) ✅
`register.ts` riscritto: riserva `usernames/{lower}` + crea profilo/publicProfiles in
un'unica `runTransaction` con check `UsernameTakenError`; se collisione, elimina l'account
auth appena creato (no orfani). Pre-check live + messaggio dedicato in `Login.tsx`.
Commit `51f09c4`.

### #4 — Scritture sensibili senza email verificata (Media) ✅
`firestore.rules`: nuovo helper `verified()` (`request.auth.token.email_verified == true`).
Applicato a `create` di friendRequests, proposals, feedback, notifications. Google = verificato
di default. Commit `f9c5f63`, regole DEPLOYATE.

## Verificati OK (nessun problema)
- `apiKey` client: pubblica per design, non è un segreto.
- `dangerouslySetInnerHTML` in `Avatar.tsx`: sicuro (preset statici; `avatarId` usato solo come
  chiave di lookup, fallback monogramma; `uid` da `useId`). No XSS.
- proposals/feedback/inventory: gating participant/owner corretto, no auto-completamento, anti
  review-bombing.

## AZIONI RESIDUE (console / backend — fuori codice)

### #2 — Firebase App Check + restrizione API key (Media) — DA FARE in console
Senza App Check la config pubblica permette a script di colpire Firestore/Auth (enumerazione,
abuso quota, brute-force login).
Passi:
1. Firebase Console → App Check → registra l'app web con **reCAPTCHA v3**.
2. Abilita **enforcement** su Cloud Firestore e Authentication.
3. Nel codice: `initializeAppCheck(app, { provider: new ReCaptchaV3Provider(SITE_KEY), isTokenAutoRefreshEnabled: true })` in `firebase.ts`.
4. Google Cloud Console → Credenziali → restringi l'API key per **HTTP referrer**
   (`alessandro220902.github.io/*`).

### Storage — DA VERIFICARE in console
`firebase.json` deploya solo le regole Firestore. Gli avatar sono preset (niente upload).
Verifica in console che **Cloud Storage** sia disabilitato oppure con regole `allow read, write: if false`.
Se abilitato con regole default → buco.

## DEFERRED (con motivo)
- **#5 Spoofing notifiche** (Bassa): titolo notifica è attacker-controlled (≤160). React fa
  escape → no XSS, ma testo fasullo possibile. Fix vero = titoli generati server-side (Cloud
  Function). Mitigato in parte da #4. Rinviato a quando si introduce un backend.
- **#6 Spam richieste/notifiche** (Bassa): no rate limit possibile in sole regole. Rinviato:
  App Check (#2) + eventuale Cloud Function con throttling.
- **#7 `groups.memberCount` incrementabile** (Bassa, cosmetico): toccare la regola rischia di
  rompere join/leave del flusso scambi non ancora costruito. Rinviato a costruzione Scambi:
  derivare il conteggio dalla subcollection `members`.
