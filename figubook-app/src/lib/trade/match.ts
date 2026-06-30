export interface Inventory {
  doubles: string[]
  missing: string[]
}

export interface MatchResult {
  receive: string[]      // codici che ricevo (sue doubles ∩ mie missing)
  give: string[]         // codici che do (mie doubles ∩ sue missing)
  receiveCount: number
  giveCount: number
  reciprocal: boolean    // entrambe le direzioni > 0
  completionPct: number  // % album completato se ricevo tutte le receive
}

// doubles = codici con state 'double'; missing = codici album mai 'have'/'double'.
export function deriveInventory(allCodes: string[], states: Record<string, string>): Inventory {
  const doubles: string[] = []
  const missing: string[] = []
  for (const code of allCodes) {
    const s = states[code]
    if (s === 'double') doubles.push(code)
    if (s !== 'have' && s !== 'double') missing.push(code)
  }
  return { doubles, missing }
}

export function computeMatch(me: Inventory, them: Inventory, albumTotal: number): MatchResult {
  const myMissing = new Set(me.missing)
  const theirMissing = new Set(them.missing)
  const receive = them.doubles.filter((c) => myMissing.has(c))
  const give = me.doubles.filter((c) => theirMissing.has(c))
  const completionPct = albumTotal > 0 ? Math.round((receive.length / albumTotal) * 100) : 0
  return {
    receive,
    give,
    receiveCount: receive.length,
    giveCount: give.length,
    reciprocal: receive.length > 0 && give.length > 0,
    completionPct,
  }
}
