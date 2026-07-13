// figubook-app/src/lib/functions/nearby.ts
import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '@/lib/firebase'

const fns = getFunctions(app, 'europe-west1')

// Ritorna gli uid dei collezionisti vicini (CAP→provincia→squadra), max 6.
export async function fetchNearbyUids(): Promise<string[]> {
  const call = httpsCallable<unknown, { uids: string[] }>(fns, 'nearbyCollectors')
  const res = await call({})
  return res.data?.uids ?? []
}
