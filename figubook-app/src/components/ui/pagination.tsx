import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

const btn =
  'inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-white/10 px-2 text-sm font-medium text-ink-2 transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime'

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Paginazione">
      <button type="button" className={btn} disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Precedente">
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </button>
      {pages.map((p) => {
        const on = p === page
        return (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-label={`Pagina ${p}`}
            aria-current={on ? 'page' : undefined}
            className={cn(btn, on && 'border-lime bg-lime text-lime-ink hover:text-lime-ink')}
          >
            {p}
          </button>
        )
      })}
      <button type="button" className={btn} disabled={page === totalPages} onClick={() => onChange(page + 1)} aria-label="Successiva">
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </nav>
  )
}
