import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { needsVerification } from '@/lib/auth/verification'
import { needsOnboarding } from '@/lib/profile/status'

// Guardia rotte private: replica l'auth-guard globale del sito vecchio
// (firebase-init.js redirigeva a benvenuto). Non autenticato -> /login.
// Account email/password non verificato (post-cutoff) -> /verifica.
// Verificato ma profilo mai completato e mai visto l'onboarding -> /onboarding (una volta).
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const { profile, loading: profileLoading } = useProfile()
  const location = useLocation()

  if (loading)
    return (
      <div className="grid min-h-screen place-items-center bg-[#080a08] text-muted-foreground">
        Caricamento…
      </div>
    )
  if (!user) return <Navigate to="/login" replace />
  if (needsVerification(user)) return <Navigate to="/verifica" replace />

  // Decidi sull'onboarding solo a profilo caricato, e non sulla pagina stessa.
  if (!profileLoading && needsOnboarding(profile) && location.pathname !== '/onboarding')
    return <Navigate to="/onboarding" replace />

  return <>{children}</>
}
