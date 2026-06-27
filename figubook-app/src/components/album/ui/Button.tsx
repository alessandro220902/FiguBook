import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost'

export interface AlbumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

// Base bottoni sezione album. Press feedback (scale 0.97, transform-only, ease-out
// <300ms) seguendo le regole di design-engineering (Emil): solo transform/opacity.
// Lingua unica con controlStyles: pill (rounded-full), primario = bordo lime,
// secondario = ghost spento che diventa bianco al click.
const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold ' +
  'transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.97] ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime ' +
  'disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100'

const VARIANTS: Record<Variant, string> = {
  primary: 'border border-lime/70 bg-transparent text-lime hover:bg-lime/10',
  ghost: 'border border-white/15 bg-white/[0.04] text-ink-2 hover:bg-white/10 hover:text-ink active:bg-white active:text-neutral-900',
}

export function AlbumButton({ variant = 'primary', className = '', children, ...rest }: AlbumButtonProps) {
  return (
    <button className={`${BASE} ${VARIANTS[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}
