import { doc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Inventory } from '@/lib/trade/match'

export interface TradeIndexDoc {
  doubles: string[]
  missing: string[]
  citta: string
  updatedAt: number
}

export interface TradeIndexEntry extends TradeIndexDoc {
  uid: string
}

// Builder puro (testabile).
export function buildIndexDoc(inv: Inventory, citta: string, now: number): TradeIndexDoc {
  return { doubles: inv.doubles, missing: inv.missing, citta, updatedAt: now }
}

function indexRef(albumId: string, uid: string) {
  return doc(db, 'tradeIndex', albumId, 'users', uid)
}

// Pubblica/aggiorna il mio inventario per un album.
export async function publishIndex(
  albumId: string,
  uid: string,
  inv: Inventory,
  citta: string,
): Promise<void> {
  await setDoc(indexRef(albumId, uid), buildIndexDoc(inv, citta, Date.now()))
}

// Rimuove il mio inventario per un album (opt-out).
export async function removeIndex(albumId: string, uid: string): Promise<void> {
  await deleteDoc(indexRef(albumId, uid))
}

// Legge tutti gli utenti che offrono scambi su un album (escluso me).
export async function fetchIndexUsers(albumId: string, meUid: string): Promise<TradeIndexEntry[]> {
  const snap = await getDocs(collection(db, 'tradeIndex', albumId, 'users'))
  return snap.docs
    .filter((d) => d.id !== meUid)
    .map((d) => ({ uid: d.id, ...(d.data() as TradeIndexDoc) }))
}
