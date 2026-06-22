# Dashboard coverflow deck — effetto feature-carousel

Data: 2026-06-22

## Obiettivo

Sostituire il carosello album della dashboard (`AlbumDeck`, oggi basato su
`CardStack` a ventaglio) con l'effetto del componente 21st "feature-carousel":
3 card visibili (precedente / attiva / successiva), centro pieno e lati che
sbucano dietro. Su mobile la card centrale deve mostrare tutto il contenuto
senza ritagli.

## Engine (transform model, da feature-carousel)

Per ogni card, stato calcolato da diff normalizzato rispetto all'attiva:
`active | prev | next | hidden`.

- **active**: `x 0, scale 1, rotate 0, opacity 1, zIndex 20, pointer-events auto`
- **prev**: `x −Δ, scale 0.85, rotate −3°, opacity 0.4, zIndex 10`
- **next**: `x +Δ, scale 0.85, rotate +3°, opacity 0.4, zIndex 10`
- **hidden**: `opacity 0, pointer-events none`

`Δ` responsivo: `min(110, larghezza · 0.28)`. Transizione spring framer-motion
(`stiffness ~260, damping ~25`). `prefers-reduced-motion` → niente animazione
molla (snap).

Diff normalizzato (loop circolare):
```
let d = index - activeIndex
if (d >  len/2) d -= len
if (d < -len/2) d += len
// d === 0 active, -1 prev, 1 next, altrimenti hidden
```

## "Entra tutto"

I lati hanno `zIndex` minore e `scale 0.85` → restano dietro e non coprono il
contenuto della centrale. La card centrale ha **altezza automatica** sul
contenuto (nessuna altezza fissa che tagli stat/percentuale).

## Card centrale (ridisegno contenuto)

- Sfondo: gradiente album `linear-gradient(145deg, c1 0%, c2 100%)` + scrim
  contrasto (come `DeckCard` attuale) per testo bianco ≥4.5:1.
- **In alto a destra**: percentuale completamento `{pct}%`.
- **Nome** album (titolo) prominente.
- **Sotto il nome**: `Possedute / Totale` (es. `545 / 886`) e **Doppie** accanto.
- Barra progresso sottile sotto la frazione (tenue, bianca; oro se completo).
- Rimossi: editor/stagione, bottone "Apri →".

## Interazione tap/swipe

- Tap su card **laterale** (prev/next) → diventa attiva (centra), **non** apre.
- Tap su card **attiva** → naviga a `/album/:id` **solo** se tap vero
  (spostamento puntatore < 8px tra pointerdown e pointerup). Durante drag/swipe
  non naviga.
- Swipe/drag orizzontale sulla card attiva → prev/next (soglia drag standard).
- Implementazione guard: ref `movedPx` aggiornato in `onDrag`/pointer move;
  in `onClick` della card attiva apri solo se `movedPx < 8`.

## Comportamento invariato

- Autoplay 4500ms; pausa-su-hover + bottone pausa (Play/Pause lucide).
- Dots in basso (stile FiguBook attuale), indicano indice attivo.
- Loop circolare.

## File

- Riscrivo `src/components/dashboard/AlbumDeck.tsx`: engine coverflow inline
  (framer-motion) + `DeckCard` con nuovo contenuto.
- Elimino `src/components/ui/card-stack.tsx` (orfano: unico consumer era
  `AlbumDeck`; nessun test lo referenzia).

## Test (TDD, vitest + @testing-library)

- Render N album → N card presenti; card attiva ha `aria-current`/marker e %
  visibile; frazione `Possedute / Totale` e Doppie presenti.
- Tap su card laterale → cambia indice attivo (non naviga: nessun cambio rotta).
- Tap su card attiva (senza drag) → naviga a `/album/:id` (Link/onClick chiamato).
- Dots: numero pari agli album; click dot cambia attivo.
- Autoplay in pausa quando `userPaused`/hover (verifica che il bottone pausa
  alterni lo stato; l'avanzamento temporizzato si può testare con fake timers).

## Fuori scope

- Variante "split" con lista chip verticale del componente originale (usiamo
  solo l'effetto delle card di destra).
- Persistenza indice tra navigazioni.
