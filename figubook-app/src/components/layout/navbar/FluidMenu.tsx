import { useEffect, useRef, useState } from 'react'
import { Menu, X, User, Settings, LifeBuoy, LogOut } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { auth } from '@/lib/firebase'

// Adattato da deepaksslibra/fluid-menu (21st): stack verticale di cerchi
// sovrapposti che si apre con transizione fluida. Solo icone. Dark + lime.
const SIZE = 52  // diametro cerchio
const STEP = 40  // passo verticale (overlap -> effetto blob)

interface Item { title: string; icon: LucideIcon; onClick: () => void }

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

  const items: Item[] = [
    { title: 'Profilo', icon: User, onClick: () => {} },
    { title: 'Impostazioni', icon: Settings, onClick: () => {} },
    { title: 'Supporto', icon: LifeBuoy, onClick: () => {} },
    { title: 'Esci', icon: LogOut, onClick: logout },
  ]

  const circle =
    'absolute left-0 top-0 grid place-items-center rounded-full border border-white/10 bg-card text-foreground shadow-lg'

  return (
    <div ref={ref} className="relative" style={{ width: SIZE, height: SIZE }}>
      {/* trigger: sempre visibile, sopra a tutti */}
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="absolute left-0 top-0 z-50 grid place-items-center rounded-full bg-white/10 text-foreground transition-colors hover:bg-white/15"
        style={{ width: SIZE, height: SIZE }}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {items.map((it, i) => {
        const Icon = it.icon
        const last = i === items.length - 1
        return (
          <button
            key={it.title}
            type="button"
            title={it.title}
            aria-label={it.title}
            onClick={() => { it.onClick(); setOpen(false) }}
            className={circle + (it.title === 'Esci' ? ' text-destructive' : '')}
            style={{
              width: SIZE,
              height: SIZE,
              zIndex: 40 - i,
              transform: `translateY(${open ? (i + 1) * STEP : 0}px)`,
              opacity: open ? 1 : 0,
              pointerEvents: open ? 'auto' : 'none',
              clipPath: last ? 'circle(50% at 50% 50%)' : 'circle(50% at 50% 58%)',
              transition: `transform ${open ? 300 : 300}ms cubic-bezier(.4,0,.2,1), opacity ${open ? 300 : 350}ms`,
              backfaceVisibility: 'hidden',
            }}
          >
            <Icon className={'h-5 w-5 ' + (it.title === 'Esci' ? 'text-destructive' : 'text-lime')} />
          </button>
        )
      })}
    </div>
  )
}
