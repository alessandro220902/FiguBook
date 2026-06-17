# Step 0 — Scaffold FiguBook React Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Creare lo scheletro dell'app React (Vite + TS + Tailwind + shadcn + tema lime/pitch/gold) che si builda e pubblica da solo su GitHub Pages via Actions, coesistendo col sito vecchio.

**Architettura:** Sottocartella `figubook-app/` nel repo esistente. GitHub Actions builda Vite e assembla un artifact Pages = file vecchi (radice) + app nuova sotto `/app/`. Il sito vivo dipende solo da GitHub, mai dal Mac. Nessun dato/logica migrata in questo step: solo scheletro + routing vuoto + deploy funzionante.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui, React Router, GitHub Actions, GitHub Pages.

**Vincolo deploy:** ZERO locale dal punto di vista utente. La fonte di verità della build è GitHub Actions. I comandi locali (npm) servono solo a Claude per generare/verificare; il sito pubblicato non dipende dal Mac.

**Base path Pages:** progetto su `https://<user>.github.io/FiguBook/`. App nuova su `/FiguBook/app/`. Quindi Vite `base: '/FiguBook/app/'`.

---

## File Structure

- `figubook-app/` — root del progetto Vite (package.json, vite.config.ts, tsconfig, ecc.)
- `figubook-app/src/main.tsx` — entry React, monta il router
- `figubook-app/src/App.tsx` — router con le 4 sezioni + login (route placeholder)
- `figubook-app/src/index.css` — Tailwind + token identità lime/pitch/gold
- `figubook-app/tailwind.config.ts` — colori brand mappati da figubook-tokens.css
- `figubook-app/src/pages/` — un file placeholder per sezione (Login, Dashboard, Album, Scambi, Community)
- `.github/workflows/deploy.yml` — build + deploy Pages (artifact = sito vecchio + app nuova)
- `figubook-app/.gitignore` — node_modules, dist

---

## Task 1: Scaffold Vite + React + TS

**Files:**
- Create: `figubook-app/` (intero progetto Vite)

- [ ] **Step 1: Generare il progetto Vite**

Run:
```bash
cd /Users/alessandrogelo/Desktop/FiguBook
npm create vite@latest figubook-app -- --template react-ts
```
Expected: cartella `figubook-app/` creata con template react-ts.

- [ ] **Step 2: Installare le dipendenze**

Run:
```bash
cd /Users/alessandrogelo/Desktop/FiguBook/figubook-app
npm install
```
Expected: `node_modules/` creato, nessun errore.

- [ ] **Step 3: Impostare base path in vite.config.ts**

Sostituire il contenuto di `figubook-app/vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: '/FiguBook/app/',
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

- [ ] **Step 4: Verificare che builda**

Run:
```bash
cd /Users/alessandrogelo/Desktop/FiguBook/figubook-app && npm run build
```
Expected: cartella `dist/` generata, exit 0, nessun errore TS.

- [ ] **Step 5: Commit**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add figubook-app
git commit -m "feat: scaffold Vite React TS in figubook-app"
```

---

## Task 2: Tailwind + token identità lime/pitch/gold

**Files:**
- Create: `figubook-app/tailwind.config.ts`, `figubook-app/postcss.config.js`
- Modify: `figubook-app/src/index.css`
- Reference: `/Users/alessandrogelo/Desktop/FiguBook/figubook-tokens.css` (valori colore reali)

- [ ] **Step 1: Installare Tailwind**

Run:
```bash
cd /Users/alessandrogelo/Desktop/FiguBook/figubook-app
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```
Expected: `tailwind.config.js` + `postcss.config.js` creati.

- [ ] **Step 2: Leggere i token reali**

Run:
```bash
cd /Users/alessandrogelo/Desktop/FiguBook
grep -E "accent|pitch|gold|ink|bg|muted" figubook-tokens.css
```
Usare i valori hex effettivi (lime/pitch/gold) nel passo successivo invece di inventarli.

- [ ] **Step 3: Configurare i colori brand**

Rinominare `tailwind.config.js` in `tailwind.config.ts` e impostare (sostituire gli hex con quelli letti allo Step 2):
```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // valori reali da figubook-tokens.css (Step 2)
        accent: '#CCFF00',   // lime — placeholder, sostituire
        pitch:  '#0b0f0c',   // pitch — placeholder, sostituire
        gold:   '#d4af37',   // gold — placeholder, sostituire
      },
      fontFamily: {
        sans: ['"Barlow Condensed"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 4: Direttive Tailwind in index.css**

Sostituire `figubook-app/src/index.css` con:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root { color-scheme: dark; }
body { @apply bg-pitch text-white font-sans; }
```

- [ ] **Step 5: Verificare build con Tailwind**

Run:
```bash
cd /Users/alessandrogelo/Desktop/FiguBook/figubook-app && npm run build
```
Expected: exit 0, classi Tailwind nel CSS di `dist/`.

- [ ] **Step 6: Commit**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add figubook-app/tailwind.config.ts figubook-app/postcss.config.js figubook-app/src/index.css
git rm --cached figubook-app/tailwind.config.js 2>/dev/null || true
git commit -m "feat: Tailwind + token brand lime/pitch/gold"
```

---

## Task 3: shadcn/ui init

**Files:**
- Create: `figubook-app/components.json`, `figubook-app/src/lib/utils.ts`
- Modify: `figubook-app/tsconfig.json` (path alias `@/*`)

- [ ] **Step 1: Aggiungere path alias in tsconfig**

In `figubook-app/tsconfig.json`, dentro `compilerOptions`, aggiungere:
```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

- [ ] **Step 2: Inizializzare shadcn**

Run:
```bash
cd /Users/alessandrogelo/Desktop/FiguBook/figubook-app
npx shadcn@latest init -d
```
Expected: `components.json` + `src/lib/utils.ts` creati, nessun errore.

- [ ] **Step 3: Installare un componente di prova (button)**

Run:
```bash
cd /Users/alessandrogelo/Desktop/FiguBook/figubook-app
npx shadcn@latest add button
```
Expected: `src/components/ui/button.tsx` creato.

- [ ] **Step 4: Verificare build**

Run:
```bash
cd /Users/alessandrogelo/Desktop/FiguBook/figubook-app && npm run build
```
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add figubook-app
git commit -m "feat: init shadcn/ui + componente button"
```

---

## Task 4: Router con le 4 sezioni + login (placeholder)

**Files:**
- Modify: `figubook-app/src/App.tsx`, `figubook-app/src/main.tsx`
- Create: `figubook-app/src/pages/Login.tsx`, `Dashboard.tsx`, `Album.tsx`, `Scambi.tsx`, `Community.tsx`

- [ ] **Step 1: Installare React Router**

Run:
```bash
cd /Users/alessandrogelo/Desktop/FiguBook/figubook-app
npm install react-router-dom
```

- [ ] **Step 2: Creare le 5 pagine placeholder**

Per ognuna (`src/pages/Login.tsx`, `Dashboard.tsx`, `Album.tsx`, `Scambi.tsx`, `Community.tsx`) — esempio Login, replicare cambiando nome e testo:
```tsx
export default function Login() {
  return (
    <main className="min-h-screen grid place-items-center">
      <h1 className="text-4xl font-bold text-accent">Login</h1>
    </main>
  )
}
```
Le altre 4: stesso schema, testo "Dashboard" / "Album" / "Scambi" / "Community".

- [ ] **Step 3: Definire il router in App.tsx**

Sostituire `figubook-app/src/App.tsx`:
```tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Album from '@/pages/Album'
import Scambi from '@/pages/Scambi'
import Community from '@/pages/Community'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/album" element={<Album />} />
      <Route path="/scambi" element={<Scambi />} />
      <Route path="/community" element={<Community />} />
    </Routes>
  )
}
```

- [ ] **Step 4: Montare il router in main.tsx**

Sostituire `figubook-app/src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/FiguBook/app">
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

- [ ] **Step 5: Verificare build**

Run:
```bash
cd /Users/alessandrogelo/Desktop/FiguBook/figubook-app && npm run build
```
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add figubook-app/src
git commit -m "feat: router 4 sezioni + login (placeholder pages)"
```

---

## Task 5: GitHub Actions — build + deploy Pages (sito vecchio + app nuova)

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `figubook-app/public/404.html` (fallback SPA per Pages)

- [ ] **Step 1: Fallback SPA per il routing client**

GitHub Pages non conosce le route React: serve un 404 che rimanda all'app. Creare `figubook-app/public/404.html`:
```html
<!doctype html>
<meta charset="utf-8">
<script>
  // Pages SPA fallback: rimanda tutto a index.html dell'app
  location.replace('/FiguBook/app/');
</script>
```

- [ ] **Step 2: Creare il workflow**

Creare `.github/workflows/deploy.yml`:
```yaml
name: Deploy Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Build React app
        working-directory: figubook-app
        run: |
          npm ci
          npm run build
      - name: Assemble Pages artifact
        run: |
          mkdir -p _site
          # sito vecchio: tutti i file di root tranne app/repo-meta
          rsync -a --exclude figubook-app --exclude _site --exclude .git \
                --exclude .github --exclude docs ./ _site/
          # app nuova sotto /app/
          mkdir -p _site/app
          cp -r figubook-app/dist/* _site/app/
      - uses: actions/upload-pages-artifact@v3
        with:
          path: _site
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Commit**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git add .github/workflows/deploy.yml figubook-app/public/404.html
git commit -m "ci: deploy Pages via Actions (sito vecchio + app /app/)"
```

- [ ] **Step 4: Abilitare Pages = GitHub Actions (una-tantum, UI utente)**

Questo step lo fa l'utente nel browser (non locale):
GitHub → repo FiguBook → Settings → Pages → "Build and deployment" → Source = **GitHub Actions**.
Poi avvisare l'utente: serve questo click una sola volta.

- [ ] **Step 5: Push e verifica deploy**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook
git push
```
Poi: GitHub → tab Actions → workflow "Deploy Pages" verde.
Expected: sito vecchio ancora su `https://<user>.github.io/FiguBook/`, app nuova su `https://<user>.github.io/FiguBook/app/` mostra "Login" lime.

---

## Self-Review

**Spec coverage:**
- Stack (Vite+React+TS+Tailwind+shadcn+Router) → Task 1-4. ✓
- Tema lime/pitch/gold da tokens → Task 2. ✓
- Deploy zero-locale via Actions, mac-independent → Task 5. ✓
- Coesistenza sito vecchio + nuovo (strangler) → Task 5 artifact assembly. ✓
- IA 4 sezioni + login → Task 4 route placeholder. ✓
- framer-motion: NON in step 0 (si aggiunge quando serve motion reale, YAGNI). Annotato.

**Placeholder scan:** gli hex colore in Task 2 Step 3 sono marcati "placeholder, sostituire" e lo Step 2 impone di leggere i valori reali da figubook-tokens.css prima — intenzionale, non un buco.

**Type consistency:** nomi pagine (Login/Dashboard/Album/Scambi/Community) e route coerenti tra Task 4 App.tsx e i file in pages/. basename `/FiguBook/app` coerente con vite base `/FiguBook/app/`. ✓

## Note aperte (non bloccanti per step 0)
- Firebase Auth NON in step 0: Login è solo placeholder visivo. Auth reale = step 1.
- Conferma `base`/`basename` se Pages serve da dominio custom (ora no CNAME → ok `/FiguBook/`).
