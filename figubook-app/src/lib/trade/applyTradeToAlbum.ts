import { counterOf } from '@/lib/album/stats'

// Dato lo stato album e uno scambio, ritorna i NUOVI conteggi assoluti (code->count)
// per i soli codici toccati. receive = +1, give = -1 (floor 0). Da passare a flushAlbumCounts.
export function applyTradeToAlbum(
  states: Record<string, string>,
  counts: Record<string, number>,
  trade: { give: string[]; receive: string[] },
): Record<string, number> {
  const out: Record<string, number> = {}
  const cur = (code: string) => (code in out ? out[code] : counterOf(code, states, counts))
  for (const code of trade.receive) out[code] = cur(code) + 1
  for (const code of trade.give) out[code] = Math.max(0, cur(code) - 1)
  return out
}
