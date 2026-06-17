# Migrazione FiguBook → React/Vite — Design Spec

**Data:** 2026-06-17
**Target uscita:** set/ott 2026
**Approccio:** redesign UI da zero + migrazione tecnica strangler

## Obiettivo

Rifondare FiguBook da HTML/JS vanilla (multi-pagina) a SPA React/Vite, con
redesign completo dell'interfaccia. Backend, dati e regole restano invariati;
cambia solo UI/UX e l'architettura frontend.

## 1. Architettura migrazione (strangler)

- Nuova cartella nel repo: `figubook-app/` (path: `/Users/alessandrogelo/Desktop/FiguBook/figubook-app/`).
- Sito vecchio (`.html` + `.js` alla radice) resta live finché React copre tutto.
  Nessun downtime, nessuna cancellazione finché il nuovo non è completo.
- Build statica → deploy su GitHub Pages.
- Switch finale solo quando React copre tutte le sezioni.

### Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- React Router
- Firebase (Auth + Firestore) — invariato
- framer-motion (micro-motion)

### Cosa si tiene (non si riscrive la logica)

- `figubook-db.js` → portato in hook React (data layer).
- `firestore.rules` → identiche (regole A–F).
- `album-data-*.js` → dataset statici riusati.
- Identità colore da `figubook-tokens.css` (lime/pitch/gold) → portata in
  config Tailwind + tema shadcn.

### Cosa cambia

- Solo UI/UX: redesign da zero.
- Workflow design: mockup immagine (imagegen-frontend-web / brandkit) →
  approvazione utente → implementazione (image-to-code + ui-ux-pro-max +
  impeccable per audit).

## 2. Architettura informativa

Quattro sezioni nav + login d'ingresso:

```
LOGIN (ingresso, fuori dalle 4 sezioni)
├─ DASHBOARD   → widget che pescano da album / doppioni / mancanti
├─ ALBUM       → catalogo · album single · doppioni · mancanti (casa dei dati)
├─ SCAMBI      → richiama doppioni (offri) + mancanti (cerchi)
└─ COMMUNITY   → da progettare, ultima
```

**Principio chiave:** doppioni, mancanti, catalogo NON sono pagine: sono viste
sui dati. Casa principale = sezione Album, ma richiamate altrove (Scambi,
Dashboard). In React si costruiscono come componenti + hook riusabili, una sola
fonte dati (hook su Firestore), più punti d'ingresso. I componenti condivisi si
progettano quando serve la pagina che li usa (non in anticipo — YAGNI).

## 3. Ordine implementazione (passo passo)

```
0. Scaffold: Vite + Tailwind + shadcn + tema lime/pitch/gold + deploy Pages
1. LOGIN      → valida auth + pipeline end-to-end
2. DASHBOARD
3. ALBUM      → + viste catalogo / doppioni / mancanti man mano
4. SCAMBI
5. COMMUNITY  → prima un brainstorming a sé (è da progettare)
```

Ogni step: mockup immagine → approvazione utente → implementazione → push.
Si procede uno step alla volta; il prossimo step parte solo a step precedente
verificato.

## 4. Pagine vecchie mappate alle nuove sezioni

| Vecchio (.html)                       | Nuova sezione        |
|---------------------------------------|----------------------|
| index, benvenuto                      | LOGIN                |
| dashboard                             | DASHBOARD            |
| album, calciatori-*, fwc*, adrenalyn, matchattax, serieb | ALBUM (album single + collezioni) |
| catalogo                              | ALBUM (vista catalogo) |
| doppioni                              | ALBUM (vista, richiamata in Scambi/Dashboard) |
| mancanti                              | ALBUM (vista, richiamata in Scambi/Dashboard) |
| scambia, scambia-dettaglio            | SCAMBI               |
| (nuova)                               | COMMUNITY            |

## Vincoli di processo

- Process prima di implementazione: spec → piano (writing-plans) → codice.
- Push su main dopo ogni modifica (regola memory).
- Cache-bust `?v=N` su asset locali del sito vecchio quando toccati.

## Prossimo passo

writing-plans per lo **step 0 (scaffold)**.
