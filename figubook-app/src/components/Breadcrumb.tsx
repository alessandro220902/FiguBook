import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export interface Crumb {
  label: string
  to?: string
}

// Breadcrumb minimale (stile 21st): voci linkate separate da chevron, ultima
// = pagina corrente (non linkata, alto contrasto). aria-current sull'ultima.
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        {items.map((it, i) => {
          const last = i === items.length - 1
          return (
            <li key={i} className="flex items-center gap-1.5">
              {it.to && !last ? (
                <Link to={it.to} className="text-muted-foreground transition-colors hover:text-ink">
                  {it.label}
                </Link>
              ) : (
                <span className={last ? 'font-semibold text-ink' : 'text-muted-foreground'} aria-current={last ? 'page' : undefined}>
                  {it.label}
                </span>
              )}
              {!last && <ChevronRight size={14} className="text-muted-foreground/60" aria-hidden />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
