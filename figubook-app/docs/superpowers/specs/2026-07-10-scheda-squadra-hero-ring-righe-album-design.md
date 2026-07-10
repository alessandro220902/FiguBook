# Scheda squadra — ring nell'hero + righe album azionabili

Data: 2026-07-10
Stato: approvato dal founder (1 = ring hero, 2 = barre+click righe).

## Problema

1. **Hero mezzo vuoto**: metà destra del gradiente è spazio morto; il dato-chiave
   (progresso squadra) è sepolto in fondo alla pagina.
2. **Righe album piatte + vicolo cieco**: la lista "compare in" è solo testo
   `titolo ..... %`, senza gerarchia visiva e non cliccabile. Vedi il % e non puoi agire.

## Obiettivo

1. Ring di completamento squadra nell'hero (destra), sopra il gradiente.
2. Righe album: mini-barra colorata + link all'album, ordinate per % decrescente.

Fuori scope: crest (già fatto), anagrafica, altro.

## 1. Ring nell'hero

Nuovo componente `src/components/album/TeamHeroRing.tsx` — ring compatto pensato
per stare SUL gradiente colorato (niente card/surface).

```ts
function TeamHeroRing({ pct, have, total }: { pct: number; have: number; total: number }): JSX.Element
```

- SVG 84×84, r=34, come `HeroRing` (stroke traccia `rgba(255,255,255,0.18)`,
  arco `#ffffff` pieno — bianco per stare su qualsiasi colore squadra, non pctColor).
- Testo pct al centro bianco. Sotto/accanto: `have/total` piccolo bianco/80.
- `strokeDashoffset` con la stessa transizione 0.8s.
- Nessun bordo/background: trasparente, drop-shadow leggero come il crest.

In `Squadra.tsx`, l'header diventa:
```tsx
<div className="relative z-10 flex items-center justify-between gap-4">
  <div className="flex items-center gap-4">
    <TeamCrest ... />
    <h1 ...>{teamDisplayName(id)}</h1>
  </div>
  {!progress.loading && progress.total > 0 && (
    <TeamHeroRing pct={progress.pct} have={progress.have} total={progress.total} />
  )}
</div>
```
- Il ring appare solo se la squadra è nei tuoi album (`total > 0`); altrimenti hero
  com'è ora (nessun ring, nessun vuoto forzato).
- Responsive: ring `shrink-0`; su mobile resta (84px entra accanto al titolo; se
  troppo stretto il titolo va a capo, accettabile).

Il blocco "I tuoi progressi" sotto **resta** (barra + lista): il ring è il colpo
d'occhio, la sezione sotto il dettaglio. La barra grande + "79/110" restano.

## 2. Righe album azionabili

Nella sezione "I tuoi progressi", la lista `appearsIn`:

- **Ordinamento**: per `pct` decrescente (completi in alto, 0% in fondo). Ordinare
  una copia in `Squadra.tsx` (non mutare l'array del risultato).
- **Ogni riga = `<Link to={`/album/${x.albumId}`}>`** (route esistente).
- Layout riga: titolo (sinistra, truncate) · **mini-barra** flessibile ·
  `pct%` (destra). Barra: contenitore `h-1.5 rounded-full bg-black/30`,
  riempimento `width: pct%`, `background: pctColor(pct)` (già importato).
- Stato hover: leggero (`hover:bg-white/[0.03] rounded-lg`), transizione, per
  segnalare cliccabilità. Padding riga per area click comoda.

Nota chiavi: `appearsIn` ha `albumId`, `albumTitle`, `sectionName`, `pct`. La key
attuale è `${albumId}-${sectionName}`: mantenerla.

## Testing

- `TeamHeroRing`: render → presenza `<svg>`, testo pct, `have/total`.
- Logica sort: assert che una lista non ordinata esca per pct desc (test puro se si
  estrae un helper; altrimenti verifica manuale — è un `.slice().sort()`).
- Righe: presenza `<a href="/album/...">` per ogni album; barra con width/pct.
- Regressione: tsc + build + suite album verdi.

## Rischi

- **Contrasto ring su hero chiaro**: squadre con c1 chiaro (es. Parma bianco) →
  arco bianco poco leggibile. Mitigazione: la traccia scura `rgba(255,255,255,0.18)`
  + drop-shadow; se serve, arco con leggero `filter drop-shadow`. Accettabile: la
  maggior parte dei gradienti kit ha profondità scura (`kitGradient` scende a `deep`).
- **Righe come Link dentro una sezione**: assicurarsi che non rompano il layout flex
  esistente; usare `flex items-center gap-3` sul Link.
