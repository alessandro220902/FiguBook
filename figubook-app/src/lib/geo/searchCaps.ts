import { CAPS } from '@/data/caps-it'
import { comuneLabel } from '@/data/comuni-it'

export interface CapHit {
  cap: string
  nome: string
  prov: string
  comune: string // etichetta "Nome (PROV)"
}

// Ricerca per prefisso di CAP. CAPS è ordinato per cap: i match sono contigui.
export function searchCaps(query: string, max: number): CapHit[] {
  const q = query.trim()
  if (!q) return []
  const hits: CapHit[] = []
  for (const [cap, nome, prov] of CAPS) {
    if (cap.startsWith(q)) {
      hits.push({ cap, nome, prov, comune: comuneLabel(nome, prov) })
      if (hits.length >= max) break
    }
  }
  return hits
}

// True se il CAP esiste nel dataset (comune generico Poste).
export function isKnownCap(cap: string): boolean {
  const c = cap.trim()
  return CAPS.some(([x]) => x === c)
}

// Comune di riferimento di un CAP (etichetta "Nome (PROV)"), o '' se sconosciuto.
export function capComune(cap: string): string {
  const c = cap.trim()
  const row = CAPS.find(([x]) => x === c)
  return row ? comuneLabel(row[1], row[2]) : ''
}
