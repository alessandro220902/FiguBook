# Album — redesign full-width + ContainerScroll (A2.4) · Design

**Data:** 2026-06-20
**Stato:** approvato dal design, in attesa review spec

## Obiettivo

Rifondere la pagina `/album/:albumId` in layout **full-width edge-to-edge** con due zone verticali:

1. **Hero statico** (nessun effetto): copertina album + statistiche ad alta leggibilità.
2. **Sezioni con effetto ContainerScroll** (Aceternity/21st): scrollando giù dall'hero verso le sezioni, il blocco editor ruota da `rotateX 20°` a `0°` con scala leggera e un'intestazione che sale, poi resta piatto e pienamente interattivo.

Riferimento effetto: https://21st.dev/community/components/aceternity/container-scroll-animation/default

## Motivazione

- Oggi `Album.tsx` è dentro `max-w-6xl` (contenuto) → l'utente vuole tutta la larghezza.
- Le statistiche in `AlbumLanding` sono semitrasparenti sul gradiente → illeggibili. Vanno rese ad alto contrasto.
- L'utente ha chiesto esplicitamente l'effetto Aceternity sullo scroll verso le sezioni (non all'apertura).

## Comportamento

### Zona 1 — Hero statico
- Full-bleed (rimosso `max-w-6xl`; padding laterale responsivo minimo).
- Copertina album grande (gradiente `entry.c1`/`entry.c2`).
- Pannello statistiche **leggibile**: chip solide `bg-bg-elev` (non semitrasparenti) con numeri grandi e colori pieni:
  - `%` completamento + barra.
  - Possedute / totale.
  - Mancanti.
  - Doppie.
- Bottoni share stub (disabilitati, invariati).
- **Nessun** effetto scroll qui: all'apertura l'utente vede subito copertina + stat.

### Zona 2 — Editor sezioni con ContainerScroll
- Wrapper con `perspective`; `useScroll({ target: ref, offset: ['start end', 'start start'] })` → l'effetto **si completa appena il blocco sezioni raggiunge la cima del viewport**, poi resta piatto.
- Transform durante lo scroll-in:
  - `rotateX`: `20 → 0` (deg)
  - `scale`: `1.04 → 1` (leggera)
  - intestazione (`header`): `translateY` che sale + leggero fade-in.
- Dentro il blocco: l'editor attuale invariato nella logica — `SectionHero` + `AlbumToolbar` + `SectionSidebar` + `StickerGrid` + `StickerInfoOverlay`.
- Una volta piatto (`rotateX 0`): **pienamente interattivo** (tap figurine, sidebar, filtri, toggle inserimento).

### Mobile / reduced-motion
- Su mobile (viewport < `md`, ~768px) **o** `prefers-reduced-motion: reduce`: effetto **disattivato** → il blocco sezioni è statico e piatto fin da subito.
- Motivazione: perf (rotateX su griglia interattiva grande è costoso), a11y (regola reduced-motion del progetto), e su mobile il tilt sprecherebbe spazio verticale.

### Full-width della griglia figurine
- Edge-to-edge: la `StickerGrid` riempie la larghezza **aumentando il numero di colonne** sui monitor larghi, mantenendo le figurine a dimensione usabile (no card ingigantite).
- Implementazione: griglia con colonne responsive che scalano oltre i breakpoint attuali (es. fino a `2xl:grid-cols-12`/auto-fill con min-width carta), così la larghezza si riempie senza perdere leggibilità della singola figurina.

## Componenti (unità isolate)

### `ContainerScroll.tsx` (nuovo, riusabile)
- **Cosa fa:** incapsula l'effetto 3D scroll-linked (Aceternity). Una sola responsabilità.
- **Props:** `header: ReactNode`, `children: ReactNode`, opzionali `className`.
- **Dipende da:** framer-motion (`useScroll`, `useTransform`, `useReducedMotion`), un hook/listener per `isMobile`.
- **Interfaccia:** se mobile o reduced-motion → renderizza `header` + `children` statici (nessun transform). Altrimenti applica `perspective` sul wrapper, `rotateX`/`scale` sul card, `translateY` sull'header, legati a `scrollYProgress`.

### `AlbumLanding.tsx` (rifatto)
- **Cosa fa:** hero statico full-width con copertina + statistiche leggibili. Nessun effetto scroll.
- **Props:** invariate (`entry: AlbumCatalogEntry`, `stats: AlbumStats`).
- **Cambi:** layout full-width; chip statistiche solide ad alto contrasto; copertina più grande.

### `Album.tsx` (orchestrazione)
- **Cosa fa:** compone `<AlbumLanding/>` (statico) + `<ContainerScroll header={…}>{ editor sezioni }</ContainerScroll>`.
- **Cambi:** rimosso `max-w-6xl` → container full-width con padding laterale responsivo; stati loading/errore invariati; logica `useAlbum`/dati invariata.

## Cosa NON cambia
- Logica dati: `useAlbum`, `flushAlbumCounts` (batch B1), schema `{states, counts}`, `loadAlbumData`.
- Componenti editor: `SectionHero`, `AlbumToolbar`, `SectionSidebar`, `StickerCard`, `StickerGrid`, `StickerInfoOverlay` (eventuale solo ritocco colonne griglia per full-width).
- Catalogo, loader, statistiche.

## Rischi / note
- L'effetto rotateX su un blocco interattivo: garantire che a `rotateX 0` non resti `transform`/`will-change` che crei contesti che rompano l'hit-testing (cfr. bug card-stack: `preserve-3d` + transform rompe `elementFromPoint` in Chrome). → quando l'effetto è completo/disattivo, niente `transform` residuo sui figli interattivi.
- `useScroll` con `offset` corretto per evitare che il blocco resti tiltato troppo a lungo.
- Edge-to-edge: testare su ultrawide che le figurine non diventino né minuscole né enormi.

## Testing
- Unit/render: `ContainerScroll` rende `header`+`children`; in reduced-motion non applica transform (mock `useReducedMotion`).
- Manuale: desktop (effetto on scroll), mobile (statico), reduced-motion (statico), interazione figurine dopo flatten, full-width su monitor largo.
- Build + lint verdi, nessun nuovo errore.
