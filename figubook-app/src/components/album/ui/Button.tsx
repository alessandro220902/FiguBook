import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost'

export interface AlbumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

// Base bottoni sezione album. Press feedback (scale 0.97, transform-only, ease-out
// <300ms) seguendo le regole di design-engineering (Emil): solo transform/opacity.
const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ' +
  'transition-transform duration-150 ease-out active:scale-[0.97] ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime ' +
  'disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100'

const VARIANTS: Record<Variant, string> = {
  primary: 'border border-lime text-lime hover:bg-lime/10',
  ghost: 'border border-border bg-transparent text-ink hover:bg-muted',
}

export function AlbumButton({ variant = 'primary', className = '', children, ...rest }: AlbumButtonProps) {
  return (
    <button className={`${BASE} ${VARIANTS[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}
