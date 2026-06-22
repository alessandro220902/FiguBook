import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

// Adattato da ayushmxxn/theme-toggle (21st). Per ora SOLO UI: l'app è dark-only,
// il tema chiaro è un lavoro a parte. Il toggle non cambia ancora il tema.
export function ThemeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = useState(true)
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Cambia tema"
      onClick={() => setIsDark((v) => !v)}
      className={cn(
        'flex h-8 w-16 cursor-pointer rounded-full p-1 transition-all duration-300',
        isDark ? 'border border-zinc-800 bg-zinc-950' : 'border border-zinc-200 bg-white',
        className,
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div className={cn('flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-300', isDark ? 'translate-x-0 bg-zinc-800' : 'translate-x-8 bg-gray-200')}>
          {isDark ? <Moon className="h-4 w-4 text-white" strokeWidth={1.5} /> : <Sun className="h-4 w-4 text-gray-700" strokeWidth={1.5} />}
        </div>
        <div className={cn('flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-300', isDark ? 'bg-transparent' : '-translate-x-8')}>
          {isDark ? <Sun className="h-4 w-4 text-gray-500" strokeWidth={1.5} /> : <Moon className="h-4 w-4 text-black" strokeWidth={1.5} />}
        </div>
      </div>
    </div>
  )
}
