export interface TeamFacts {
  city?: string
  founded?: number
  stadium?: string
  nickname?: string
}

// chiave = id canonico (slug nome, vedi teamIdentity). Campi opzionali: assente => nascosto.
// Popolato progressivamente (Wikidata CC0 / conoscenza / web).
export const TEAM_FACTS: Record<string, TeamFacts> = {}

export function factsForTeam(canonicalId: string): TeamFacts {
  return TEAM_FACTS[canonicalId] ?? {}
}
