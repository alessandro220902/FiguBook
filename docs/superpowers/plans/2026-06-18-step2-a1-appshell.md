# A1 App-shell + tubelight nav Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Shell unica con tubelight nav scritta una volta, sopra le 4 sezioni private.

**Architecture:** AppLayout (nav + Outlet) avvolge le rotte private annidate dietro ProtectedRoute. Nav = tubelight-navbar 21st adattata a React Router, attivo dalla rotta.

**Tech Stack:** React + React Router v7 + framer-motion + lucide-react (tutte già installate).

**Verifica:** no test runner + zero-locale → `npm run build` + `npm run lint` + check live. Niente unit test.

---

## Task 1 — TubelightNav (componente adattato)

**Files:**
- Create: `figubook-app/src/components/layout/TubelightNav.tsx`

- [ ] **Step 1: crea TubelightNav.tsx** (adattato da ayushmxxn: no "use client", react-router Link, attivo da useLocation, primary=lime)

```tsx
import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

export function TubelightNav({ items, className }: { items: NavItem[]; className?: string }) {
  const { pathname } = useLocation()

  return (
    <div
      className={cn(
        'fixed bottom-0 left-1/2 z-50 mb-6 -translate-x-1/2 sm:top-0 sm:mb-0 sm:pt-6',
        className,
      )}
    >
      <div className="flex items-center gap-1 rounded-full border border-border bg-card/80 px-1 py-1 shadow-lg backdrop-blur-lg">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.url
          return (
            <Link
              key={item.name}
              to={item.url}
              className={cn(
                'relative cursor-pointer rounded-full px-6 py-2 text-sm font-semibold transition-colors',
                'text-foreground/80 hover:text-primary',
                isActive && 'text-primary',
              )}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden">
                <Icon size={18} strokeWidth={2.5} />
              </span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 -z-10 w-full rounded-full bg-primary/10"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <div className="absolute -top-2 left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full bg-primary">
                    <div className="absolute -left-2 -top-2 h-6 w-12 rounded-full bg-primary/20 blur-md" />
                    <div className="absolute -top-1 h-6 w-8 rounded-full bg-primary/20 blur-md" />
                    <div className="absolute left-2 top-0 h-4 w-4 rounded-full bg-primary/20 blur-sm" />
                  </div>
                </motion.div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
```

---

## Task 2 — AppLayout

**Files:**
- Create: `figubook-app/src/components/layout/AppLayout.tsx`

- [ ] **Step 1: crea AppLayout.tsx** (nav + Outlet; padding-top per non finire sotto la nav desktop)

```tsx
import { Outlet } from 'react-router-dom'
import { LayoutDashboard, BookOpen, ArrowLeftRight, Users } from 'lucide-react'
import { TubelightNav, type NavItem } from '@/components/layout/TubelightNav'

const NAV: NavItem[] = [
  { name: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { name: 'Album', url: '/album', icon: BookOpen },
  { name: 'Scambi', url: '/scambi', icon: ArrowLeftRight },
  { name: 'Community', url: '/community', icon: Users },
]

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TubelightNav items={NAV} />
      <main className="px-5 pb-28 pt-8 sm:px-10 sm:pt-28">
        <Outlet />
      </main>
    </div>
  )
}
```

---

## Task 3 — Rotte annidate

**Files:**
- Modify: `figubook-app/src/App.tsx`

- [ ] **Step 1: annida le 4 private sotto ProtectedRoute + AppLayout**

```tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
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
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/album" element={<Album />} />
        <Route path="/scambi" element={<Scambi />} />
        <Route path="/community" element={<Community />} />
      </Route>
    </Routes>
  )
}
```

- [ ] **Step 2: build + lint** — `npm run build && npm run lint` → exit 0, nessun nuovo errore mio.

---

## Task 4 — Pulizia placeholder

**Files:**
- Modify: `figubook-app/src/pages/Dashboard.tsx`

- [ ] **Step 1: rimuovere bottone Esci inline dal placeholder** (era temporaneo; l'Esci andrà nel menu profilo della shell, deferred). Lasciare solo il titolo per ora.

- [ ] **Step 2: build** → exit 0.

---

## Commit & deploy
- [ ] commit + push (memory [[push-after-update]]). Vite hash gli asset → no cache-bust manuale.

## Deferred (non buchi)
- Top-right: campanella + avatar/menu Esci → Step 2 con layer dati.
- Nav mobile custom → con link utente, se serve.
