# Onboarding profilo post-verifica Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dopo la verifica email, portare il nuovo utente su una pagina `/onboarding` che raccoglie il comune (obbligatorio) + CAP/squadra/avatar (opzionali, con microcopy), saltabile, con un banner perenne in Home finché manca il comune.

**Architecture:** Due stati sul profilo privato: `cap` (privato, mai pubblico) e `onboarded` (ha visto l'onboarding). Il completamento è derivato = comune valido (`isValidComune(citta)`). `ProtectedRoute` reindirizza a `/onboarding` solo se `!hasComune && !onboarded`. Banner in Home visibile finché `!hasComune`. Si riusano i picker esistenti, estraendo `TeamPicker` e `AvatarModal` da `Profilo.tsx` in file condivisi.

**Tech Stack:** React + react-router-dom, Firebase Firestore, Vitest.

---

## File Structure

- `src/lib/db/profile.ts` — +campi `cap`/`onboarded` su `ProfileDoc`; +`isValidCap`, `saveProfilePrivate`, `markOnboarded`
- `src/lib/db/profile.test.ts` — test `isValidCap` (nuovo file test se non esiste)
- `src/lib/profile/status.ts` — `hasComune`, `needsOnboarding`, `showCompleteBanner`
- `src/lib/profile/status.test.ts` — test dei tre helper
- `src/components/profile/TeamPicker.tsx` — estratto da Profilo.tsx
- `src/components/profile/AvatarModal.tsx` — estratto da Profilo.tsx
- `src/pages/Profilo.tsx` — rimuove le definizioni locali, importa i due estratti
- `src/pages/Onboarding.tsx` — nuova pagina onboarding
- `src/components/home/CompleteProfileBanner.tsx` — banner
- `src/pages/Home.tsx` — monta il banner
- `src/components/ProtectedRoute.tsx` — gate onboarding
- `src/App.tsx` — rotta `/onboarding`

---

## Task 1: Data layer — campi cap/onboarded + helper di salvataggio

**Files:**
- Modify: `src/lib/db/profile.ts`
- Test: `src/lib/db/profile.test.ts`

- [ ] **Step 1: Scrivi il test che fallisce**

Crea `src/lib/db/profile.test.ts` (usa doppi apici per stringhe con apostrofo):

```ts
import { describe, expect, it } from 'vitest'
import { isValidCap } from './profile'

describe('isValidCap', () => {
  it('accetta 5 cifre', () => {
    expect(isValidCap('00184')).toBe(true)
  })
  it('accetta stringa vuota (CAP opzionale)', () => {
    expect(isValidCap('')).toBe(true)
    expect(isValidCap('   ')).toBe(true)
  })
  it('rifiuta lunghezze o caratteri errati', () => {
    expect(isValidCap('123')).toBe(false)
    expect(isValidCap('123456')).toBe(false)
    expect(isValidCap('abcde')).toBe(false)
  })
})
```

- [ ] **Step 2: Esegui il test per vederlo fallire**

Run: `cd figubook-app && npx vitest run src/lib/db/profile.test.ts`
Expected: FAIL — `isValidCap` non esportata.

- [ ] **Step 3: Aggiungi campi e helper in `profile.ts`**

In `ProfileDoc` (dopo `favTeam?: string`, prima di `isPublic?`):

```ts
  // CAP privato (mai in publicProfiles). 5 cifre o assente.
  cap?: string
  // true = l'utente ha già visto l'onboarding (anche se l'ha saltato).
  onboarded?: boolean
```

In cima al file, dopo gli import, aggiungi l'helper puro:

```ts
// CAP valido = esattamente 5 cifre, oppure vuoto (è opzionale).
export function isValidCap(cap: string): boolean {
  const c = cap.trim()
  return c === '' || /^\d{5}$/.test(c)
}
```

In fondo al file (dopo `saveProfileAccount`/`savePrivacy`), aggiungi i due helper che scrivono
SOLO sul doc privato `meta/profile` (niente publicProfiles):

```ts
// Salva campi privati dell'onboarding (cap/onboarded) senza toccare publicProfiles.
// Il CAP viene validato: se non valido, non viene scritto.
export async function saveProfilePrivate(
  uid: string,
  patch: { cap?: string; onboarded?: boolean },
): Promise<void> {
  const data: Partial<ProfileDoc> = {}
  if (patch.cap !== undefined) data.cap = isValidCap(patch.cap) ? patch.cap.trim() : ''
  if (patch.onboarded !== undefined) data.onboarded = patch.onboarded
  await setDoc(profileRef(uid), data, { merge: true })
}

// Segna l'onboarding come visto (per "Configura più tardi").
export async function markOnboarded(uid: string): Promise<void> {
  await saveProfilePrivate(uid, { onboarded: true })
}
```

(`setDoc` e `profileRef` sono già importati/definiti nel file.)

- [ ] **Step 4: Esegui il test per verificarlo verde**

Run: `cd figubook-app && npx vitest run src/lib/db/profile.test.ts`
Expected: PASS (3 test).

- [ ] **Step 5: Typecheck**

Run: `cd figubook-app && npx tsc -b --noEmit`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add figubook-app/src/lib/db/profile.ts figubook-app/src/lib/db/profile.test.ts
git commit -m "feat(profile): campi cap/onboarded + isValidCap/saveProfilePrivate/markOnboarded"
```

---

## Task 2: Helper di stato onboarding

**Files:**
- Create: `src/lib/profile/status.ts`
- Test: `src/lib/profile/status.test.ts`

- [ ] **Step 1: Scrivi il test che fallisce**

Crea `src/lib/profile/status.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { hasComune, needsOnboarding, showCompleteBanner } from './status'
import type { ProfileDoc } from '@/lib/db/profile'

const base: ProfileDoc = { displayName: 'x', username: 'x', ts: 0 }

describe('profile status', () => {
  it('hasComune true solo con comune valido', () => {
    expect(hasComune({ ...base, citta: 'Roma (RM)' })).toBe(true)
    expect(hasComune({ ...base, citta: 'non-esiste-xyz' })).toBe(false)
    expect(hasComune(base)).toBe(false)
    expect(hasComune(null)).toBe(false)
  })
  it('needsOnboarding: manca comune e non ancora onboarded', () => {
    expect(needsOnboarding(base)).toBe(true)
    expect(needsOnboarding({ ...base, onboarded: true })).toBe(false)
    expect(needsOnboarding({ ...base, citta: 'Roma (RM)' })).toBe(false)
  })
  it('showCompleteBanner: ogni volta che manca il comune', () => {
    expect(showCompleteBanner(base)).toBe(true)
    expect(showCompleteBanner({ ...base, onboarded: true })).toBe(true)
    expect(showCompleteBanner({ ...base, citta: 'Roma (RM)' })).toBe(false)
  })
})
```

- [ ] **Step 2: Esegui il test per vederlo fallire**

Run: `cd figubook-app && npx vitest run src/lib/profile/status.test.ts`
Expected: FAIL — modulo mancante.

- [ ] **Step 3: Implementa `status.ts`**

Crea `src/lib/profile/status.ts`:

```ts
import { isValidComune } from '@/lib/geo/searchComuni'
import type { ProfileDoc } from '@/lib/db/profile'

// Il comune è il dato-base della Community: profilo "completo" = comune valido.
export function hasComune(profile: ProfileDoc | null): boolean {
  return isValidComune((profile?.citta ?? '').trim())
}

// Forziamo l'onboarding solo la prima volta: manca il comune E non l'ha mai visto.
export function needsOnboarding(profile: ProfileDoc | null): boolean {
  return !hasComune(profile) && !(profile?.onboarded ?? false)
}

// Il banner ricorda finché manca il comune, anche dopo aver saltato l'onboarding.
export function showCompleteBanner(profile: ProfileDoc | null): boolean {
  return !hasComune(profile)
}
```

- [ ] **Step 4: Esegui il test per verificarlo verde**

Run: `cd figubook-app && npx vitest run src/lib/profile/status.test.ts`
Expected: PASS (3 test). Se `hasComune('Roma (RM)')` risultasse false, il dataset comuni usa
un'altra label: apri `src/data/comuni-it.ts`, prendi un comune reale e aggiorna la stringa nei
test (è l'unico punto dipendente dal dataset).

- [ ] **Step 5: Commit**

```bash
git add figubook-app/src/lib/profile/status.ts figubook-app/src/lib/profile/status.test.ts
git commit -m "feat(profile): helper hasComune/needsOnboarding/showCompleteBanner"
```

---

## Task 3: Estrai TeamPicker in un componente condiviso

**Files:**
- Create: `src/components/profile/TeamPicker.tsx`
- Modify: `src/pages/Profilo.tsx` (rimuovi la funzione locale `TeamPicker` ~riga 102, aggiungi import)

- [ ] **Step 1: Crea il file estratto**

Apri `src/pages/Profilo.tsx`, individua la funzione locale `function TeamPicker({ value, onChange }...)`
(inizia ~riga 102) e la sua chiusura. Copia l'INTERO corpo in un nuovo file
`src/components/profile/TeamPicker.tsx`, aggiungendo gli import che la funzione usa (guarda quali
simboli referenzia: probabilmente `useState`, componenti team, `teams`/`teamById`, icone lucide —
copia dagli import di Profilo.tsx quelli effettivamente usati dalla funzione) ed esportandola:

```tsx
export function TeamPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  // ...corpo identico spostato da Profilo.tsx...
}
```

- [ ] **Step 2: Aggiorna Profilo.tsx**

Rimuovi la definizione locale `function TeamPicker(...) {...}` da `Profilo.tsx` e aggiungi in cima,
con gli altri import di `@/components/profile/...`:

```tsx
import { TeamPicker } from '@/components/profile/TeamPicker'
```

Rimuovi eventuali import ora orfani in Profilo.tsx (simboli usati SOLO da TeamPicker).

- [ ] **Step 3: Typecheck + build**

Run: `cd figubook-app && npx tsc -b --noEmit && npm run build`
Expected: exit 0 (solo warning preesistente INEFFECTIVE_DYNAMIC_IMPORT).

- [ ] **Step 4: Commit**

```bash
git add figubook-app/src/components/profile/TeamPicker.tsx figubook-app/src/pages/Profilo.tsx
git commit -m "refactor(profile): estrai TeamPicker in componente condiviso"
```

---

## Task 4: Estrai AvatarModal in un componente condiviso

**Files:**
- Create: `src/components/profile/AvatarModal.tsx`
- Modify: `src/pages/Profilo.tsx` (rimuovi la funzione locale `AvatarModal` ~riga 32, aggiungi import)

- [ ] **Step 1: Crea il file estratto**

In `src/pages/Profilo.tsx` individua `function AvatarModal({ ... }) {...}` (inizia ~riga 32).
Copia l'intero corpo in `src/components/profile/AvatarModal.tsx`, portando gli import che usa
(icone, firebase, avatar data, ecc.) ed esportandola con la STESSA firma di props che ha oggi:

```tsx
export function AvatarModal(props: /* stessa firma attuale: uid, current, name, onClose */) {
  // ...corpo identico spostato da Profilo.tsx...
}
```

Mantieni identica la firma delle props (leggi come viene chiamata a ~riga 555:
`<AvatarModal uid={...} current={...} name={...} onClose={...} />`).

- [ ] **Step 2: Aggiorna Profilo.tsx**

Rimuovi la definizione locale e aggiungi l'import:

```tsx
import { AvatarModal } from '@/components/profile/AvatarModal'
```

Rimuovi import ora orfani in Profilo.tsx.

- [ ] **Step 3: Typecheck + build**

Run: `cd figubook-app && npx tsc -b --noEmit && npm run build`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add figubook-app/src/components/profile/AvatarModal.tsx figubook-app/src/pages/Profilo.tsx
git commit -m "refactor(profile): estrai AvatarModal in componente condiviso"
```

---

## Task 5: Pagina Onboarding

**Files:**
- Create: `src/pages/Onboarding.tsx`

- [ ] **Step 1: Implementa la pagina**

Crea `src/pages/Onboarding.tsx`:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { CittaPicker } from '@/components/profile/CittaPicker'
import { TeamPicker } from '@/components/profile/TeamPicker'
import { AvatarModal } from '@/components/profile/AvatarModal'
import { Avatar } from '@/components/Avatar'
import { saveProfileAccount, saveProfilePrivate, markOnboarded, isValidCap } from '@/lib/db/profile'

const HINT = 'text-xs text-ink-2 mt-1.5'

export default function Onboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile } = useProfile()

  const [citta, setCitta] = useState(profile?.citta ?? '')
  const [cap, setCap] = useState(profile?.cap ?? '')
  const [favTeam, setFavTeam] = useState(profile?.favTeam ?? '')
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const dirty =
    citta !== (profile?.citta ?? '') ||
    cap !== (profile?.cap ?? '') ||
    favTeam !== (profile?.favTeam ?? '')
  const capOk = isValidCap(cap)

  async function save() {
    if (!user || !profile) return
    setSaving(true)
    try {
      await saveProfileAccount(user.uid, {
        username: profile.username,
        nome: profile.nome ?? '',
        citta,
        bio: profile.bio ?? '',
        favTeam,
      })
      await saveProfilePrivate(user.uid, { cap, onboarded: true })
      navigate('/home', { replace: true })
    } finally {
      setSaving(false)
    }
  }

  async function later() {
    if (!user) return
    await markOnboarded(user.uid)
    navigate('/home', { replace: true })
  }

  return (
    <div className="mx-auto w-full max-w-lg px-5 py-10">
      <h1 className="type-h1 text-ink">Benvenuto! Completa il tuo profilo</h1>
      <p className="mt-1.5 text-base text-ink-2">
        Bastano pochi dati per trovare collezionisti come te. Puoi anche farlo più tardi.
      </p>

      <div className="mt-8 space-y-6">
        <div>
          <label className="text-sm font-semibold text-ink">Comune <span className="text-lime">*</span></label>
          <div className="mt-1.5"><CittaPicker value={citta} onChange={setCitta} /></div>
          <p className={HINT}>Da dove collezioni — ci serve per la scoperta locale.</p>
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">CAP</label>
          <input
            value={cap}
            onChange={(e) => setCap(e.target.value.replace(/\D/g, '').slice(0, 5))}
            inputMode="numeric"
            placeholder="es. 00184"
            style={{ outline: 'none', boxShadow: 'none' }}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-surface px-4 py-2.5 text-[15px] text-ink focus:border-lime/60"
          />
          <p className={HINT}>
            Aggiungi il CAP: gli scambi che ti consigliamo diventano molto più precisi, trovi
            collezionisti proprio vicino a te. Resta privato.
          </p>
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">Squadra del cuore</label>
          <div className="mt-1.5"><TeamPicker value={favTeam} onChange={setFavTeam} /></div>
          <p className={HINT}>
            Scegli la tua squadra: colora il tuo profilo e ti fa sentire parte della tua tifoseria.
          </p>
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">Immagine profilo</label>
          <div className="mt-1.5 flex items-center gap-3">
            <Avatar
              id={profile?.avatarId}
              name={profile?.username ?? ''}
              className="h-14 w-14 overflow-hidden rounded-full"
            />
            <button
              type="button"
              onClick={() => setAvatarOpen(true)}
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-ink-2 transition-colors hover:text-ink"
            >
              Scegli avatar
            </button>
          </div>
          <p className={HINT}>Metti un avatar: ti rendi riconoscibile agli altri collezionisti.</p>
        </div>
      </div>

      <div className="mt-9 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || !capOk || saving}
          className="rounded-full bg-lime px-6 py-2.5 text-[15px] font-semibold text-lime-ink transition-opacity disabled:opacity-40"
        >
          {saving ? 'Salvataggio…' : 'Salva'}
        </button>
        <button
          type="button"
          onClick={later}
          className="rounded-full px-5 py-2.5 text-[15px] font-medium text-ink-2 transition-colors hover:text-ink"
        >
          Configura più tardi
        </button>
      </div>

      {avatarOpen && user && (
        <AvatarModal
          uid={user.uid}
          current={profile?.avatarId}
          name={profile?.username ?? ''}
          onClose={() => setAvatarOpen(false)}
        />
      )}
    </div>
  )
}
```

Nota: se la firma reale di `AvatarModal` (Task 4) differisce da `{uid, current, name, onClose}`,
adegua qui la chiamata a quella firma.

- [ ] **Step 2: Typecheck + build**

Run: `cd figubook-app && npx tsc -b --noEmit && npm run build`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add figubook-app/src/pages/Onboarding.tsx
git commit -m "feat(onboarding): pagina onboarding profilo con microcopy"
```

---

## Task 6: Rotta + gate onboarding

**Files:**
- Modify: `src/App.tsx` (aggiungi rotta `/onboarding` dentro l'area protetta)
- Modify: `src/components/ProtectedRoute.tsx` (redirect a onboarding)

- [ ] **Step 1: Aggiungi la rotta in App.tsx**

In `src/App.tsx`, con gli altri import di pagina:

```tsx
import Onboarding from '@/pages/Onboarding'
```

Dentro il gruppo `<Route element={<ProtectedRoute>...}>` (accanto a `/home`, ~riga 70):

```tsx
<Route path="/onboarding" element={<Onboarding />} />
```

- [ ] **Step 2: Aggiungi il gate in ProtectedRoute.tsx**

Sostituisci il contenuto di `src/components/ProtectedRoute.tsx` con:

```tsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { needsVerification } from '@/lib/auth/verification'
import { needsOnboarding } from '@/lib/profile/status'

// Guardia rotte private. Non autenticato -> /login. Email non verificata -> /verifica.
// Verificato ma profilo mai completato e mai visto l'onboarding -> /onboarding (una volta).
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const { profile, loading: profileLoading } = useProfile()
  const location = useLocation()

  if (loading)
    return (
      <div className="grid min-h-screen place-items-center bg-[#080a08] text-muted-foreground">
        Caricamento…
      </div>
    )
  if (!user) return <Navigate to="/login" replace />
  if (needsVerification(user)) return <Navigate to="/verifica" replace />

  // Decidi sull'onboarding solo a profilo caricato, e non sulla pagina stessa.
  if (!profileLoading && needsOnboarding(profile) && location.pathname !== '/onboarding')
    return <Navigate to="/onboarding" replace />

  return <>{children}</>
}
```

- [ ] **Step 3: Typecheck + build**

Run: `cd figubook-app && npx tsc -b --noEmit && npm run build`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add figubook-app/src/App.tsx figubook-app/src/components/ProtectedRoute.tsx
git commit -m "feat(onboarding): rotta /onboarding + gate post-verifica"
```

---

## Task 7: Banner completamento in Home

**Files:**
- Create: `src/components/home/CompleteProfileBanner.tsx`
- Modify: `src/pages/Home.tsx` (monta il banner in cima)

- [ ] **Step 1: Implementa il banner**

Crea `src/components/home/CompleteProfileBanner.tsx`:

```tsx
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useProfile } from '@/hooks/useProfile'
import { showCompleteBanner } from '@/lib/profile/status'

// Promemoria perenne (non chiudibile a mano): sparisce solo quando il comune è valido.
export function CompleteProfileBanner() {
  const { profile, loading } = useProfile()
  if (loading || !showCompleteBanner(profile)) return null

  return (
    <Link
      to="/onboarding"
      className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-lime/25 bg-lime/[0.06] px-5 py-4 transition-colors hover:border-lime/40"
    >
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-ink">Completa il tuo profilo</p>
        <p className="mt-0.5 text-sm text-ink-2">
          Aggiungi il tuo comune per trovare collezionisti vicino a te.
        </p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-lime">
        Completa <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  )
}
```

- [ ] **Step 2: Monta il banner in Home.tsx**

In `src/pages/Home.tsx`, aggiungi l'import:

```tsx
import { CompleteProfileBanner } from '@/components/home/CompleteProfileBanner'
```

Renderizzalo come primo elemento del contenuto della pagina (subito dentro il wrapper radice,
prima dell'header/hero esistente):

```tsx
<CompleteProfileBanner />
```

- [ ] **Step 3: Typecheck + build**

Run: `cd figubook-app && npx tsc -b --noEmit && npm run build`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add figubook-app/src/components/home/CompleteProfileBanner.tsx figubook-app/src/pages/Home.tsx
git commit -m "feat(onboarding): banner completamento profilo in Home"
```

---

## Task 8: Verifica end-to-end (manuale, founder) + push

**Files:** nessuno

- [ ] **Step 1: Push**

```bash
git push origin main
```

- [ ] **Step 2: Verifica manuale (dopo deploy Pages)**

1. Registra un nuovo account, verifica la mail → atteso: atterri su `/onboarding`.
2. Clicca "Configura più tardi" → atteso: vai in Home, banner "Completa il tuo profilo" visibile.
3. Ricarica la pagina → NON torni su `/onboarding` (onboarded=true), banner ancora visibile.
4. Apri il banner → onboarding → metti il **comune** → Salva → Home senza banner.
5. (Console Firebase) `users/{uid}/meta/profile` ha `cap` (se messo) e `onboarded:true`;
   `publicProfiles/{uid}` NON ha `cap`.
6. Un utente esistente che ha già un comune valido: al login NON viene mandato a `/onboarding`
   e non vede il banner.

---

## Note

- CAP assistito (prefill dal comune / menu zona per città grandi) è FUORI SCOPE: richiede dataset
  comune→CAP inesistente oggi. Qui il CAP è input 5 cifre opzionale.
- `git add` con path espliciti (mai `-A` da root).
- Cache-bust non necessario: build Vite con hashing (deploy via Actions).
