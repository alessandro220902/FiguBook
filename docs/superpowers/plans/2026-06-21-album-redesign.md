# Album Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ridisegnare le due viste album (lista + singolo) con stile Supabase neutro + accento lime brand + font Outfit, scoped alla sola sezione album e reversibile.

**Architecture:** Tema scoped via classe `.album-theme` che ridefinisce i CSS custom properties di superficie (Supabase neutro) e `--font-sans` (Outfit) per i soli sottoalberi album. I componenti tengono le stesse classi Tailwind (`bg-bg-elev`, `text-ink-2`, `text-muted-foreground`…): cambiano solo i valori dei token sotto lo scope. Layout/bottoni rifatti componente per componente. Logica/dati invariati.

**Tech Stack:** React 19, Vite, Tailwind v4 (`@theme`), TypeScript, Vitest + Testing Library, lucide-react, framer-motion.

**Convenzioni di sessione (memoria utente):**
- Dopo **ogni** task: commit **e push su `main`** (no chiedere). Commit message in coda: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Skill estetiche da richiamare in implementazione: `minimalist-ui` + `emil-design-eng`.
- Costruzione progressiva: chiudere un task (build verde + test verdi) prima del successivo. Niente regressioni trascinate.
- Cache-bust `?v=N`: **non applicabile** qui (Vite fa hashing degli asset in build). Nessuna azione.

**Comandi:**
- Test mirato: `npm test -- <path>` (es. `npm test -- src/components/album/ui/Button.test.tsx`)
- Tutti i test: `npm test`
- Build: `npm run build`
- Dev (verifica visiva): `npm run dev` → apri `/album` e `/album/<id>`

---

## File Structure

- `src/index.css` — Modify: aggiungi import Outfit + blocco `.album-theme` (token scoped)
- `src/components/album/ui/Button.tsx` — Create: `AlbumButton` (variant primary|ghost)
- `src/components/album/ui/Button.test.tsx` — Create: test del bottone
- `src/pages/AlbumList.tsx` — Modify: wrapper `.album-theme`, `AlbumTile` ridisegnata, retry button
- `src/pages/Album.tsx` — Modify: wrapper `.album-theme` su `<main>`
- `src/components/album/AlbumLanding.tsx` — Modify: hero editoriale, share button via `AlbumButton`
- `src/components/album/SectionHero.tsx` — Modify: filtri segmented coerenti
- `src/components/album/SectionSidebar.tsx` — Modify: item attivo con tick lime
- `src/components/album/StickerInfoOverlay.tsx` — Modify: rifinitura radius/bottoni (superfici neutre ereditate)
- `src/components/album/StickerCard.tsx` — **Invariato di proposito** (card piena colore squadra è decisione esistente; stato via luminosità/icona). Nessun task.

Test esistenti da mantenere verdi: `AlbumLanding.test.tsx`, `StickerCard.test.tsx`, `ContainerScroll.test.tsx`.

---

## Task 0: Tema album-scoped (Supabase neutro + Outfit)

**Files:**
- Modify: `src/index.css:1` (import font) e nuovo blocco dopo `body { ... }` (~riga 41)
- Modify: `src/pages/AlbumList.tsx` (classe wrapper)
- Modify: `src/pages/Album.tsx` (classe wrapper)

- [ ] **Step 1: Aggiungi Outfit all'`@import` font**

In `src/index.css` riga 1, dentro l'URL Google Fonts esistente, aggiungi `&family=Outfit:wght@400;500;600;700` prima di `&display=swap`. Risultato (riga 1 completa):

```css
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700;800&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&family=Instrument+Serif:ital@0;1&family=Outfit:wght@400;500;600;700&display=swap');
```

- [ ] **Step 2: Aggiungi il blocco `.album-theme`**

In `src/index.css`, subito dopo la regola `body { ... }` (dopo la riga `}` che chiude `body`, ~riga 41), inserisci:

```css
/* Sezione Album — tema scoped (Supabase neutro + Outfit). Reversibile: togli la
   classe .album-theme dai wrapper e tutto torna ai token brand. Override dei soli
   CSS custom properties di superficie => i componenti tengono le stesse classi. */
.album-theme {
  --font-sans: 'Outfit', system-ui, sans-serif;
  /* superfici neutre (tema Supabase, dark) */
  --color-bg-elev: oklch(0.2046 0 0);
  --color-surface: oklch(0.2603 0 0);
  --color-muted: oklch(0.2393 0 0);
  --color-ink-2: oklch(0.7122 0 0);
  --color-muted-foreground: oklch(0.7122 0 0);
  --muted-foreground: oklch(0.7122 0 0);
  --border: oklch(0.2809 0 0);
  font-family: var(--font-sans);
}
```

- [ ] **Step 3: Applica `.album-theme` alla vista lista**

In `src/pages/AlbumList.tsx`, il return principale (riga ~24) ha il root `<div className="mx-auto w-full max-w-[88rem]">`. Aggiungi `album-theme` (anche nel ramo loading, riga ~12, per coerenza):

```tsx
// ramo loading (riga ~12)
<div className="album-theme mx-auto w-full max-w-[88rem]">
// return principale (riga ~24)
<div className="album-theme mx-auto w-full max-w-[88rem]">
```

- [ ] **Step 4: Applica `.album-theme` alla vista singolo**

In `src/pages/Album.tsx` riga 83, il `<main>`:

```tsx
<main className="album-theme w-full px-4 pb-16 pt-6 sm:px-6 lg:px-8">
```

- [ ] **Step 5: Build di verifica**

Run: `npm run build`
Expected: build OK, nessun errore TS/CSS.

- [ ] **Step 6: Verifica visiva**

Run: `npm run dev` → apri `/album` e `/album/<id>`.
Expected: testo in Outfit nelle due viste; superfici (riquadri stat, sidebar) grigio neutro invece che verde-scuro; lime invariato; resto app (dashboard/login) invariato.

- [ ] **Step 7: Commit + push**

```bash
git add src/index.css src/pages/AlbumList.tsx src/pages/Album.tsx
git commit -m "feat(album): tema scoped Supabase neutro + Outfit (.album-theme)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

---

## Task 1: Sistema bottoni — `AlbumButton`

**Files:**
- Create: `src/components/album/ui/Button.tsx`
- Test: `src/components/album/ui/Button.test.tsx`

- [ ] **Step 1: Scrivi il test (fallisce)**

`src/components/album/ui/Button.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AlbumButton } from './Button'

describe('AlbumButton', () => {
  it('rende children e gestisce il click', async () => {
    const onClick = vi.fn()
    render(<AlbumButton onClick={onClick}>Apri</AlbumButton>)
    await userEvent.click(screen.getByRole('button', { name: 'Apri' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('primary usa fill lime, ghost usa bordo', () => {
    const { rerender } = render(<AlbumButton variant="primary">P</AlbumButton>)
    expect(screen.getByRole('button')).toHaveClass('bg-lime')
    rerender(<AlbumButton variant="ghost">G</AlbumButton>)
    expect(screen.getByRole('button')).toHaveClass('border')
  })

  it('disabled non chiama onClick', async () => {
    const onClick = vi.fn()
    render(<AlbumButton disabled onClick={onClick}>X</AlbumButton>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    await userEvent.click(btn).catch(() => {})
    expect(onClick).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Esegui il test, verifica che fallisca**

Run: `npm test -- src/components/album/ui/Button.test.tsx`
Expected: FAIL — `Cannot find module './Button'`.

- [ ] **Step 3: Implementa `AlbumButton`**

`src/components/album/ui/Button.tsx`:

```tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost'

export interface AlbumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

// Base bottoni sezione album. Press feedback (scale 0.97, transform-only, ease-out
// <300ms) seguendo le regole di design-engineering (Emil): solo transform/opacity.
const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ' +
  'transition-transform duration-150 ease-out active:scale-[0.97] ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime ' +
  'disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-lime text-lime-ink hover:brightness-105',
  ghost: 'border border-border bg-transparent text-ink hover:bg-muted',
}

export function AlbumButton({ variant = 'primary', className = '', children, ...rest }: AlbumButtonProps) {
  return (
    <button className={`${BASE} ${VARIANTS[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}
```

- [ ] **Step 4: Esegui il test, verifica che passi**

Run: `npm test -- src/components/album/ui/Button.test.tsx`
Expected: PASS (3 test).

- [ ] **Step 5: Commit + push**

```bash
git add src/components/album/ui/Button.tsx src/components/album/ui/Button.test.tsx
git commit -m "feat(album): AlbumButton (primary/ghost) con press feedback

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

---

## Task 2: Vista lista — `AlbumTile` ridisegnata

**Files:**
- Modify: `src/pages/AlbumList.tsx` (funzione `AlbumTile` riga 50-93, nuovo helper `TileStat`, retry button riga 30, import)

- [ ] **Step 1: Importa `AlbumButton`**

In testa a `src/pages/AlbumList.tsx`, dopo gli import esistenti:

```tsx
import { AlbumButton } from '@/components/album/ui/Button'
```

- [ ] **Step 2: Sostituisci il retry button (riga ~30)**

Da:

```tsx
<button type="button" onClick={retry} className="mt-5 rounded-lg bg-lime px-5 py-2.5 text-sm font-medium text-lime-ink transition-transform duration-150 hover:-translate-y-px active:scale-95">
  Riprova
</button>
```

A:

```tsx
<AlbumButton type="button" onClick={retry} className="mt-5">Riprova</AlbumButton>
```

- [ ] **Step 3: Sostituisci `AlbumTile` (riga 50-93) e aggiungi `TileStat`**

```tsx
function AlbumTile({ a }: { a: PerAlbumStats }) {
  const { entry } = a
  return (
    <Link
      to={`/album/${a.id}`}
      className="group relative flex overflow-hidden rounded-lg border border-border bg-bg-elev transition-transform duration-150 ease-out hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime"
      aria-label={`Apri ${entry.title} — ${a.pct}% completo`}
    >
      {/* Spina colore squadra: identifica senza annegare la card */}
      <span aria-hidden className="w-1 shrink-0" style={{ background: `linear-gradient(${entry.c1}, ${entry.c2})` }} />
      <div className="min-w-0 flex-1 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-[11px] uppercase tracking-wide text-ink-2">{entry.editor} · {entry.season}</div>
            <h2 className="mt-1 truncate text-lg font-semibold tracking-tight text-ink">{entry.title}</h2>
          </div>
          <div className="shrink-0 font-display text-4xl font-bold leading-none tabular-nums text-ink">
            {a.pct}<span className="text-xl text-ink-2">%</span>
          </div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-lime transition-[width] duration-500" style={{ width: `${Math.max(2, a.pct)}%` }} />
        </div>

        <div className="mt-4 flex items-end justify-between">
          <dl className="flex gap-5">
            <TileStat label="Possedute" value={`${a.have}`} sub={`/ ${a.total}`} />
            <TileStat label="Mancanti" value={`${a.missing}`} />
            <TileStat label="Doppie" value={`${a.doubles}`} />
          </dl>
          <span className="text-sm font-medium text-ink-2 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-lime">Apri →</span>
        </div>
      </div>
    </Link>
  )
}

function TileStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-wide text-ink-2">{label}</dt>
      <dd className="mt-0.5 font-display text-lg font-bold tabular-nums text-ink">
        {value}{sub && <span className="text-sm font-medium text-ink-2"> {sub}</span>}
      </dd>
    </div>
  )
}
```

- [ ] **Step 4: Aggiorna lo skeleton tile (riga ~16)**

Lo skeleton usa `h-44` (card alte gradiente). Riduci a card neutre più basse:

```tsx
<div key={i} className="h-36 animate-pulse rounded-lg bg-bg-elev" />
```

- [ ] **Step 5: Build + test**

Run: `npm run build && npm test`
Expected: build OK; tutti i test verdi (AlbumList non ha test propri; gli altri non toccati).

- [ ] **Step 6: Verifica visiva**

Run: `npm run dev` → `/album`.
Expected: tile neutre con spina colore a sinistra, % grande Barlow, progress lime sottile, 3 stat con label mono. Hover: lift + "Apri →" lime. Stati loading/error coerenti.

- [ ] **Step 7: Commit + push**

```bash
git add src/pages/AlbumList.tsx
git commit -m "feat(album): tile lista neutra con spina colore squadra e % Barlow

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

---

## Task 3: Vista singolo — hero `AlbumLanding`

**Files:**
- Modify: `src/components/album/AlbumLanding.tsx` (JSX return riga 44-92, `ShareButton` riga 96-108, `Stat` riga 110-120, import)
- Test (mantieni verde): `src/components/album/AlbumLanding.test.tsx`

> **Vincolo test:** `AlbumLanding.test.tsx` richiede che compaiano il titolo, almeno un nodo testo `"60%"`, e i nodi `"400"`, `"270"`, `"12"`. Mantieni il numero hero come **nodo unico** `{stats.pct}%` (non splittare `%` in uno span) e i valori `Stat` come testo iniziale del nodo.

- [ ] **Step 1: Importa `AlbumButton`**

In testa al file, dopo gli import esistenti:

```tsx
import { AlbumButton } from './ui/Button'
```

- [ ] **Step 2: Sostituisci il JSX della `<section>` (riga 44-92)**

```tsx
  return (
    <section className="relative w-full">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-stretch">
        {/* Copertina */}
        <div
          className="relative aspect-[3/4] overflow-hidden rounded-lg border border-border lg:aspect-auto lg:min-h-[20rem]"
          style={{ backgroundImage: sectionGradient(entry.c1, entry.c2) }}
        >
          <div aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.05) 55%, transparent 100%)' }} />
          <div className="absolute inset-x-0 bottom-0 p-6">
            <div className="font-mono text-[11px] uppercase tracking-wide text-white/80">{entry.editor} · {entry.season}</div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white drop-shadow sm:text-4xl">{entry.title}</h1>
          </div>
        </div>

        {/* Pannello statistiche: numero eroe + barra + stat + condivisione */}
        <div className="flex flex-col justify-center gap-6">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wide text-ink-2">Completamento</div>
            <div className="mt-1 font-display text-6xl font-bold leading-none tabular-nums text-ink">{stats.pct}%</div>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-lime transition-[width] duration-500" style={{ width: `${stats.pct}%` }} />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <Stat label="Possedute" value={`${stats.have}`} sub={`/ ${stats.total}`} tone="have" />
            <Stat label="Mancanti" value={`${stats.missing}`} tone="missing" />
            <Stat label="Doppie" value={`${stats.doubles}`} />
          </div>

          <div className="flex flex-wrap gap-3">
            <ShareButton label="Condividi doppie" disabled={doubleCodes.length === 0} onClick={() => share('doubles', doubleCodes)} />
            <ShareButton label="Condividi mancanti" disabled={missingCodes.length === 0} onClick={() => share('missing', missingCodes)} />
          </div>
        </div>
      </div>

      {toast && (
        <div role="status" className="pointer-events-none absolute bottom-0 left-0 flex items-center gap-2 rounded-lg border border-lime/30 bg-bg-elev px-4 py-2.5 text-sm font-medium text-ink shadow-lg">
          <Check size={16} className="text-lime" /> {toast}
        </div>
      )}
    </section>
  )
```

- [ ] **Step 3: Sostituisci `ShareButton` (riga 96-108)**

```tsx
function ShareButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <AlbumButton variant="ghost" onClick={onClick} disabled={disabled} title={disabled ? 'Niente da condividere' : label}>
      <Share2 size={16} /> {label}
    </AlbumButton>
  )
}
```

- [ ] **Step 4: Sostituisci `Stat` (riga 110-120) — niente più riquadro pieno**

```tsx
function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'have' | 'missing' }) {
  const color = tone === 'have' ? 'text-stat-have' : tone === 'missing' ? 'text-stat-missing' : 'text-ink'
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-wide text-ink-2">{label}</div>
      <div className={`mt-1 whitespace-nowrap font-display text-3xl font-bold tabular-nums ${color}`}>
        {value}{sub && <span className="text-base font-medium text-ink-2"> {sub}</span>}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Esegui il test AlbumLanding, verifica verde**

Run: `npm test -- src/components/album/AlbumLanding.test.tsx`
Expected: PASS (titolo, `60%`, `400`, `270`, `12` presenti).

- [ ] **Step 6: Build + verifica visiva**

Run: `npm run build` poi `npm run dev` → `/album/<id>`.
Expected: hero più editoriale, numero % grande, barra lime, 3 stat senza riquadri pesanti, due ghost button condivisione con press feedback.

- [ ] **Step 7: Commit + push**

```bash
git add src/components/album/AlbumLanding.tsx
git commit -m "feat(album): hero AlbumLanding editoriale, share via AlbumButton

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

---

## Task 4: Vista singolo — pannello sezioni (SectionHero, SectionSidebar, StickerInfoOverlay)

**Files:**
- Modify: `src/components/album/SectionHero.tsx` (filtri + toggle, riga 36-56)
- Modify: `src/components/album/SectionSidebar.tsx` (item attivo, riga 51-71)
- Modify: `src/components/album/StickerInfoOverlay.tsx` (radius, riga 32 e 46/49)

- [ ] **Step 1: SectionHero — filtri segmented coerenti (riga 36-56)**

Sostituisci il blocco `<div className="mt-4 flex flex-wrap items-center gap-2"> … </div>` con:

```tsx
        {/* Filtri segmented + toggle inserimento, dentro il banner */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {TABS.map((t) => {
            const active = filter === t.key
            return (
              <button key={t.key} type="button" onClick={() => onFilter(t.key)} aria-pressed={active}
                className={[
                  'rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-transform duration-150 ease-out active:scale-[0.97]',
                  active ? 'bg-lime text-lime-ink' : 'border border-white/25 bg-black/40 text-white hover:bg-black/55',
                ].join(' ')}>
                {t.label} <span className="opacity-70">{t.n(stats)}</span>
              </button>
            )
          })}
          <button type="button" onClick={onToggleInsert} aria-pressed={insertOn}
            className={[
              'ml-auto rounded-lg px-5 py-1.5 text-sm font-semibold transition-transform duration-150 ease-out active:scale-[0.97]',
              insertOn ? 'bg-lime text-lime-ink' : 'border border-white/25 bg-black/40 text-white hover:bg-black/55',
            ].join(' ')}>
            Inserimento rapido {insertOn ? 'ON' : 'OFF'}
          </button>
        </div>
```

(Il banner sezione resta a gradiente colore-sezione: è l'identità della sezione. Cambiano solo i controlli: radius `lg` coerente, attivo = lime, press feedback. Niente più `shadow`/glow incoerenti.)

- [ ] **Step 2: SectionSidebar — tick lime su item attivo (riga 51-71)**

Importa `Check` in testa al file:

```tsx
import { Check } from 'lucide-react'
```

Sostituisci il `<button>` dell'item (riga 55-70) con (aggiunge il tick lime quando attivo):

```tsx
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onSelect(s.id)}
                    style={active ? sectionVars(s.c1, s.c2) : undefined}
                    className={[
                      'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-transform duration-150 ease-out active:scale-[0.99]',
                      active
                        ? 'bg-[linear-gradient(100deg,color-mix(in_srgb,var(--t1)_36%,transparent),color-mix(in_srgb,var(--t2)_22%,transparent))] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--t1)_50%,transparent)]'
                        : 'hover:bg-surface',
                    ].join(' ')}
                  >
                    <span className="h-6 w-6 shrink-0 rounded-md border border-white/15" style={{ backgroundImage: sectionGradient(s.c1, s.c2) }} />
                    <span className="text-sm">{s.name}</span>
                    {active && <Check size={14} className="shrink-0 text-lime" strokeWidth={3} />}
                    <span className="ml-auto text-right text-[10px] leading-tight text-muted-foreground">{st.have}/{st.total}<br />{st.pct}%</span>
                  </button>
```

(Nota: rimosso `font-display` dal nome sezione → eredita Outfit dallo scope. Il titolo "Sezioni" alla riga 36 può restare `font-display` o passare a default; lascialo invariato.)

- [ ] **Step 3: StickerInfoOverlay — radius coerente (riga 32, 46, 49→51)**

- Riga 32: `rounded-2xl` → `rounded-lg` nel `className` del `<dialog>`.
- Riga 33: la cover `<div className="relative h-40 w-full" …>` resta (colore sezione, decisione esistente).
- Riga 46: bottone meno `rounded-lg` resta ok.
- Riga 51: bottone Aggiungi `rounded-lg` resta ok.

Modifica solo riga 32:

```tsx
    <dialog ref={ref} onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose() }}
      className="m-auto w-[min(92vw,360px)] rounded-lg border border-white/10 bg-bg-elev p-0 text-ink backdrop:bg-black/60">
```

(Le superfici neutre sono già ereditate da `.album-theme`: l'overlay è discendente DOM di `<main class="album-theme">`, quindi `bg-bg-elev` è già neutro.)

- [ ] **Step 4: Build + test completi**

Run: `npm run build && npm test`
Expected: build OK; tutti i test verdi (`StickerCard.test`, `AlbumLanding.test`, `ContainerScroll.test` inclusi).

- [ ] **Step 5: Verifica visiva**

Run: `npm run dev` → `/album/<id>`, apri una sezione, cambia filtri, toggle inserimento, apri info di una figurina.
Expected: filtri segmented attivo=lime con press feedback; sidebar item attivo con tick lime; overlay info su superficie neutra, radius coerente; griglia/card figurine invariate (colore squadra).

- [ ] **Step 6: Commit + push**

```bash
git add src/components/album/SectionHero.tsx src/components/album/SectionSidebar.tsx src/components/album/StickerInfoOverlay.tsx
git commit -m "feat(album): pannello sezioni — filtri segmented, tick lime sidebar, overlay neutro

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

---

## Task 5: Verifica finale end-to-end

**Files:** nessuno (solo verifica).

- [ ] **Step 1: Suite completa**

Run: `npm test`
Expected: tutti i file di test verdi.

- [ ] **Step 2: Build di produzione**

Run: `npm run build`
Expected: OK, nessun errore.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: nessun nuovo errore introdotto dai file toccati.

- [ ] **Step 4: Walkthrough visivo completo**

Run: `npm run dev`. Verifica nell'ordine:
1. `/album` — griglia tile neutre, hover/press, stati loading/error/empty
2. `/album/<id>` — hero, pannello sticky, sidebar, filtri, inserimento rapido, overlay info
3. `/dashboard` e `/login` — invariati (nessun bleed del tema album)

Expected: coerenza minimalista Outfit+lime su album; resto app intatto.

- [ ] **Step 5: Niente da committare**

Se i task precedenti sono già committati e pushati, qui non resta nulla. Se la verifica ha richiesto fix, committa con messaggio descrittivo e `git push origin main`.

---

## Self-Review (autore del piano)

**Spec coverage:**
- Tema Supabase neutro + lime + Outfit scoped → Task 0 ✓
- Sistema bottoni (Primary/Ghost) → Task 1 ✓; Stepper → invariato (già 32px/coerente in StickerCard); Segmented → Task 4 Step 1 ✓
- Lista tile (spina colore, % Barlow, progress lime, stat mono) → Task 2 ✓
- Hero editoriale (% eroe, ghost share) → Task 3 ✓
- Pannello (sidebar tick, section hero segmented, overlay neutro, grid invariata) → Task 4 ✓
- Reversibilità (`.album-theme`) → Task 0 ✓
- No regressioni (test esistenti verdi) → vincoli espliciti in Task 3 + verifiche Task 4/5 ✓

**Placeholder scan:** nessun TBD/TODO; ogni step di codice ha il codice completo.

**Type consistency:** `AlbumButton` (props `variant`, `children`, `...rest`) usato identico in AlbumList (Task 2) e AlbumLanding (Task 3). `TileStat` definito e usato in Task 2. `sectionGradient`/`sectionVars` invariati (firma `(c1, c2)`).
