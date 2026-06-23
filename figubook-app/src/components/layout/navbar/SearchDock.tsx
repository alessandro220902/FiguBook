import { AnimatePresence, motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { useState } from 'react'

// Adattato da moumensoliman/expanding-search-dock (21st). Per ora la ricerca
// vera (album + carte) arriva nello slice 2: qui c'è la lente che si espande
// in dock. onSearch resta agganciabile.
export function SearchDock({ onSearch, placeholder = 'Cerca album o carte…' }: { onSearch?: (q: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (q.trim()) onSearch?.(q.trim())
  }

  return (
    <div className="relative">
      <AnimatePresence mode="wait" initial={false}>
        {!open ? (
          <motion.button
            key="icon"
            type="button"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => setOpen(true)}
            aria-label="Cerca"
            className="grid h-10 w-10 place-items-center rounded-full text-foreground transition-colors hover:bg-white/8"
          >
            <Search className="h-5 w-5" />
          </motion.button>
        ) : (
          <motion.form
            key="input"
            initial={{ width: 40, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onSubmit={submit}
            className="flex items-center gap-2 overflow-hidden rounded-full border border-white/12 bg-white/[0.06] pr-1 backdrop-blur-md"
          >
            <span className="ml-3 text-muted-foreground"><Search className="h-4 w-4" /></span>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={placeholder}
              className="h-10 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={() => { setOpen(false); setQ('') }}
              aria-label="Chiudi ricerca"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
