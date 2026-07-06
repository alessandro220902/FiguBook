import { useSyncExternalStore } from 'react'

// Store tema minimale (dark/light) condiviso senza provider. Persistito in
// localStorage, notifica i subscriber al cambio. Usato dal ThemeToggle e dalle
// superfici che devono reagire (per ora Home: tema Midnight Gold).
export type ThemeMode = 'dark' | 'light'

const KEY = 'figubook:theme'
const subs = new Set<() => void>()
let mode: ThemeMode = readInitial()

function readInitial(): ThemeMode {
  try {
    return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function setThemeMode(next: ThemeMode) {
  if (next === mode) return
  mode = next
  try { localStorage.setItem(KEY, next) } catch { /* no-op */ }
  subs.forEach((f) => f())
}

export function toggleThemeMode() {
  setThemeMode(mode === 'dark' ? 'light' : 'dark')
}

function subscribe(cb: () => void) {
  subs.add(cb)
  return () => { subs.delete(cb) }
}

export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(subscribe, () => mode, () => mode)
}
