export type Axis = 'totale' | 'collezionista' | 'scambista'

export interface ScoreRow {
  uid: string
  username?: string
  avatarId?: string
  favTeam?: string
  citta?: string
  totale: number
  collezionista: number
  scambista: number
}
export interface RankedRow extends ScoreRow { rank: number; value: number }

export function rankByAxis(rows: ScoreRow[], axis: Axis, limit: number): RankedRow[] {
  return [...rows]
    .map((r) => ({ ...r, value: r[axis] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map((r, i) => ({ ...r, rank: i + 1 }))
}
