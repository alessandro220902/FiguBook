import { COMUNI, comuneLabel } from '@/data/comuni-it'

export interface ComuneHit { nome: string; prov: string; label: string }

const CANONICAL = new Set(COMUNI.map(([n, p]) => comuneLabel(n, p)))

export function searchComuni(query: string, max: number): ComuneHit[] {
  const q = query.trim().toLowerCase()
  // Query vuota (focus senza digitare): mostra i primi comuni come lista iniziale.
  if (!q) return COMUNI.slice(0, max).map(([nome, prov]) => ({ nome, prov, label: comuneLabel(nome, prov) }))
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

export function isValidComune(value: string): boolean {
  return CANONICAL.has(value)
}
