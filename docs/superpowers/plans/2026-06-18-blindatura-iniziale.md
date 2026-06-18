# Blindatura parte iniziale (auth + rules) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Chiudere i buchi live dello strato d'ingresso prima di costruire la dashboard.

**Architecture:** A) Auth React — route guard + signup corretto. B) Sicurezza server — stringere firestore.rules. Nessun nuovo comportamento prodotto, solo blindatura.

**Tech Stack:** React + React Router + Firebase modular (auth/firestore) + firestore.rules.

**Nota verifica:** progetto senza test runner + vincolo zero-locale. Verifica = `npm run build` (typecheck) + `npm run lint` + check live dopo deploy. Niente unit test (deviazione consapevole da TDD per vincolo ambiente).

---

## Task 1 — ProtectedRoute (G0)

**Files:**
- Create: `figubook-app/src/components/ProtectedRoute.tsx`
- Modify: `figubook-app/src/App.tsx`

- [ ] **Step 1: crea ProtectedRoute**
```tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading)
    return (
      <div className="grid min-h-screen place-items-center bg-[#080a08] text-muted-foreground">
        Caricamento…
      </div>
    )
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
```

- [ ] **Step 2: avvolgi le 4 rotte private in App.tsx**
```tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Album from '@/pages/Album'
import Scambi from '@/pages/Scambi'
import Community from '@/pages/Community'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/album" element={<ProtectedRoute><Album /></ProtectedRoute>} />
      <Route path="/scambi" element={<ProtectedRoute><Scambi /></ProtectedRoute>} />
      <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
    </Routes>
  )
}
```

- [ ] **Step 3: build + lint** — `npm run build && npm run lint` → exit 0.

---

## Task 2 — Login: Google non sovrascrive (G1) + username valido (G2)

**Files:**
- Modify: `figubook-app/src/pages/Login.tsx`

- [ ] **Step 1: import getAdditionalUserInfo** — aggiungere a import da `firebase/auth`.

- [ ] **Step 2: handleGoogle scrive profilo SOLO se nuovo utente**
```tsx
const cred = await signInWithPopup(auth, googleProvider)
const u = cred.user
if (getAdditionalUserInfo(cred)?.isNewUser) {
  const name = u.displayName || (u.email || '').split('@')[0]
  await setDoc(
    doc(db, 'users', u.uid, 'meta', 'profile'),
    { displayName: name, username: name, ts: Date.now() },
    { merge: true },
  )
}
navigate('/dashboard', { replace: true })
```

- [ ] **Step 3: handleRegister valida username dopo trim**
```tsx
const username = regUser.trim()
if (!username) { setRegErr('Inserisci un nome utente.'); setBusy(false); return }
const cred = await createUserWithEmailAndPassword(auth, regEmail.trim(), regPass)
await updateProfile(cred.user, { displayName: username })
await setDoc(
  doc(db, 'users', cred.user.uid, 'meta', 'profile'),
  { displayName: username, username, ts: Date.now() },
  { merge: true },
)
```

- [ ] **Step 4: build + lint** → exit 0.

---

## Task 3 — Rules: notifiche href/icon (B3) + proposte transizioni (B6)

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: notifiche** — nel blocco `create` di `notifications`, aggiungere vincoli: `href` (se presente) in whitelist path interni; `icon` (se presente) in set chiuso emoji.

- [ ] **Step 2: proposte** — `create` con `status=='pending'`; `update` impedisce `status=='completed'` se non tutti i `participants` sono in `confirmedBy`, e `confirmedBy` ⊆ participants.

- [ ] **Step 3: deploy rules** — l'utente deve fare `firebase deploy --only firestore:rules` (richiede login firebase locale → comando da lanciare con `!`). Le rules NON si deployano via GitHub Actions di Pages.

---

## Rimandato (NON buchi, YAGNI)
- G6 publicProfile al signup → quando si costruisce scambi/community.
- Fondamenta DB B1–B13 → quando si porta il layer dati in React (dashboard/album).
Vedi [[no-buchi-costruzione-progressiva]].
