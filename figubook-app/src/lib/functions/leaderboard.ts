// figubook-app/src/lib/functions/leaderboard.ts
import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '@/lib/firebase'

export type Scope = 'nazionale' | 'citta' | 'squadra' | 'amici'
export type Axis = 'totale' | 'collezionista' | 'scambista'

export interface RankedRow {
  uid: string; username?: string; avatarId?: string; favTeam?: string; citta?: string
  totale: number; collezionista: number; scambista: number; rank: number; value: number
}
export interface LeaderboardResult { rows: RankedRow[]; me: RankedRow; hasMore: boolean; season: string }

const fns = getFunctions(app, 'europe-west1')

export async function fetchLeaderboard(scope: Scope, axis: Axis, limit = 20): Promise<LeaderboardResult> {
  const call = httpsCallable<{ scope: Scope; axis: Axis; limit: number }, LeaderboardResult>(fns, 'leaderboard')
  const res = await call({ scope, axis, limit })
  return res.data
}
