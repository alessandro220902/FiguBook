import { Link, useLocation } from 'react-router-dom'
import { Home, BookOpen, ArrowLeftRight, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './ThemeToggle'
import { FluidMenu } from './FluidMenu'
import { NotificationsBell } from './NotificationsBell'
import { SearchDock } from './SearchDock'
import { ProfileChip } from './ProfileChip'

interface Item { name: string; url: string; icon: LucideIcon }
const NAV: Item[] = [
  { name: 'Home', url: '/home', icon: Home },
  { name: 'Album', url: '/album', icon: BookOpen },
  { name: 'Scambi', url: '/scambi', icon: ArrowLeftRight },
  { name: 'Community', url: '/community', icon: Users },
]

// Navbar stile Netflix: solo desktop+iPad (>=md). Su telefono resta la bottom-nav.
// La ricerca (search-dock) arriva nello slice 2.
export function DesktopNavbar() {
  const { pathname } = useLocation()
  return (
    <nav className="fixed inset-x-0 top-0 z-50 hidden h-20 items-center gap-4 px-6 md:flex">
      {/* Sfondo sfumato in un layer separato: il mask sfuma solo lo sfondo, NON
          il contenuto (le voci FluidMenu / i dropdown che scendono sotto la nav). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-bg/85 via-bg/45 to-transparent [backdrop-filter:blur(6px)] [mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
      />
      {/* sinistra: logo + nome */}
      <Link to="/home" className="flex shrink-0 items-center gap-2.5">
        <span className="grid h-9 w-9 -rotate-6 place-items-center rounded-[10px] bg-lime font-display text-xl font-extrabold text-lime-ink">F</span>
        <span className="font-display text-xl font-extrabold tracking-tight">FiguBook</span>
      </Link>

      {/* identità: avatar + username (ring colore squadra), cliccabile -> profilo */}
      <ProfileChip />

      {/* centro: voci + notifiche */}
      <div className="flex flex-1 items-center justify-center gap-1.5">
        <SearchDock />
        {NAV.map((item) => {
          const active = pathname === item.url || pathname.startsWith(item.url + '/')
          return (
            <Link
              key={item.name}
              to={item.url}
              className={cn(
                'inline-flex h-10 items-center rounded-full border px-5 text-[15px] font-medium text-foreground transition-colors',
                active
                  ? 'border-lime/30 bg-[linear-gradient(165deg,color-mix(in_srgb,var(--color-lime)_26%,transparent),color-mix(in_srgb,var(--color-lime)_10%,transparent)_60%,transparent)]'
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
