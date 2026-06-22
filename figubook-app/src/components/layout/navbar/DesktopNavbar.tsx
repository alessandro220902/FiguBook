import { Link, useLocation } from 'react-router-dom'
import { Home, BookOpen, ArrowLeftRight, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './ThemeToggle'
import { FluidMenu } from './FluidMenu'
import { NotificationsBell } from './NotificationsBell'

interface Item { name: string; url: string; icon: LucideIcon }
const NAV: Item[] = [
  { name: 'Home', url: '/dashboard', icon: Home },
  { name: 'Album', url: '/album', icon: BookOpen },
  { name: 'Scambi', url: '/scambi', icon: ArrowLeftRight },
  { name: 'Community', url: '/community', icon: Users },
]

// Navbar stile Netflix: solo desktop+iPad (>=md). Su telefono resta la bottom-nav.
// La ricerca (search-dock) arriva nello slice 2.
export function DesktopNavbar() {
  const { pathname } = useLocation()
  return (
    <nav className="fixed inset-x-0 top-0 z-50 hidden h-16 items-center gap-4 border-b border-white/[0.06] bg-neutral-950/80 px-6 backdrop-blur-lg md:flex">
      {/* sinistra: logo + nome */}
      <Link to="/dashboard" className="flex shrink-0 items-center gap-2.5">
        <span className="grid h-9 w-9 -rotate-6 place-items-center rounded-[10px] bg-lime font-display text-xl font-extrabold text-lime-ink">F</span>
        <span className="font-display text-xl font-extrabold tracking-tight">FiguBook</span>
      </Link>

      {/* centro: voci + notifiche */}
      <div className="flex flex-1 items-center justify-center gap-1.5">
        {NAV.map((item) => {
          const active = pathname === item.url || pathname.startsWith(item.url + '/')
          return (
            <Link
              key={item.name}
              to={item.url}
              className={cn(
                'inline-flex h-10 items-center rounded-full border px-5 text-[15px] font-medium text-white transition-colors',
                active
                  ? 'border-lime/30 bg-[linear-gradient(165deg,#2c3a18,#1a2410_60%,#141c0d)] font-semibold'
                  : 'border-transparent hover:bg-white/[0.06]',
              )}
            >
              {item.name}
            </Link>
          )
        })}
        <NotificationsBell />
      </div>

      {/* destra: tema + menu fluido */}
      <div className="flex shrink-0 items-center gap-2.5">
        <ThemeToggle />
        <FluidMenu />
      </div>
    </nav>
  )
}
