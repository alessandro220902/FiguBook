// Lingua unica per filtri/azioni della sezione album (dark theme).
// Due soli stati visivi: LIME (attivo/primario) e GHOST (inattivo/neutro).
// Forma unica: soft-rect rounded-lg. Vedi regole concordate con l'utente.

export const CTRL_BASE =
  'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold ' +
  'transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.97] ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime'

// Attivo / azione primaria (Apri, Nuovo album, filtro selezionato)
export const CTRL_LIME = 'border border-lime/60 bg-lime/10 text-lime hover:bg-lime/20'

// Inattivo / azione neutra (filtro non selezionato, Condividi, Inserimento rapido spento)
export const CTRL_GHOST = 'border border-white/15 bg-white/5 text-ink hover:bg-white/10'

// Badge conteggio dentro un filtro
export const CTRL_BADGE_ON = 'rounded-md bg-lime px-1.5 text-xs font-bold tabular-nums text-lime-ink'
export const CTRL_BADGE_OFF = 'text-xs tabular-nums text-ink-2/70'

export function ctrl(active: boolean): string {
  return `${CTRL_BASE} ${active ? CTRL_LIME : CTRL_GHOST}`
}
