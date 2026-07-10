# Team Kit — Fase C2: crest squadra (fedeltà colori + monogramma)

Data: 2026-07-10
Stato: approvato dal founder, pronto per il piano.

## Problema

La scheda `/squadra/:teamId` usa i colori **generati** (`team.c1/c2` da `TEAMS`),
non il **kit curato** (`KITS`). Risultato: Atalanta esce blu/grigio piatto invece
del blu/nero a righe curato. In-album l'hero è corretto (`kitForSection`), sulla
scheda no → identità incoerente tra le due superfici.

In più il crest (`TeamCrest`) è uno scudo generico diviso in due metà piatte:
nessun marchio di identità, debole su una pagina che è "identità squadra".

Vincolo legale: niente stemmi/loghi ufficiali (marchi + copyright dei club).
Costruiamo un crest **nostro**: colori sociali + pattern maglia + monogramma.

## Obiettivo

1. **Fedeltà colori**: la scheda usa lo stesso kit curato di SectionHero.
2. **Crest riconoscibile**: pattern maglia dentro lo scudo + monogramma (1 lettera).

Fuori scope (task separati, non ora): barre/click sulle righe album, ring nell'hero.

## Componenti

### 1. Risoluzione kit curato per la scheda

La scheda già carica le sezioni degli album dell'utente via `useTeamProgress`
(`sectionsMap`). Si ricava il kit curato trovando una sezione che matcha la
squadra e passandola a `kitForSection`.

- Matching: prima sezione con `canonicalTeamId(section) === id`
  (stesso criterio con cui la scheda/hook già aggregano la squadra).
- Da quella sezione: `kitForSection(section)` → `TeamKit` curato.
- **Fallback**: finché le sezioni non sono caricate, o se nessuna matcha
  (es. squadra non negli album dell'utente), usa `kitFromColors(team.c1, team.c2)`.
  Nessun flash: l'hero rende subito col fallback e passa al curato quando arriva.

Implementazione: estendere `useTeamProgress` per esporre anche la `section`
matchata (o direttamente il `TeamKit` risolto). Il criterio di match esiste già
dentro `aggregateTeamProgress`; si espone il primo `Section` che contribuisce.
Nessuna mappa manuale, nessun caricamento duplicato.

Firma proposta (additiva, retro-compatibile):
```ts
interface TeamProgress extends TeamProgressResult {
  loading: boolean
  kit?: TeamKit  // curato, se una sezione dell'utente matcha la squadra
}
```

### 2. `TeamCrest` ridisegnato — props additive, NON breaking

Firma retro-compatibile: si tengono `c1/c2`, si aggiungono opzionali.
```ts
function TeamCrest({
  c1,
  c2,
  accent,       // opz: colore banda per 'sash'
  pattern,      // opz: KitPattern, default 'halves' (= comportamento attuale)
  monogram,     // opz: 1 lettera maiuscola; se assente non si disegna testo
  className,
}): JSX.Element
```

Default (nessun `pattern`/`monogram`) = scudo diviso in due metà come oggi →
gli 8 call-site esistenti (chip favTeam in ProfileChip/Home/Community/Profilo/
ProfiloPubblico) restano invariati, nessuna regressione. Solo `Squadra.tsx`
passa `pattern`, `accent` e `monogram`.

Dentro lo scudo (clipPath esistente), pattern replicato in SVG:
- `solid`  → riempimento pieno c1.
- `stripes`→ righe verticali (c1/c2 alternate).
- `hoops`  → righe orizzontali (c1/c2 alternate).
- `halves` → due metà (sinistra c1, destra c2) — mantiene lo split attuale come caso.
- `sash`   → banda diagonale (accent ?? c2) su fondo c1.

Sopra il pattern: **monogramma** centrato, `font-family` serif (display dell'app),
`font-weight` bold. Colore inchiostro da `inkForKit(kit).isDark ? DARK_INK : LIGHT_INK`.
Bordo scudo: mantiene lo stroke bianco tenue attuale.

Nota: i pattern in `color.ts` (`kitPattern`) sono CSS background, non riusabili in
SVG; il crest ridisegna gli stessi disegni con primitive SVG (rect/path). La logica
di scelta pattern resta il campo `kit.pattern` (unica fonte).

Monogramma derivato dal chiamante: prima lettera del nome display, maiuscola.

### 3. `Squadra.tsx`

- Kit: `const kit = progress.kit ?? kitFromColors(team.c1, team.c2)`.
- Hero: `kitGradient(kit)` + `kitPattern(kit)` (già così, ora col kit curato).
- Crest:
  ```tsx
  <TeamCrest
    c1={kit.c1} c2={kit.c2} accent={kit.accent} pattern={kit.pattern}
    monogram={teamDisplayName(id).charAt(0).toUpperCase()}
    className="h-16 w-16 drop-shadow-md sm:h-20 sm:w-20"
  />
  ```

## Altri call-site di `TeamCrest`

Nessuna modifica: firma additiva, i default riproducono lo scudo attuale.
Gli 8 chip favTeam (ProfileChip, Home, Community, Profilo ×3, ProfiloPubblico,
SectionHero) restano com'è.

## Testing

- `TeamCrest`: render per ogni `pattern` (solid/stripes/hoops/halves/sash) — snapshot
  o assert su presenza elementi (rect righe, path sash, testo monogramma).
- Inchiostro monogramma: assert `inkForKit` scelto correttamente su kit chiaro vs scuro.
- Risoluzione kit: `aggregateTeamProgress`/hook espone la section corretta per un
  set di album fixture; fallback quando nessuna sezione matcha.
- Regressione: tsc + build + suite album esistente verdi.

## Rischi

- **Match sezione**: garantire che sia lo stesso criterio dell'aggregazione, così
  il kit mostrato è della squadra giusta (no mismatch con la %).
- **Contrasto monogramma** su pattern a due colori: `inkForKit` valuta i colori del
  kit; su pattern con metà bianca/scura potrebbe servire un leggero drop-shadow sul
  testo (come già sul testo hero) per leggibilità garantita.
