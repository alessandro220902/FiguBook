export type AlbumBadgeVariant = 'new-release' | 'new'

const LABEL: Record<AlbumBadgeVariant, { text: string; aria: string }> = {
  'new-release': { text: 'Nuova uscita', aria: 'Nuova uscita' },
  'new': { text: 'Nuovo', aria: 'Nuovo nella tua lista' },
}

// Chip novità album: oro su near-black (Midnight Gold), stesso linguaggio del badge ×N.
export function AlbumBadge({ variant, className }: { variant: AlbumBadgeVariant; className?: string }) {
  const { text, aria } = LABEL[variant]
  return (
    <span
      role="img"
      aria-label={aria}
      className={
        'pointer-events-none inline-flex items-center rounded-full bg-lime-ink/90 px-2 py-0.5 ' +
        'text-[10px] font-bold uppercase tracking-wide text-gold ring-1 ring-gold/60 shadow-sm ' +
        (className ?? '')
      }
    >
      {text}
    </span>
  )
}
