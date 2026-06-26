# Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Costruire la landing page pubblica su `/` che spiega FiguBook e converte alla registrazione, sostituendo l'attuale redirect `/` → `/login`.

**Architecture:** Singola pagina `src/pages/Landing.tsx` composta da sezioni locali (Nav, Hero, Features, AlbumShowcase, FinalCta, Footer). Route `/` resa condizionale in `App.tsx`: utente loggato → redirect `/home`, altrimenti landing. Stile riusa i token del Login (dark `#080a08`, accento lime, font display). Ispirazione layout: hero mikolajdobrucki + bento aceternity (21st.dev), rivestiti col brand. Mockup CSS, copertine reali dal catalogo esistente.

**Tech Stack:** React, react-router-dom, Tailwind, dati da `@/data/albumCatalog`. Nessuna nuova dipendenza.

---

### Task 1: Routing — `/` rende Landing con guardia auth

**Files:**
- Create: `src/pages/Landing.tsx` (stub)
- Modify: `src/App.tsx`

- [ ] **Step 1: Stub Landing**

Crea `src/pages/Landing.tsx`:

```tsx
export default function Landing() {
  return <div className="min-h-screen bg-[#080a08] text-[#f4efe6]">Landing</div>
}
```

- [ ] **Step 2: Collega la route con guardia**

In `src/App.tsx`: importa `useAuth` e `Landing`, sostituisci la riga
`<Route path="/" element={<Navigate to="/login" replace />} />`.

```tsx
import Landing from '@/pages/Landing'
import { useAuth } from '@/hooks/useAuth'
// ...dentro App(), prima del return, leggi lo stato:
const { user } = useAuth()
// route:
<Route path="/" element={user ? <Navigate to="/home" replace /> : <Landing />} />
```

Nota: `useAuth` è già usato altrove (es. Login). Se `App` non ha accesso al context,
verificare che `<AuthProvider>` avvolga `<App />` in `main.tsx` (già così).

- [ ] **Step 3: Verifica build + manuale**

Run: `npx tsc -b --noEmit && npm run build`
Expected: exit 0.
Manuale: `/` da sloggato mostra "Landing"; da loggato redirige a `/home`.

- [ ] **Step 4: Commit**

```bash
git add figubook-app/src/pages/Landing.tsx figubook-app/src/App.tsx
git commit -m "feat(landing): route / pubblica con guardia auth (stub)"
```

---

### Task 2: Nav + Hero

**Files:**
- Modify: `src/pages/Landing.tsx`

- [ ] **Step 1: Nav**

Barra in cima: badge logo "F" lime (riusa lo stile del Login:
`grid h-9 w-9 -rotate-6 place-items-center rounded-[10px] bg-lime font-display ...`) +
wordmark "FiguBook" a sinistra; a destra `Link` "Accedi" → `/login`. Container
`mx-auto max-w-[1100px] px-6`.

- [ ] **Step 2: Hero**

Due colonne a `md` (mobile = stack; ricorda regola PC=md, iPad=PC):
- Sinistra: `h1` display grande (`font-display text-5xl md:text-6xl font-bold tracking-[-0.03em]`),
  claim coerente col tono slogan (es. "Chiudi l'album senza comprare pacchetti alla cieca.").
  Sottotitolo `text-muted-foreground`. Due CTA: `Inizia gratis` (bottone lime →
  `/login`, apre registrazione — vedi Task 6) + "Scopri come funziona" (link che scrolla
  a `#funziona`, ancora sulla sezione feature).
- Destra: mockup CSS — card "figurina" + barra avanzamento album (riquadro
  `rounded-2xl border border-white/10 bg-[#0c100c]` con dentro un numero "+1", una
  progress bar lime a ~70%, etichetta "Album 70%").

- [ ] **Step 3: Verifica**

Run: `npx tsc -b --noEmit && npm run lint && npm run build`
Expected: exit 0, nessun errore lint.
Manuale: hero responsive, CTA cliccabili.

- [ ] **Step 4: Commit**

```bash
git add figubook-app/src/pages/Landing.tsx
git commit -m "feat(landing): nav + hero con mockup avanzamento album"
```

---

### Task 3: Feature — 4 card (bento)

**Files:**
- Modify: `src/pages/Landing.tsx`

- [ ] **Step 1: Sezione feature**

Aggiungi `<section id="funziona">` con titolo sezione + griglia bento (ispirazione
aceternity): `grid gap-4 md:grid-cols-2`. 4 card (`rounded-2xl border border-white/10
bg-[#0c100c] p-6`), ognuna con icona lucide, titolo, descrizione:
- **Risparmia** (icona `PiggyBank`/`Wallet`) — "Smetti di comprare pacchetti alla cieca. Scambia i doppioni gratis e completa senza sprechi."
- **Trova le doppie** (icona `Copy`/`Layers`) — "Sai sempre cosa hai in più e cosa ti manca, aggiornato in tempo reale."
- **Scambia con persone reali** (icona `Users`) — "Connettiti con altri collezionisti e chiudi gli scambi giusti."
- **Album sempre aggiornato** (icona `BookOpen`) — "Un tocco e la collezione è in pari, ovunque tu sia."

Una card può occupare più spazio (`md:col-span-2` o `md:row-span-2`) per dare ritmo
bento, a discrezione estetica.

- [ ] **Step 2: Verifica**

Run: `npx tsc -b --noEmit && npm run lint && npm run build`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add figubook-app/src/pages/Landing.tsx
git commit -m "feat(landing): sezione feature bento (risparmia/doppie/scambia/aggiornato)"
```

---

### Task 4: Album in evidenza (copertine reali)

**Files:**
- Modify: `src/pages/Landing.tsx`

- [ ] **Step 1: Leggi il catalogo**

Importa il catalogo: `import { ALBUM_CATALOG } from '@/data/albumCatalog'`. Ogni voce
(`AlbumCatalogEntry`) ha `title`, `editor`, `total`, `c1`, `c2`, opzionale `cover`.

- [ ] **Step 2: Griglia copertine**

`<section>` "Album in evidenza" + sottotitolo. Mostra i primi ~6–8 album:
`grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4`. Ogni cella `aspect-[3/4]
rounded-xl overflow-hidden border border-white/10`:
- se `a.cover` esiste → `<img src={a.cover} className="h-full w-full object-cover" />`
- altrimenti → fondo `linear-gradient(135deg, c1, c2)` con `title` + `editor` in overlay.

Sotto ogni cella o in overlay: titolo + "{total} figurine".

- [ ] **Step 3: Verifica**

Run: `npx tsc -b --noEmit && npm run lint && npm run build`
Expected: exit 0.
Manuale: cover Calciatori 25/26 carica come immagine; gli altri mostrano gradiente brand.

- [ ] **Step 4: Commit**

```bash
git add figubook-app/src/pages/Landing.tsx
git commit -m "feat(landing): album in evidenza con copertine reali dal catalogo"
```

---

### Task 5: CTA finale + Footer

**Files:**
- Modify: `src/pages/Landing.tsx`

- [ ] **Step 1: Fascia CTA finale**

`<section>` con fondo accentato (lime tenue o bordo lime), titolo "Inizia a chiudere
l'album" + bottone `Inizia gratis` → `/login` (registrazione).

- [ ] **Step 2: Footer**

`<footer className="border-t border-white/10">` con: link `/privacy` `/termini`
`/cookie`; bottone "Gestisci cookie" che reimposta il consenso così il banner riappare
— `import { setConsent } from '@/lib/consent'` e on click rimuovi la chiave + reload,
oppure esponi un helper. Implementazione minima:

```tsx
function manageCookies() {
  localStorage.removeItem('figubook.cookieConsent')
  location.reload()
}
```

Più disclaimer font-mono uppercase: "Non affiliato a Panini S.p.A. — strumento
indipendente di tracking e scambio.".

- [ ] **Step 3: Verifica**

Run: `npx tsc -b --noEmit && npm run lint && npm run build`
Expected: exit 0.
Manuale: link legali funzionano; "Gestisci cookie" fa riapparire il banner.

- [ ] **Step 4: Commit**

```bash
git add figubook-app/src/pages/Landing.tsx
git commit -m "feat(landing): cta finale + footer legale con gestisci cookie"
```

---

### Task 6: CTA apre il Login in modalità registrazione

**Files:**
- Modify: `src/pages/Login.tsx`
- Modify: `src/pages/Landing.tsx` (link CTA)

- [ ] **Step 1: Login legge l'intento registrazione**

In `Login.tsx`, lo stato iniziale `mode` deve partire da `'register'` quando si arriva
con quell'intento. Usa il query param: leggi `useSearchParams` (o `location.search`):

```tsx
import { useSearchParams } from 'react-router-dom'
// ...
const [params] = useSearchParams()
const [mode, setMode] = useState<Mode>(params.get('r') === '1' ? 'register' : 'login')
```

- [ ] **Step 2: Landing punta le CTA a /login?r=1**

Tutte le CTA "Inizia gratis" della landing: `<Link to="/login?r=1">`.

- [ ] **Step 3: Verifica**

Run: `npx tsc -b --noEmit && npm run lint && npm run build`
Expected: exit 0.
Manuale: cliccando "Inizia gratis" la pagina login apre con il tab **Registrati** attivo.

- [ ] **Step 4: Commit**

```bash
git add figubook-app/src/pages/Login.tsx figubook-app/src/pages/Landing.tsx
git commit -m "feat(landing): cta inizia gratis apre login in modalita registrazione"
```

---

### Task 7: Rifinitura estetica + push

**Files:**
- Modify: `src/pages/Landing.tsx`

- [ ] **Step 1: Passata estetica**

Applica le skill estetiche (frontend-design + minimalismo Geist): ritmo spaziatura,
gerarchia tipografica, contrasto, hover desktop-only (gatati su `hover+pointer:fine`,
non sulla width — iPad conta come PC). Evita slop IA (no emoji-spam, no gradient gratuiti).
Coerenza col Login.

- [ ] **Step 2: Verifica finale completa**

Run: `npx tsc -b --noEmit && npm run lint && npm run build && npx vitest run`
Expected: tutto verde (i 75 test esistenti restano verdi; la landing non aggiunge test).

- [ ] **Step 3: Commit + push**

```bash
git add figubook-app/src/pages/Landing.tsx
git commit -m "polish(landing): rifinitura tipografia/spaziatura/hover"
git push
```

---

## Note di verifica complessiva (dal spec)

- `/` sloggato → landing; loggato → `/home`. ✓ Task 1
- Hero + CTA registrazione. ✓ Task 2, 6
- 4 feature incl. angolo "risparmia". ✓ Task 3
- Album in evidenza con cover reali + fallback gradiente. ✓ Task 4
- Footer legale + gestisci cookie. ✓ Task 5
- Responsive PC=md (iPad=PC). ✓ Task 2, 7
- Nessuna stat inventata, nessuna nuova dipendenza. ✓ (per costruzione)
