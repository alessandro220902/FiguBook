import { Outlet } from 'react-router-dom'
import { LayoutDashboard, BookOpen, ArrowLeftRight, Users } from 'lucide-react'
import { TubelightNav, type NavItem } from '@/components/layout/TubelightNav'

// Shell condivisa: nav unica scritta una volta, riusata sulle 4 sezioni private.
const NAV: NavItem[] = [
  { name: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { name: 'Album', url: '/album', icon: BookOpen },
  { name: 'Scambi', url: '/scambi', icon: ArrowLeftRight },
  { name: 'Community', url: '/community', icon: Users },
]

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TubelightNav items={NAV} />
      {/* pb per non finire sotto la bottom-bar mobile; pt per la nav desktop in alto */}
      <main className="px-5 pb-28 pt-8 sm:px-10 sm:pt-28">
        <Outlet />
      </main>
    </div>
  )
}
