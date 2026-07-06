import { useEffect } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { Home, BookOpen, ArrowLeftRight, Users, Search } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCollection } from '@/hooks/useCollection'
import { useThemeMode } from '@/hooks/useThemeMode'
import { touchStatsSnapshot } from '@/lib/db/statsHistory'
import { TubelightNav, type NavItem } from '@/components/layout/TubelightNav'
import { DesktopNavbar } from '@/components/layout/navbar/DesktopNavbar'
import { NotificationsBell } from '@/components/layout/navbar/NotificationsBell'
import { FluidMenu } from '@/components/layout/navbar/FluidMenu'
import { ProfileChip } from '@/components/layout/navbar/ProfileChip'

// Shell condivisa: nav unica scritta una volta, riusata sulle 4 sezioni private.
// Home (dashboard) usa l'icona casetta su mobile. Label "Home" come su desktop.
const NAV: NavItem[] = [
  { name: 'Home', url: '/home', icon: Home },
  { name: 'Album', url: '/album', icon: BookOpen },
  { name: 'Scambi', url: '/scambi', icon: ArrowLeftRight },
  { name: 'Community', url: '/community', icon: Users },
  { name: 'Cerca', url: '/cerca', icon: Search },
]

export function AppLayout() {
  // Snapshot stats "che insegue": upsert del giorno corrente su ogni cambio di
  // have/doubles, da qualsiasi sezione. Così le figurine restano attribuite al
  // giorno reale d'inserimento (non spinte al primo accesso successivo).
  const { user } = useAuth()
  const { totals, albums, loading, error } = useCollection()
  useEffect(() => {
    if (!user || loading || error || albums.length === 0) return
    void touchStatsSnapshot(user.uid, totals)
  }, [user, loading, error, albums.length, totals])

  // TEST Midnight Gold: scope oro esteso alla shell (nav inclusa) solo su Home.
  // Light/dark cablato al ThemeToggle via useThemeMode.
  const mode = useThemeMode()
  // Midnight Gold su tutta la shell app; light/dark cablato al ThemeToggle.
  const homeScope = ` home-gold${mode === 'light' ? ' home-light' : ''}`

  return (
    <div className={`relative min-h-screen text-foreground${homeScope}`}>
      {/* Sfondo unico app Midnight Gold: nero prevalente sfuma in oro; in chiaro crema->oro. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: mode === 'light'
            ? 'linear-gradient(180deg, #f4ecd8 0%, #ead9b2 40%, #d8be8a 78%, #c8a96e 100%)'
            : 'linear-gradient(180deg, #0f0f0f 0%, #141210 48%, #241d12 80%, #3d3018 100%)',
        }}
      />

      {/* Navbar Netflix-style: solo desktop+iPad (>=md) */}
      <DesktopNavbar />

      {/* Cluster mobile (telefono, <md): logo + bottom-nav + menu destro */}
      <div className="md:hidden">
        <div className="fixed left-4 top-4 z-50 flex items-center gap-1.5 sm:left-6 sm:top-6">
          <Link to="/home" className="flex items-center">
            <span className="grid h-9 w-9 -rotate-6 place-items-center rounded-[10px] bg-lime font-display text-xl font-extrabold text-lime-ink">
              F
            </span>
          </Link>
          <ProfileChip />
        </div>
        <TubelightNav items={NAV} />
        {/* Top-right mobile: notifiche live + FluidMenu (stesso menu del desktop) */}
        <div className="fixed right-4 top-4 z-50 flex items-center gap-2 sm:right-6 sm:top-6">
          <NotificationsBell asLink />
          <FluidMenu />
        </div>
      </div>

      {/* pt: cluster (mobile) / navbar h-16 (desktop). pb: bottom-bar mobile */}
      <main className="px-5 pb-28 pt-16 sm:px-10 md:pb-12 md:pt-24">
        <Outlet />
      </main>
    </div>
  )
}
