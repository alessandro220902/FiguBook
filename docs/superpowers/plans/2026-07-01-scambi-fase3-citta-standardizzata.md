# Scambi Fase 3 — Città standardizzata — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendere affidabile "Vicino a me" (match stessa città) rendendo il campo Città un autocomplete su dataset comuni italiani che salva un valore canonico `"Nome (PROV)"`.

**Architecture:** Dataset comuni bundlato (compatto). Modulo puro `searchComuni`/`isValidComune` testato. Componente `CittaPicker` (input + dropdown) usato nel Profilo. Validazione in `saveProfileAccount` per non salvare città non canoniche. Nessuna coordinata/GPS/distanza.

**Tech Stack:** React 18, Vite, TS, Firebase Firestore, Vitest, Tailwind, lucide-react.

Spec: `docs/superpowers/specs/2026-07-01-scambi-fase3-citta-standardizzata-design.md`

---

## File Structure
- Create: `src/data/comuni-it.ts` — dataset generato `[nome, prov][]` + helper `comuneLabel`.
- Create: `src/lib/geo/searchComuni.ts` (+ `.test.ts`) — `searchComuni(query, max)`, `isValidComune(value)`.
- Create: `src/components/profile/CittaPicker.tsx` — input con dropdown suggerimenti.
- Modify: `src/pages/Profilo.tsx` — sostituisce l'input città con `<CittaPicker>`.
- Modify: `src/lib/db/profile.ts` — valida città canonica in `saveProfileAccount`.

---

## Task 1: Generare il dataset comuni

**Files:**
- Create: `src/data/comuni-it.ts`

- [ ] **Step 1: Scaricare la fonte ISTAT pubblica**

Run (dalla root del repo):
```bash
curl -s "https://raw.githubusercontent.com/matteocontrini/comuni-json/master/comuni.json" -o /tmp/comuni-src.json
node -e "const c=require('/tmp/comuni-src.json'); console.log(c.length)"
```
Expected: stampa `7904` (o numero simile > 7000).

- [ ] **Step 2: Generare `src/data/comuni-it.ts` dal sorgente**

Run:
```bash
node -e '
const c = require("/tmp/comuni-src.json");
const rows = c
  .map(x => [String(x.nome), String(x.sigla)])
  .filter(([n, p]) => n && p)
  .sort((a, b) => a[0].localeCompare(b[0], "it"));
const body =
  "// GENERATO da comuni-json (ISTAT). Non modificare a mano; rigenerare.\n" +
  "// Ogni voce: [nome, siglaProvincia]. Etichetta canonica = comuneLabel().\n" +
  "export const COMUNI: ReadonlyArray<readonly [string, string]> = " +
  JSON.stringify(rows) + " as const\n\n" +
  "export function comuneLabel(nome: string, prov: string): string {\n" +
  "  return nome + \" (\" + prov + \")\"\n" +
  "}\n";
require("fs").writeFileSync("figubook-app/src/data/comuni-it.ts", body);
console.log("written", rows.length, "comuni");
'
```
Expected: `written 7904 comuni` (o simile). Il file `figubook-app/src/data/comuni-it.ts` esiste.

- [ ] **Step 3: Typecheck**

Run: `cd figubook-app && npx tsc -b --noEmit`
Expected: 0 errori.

- [ ] **Step 4: Commit**

```bash
git add figubook-app/src/data/comuni-it.ts
git commit -m "feat(geo): dataset comuni italiani (nome+provincia) generato da ISTAT"
```

---

## Task 2: Modulo puro searchComuni + isValidComune

**Files:**
- Create: `src/lib/geo/searchComuni.ts`
- Test: `src/lib/geo/searchComuni.test.ts`

- [ ] **Step 1: Scrivere il test**

Create `src/lib/geo/searchComuni.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { searchComuni, isValidComune } from './searchComuni'

describe('searchComuni', () => {
  it('trova per prefisso, case-insensitive', () => {
    const r = searchComuni('rom', 8)
    expect(r.some((c) => c.label === 'Roma (RM)')).toBe(true)
  })
  it('i match per prefisso vengono prima dei contains', () => {
    const r = searchComuni('mila', 8)
    expect(r[0].label.toLowerCase().startsWith('mila')).toBe(true)
  })
  it('rispetta il cap max', () => {
    expect(searchComuni('a', 5).length).toBeLessThanOrEqual(5)
  })
  it('query vuota => nessun risultato', () => {
    expect(searchComuni('  ', 8)).toEqual([])
  })
})

describe('isValidComune', () => {
  it('true sul valore canonico', () => {
    expect(isValidComune('Roma (RM)')).toBe(true)
  })
  it('false su testo libero o vuoto', () => {
    expect(isValidComune('roma')).toBe(false)
    expect(isValidComune('Xyzville')).toBe(false)
    expect(isValidComune('')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test, verifica fallimento**

Run: `cd figubook-app && npx vitest run src/lib/geo/searchComuni.test.ts`
Expected: FAIL ("Cannot find module './searchComuni'").

- [ ] **Step 3: Implementare il modulo**

Create `src/lib/geo/searchComuni.ts`:
```ts
import { COMUNI, comuneLabel } from '@/data/comuni-it'

export interface ComuneHit { nome: string; prov: string; label: string }

// Set delle etichette canoniche per validazione O(1).
const CANONICAL = new Set(COMUNI.map(([n, p]) => comuneLabel(n, p)))

// Ricerca per prefisso (poi contains), case-insensitive, cap a `max`.
export function searchComuni(query: string, max: number): ComuneHit[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const prefix: ComuneHit[] = []
  const contains: ComuneHit[] = []
  for (const [nome, prov] of COMUNI) {
    const low = nome.toLowerCase()
    if (low.startsWith(q)) prefix.push({ nome, prov, label: comuneLabel(nome, prov) })
    else if (low.includes(q)) contains.push({ nome, prov, label: comuneLabel(nome, prov) })
    if (prefix.length >= max) break
  }
  return [...prefix, ...contains].slice(0, max)
}

// True se `value` è un'etichetta canonica esistente ("Nome (PROV)").
export function isValidComune(value: string): boolean {
  return CANONICAL.has(value)
}
```

- [ ] **Step 4: Run test, verifica pass**

Run: `cd figubook-app && npx vitest run src/lib/geo/searchComuni.test.ts`
Expected: PASS (6 test).

- [ ] **Step 5: Commit**

```bash
git add figubook-app/src/lib/geo/searchComuni.ts figubook-app/src/lib/geo/searchComuni.test.ts
git commit -m "feat(geo): searchComuni + isValidComune (puro, testato)"
```

---

## Task 3: Componente CittaPicker

**Files:**
- Create: `src/components/profile/CittaPicker.tsx`

- [ ] **Step 1: Creare il componente**

Create `src/components/profile/CittaPicker.tsx`:
```tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { MapPin, X } from 'lucide-react'
import { searchComuni } from '@/lib/geo/searchComuni'

const inputCls =
  'w-full rounded-xl border border-white/[0.1] bg-surface px-3.5 py-3 text-[16px] text-ink outline-none transition-colors placeholder:text-ink-2 focus:border-lime'

interface Props {
  value: string                 // etichetta canonica salvata, es. "Roma (RM)" o ''
  onChange: (v: string) => void
}

// Autocomplete comuni: si seleziona SOLO dal dropdown (nessun testo libero salvato).
export function CittaPicker({ value, onChange }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  const hits = useMemo(() => (open ? searchComuni(query, 8) : []), [query, open])

  // Chiudi cliccando fuori.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  // Città già selezionata: mostro una "pill" con la X per cambiarla.
  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-surface px-3.5 py-3">
        <MapPin className="h-4 w-4 shrink-0 text-lime" />
        <span className="min-w-0 flex-1 truncate text-[16px] text-ink">{value}</span>
        <button
          type="button"
          aria-label="Cambia città"
          onClick={() => { onChange(''); setQuery(''); setOpen(true) }}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-ink-2 hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div ref={boxRef} className="relative">
      <input
        className={inputCls}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Cerca il tuo comune…"
        autoComplete="off"
      />
      {open && hits.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-white/[0.1] bg-card p-1 shadow-2xl">
          {hits.map((h) => (
            <li key={h.label}>
              <button
                type="button"
                onClick={() => { onChange(h.label); setOpen(false); setQuery('') }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-ink hover:bg-white/[0.05]"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-2" />
                <span className="truncate">{h.nome}</span>
                <span className="ml-auto shrink-0 text-xs text-ink-2">{h.prov}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `cd figubook-app && npx tsc -b --noEmit`
Expected: 0 errori.

- [ ] **Step 3: Commit**

```bash
git add figubook-app/src/components/profile/CittaPicker.tsx
git commit -m "feat(profile): CittaPicker autocomplete comuni"
```

---

## Task 4: Integrare CittaPicker nel Profilo

**Files:**
- Modify: `src/pages/Profilo.tsx`

- [ ] **Step 1: Import del componente**

In cima a `src/pages/Profilo.tsx` aggiungere:
```ts
import { CittaPicker } from '@/components/profile/CittaPicker'
```

- [ ] **Step 2: Sostituire l'input città**

Trovare il blocco (label "Città"):
```tsx
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LBL}>Città</span>
          <input
            className={inputCls}
            value={citta}
            onChange={(e) => setCitta(e.target.value)}
            placeholder="Es. Milano"
            maxLength={40}
          />
        </label>
```
e sostituirlo con:
```tsx
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LBL}>Città</span>
          <CittaPicker value={citta} onChange={setCitta} />
        </label>
```

- [ ] **Step 3: Typecheck + build**

Run: `cd figubook-app && npx tsc -b --noEmit && npm run build`
Expected: 0 errori tsc; build ok (eventuale warning chunk-size accettato).

- [ ] **Step 4: Commit**

```bash
git add figubook-app/src/pages/Profilo.tsx
git commit -m "feat(profile): campo Città usa CittaPicker (autocomplete comuni)"
```

---

## Task 5: Validazione città canonica in saveProfileAccount

**Files:**
- Modify: `src/lib/db/profile.ts`

- [ ] **Step 1: Import isValidComune**

In cima a `src/lib/db/profile.ts` aggiungere:
```ts
import { isValidComune } from '@/lib/geo/searchComuni'
```

- [ ] **Step 2: Validare la città nel clean**

Nel corpo di `saveProfileAccount`, trovare:
```ts
    citta: patch.citta?.trim() || '',
```
e sostituire con:
```ts
    // Solo comuni canonici ("Nome (PROV)"); testo non valido -> città non impostata.
    citta: isValidComune((patch.citta ?? '').trim()) ? patch.citta!.trim() : '',
```

- [ ] **Step 3: Typecheck + test**

Run: `cd figubook-app && npx tsc -b --noEmit && npx vitest run`
Expected: 0 errori; tutti i test verdi.

- [ ] **Step 4: Commit**

```bash
git add figubook-app/src/lib/db/profile.ts
git commit -m "feat(profile): salva solo città canonica (comune valido)"
```

---

## Task 6: Verifica finale + push

- [ ] **Step 1: Suite completa**

Run:
```bash
cd figubook-app && npx tsc -b --noEmit && npm run lint 2>&1 | grep -c "error" && npx vitest run && npm run build
```
Expected: tsc 0 errori; `0` (nessun errore lint); test verdi; build ok.

- [ ] **Step 2: Verifica manuale**

Checklist:
- [ ] Profilo → campo Città: digito "Rom" → dropdown mostra "Roma" con "RM" a destra → seleziono → compare pill "Roma (RM)".
- [ ] Salvo il profilo → ricarico → la città resta "Roma (RM)".
- [ ] La X sulla pill riapre la ricerca.
- [ ] Secondo account con stessa città "Roma (RM)" → Scambi, chip "Vicino a me" attivo → l'utente compare (match affidabile).
- [ ] Digitare testo non valido e salvare (se possibile) NON salva testo libero (città resta vuota).

- [ ] **Step 3: Push**

```bash
cd /Users/alessandrogelo/Desktop/FiguBook && git push origin main
```

---

## Self-review (coperture spec)
- Dataset comuni {nome, prov} bundlato → Task 1.
- searchComuni + isValidComune puri testati → Task 2.
- CittaPicker autocomplete, no testo libero, pill+X → Task 3.
- Profilo usa CittaPicker → Task 4.
- Validazione canonica in saveProfileAccount → Task 5.
- "Vicino a me" invariato (match esatto su valore ora canonico) → nessuna modifica codice, verificato in Task 6.
- Migrazione: nessun auto-fix (utente riseleziona) → coerente, nessun task.
- publicProfiles/tradeIndex: il mirror usa `clean.citta` già canonico → nessuna modifica.
