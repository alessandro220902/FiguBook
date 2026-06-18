import { Outlet, Link } from 'react-router-dom'
import { Home, BookOpen, ArrowLeftRight, Users } from 'lucide-react'
import { TubelightNav, type NavItem } from '@/components/layout/TubelightNav'
import { TopRightMenu } from '@/components/layout/TopRightMenu'

// Shell condivisa: nav unica scritta una volta, riusata sulle 4 sezioni private.
// Dashboard usa l'icona casetta (Home) su mobile.
const NAV: NavItem[] = [
  { name: 'Dashboard', url: '/dashboard', icon: Home },
  { name: 'Album', url: '/album', icon: BookOpen },
  { name: 'Scambi', url: '/scambi', icon: ArrowLeftRight },
  { name: 'Community', url: '/community', icon: Users },
]

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* logo top-left */}
      <Link to="/dashboard" className="fixed left-4 top-4 z-50 flex items-center gap-2 sm:left-6 sm:top-6">
        <span className="grid h-9 w-9 -rotate-6 place-items-center rounded-[10px] bg-lime font-display text-xl font-extrabold text-lime-ink">
          F
        </span>
        <span className="hidden font-display text-xl font-extrabold tracking-tight sm:inline">FiguBook</span>
      </Link>

      <TubelightNav items={NAV} />
      <TopRightMenu />

      {/* pt per non finire sotto cluster (mobile) / nav (desktop); pb per bottom-bar mobile */}
      <main className="px-5 pb-28 pt-24 sm:px-10 sm:pt-36">
        <Outlet />
      </main>
    </div>
  )
}
