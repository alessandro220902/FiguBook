// Lingua unica per filtri/azioni della sezione album (dark theme).
// Regole concordate:
//  - LIME pieno = SOLO azioni principali (Apri, Nuovo album).
//  - Filtri/toggle: attivo = bianco pieno (massimo contrasto), inattivo = ghost spento.
//  - Azioni neutre (Condividi): ghost.
//  - Forma unica: radius 6px (rounded-md), come il mockup minimalist.

// Forma unica: pill (rounded-full), come i filtri del mockup minimalist.
export const CTRL_BASE =
  'inline-flex min-h-[38px] items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold ' +
  'transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.98] ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime'

// Azione principale: SOLO bordo + scritta lime (niente fill), faint fill solo all'hover
export const CTRL_PRIMARY = 'border border-lime/70 bg-transparent text-lime hover:bg-lime/10'

// Filtro/toggle ATTIVO ("spinto"): bianco pieno, alto contrasto, niente lime
export const CTRL_ON = 'border border-transparent bg-white text-neutral-900 hover:bg-white/90'

// Inattivo / neutro: ghost spento; al click diventa bianco (press feedback)
export const CTRL_GHOST = 'border border-white/15 bg-white/[0.04] text-ink-2 hover:bg-white/10 hover:text-ink active:bg-white active:text-neutral-900'

// Badge conteggio dentro un filtro: solo numero, niente tondino
export const CTRL_BADGE_ON = 'text-xs font-bold tabular-nums text-neutral-900/55'
export const CTRL_BADGE_OFF = 'text-xs tabular-nums text-ink-2/70'

export function ctrlFilter(active: boolean): string {
  return `${CTRL_BASE} ${active ? CTRL_ON : CTRL_GHOST}`
}
export function ctrlPrimary(): string {
  return `${CTRL_BASE} ${CTRL_PRIMARY}`
}
export function ctrlGhost(): string {
  return `${CTRL_BASE} ${CTRL_GHOST}`
}
