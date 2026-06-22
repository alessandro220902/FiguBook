import { useEffect, useRef, useState } from 'react'
import { Menu, X, User, Settings, LifeBuoy, LogOut } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { auth } from '@/lib/firebase'

interface FluidItem {
  title: string
  icon: typeof User
  onClick: () => void
}

// Adattato da deepaksslibra/fluid-menu (21st): trigger che apre uno stack di
// pillole a comparsa (translateY + opacity, stagger). Dark + lime.
export function FluidMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!ref.current || ref.current.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  async function logout() {
    await signOut(auth)
    navigate('/login', { replace: true })
  }

  // Profilo/Impostazioni/Supporto placeholder (come prima); Esci attivo.
  const items: FluidItem[] = [
    { title: 'Profilo', icon: User, onClick: () => {} },
    { title: 'Impostazioni', icon: Settings, onClick: () => {} },
    { title: 'Supporto', icon: LifeBuoy, onClick: () => {} },
    { title: 'Esci', icon: LogOut, onClick: logout },
  ]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid h-10 w-10 place-items-center rounded-full bg-white/8 text-foreground transition-colors hover:bg-white/15"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <div className="absolute right-0 top-12 flex flex-col items-end gap-2">
        {items.map((it, i) => {
          const Icon = it.icon
          return (
            <button
              key={it.title}
              type="button"
              onClick={() => { it.onClick(); setOpen(false) }}
              style={{ transitionDelay: open ? `${i * 45}ms` : '0ms' }}
              className={
                'flex items-center gap-2.5 whitespace-nowrap rounded-full border border-white/10 bg-card px-3 py-2 text-sm font-medium text-foreground shadow-lg transition-[opacity,transform] duration-200 hover:bg-white/10 ' +
                (open ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0') +
                (it.title === 'Esci' ? ' text-destructive' : '')
              }
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-lime/15 text-lime">
                <Icon className="h-3.5 w-3.5" />
              </span>
              {it.title}
            </button>
          )
        })}
      </div>
    </div>
  )
}
