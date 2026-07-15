import { PT } from './pointValues.js'

export interface AlbumInput { albumId: string; have: number; total: number; teamHave: number; baselineHave?: number }
export interface TradeInput { partner: string; at: number }
export interface ScambistaInput {
  trades: TradeInput[]
  invites: { at: number }[]
  friendshipsAt: number[]
  activeDays: string[]
  profileComplete: boolean
}
export interface ScoringInput extends ScambistaInput { albums: AlbumInput[] }
export interface Axes { collezionista: number; scambista: number; totale: number }

const round1 = (n: number): number => Math.round(n * 10) / 10
const pctOf = (have: number, total: number): number => (total > 0 ? Math.min(100, (have / total) * 100) : 0)

export function scoreCollezionista(albums: AlbumInput[]): number {
  let pts = 0
  for (const a of albums) {
    if (a.have <= 0 || a.total <= 0) continue
    pts += PT.albumStarted
    const pct = pctOf(a.have, a.total)
    if (pct >= 25) pts += PT.milestone
    if (pct >= 50) pts += PT.milestone
    if (pct >= 75) pts += PT.milestone
    if (a.have >= a.total) pts += PT.albumComplete
    pts += PT.perSticker * a.have
    pts += PT.derbyBonusFactor * PT.perSticker * a.teamHave
  }
  return round1(pts)
}

// Punti Collezionista guadagnati NEL MESE: delta figurine + soglie/completamento CROSSATE nel mese.
export function scoreCollezionistaSeasonal(albums: AlbumInput[]): number {
  let pts = 0
  for (const a of albums) {
    const base = a.baselineHave ?? 0
    if (a.total <= 0) continue
    const delta = Math.max(0, a.have - base)
    if (base === 0 && a.have > 0) pts += PT.albumStarted
    const basePct = pctOf(base, a.total)
    const curPct = pctOf(a.have, a.total)
    for (const thr of [25, 50, 75]) if (basePct < thr && curPct >= thr) pts += PT.milestone
    if (base < a.total && a.have >= a.total) pts += PT.albumComplete
    pts += PT.perSticker * delta
    pts += PT.derbyBonusFactor * PT.perSticker * a.teamHave
  }
  return round1(pts)
}

export function scoreScambista(i: ScambistaInput): number {
  const distinctPartners = new Set(i.trades.map((t) => t.partner)).size
  let pts = 0
  pts += PT.tradeCompleted * i.trades.length
  pts += PT.newPartner * distinctPartners
  pts += PT.invite * i.invites.length
  pts += PT.friendship * i.friendshipsAt.length
  pts += PT.activeDay * i.activeDays.length
  if (i.profileComplete) pts += PT.profileComplete
  return round1(pts)
}

// sinceMs: se presente, considera solo eventi con at>=sinceMs e giorni con ISO>=mese; album usa il delta baseline.
export function computeAxes(input: ScoringInput, sinceMs?: number): Axes {
  const sinceIso = sinceMs !== undefined ? isoOf(sinceMs) : undefined
  const trades = sinceMs === undefined ? input.trades : input.trades.filter((t) => t.at >= sinceMs)
  const invites = sinceMs === undefined ? input.invites : input.invites.filter((x) => x.at >= sinceMs)
  const friendshipsAt = sinceMs === undefined ? input.friendshipsAt : input.friendshipsAt.filter((a) => a >= sinceMs)
  const activeDays = sinceIso === undefined ? input.activeDays : input.activeDays.filter((d) => d >= sinceIso)
  const collezionista = sinceMs === undefined ? scoreCollezionista(input.albums) : scoreCollezionistaSeasonal(input.albums)
  const scambista = scoreScambista({ trades, invites, friendshipsAt, activeDays, profileComplete: input.profileComplete })
  return { collezionista, scambista, totale: round1(collezionista + scambista) }
}

function isoOf(ms: number): string {
  const d = new Date(ms)
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${d.getUTCFullYear()}-${m}-${day}`
}
