import { Outlet, Link } from 'react-router-dom'
import { Home, BookOpen, ArrowLeftRight, Users } from 'lucide-react'
import { TubelightNav, type NavItem } from '@/components/layout/TubelightNav'
import { TopRightMenu } from '@/components/layout/TopRightMenu'
import { DesktopNavbar } from '@/components/layout/navbar/DesktopNavbar'

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
    <div className="relative min-h-screen text-foreground">
      {/* Sfondo unico app: radiale verde-rosso (21st reapollo background-radial-green-red),
          full-screen fisso. Verde in alto-sx, rosso in basso, base neutral-950. */}
      <div className="fixed inset-0 -z-10 bg-neutral-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_40%_-10%,rgba(16,185,129,0.3),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_60%_120%,rgba(239,68,68,0.25),transparent)]" />
      </div>

      {/* Navbar Netflix-style: solo desktop+iPad (>=md) */}
      <DesktopNavbar />

      {/* Cluster mobile (telefono, <md): logo + bottom-nav + menu destro */}
      <div className="md:hidden">
        <Link to="/dashboard" className="fixed left-4 top-4 z-50 flex items-center gap-2 sm:left-6 sm:top-6">
          <span className="grid h-9 w-9 -rotate-6 place-items-center rounded-[10px] bg-lime font-display text-xl font-extrabold text-lime-ink">
            F
          </span>
          <span className="hidden font-display text-xl font-extrabold tracking-tight sm:inline">FiguBook</span>
        </Link>
        <TubelightNav items={NAV} />
        <TopRightMenu />
      </div>

      {/* pt: cluster (mobile) / navbar h-16 (desktop). pb: bottom-bar mobile */}
      <main className="px-5 pb-28 pt-20 sm:px-10 md:pb-12 md:pt-24">
        <Outlet />
      </main>
    </div>
  )
}
