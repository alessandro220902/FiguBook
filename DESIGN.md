# DESIGN.md — FiguBook

Sistema visivo di FiguBook. Documenta lo stato attuale (token già committati) e i
raffinamenti proposti. **Identity-preservation**: i colori brand esistenti restano
l'ancora; si raffina, non si stravolge.

Formato ispirato a Google Stitch DESIGN.md.

---

## 1. Theme

**Scena fisica**: un ragazzo/adulto col pacchetto Panini appena aperto, a casa o sul
divano, luce ambiente normale, mood eccitato di "ce l'ho / mi manca". Vuole marcare
veloce e vedere il progresso. → Tema **chiaro di default**, caldo ma non smielato,
con accent ad alta energia. Disponibili varianti scure/alternative.

Strategia colore: **Restrained+** — neutri caldi tinti + UN accent ad alta saturazione
(lime). Il colore "vero" del calcio entra per-album (gradiente c1/c2 della sezione),
non nello sfondo globale.

Sistema multi-tema già presente via `body[data-variant]`:
- **default** (carta calda + lime) — primario.
- **stadio** (notturno blu + ambra) — modalità scura.
- **streetwear** (off-white + magenta, Space Grotesk).

---

## 2. Colors

Tutti i colori sono **token CSS** in `:root`; le superfici NON devono mai hardcodare
hex — sempre `var(--…)` o `color-mix()` sui token (così le varianti reggono).

### v2 "Campo notturno / Foil" (proposta redesign marcato)
Warmth portata da accent/gold, non dallo sfondo (esce dal "cream AI-default").
Aggiunti due ruoli d'identità: **pitch** (verde campo committed) e **foil** (oro raro).

| Ruolo | Token | Valore v2 | (era) | Uso |
|---|---|---|---|---|
| Background | `--bg` | `#efece4` | `#f4efe6` | sfondo pagina, meno pastello |
| Surface | `--bg-elev` | `#faf7f1` | `#fbf8f1` | card, pannelli, nav |
| Ink | `--ink` | `#121511` | `#14110d` | testo primario, titoli (nero-verde) |
| Ink-2 | `--ink-2` | `#3a3f38` | `#3a342a` | testo secondario |
| Muted | `--muted` | `#6b6f64` | `#8a8275` | terziario — **ora AA** (~5:1) |
| Line | `--line` | `#e1dccf` | `#e3dccd` | bordi sottili |
| Line-strong | `--line-strong` | `#121511` | `#14110d` | divisori forti |
| **Accent** | `--accent` | `#c2f23d` | `#c8ff3d` | azione primaria — lime pennarello |
| Accent ink | `--accent-ink` | `#13160f` | `#14110d` | testo su accent |
| **Pitch** | `--pitch` | `#0e4d39` | *(nuovo)* | hero/brand: campo sotto i riflettori |
| Pitch ink | `--pitch-ink` | `#eafff3` | *(nuovo)* | testo su pitch |
| **Foil / Gold** | `--gold` `--foil` | `#e6b73c` | `#f5b800` | raro / trofeo / completato |
| Warn | `--warn` | `#ff5b2e` | `#ff5b2e` | mancante / errore |
| Good | `--good` | `#1f9c63` | `#1f8a5b` | disponibile / successo |

Uso: accent = azioni/evidenza (≤15% superficie). Pitch = hero, header brand, stati
"in corso", momenti identitari. Foil = solo rarità/completamento (parsimonia → resta speciale).

### Per-album (identità della collezione)
Ogni sezione/album espone `--c1` / `--c2` usati come gradiente dell'hero. È il punto in
cui entra il "colore della squadra/competizione". Restano vincolati a testo bianco con
contrasto verificato.

### Nota contrasto (da correggere nel redesign)
- `--muted` `#8a8275` su `--bg` `#f4efe6` ≈ 3.4:1 → **sotto AA per corpo**. Alzare verso
  l'ink (`#6f685b` ≈ 4.6:1) per testo piccolo; tenere il grigio chiaro solo per testo
  ≥18px/bold.
- Stati "ho/manca/doppia": **mai solo colore** → sempre con icona o etichetta (daltonismo).

---

## 3. Typography

Coppie su asse di contrasto (display grottesco + serif + mono), non font simili.

| Ruolo | Famiglia | Token | Uso |
|---|---|---|---|
| Display | **Bricolage Grotesque** (400–800, opsz) | `--f-display` | titoli, numeri grandi, hero |
| Body | **Geist** (300–700) | `--f-body` | testo, UI, label |
| Mono | **Geist Mono** (400–600) | `--f-mono` | dati, codici figurina, kicker funzionali, stat label |
| Serif accent | **Instrument Serif** (italic) | `--f-serif` | tocco editoriale, enfasi "ma non per molto…" in hero benvenuto |

Regole:
- Display letter-spacing **≥ -0.04em** (floor). Tight grotesque: -0.02/-0.03em.
- `clamp()` hero **max ≤ 6rem (96px)**; in app UI tenersi ~40–58px.
- `text-wrap: balance` su h1–h3; `pretty` su prosa.
- Corpo 45–75ch di larghezza riga.
- Numeri: `font-variant-numeric: tabular-nums` su statistiche/contatori.

Scala tipografica proposta (rem, base 15–16px):
`12 · 13 · 14 · 16 · 18 · 22 · 28 · 36 · 46 · 58`

---

## 4. Spacing

Nessuna scala formale oggi (px ad hoc). **Adottare scala 4px**:

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 56 · 72`

- Gutter sezione: 24–32. Padding card: 20–24. Gap griglie figurine: 8–12.
- Variare lo spazio per ritmo (sezioni respirate, contenuto denso solo nella griglia figurine).

---

## 5. Border-radius

| Token | Valore | Uso |
|---|---|---|
| `--radius` | `14px` | card, input, bottoni |
| `--radius-lg` | `22px` | pannelli grandi, hero |
| (pill) | `999px` | tag, chip, nav-tab, avatar |

Tetto card **12–16px** (no over-rounding 24/28/32+). Pill solo per tag/bottoni/chip.

---

## 6. Shadows

Filosofia: **depth contenuta, niente ghost-card**. Mai `border 1px + box-shadow ≥16px`
sullo stesso elemento come decorazione a riposo.

Scala proposta (token-aware, si tinge dell'ink del tema):
```css
--shadow-sm: 0 1px 2px color-mix(in srgb, var(--ink) 12%, transparent);
--shadow-md: 0 4px 12px -6px color-mix(in srgb, var(--ink) 22%, transparent);
--shadow-lg: 0 12px 28px -12px color-mix(in srgb, var(--ink) 30%, transparent); /* solo overlay/hover */
```
- A riposo: bordo `--line`, nessuna o minima ombra.
- Elevazione (hover, dropdown, modal): ombra definita, una sola, non border+blur largo.
- Temi scuri: l'elevazione si fa con bordo/lume, non con drop-shadow nero (invisibile).

---

## 7. Motion

- Easing d'uscita esponenziale: `cubic-bezier(0.22, 1, 0.36, 1)`. **No bounce/elastic.**
- Durate: 130ms (micro), 240ms (transizioni), 400–560ms (entrate).
- **Animare solo `transform`/`opacity`** — mai `width`/`height`/`min-height`/`padding`
  (jank). Per le barre di progresso usare `transform: scaleX()` con `transform-origin:left`.
- Staggering legittimo dentro una lista; evitare il "reflex" identico su ogni sezione.
- `@media (prefers-reduced-motion: reduce)` obbligatorio (già nel layer impeccable).

---

## 8. Components (convenzioni)

- **Nav**: sticky, blur leggero, brand-mark ruotato, `.nav-tab` pill (attiva = ink/accent).
- **Card** (`.panel`, `.album-mini`, `.qstat`): superficie `--bg-elev`, bordo `--line`,
  radius `--radius`. Hover = bordo accent, non lift decorativo.
- **Bottoni**: `.btn` (neutro), `.btn-accent`/`.cta` (azione primaria, fondo accent).
  Target ≥44px. Stati: hover, active, focus-visible (ring accent), disabled.
- **Chip/tag**: pill, mono o body 13px.
- **Stato figurina**: pattern condiviso ho/manca/doppia → colore + icona + etichetta.
- **Hero album**: gradiente `--c1/--c2`, testo bianco, niente gradient-text decorativo.
- **z-index scale semantica**: dropdown 100 · sticky 200 · backdrop 300 · modal 400 ·
  toast 500 · tooltip 600 (no 999/9999).

---

## 9. Bans attivi (da rispettare e correggere)

- ❌ Gradient text (`background-clip:text` + gradiente) — presente negli hero album.
- ❌ Side-stripe border (`border-left/right >1px` accent) — presente in `.friend-card`.
- ❌ Animazione di proprietà di layout (`width`/`min-height`/`padding`).
- ❌ Eyebrow maiuscoletto tracked su ogni sezione; numerazione 01/02/03 di default.
- ❌ Over-rounding card; ghost-card (border+ombra larga); glassmorphism decorativo.
