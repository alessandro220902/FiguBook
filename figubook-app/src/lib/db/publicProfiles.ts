import {
  collection,
  query,
  where,
  orderBy,
  limit as fbLimit,
  getDocs,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { PublicProfile } from '@/lib/db/profile'

const col = () => collection(db, 'publicProfiles')
// Sentinella di fine-range per query prefisso (ultimo codepoint dell'area PUA).
const HIGH = String.fromCharCode(0xf8ff)

// Ricerca per prefisso sullo username (case-insensitive via usernameLower).
export async function searchUsers(prefix: string, max = 8): Promise<PublicProfile[]> {
  const p = prefix.trim().toLowerCase()
  if (!p) return []
  const q = query(
    col(),
    orderBy('usernameLower'),
    where('usernameLower', '>=', p),
    where('usernameLower', '<=', p + HIGH),
    fbLimit(max),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data() as PublicProfile)
}

// Lookup esatto per username (per la rotta /u/:username).
export async function getPublicByUsername(username: string): Promise<PublicProfile | null> {
  const p = username.trim().toLowerCase()
  if (!p) return null
  const snap = await getDocs(query(col(), where('usernameLower', '==', p), fbLimit(1)))
  return snap.empty ? null : (snap.docs[0].data() as PublicProfile)
}
