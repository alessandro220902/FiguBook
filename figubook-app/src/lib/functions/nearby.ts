// figubook-app/src/lib/functions/nearby.ts
import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '@/lib/firebase'

const fns = getFunctions(app, 'europe-west1')

type NearbyResult = { uids: string[]; hasMore: boolean }

// Ritorna un batch di uid vicini (CAP→provincia→squadra), escludendo i già-visti.
export async function fetchNearbyUids(
  exclude: string[], limit: number,
): Promise<NearbyResult> {
  const call = httpsCallable<{ exclude: string[]; limit: number }, NearbyResult>(
    fns, 'nearbyCollectors',
  )
  const res = await call({ exclude, limit })
  return { uids: res.data?.uids ?? [], hasMore: res.data?.hasMore ?? false }
}
