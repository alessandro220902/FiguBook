# Team Kit — Identità visiva squadra (Fase A)

Data: 2026-07-09
Stato: approvato per implementazione

## Contesto e posizionamento

FiguBook è un'app di collezionismo **solo sportivo**. Le app generaliste (francobolli,
monete, carte) devono restare visivamente neutre. FiguBook no: l'identità squadra è il
vantaggio competitivo. Obiettivo: essere *il top* per chi colleziona sport — le figurine
e le sezioni devono *sentirsi* della squadra, non anonime.

Oggi ogni sezione album ha due colori piatti `c1/c2` scelti a mano nel JSON
(`src/data/albums/*.ts`). Problemi:

- Colori generici e duplicati: Bologna, Cagliari e Genoa condividono `#a01d2e/#1a4a8b`;
  Torino è due marroni piatti; ecc. Non rispecchiano i veri colori sociali.
- Nessuna identità oltre al gradiente: una maglia a strisce e una tinta unita rendono
  identiche a colpo d'occhio.

## Obiettivo Fase A

Unificare **accuratezza colore** (ex proposta 1) e **identità visiva** (ex proposta 4) in
un'unica struttura dati + motore: il **Team Kit**. Colori fedeli per tutte le squadre +
pattern-maglia *sottile* dove è iconico. Testo sempre contrasto AA. Zero regressioni via
fallback.

Fuori scope Fase A (spec separati):
- **Fase B** — badge "Nuovo" su album/sezioni fresche.
- **Fase C** — scheda squadra arricchita (stemma grande, città, trivia, silhouette/foto
  stadio). Nota: foto stadi reali hanno rischio licenze → in Fase C si parte dalla
  **silhouette line-art SVG** (sicura, on-brand), non da foto d'agenzia.

## Decisioni prese

- **Intensità pattern: sottile.** Appena percettibile dietro il gradiente, sotto il testo.
  Riconoscibile ma mai rumoroso. Rischio slop minimo. Testo sempre AA.
- **Pattern solo dove iconico.** Default `solid` (gradiente pulito, come oggi). Curare le
  ~15 squadre con maglia riconoscibile, non inventare pattern per tutte le 60.
- **Stadio rimandato a Fase C.** In Fase A il visivo lo danno kit colori + pattern (+ crest
  già esistente).

## Modello dati

`src/lib/album/teamKits.ts` — punto di verità unico.

```ts
export type KitPattern = 'solid' | 'stripes' | 'halves' | 'sash' | 'hoops'

export interface TeamKit {
  c1: string        // colore sociale primario (hex)
  c2: string        // colore sociale secondario (hex)
  accent?: string   // terzo colore opzionale (bordo/dettaglio)
  pattern: KitPattern
  foil?: boolean    // lamina su elementi speciali (default false)
}

// chiave = team-key normalizzato (vedi mapping)
export const KITS: Record<string, TeamKit>
```

Note:
- `pattern: 'solid'` ⇒ nessun layer pattern, solo gradiente (comportamento odierno).
- `accent` usato per bordi/dettagli, non per lo sfondo principale.
- Direzione strisce non è configurabile in Fase A: `stripes` = verticali,
  `hoops` = orizzontali, `sash` = banda diagonale, `halves` = due metà. Sufficiente per le
  maglie iconiche di Serie A.

## Motore colore

Estende `src/lib/album/color.ts` (le firme attuali `sectionGradient`/`ownedInkIsDark`
restano per retrocompatibilità finché non migrati tutti i call site).

- `kitGradient(kit: TeamKit): string` — gradiente identità dal kit (equivalente a
  `sectionGradient(kit.c1, kit.c2)` per `solid`).
- `kitPattern(kit: TeamKit): string | undefined` — layer CSS `background` sottile per il
  pattern (repeating-linear-gradient per `stripes`/`hoops`, linear per `halves`/`sash`),
  opacità bassa + `mix-blend-overlay`. Ritorna `undefined` per `solid`.
- `ownedInkIsDark(kit: TeamKit): boolean` — invariato nella logica (media luminanza c1/c2),
  firma adattata al kit. Garantisce contrasto AA del testo sulle tile possedute.

L'applicazione compone: gradiente di base + (se presente) layer pattern sopra, testo sopra
ancora con inchiostro AA.

## Mapping kit ↔ sezioni

Stessa squadra può avere `section.id` diverso tra album (es. `inter` vs `inter-fc`).

- `kitForSection(section): TeamKit` — normalizza `section.id`/`section.name` verso il
  team-key canonico (riusa gli id di `src/lib/teams.ts`), cerca in `KITS`.
- **Fallback:** se nessun kit corrisponde (sezioni non-squadra: Introduzione, Speciali,
  leghe; oppure squadra non ancora curata), deriva un kit al volo da `section.c1/c2` con
  `pattern: 'solid'`. Riproduce **esattamente** il rendering odierno.

Conseguenza: migrazione squadra-per-squadra, nessun big-bang, zero rotture.

## Punti di applicazione

Tutti leggono lo stesso kit via `kitForSection`:

- `src/components/album/StickerCard.tsx` — sfondo figurine possedute (gradiente + pattern
  sottile). Mantiene il velo foil doppie già presente sopra il kit.
- `src/components/album/SectionHero.tsx` — hero sezione.
- `src/components/album/SectionSidebar.tsx` — chip/gradiente voce attiva.
- `src/components/album/StickerInfoOverlay.tsx` — header overlay.
- `TeamCrest` / `teamStyle.ts` — allineati al kit se rilevante.

## Testing

- `src/lib/album/teamKits.test.ts` (nuovo):
  - ogni kit ha `c1`/`c2`/`accent` hex validi;
  - `pattern` è un valore ammesso;
  - `ownedInkIsDark` coerente col kit (nessun testo bianco su gradiente chiaro).
- `src/lib/album/color.test.ts` (nuovo o esteso):
  - `kitGradient` output atteso;
  - `kitPattern` ⇒ `undefined` per `solid`, stringa non vuota per gli altri;
  - fallback da `c1/c2` produce kit `solid` con gradiente identico a `sectionGradient`.
- `src/components/album/StickerCard.test.tsx` (esistente, 5 test) — adattato al kit,
  restano verdi.

## Consegna Fase A

1. `teamKits.ts` — struttura + colori fedeli per tutte le squadre Serie A (Calciatori
   24/25 e 25/26) + ~15 pattern iconici.
2. `color.ts` esteso (`kitGradient` / `kitPattern` / `ownedInkIsDark` da kit) + fallback.
3. `kitForSection` con mapping + fallback.
4. Applicato a StickerCard, SectionHero, SectionSidebar, StickerInfoOverlay.
5. Test verdi, `tsc -b --noEmit` e `npm run build` puliti.
6. Cache-bust asset se necessario.

## Note di processo

- **Skill estetiche obbligatorie in implementazione:** il lavoro grafico (pattern, gradienti,
  contrasto, hero) invoca `design-taste-frontend` + audit `impeccable`. Carattere
  minimalista, no slop IA, tema Midnight Gold (near-black + oro).
- Contrasto testo sempre verificato AA (regola StickerCard esistente).
- Tap target ≥44px invariato.
- Commit+push su main dopo ogni modifica; `git add` con path espliciti (mai `-A` da root).

## Rischi

- **Slop pattern:** mitigato da intensità sottile + solo squadre iconiche + audit impeccable.
- **Contrasto su maglie chiare:** coperto da `ownedInkIsDark` + test dedicati.
- **Scope creep colori:** curare Serie A prima; altre leghe/nazionali restano su fallback
  finché non curate.
</content>
