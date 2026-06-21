# Redesign sezione Album — Supabase + lime brand + Outfit

Data: 2026-06-21
Stato: design approvato (direzione), in attesa review spec

## Obiettivo

Redesign **mirato** (non completo) delle due viste album, carattere minimalista, fresco, giovane.
Ispirazione tema **Supabase** (tweakcn): superfici scure neutre + accento verde. Reconciliato col
brand FiguBook (lime + pitch). Font **Outfit** scoped alla sola sezione album (reversibile).

Logica, dati, funzioni (collezione, increment/decrement, filtri, condivisione) **non si toccano**.
Solo layout, carattere, bottoni, gerarchia, spaziature.

## Scope

In scope:
- `src/pages/AlbumList.tsx` — vista lista album (`/album`)
- `src/pages/Album.tsx` — vista singolo album (`/album/:id`)
- `src/components/album/*` — AlbumLanding, SectionSidebar, SectionHero, StickerGrid, StickerCard,
  StickerInfoOverlay, ContainerScroll
- Token estetici album-scoped in `src/index.css`

Fuori scope: dashboard, login, community, scambi, navbar globale. Nessuna modifica a hook/db/data.

## Decisioni di design

### Tema (album-scoped)
- Superfici **neutre Supabase** (grigi freddi) al posto del gradiente squadra che annega:
  - card `oklch(0.2046 0 0)`, muted `oklch(0.2393 0 0)`, border `oklch(0.2809 0 0)`,
    muted-foreground `oklch(0.7122 0 0)`
  - bg pagina resta brand (`--color-bg`)
- **Accento = lime brand** `#c2f23d` (azione/stato). Verde pitch per superfici-accento dove serve.
  Niente verde Supabase puro come primario: l'azione resta lime (identità).
- Stat: `--color-stat-have` / `--color-stat-missing` invariati.
- Radius **0.5rem** (più crisp del 2xl attuale), ombre tenui Supabase.
- **Colore squadra** non sparisce: diventa accento (spina/spine) invece che fondale.

### Carattere (album-scoped, reversibile)
- `--font-sans` override a **Outfit** dentro un wrapper `.album-theme` sulle due pagine album.
  Outfit caricato via `@import` esistente in `index.css`.
- **Barlow Condensed** resta per i numeroni tabular (%, conteggi).
- **Geist Mono** uppercase 11px tracking-wide per micro-label (editor·season, label stat).
- Resto app continua su Geist (nessuna modifica globale).

### Sistema bottoni (trasversale, base di tutto)
4 varianti riusate ovunque nella sezione:
- **Primary** — fill lime, testo lime-ink, `active:scale(0.97)`, transition transform 150ms ease-out
- **Ghost** — bordo neutro (`border`), hover `bg muted`, azioni secondarie ("Apri", condivisione)
- **Stepper** — 32px touch target (già stabilito), +/− icona, count Barlow tabular
- **Segmented** (filtri sezione) — pill Geist Mono uppercase 11px, attivo = bg lime + testo lime-ink

Regole Emil applicate: solo transform/opacity, ease-out custom, durate <300ms, press feedback su
ogni elemento premibile, niente animazioni su azioni da tastiera.

### Vista lista (AlbumTile)
- Via gradiente squadra + overlay scuro (murky). Nuova tile su superficie **neutra card**:
  - **spina colore squadra** sottile a sinistra (4px) — identifica senza annegare
  - **% gigante** Barlow tabular (eroe del dato) in alto a destra
  - titolo **Outfit** medium, `editor · season` mono micro
  - progress: barra **lime 1.5px** (non bianca su nero)
  - 3 stat inline (Possedute/Mancanti/Doppie): label mono uppercase tiny + valore tabular
  - hover lift -2px + accent lime; press scale 0.98
- Stati loading/error/empty: riallineati al nuovo stile (skeleton neutro, ghost button retry).

### Vista singolo — hero (AlbumLanding)
- Più editoriale, più aria:
  - titolo grande **Outfit**, `editor·season` mono
  - **% come numero eroe** (Barlow) a destra, niente anello carico
  - Mancanti/Doppie come **ghost button** rapidi (condivisione, funzione invariata)
  - gerarchia via dimensione/peso, non riquadri

### Vista singolo — pannello sezioni
Impianto sticky **mantenuto** (funziona, niente regressioni). Solo rifinitura:
- Sidebar (SectionSidebar): item attivo = **tick lime + bg sottile** (muted), superfici neutre
- Hero sezione (SectionHero): banda colore sezione **più calma**, filtri come **Segmented**
- Griglia/card (StickerGrid/StickerCard): card piena colore squadra resta (decisione esistente —
  stato via luminosità/icona non da hue); rifinitura cornici/spaziature al nuovo radius
- StickerInfoOverlay: superfici neutre, bottoni dal nuovo sistema

## Ordine di costruzione (no buchi, pezzo per pezzo, ognuno testato)

1. Token album-scoped + wrapper `.album-theme` + Outfit (base)
2. Sistema bottoni (Primary/Ghost/Stepper/Segmented)
3. Vista lista — AlbumTile + stati
4. Vista singolo — hero AlbumLanding
5. Vista singolo — pannello (sidebar, section hero, grid, overlay)

Ogni pezzo: build + test esistenti verdi + verifica browser reale (hit-testing) prima del successivo.

## Vincoli / rischi

- **Reversibilità**: Outfit e superfici neutre scoped a `.album-theme` → si tolgono cambiando un wrapper.
- **Coerenza**: accetto island tipografica album (scelta utente: provare solo qui).
- **Regressioni**: test esistenti (AlbumLanding, ContainerScroll, StickerCard) devono restare verdi.
- **Cache-bust**: bump `?v=N` su asset locali modificati.
- **Skill estetiche**: implementazione richiama `minimalist-ui` + `emil-design-eng`.

## Non-goal

- Nessun cambio a dashboard/login/altre sezioni.
- Nessun refactor di logica/db/data.
- Nessuna nuova funzione (solo restyle di ciò che c'è).
