# Impostazioni — Account e sicurezza Design

Data: 2026-06-30
Stato: design approvato

## Obiettivo

Chiudere la pagina `/profilo/impostazioni` (oggi placeholder con tab "in arrivo") con una
sezione **Account e sicurezza** funzionante: cambio password per utenti email/password,
con fallback "password dimenticata" via email; messaggio dedicato per utenti Google.

## Provider

L'app usa due provider: email/password e Google (`googleProvider`). Il cambio password vale
solo per chi ha il provider `password`. Si rileva da `user.providerData.some(p => p.providerId === 'password')`.

## Componenti

### 1. Modulo `src/lib/auth/password.ts` (nuovo)
- `hasPasswordProvider(user): boolean` — true se l'utente ha provider `password`.
- `changePassword(currentPassword, newPassword): Promise<void>` — riautentica con
  `EmailAuthProvider.credential(email, currentPassword)` + `reauthenticateWithCredential`,
  poi `updatePassword`. Throw se non c'è utente/email.
- `sendReset(email): Promise<void>` — `sendPasswordResetEmail(auth, email)`.

### 2. Pagina `src/pages/ProfiloImpostazioni.tsx` (riscrittura)
Rimuove le tab placeholder. Layout: titolo + sezione "Account e sicurezza".
- Se `hasPasswordProvider(user)`:
  - Form `ChangePasswordForm`: campi Password attuale, Nuova password, Conferma.
    Validazione client: nuova >= 6 char, conferma == nuova. Submit → `changePassword`,
    messaggio successo/errore. Errori mappati: credenziale errata → "Password attuale errata",
    altro → messaggio generico.
  - Link "Password dimenticata?" → `sendReset(user.email)` + conferma "Email inviata".
- Se Google-only:
  - Card informativa: "Accedi con Google. La password si gestisce dal tuo account Google.",
    nessun form.

## Fuori scope (confermato)
- Notifiche (push telefono non esiste; in-app sempre attive).
- Preferenze scambio (rimandate alla sezione Scambi).
- Elimina account.
- Le tab Scambi/Privacy placeholder vengono rimosse.

## File toccati
- Create: `src/lib/auth/password.ts` + `src/lib/auth/password.test.ts`
- Modify: `src/pages/ProfiloImpostazioni.tsx`

Nessuna modifica a Firestore/regole. Niente deploy regole.

## Verifica
- `npx tsc -b --noEmit` 0, `npm run lint` 0 error, `npm run build` 0.
- Manuale: utente email/password cambia password (attuale errata → errore; corretta → successo);
  "password dimenticata" invia email; utente Google vede solo il messaggio.
