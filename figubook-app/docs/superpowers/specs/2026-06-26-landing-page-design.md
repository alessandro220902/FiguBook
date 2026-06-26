# Landing page pubblica — design

**Data:** 2026-06-26
**Stato:** approvato (design), in attesa review spec

## Obiettivo

Pagina marketing pubblica per visitatori che non conoscono FiguBook. Spiega cos'è,
mostra valore, converte alla registrazione. Sostituisce l'attuale redirect `/` → `/login`.

Riferimento concorrente: doppy.it (stessa nicchia). Ne riprendiamo l'angolo "risparmia
/ smetti di comprare pacchetti alla cieca" e la sezione "Album in evidenza"; **non**
copiamo stats numeriche (FiguBook è nuovo: numeri inventati = falsi/illegali), blog,
WhatsApp, claim "community n.1".

## Routing

- `/` → `<Landing />` (pubblica, nessun auth)
- Utente già autenticato che apre `/` → redirect a `/home`
- `/login` invariato; CTA "Inizia gratis" apre `/login` in modalità registrazione
- Le route legali `/privacy` `/termini` `/cookie` restano

Loggato/non loggato: si usa `useAuth()`. Mentre `loading` → nessun flash (placeholder
neutro o nulla finché si conosce lo stato).

## Stile

Stesso linguaggio visivo del Login: sfondo `#080a08`, font display, accento **lime**,
estetica minimalista Geist (no slop IA). Riuso dei token/classi esistenti. Applicare le
skill estetiche (frontend-design + minimalismo) in implementazione.

## Struttura (scroll verticale)

1. **Nav** — badge logo "F" lime + wordmark a sx · bottone `Accedi` (→ /login) a dx.
   Sticky leggera o statica.

2. **Hero** — titolo display grande + claim (tono coerente con gli slogan del Login,
   es. "La tua collezione, sempre in tasca" + sottotitolo sul completare l'album
   scambiando invece di comprare pacchetti). CTA primaria `Inizia gratis`
   (→ /login?register) + secondaria "Scopri come funziona" (scroll alla sezione feature).
   A fianco: **mockup CSS** (card figurina + barra avanzamento album) coerente col brand.

3. **Feature — 4 card**:
   - **Risparmia** — smetti di comprare pacchetti alla cieca; scambia i doppioni gratis.
   - **Trova le doppie** — sai sempre cosa hai in più e cosa ti manca.
   - **Scambia con persone reali** — connettiti con altri collezionisti.
   - **Album sempre aggiornato** — un tocco e la collezione è in pari, ovunque.

4. **Album in evidenza** — griglia di copertine dal catalogo reale (`albumCatalog.ts`):
   cover immagine vera dove presente (Calciatori 25/26), altrimenti card con gradiente
   brand `c1`/`c2` + titolo + editore + totale figurine. ~6–8 album. Nessun numero
   inventato; sono dati reali del catalogo.

5. **CTA finale** — fascia accentata (lime) "Inizia a chiudere l'album" + bottone
   `Inizia gratis`.

6. **Footer** — link Privacy / Termini / Cookie + "Gestisci cookie" (riapre il banner /
   imposta consenso) + disclaimer "Non affiliato a Panini S.p.A.".

## Componenti / file

- `src/pages/Landing.tsx` — pagina, composta da sezioni locali (Nav, Hero, Features,
  AlbumShowcase, FinalCta, Footer). Se un blocco cresce, estrarlo in
  `src/components/landing/`.
- `src/App.tsx` — `/` ora rende `<Landing />` con guardia: se `user` → `<Navigate to="/home">`.
- Dati: import da `@/data/albumCatalog` (nessun nuovo dato).
- Nessuna modifica all'app autenticata né al Login (solo, se serve, supporto a
  `/login` aprendo in tab registrazione via query/param o state).

## Fuori scope (YAGNI)

Stats numeriche, blog, social, toggle tema, FAQ, screenshot reali, i18n. Mockup CSS, non
foto. Niente nuove dipendenze.

## Verifica

- `tsc -b --noEmit`, `npm run lint`, `npm run build` verdi.
- `/` da non loggato mostra landing; da loggato redirige a `/home`.
- CTA "Inizia gratis" porta a /login in modalità registrazione.
- Responsive: mobile include iPad (regola PC=md). Layout PC/mobile separato a `md`.
- Copertine reali caricano; fallback gradiente per album senza cover.
