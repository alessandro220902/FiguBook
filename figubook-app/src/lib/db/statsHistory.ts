// src/lib/db/statsHistory.ts
import { collection, doc, getDocs, limit, orderBy, query, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { StatSnapshot } from '@/lib/stats/computeDeltas'

export function todayIso(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

type Totals = { have: number; doubles: number; missing: number; total: number }

// Upsert dello snapshot del giorno corrente: insegue `have` così le figurine
// inserite oggi restano attribuite a oggi (non spinte al primo accesso di domani).
// Guard: riscrive solo se `have` è cambiato rispetto all'ultima scrittura odierna.
export async function touchStatsSnapshot(uid: string, totals: Totals): Promise<void> {
  const today = todayIso()
  const key = `figubook:statsDay:${uid}`
  const marker = `${today}:${totals.have}`
  if (localStorage.getItem(key) === marker) return
  localStorage.setItem(key, marker)
  try {
    await setDoc(doc(db, 'users', uid, 'stats', today), {
      date: today,
      have: totals.have,
      doubles: totals.doubles,
      missing: totals.missing,
      total: totals.total,
    })
  } catch (e) {
    console.error('statsSnapshot', e)
    localStorage.removeItem(key) // riprova al prossimo giro se fallisce
  }
}

// Ultimi N snapshot, dal più recente al più vecchio (default 8).
export async function fetchRecentSnapshots(uid: string, count = 8): Promise<StatSnapshot[]> {
  const q = query(
    collection(db, 'users', uid, 'stats'),
    orderBy('date', 'desc'),
    limit(count),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data() as StatSnapshot)
}
