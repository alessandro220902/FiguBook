# Step 2 / A1 — App-shell + tubelight nav (design)

Data: 2026-06-18
Skill: brainstorming (design approvato dall'utente). Lente: architect.
Parte di [[migrazione-step0]] → Step 2 Dashboard, sotto-pezzo A1 (shell). Vedi audit [[no-buchi-costruzione-progressiva]].

## Obiettivo
Trasformare le 4 pagine private isolate in una **shell unica** con nav scritta una volta sola (risolve A1 del check scheletro: niente nav copiata 4 volte come il sito vecchio).

## Scope (fetta 1)
DENTRO:
- `components/layout/TubelightNav.tsx` — tubelight-navbar di ayushmxxn (21st) adattata.
- `components/layout/AppLayout.tsx` — cornice: nav + `<Outlet/>`.
- `App.tsx` — rotte annidate: le 4 private dentro UN solo `<ProtectedRoute><AppLayout/></ProtectedRoute>`.

FUORI (deferred, non buchi):
- Top-right cluster (campanella notifiche + avatar/menu Esci) → posto riservato, vuoto ora; si collega in Step 2 col layer dati.
- Nav mobile custom → il componente fa già bottom-bar nativa <768px; si rivede con link utente se serve.
- Contenuto Dashboard (widget) → Step 2 proper.

## Componente sorgente
`tubelight-navbar.tsx` (ayushmxxn, framer-motion + lucide). Deps già presenti: framer-motion ^12, lucide-react, react-router-dom ^7. Nessun install.

## Adattamenti (Next → Vite/React Router)
1. Rimuovere `"use client"` (no Next).
2. `next/link` `<Link href>` → `react-router-dom` `<Link to>`.
3. Stato attivo: da `useState(items[0].name)`+onClick → da `useLocation().pathname` confrontato con `item.url`. Motivo: atterraggio diretto su `/album` deve mostrare Album attivo, non sempre il primo.
4. Tweak colore pill: `bg-background/5` → superfici brand (card/border) per leggibilità del mockup. `--primary` già = lime → attivo + tube-glow già brand.
5. `layoutId="lamp"` (glow spring) TENUTO — è il linguaggio di motion unico (glow lime + spring), coerente con [[componenti-21st-urls]].

## Voci nav (icone lucide per mobile)
- Dashboard → `LayoutDashboard` → `/dashboard`
- Album → `BookOpen` → `/album`
- Scambi → `ArrowLeftRight` → `/scambi`
- Community → `Users` → `/community`

## Comportamento
- Desktop: pill top-center, attivo lime + tube-glow, sincronizzato con rotta.
- Mobile (<768px): bottom-bar con icone (nativo del componente).
- App invariata: le 4 pagine restano, solo incorniciate.

## Verifica (vincolo zero-locale, no test runner)
`npm run build` (typecheck) + `npm run lint` (no nuovi errori miei) + check live dopo deploy: nav visibile, voce attiva seguendo la rotta, navigazione SPA tra le 4 sezioni senza ricarico, ProtectedRoute ancora attivo.

## Self-review spec
- Placeholder: nessuno. Path esatti. Deps verificate. Deferred esplicitati come non-buchi. Comportamento invariato confermato.
