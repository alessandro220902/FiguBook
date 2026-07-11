# Onboarding profilo post-verifica + banner completamento + campo CAP

Data: 2026-07-11
Stato: approvato (brainstorm via dialogo), pronto per il piano

## Obiettivo

Dopo la verifica email, il nuovo utente non atterra nell'app "vuota" ma su una pagina di
**onboarding** che lo invita a completare il profilo. Raccoglie il dato-base della Community
(**comune**, obbligatorio) e, in modo soft, CAP / squadra / avatar (opzionali, con microcopy
che ne spiega il beneficio). L'onboarding è **saltabile** ("Configura più tardi"); finché manca
il comune, un **banner perenne in Home** ricorda di completarlo.

Non si manda l'utente sulla pagina Profilo attuale: è densa e mostra la "Zona pericolosa"
(elimina account) — inadatta al primo accesso.

## Concetti chiave

Due stati distinti sul profilo:
- **`onboarded`** (bool, privato): "ha già visto l'onboarding". Si mette `true` quando l'utente
  salva **oppure** clicca "Configura più tardi". Serve a non re-inchiodarlo sulla pagina
  onboarding ad ogni visita.
- **completato** (derivato, non memorizzato): il profilo è "completo" quando ha un **comune
  valido** (`isValidComune(citta)`). Guida la comparsa del banner.

Perché due stati: l'onboarding è saltabile. Un gate rigido "vai a onboarding finché non hai il
comune" romperebbe lo "Salta" (rimbalzo infinito). Con `onboarded` separato: si forza la pagina
solo la prima volta; dopo, la spinta al completamento la dà il banner.

## Campi dati

Estendere `ProfileDoc` (in `src/lib/db/profile.ts`, doc privato `users/{uid}/meta/profile`):
- `cap?: string` — CAP, **privato**. MAI scritto in `publicProfiles`. Validazione: 5 cifre o vuoto.
- `onboarded?: boolean` — vedi sopra.

Il **comune** riusa il campo esistente `citta` (formato "Roma (RM)", validato da `isValidComune`).

`publicProfiles` NON cambia: niente CAP, niente onboarded. Il comune (`citta`) resta gestito
dalla privacy esistente (visibile solo se profilo pubblico / ad amici), invariato.

## Routing / gate

`ProtectedRoute` (`src/components/ProtectedRoute.tsx`) oggi: non-auth → /login; da-verificare → /verifica.
Aggiungere: se autenticato, verificato, **profilo caricato** e `!profile.onboarded` e la rotta
corrente non è `/onboarding` → redirect a `/onboarding`.

Dettagli:
- Serve il profilo dentro ProtectedRoute (`useProfile`). Finché il profilo è in caricamento,
  mostrare lo stesso loader esistente (non decidere con dati incompleti).
- `/onboarding` è una nuova rotta DENTRO l'area protett­a (richiede utente verificato) ma è
  esente dal redirect-a-onboarding (altrimenti loop).
- Post-verifica: `VerificaEmail` fa già `window.location.reload()`; al reload il gate manda a
  `/onboarding` perché `onboarded` è ancora false. Nessuna modifica a VerificaEmail necessaria.

## Pagina `/onboarding`

Nuovo file `src/pages/Onboarding.tsx`. Layout pulito, centrato, niente navbar densa/zona
pericolosa. Titolo caldo ("Benvenuto! Completa il tuo profilo").

Campi, in ordine:
1. **Comune** (obbligatorio) — `CittaPicker` (esistente). Label chiara che è obbligatorio.
2. **CAP** (opzionale) — input 5 cifre. Microcopy sotto:
   *"Aggiungi il CAP: gli scambi che ti consigliamo diventano molto più precisi, trovi
   collezionisti proprio vicino a te."*
3. **Squadra del cuore** (opzionale) — `TeamPicker` (esistente). Microcopy:
   *"Scegli la tua squadra: colora il tuo profilo e ti fa sentire parte della tua tifoseria."*
4. **Immagine profilo** (opzionale) — riuso `AvatarModal`/avatar picker esistente. Microcopy:
   *"Metti un avatar: ti rendi riconoscibile agli altri collezionisti."*

Bottoni in fondo:
- **Salva** — attivo solo se `dirty` (qualcosa è stato modificato), come già fa il form Profilo.
  Al click: valida comune (se presente/valido lo salva), salva cap/favTeam/avatar, mette
  `onboarded=true`, poi naviga a `/home`. Se il comune è vuoto/invalido, Salva resta possibile
  ma il profilo non è "completo" → il banner comparirà (non blocca).
- **Configura più tardi** — mette `onboarded=true` senza salvare altro, naviga a `/home`.

Nota UX: "Salva" richiede almeno un comune valido per considerarsi completo, ma NON è un muro —
si può salvare parziale o saltare. Il completamento è spinto dal banner, non imposto.

## Banner completamento in Home

Nuovo componente `src/components/home/CompleteProfileBanner.tsx`, montato in cima a `Home`
(`src/pages/Home.tsx`). Visibile SOLO se profilo caricato e `!isValidComune(citta)`.

Contenuto: breve, invitante — "Completa il profilo per trovare collezionisti vicino a te" +
bottone/link "Completa →" che porta a `/onboarding`. Sparisce da solo appena il comune è valido.
Non dismissibile a mano (è il promemoria perenne voluto); sparisce solo al completamento.

## Persistenza

Estendere `saveProfileAccount` (o funzione dedicata) per scrivere anche `cap` e `onboarded` su
`meta/profile`, SENZA propagarli a `publicProfiles`. Il CAP va validato (5 cifre) e ripulito.
`onboarded` va impostabile da solo (per "Configura più tardi") senza toccare gli altri campi —
prevedere un helper leggero tipo `markOnboarded(uid)` o un patch parziale.

## Fuori scope (fasi successive)

- **CAP assistito** (prefill automatico dal comune per comuni mono-CAP; menu "quale zona?" per
  città grandi). Richiede un dataset comune→CAP che oggi non esiste (`COMUNI` ha solo nome+prov).
  In questa fase il CAP è un semplice input 5 cifre opzionale. L'assist è una rifinitura futura.
- **Uso del CAP nel motore di match** (Community Fase 2): qui lo si raccoglie soltanto.
- SMTP/dominio custom per la deliverability delle mail di verifica (task a sé).

## Verifica

- Nuovo utente verificato con profilo vuoto → atterra su `/onboarding`.
- "Configura più tardi" → `/home` con banner visibile; ricaricando NON torna su `/onboarding`.
- Mette il comune + Salva → `/home` senza banner.
- CAP salvato non appare in `publicProfiles` (privacy).
- Test unit: validazione CAP (5 cifre/vuoto), criterio "completo" = `isValidComune(citta)`.
