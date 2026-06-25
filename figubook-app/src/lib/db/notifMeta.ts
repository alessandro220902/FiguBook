import { Bell, CheckCircle2, ThumbsUp, ArrowLeftRight, PencilLine, XCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Stile alert-toast (21st/lavikatiyar): stripe colorata a sinistra + icona lucide
// per tipo, niente emoji. Colore = accento, non riempimento.
// File separato (no componenti) così Fast Refresh resta valido.
export const NOTIF_META: Record<string, { color: string; Icon: LucideIcon }> = {
  completed: { color: '#a3e635', Icon: CheckCircle2 },   // lime
  accepted: { color: '#34d399', Icon: ThumbsUp },        // emerald
  proposal: { color: '#38bdf8', Icon: ArrowLeftRight },  // sky
  revise: { color: '#fbbf24', Icon: PencilLine },        // amber
  rejected: { color: '#f87171', Icon: XCircle },         // red
}
export const notifMeta = (type?: string) => NOTIF_META[type ?? ''] ?? { color: '#9ca3af', Icon: Bell }

export type Tab = 'all' | 'unread' | 'read'
export const NOTIF_TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'Tutte' },
  { key: 'unread', label: 'Non lette' },
  { key: 'read', label: 'Lette' },
]
