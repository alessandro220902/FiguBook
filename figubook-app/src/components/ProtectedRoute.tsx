import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

// Guardia rotte private: replica l'auth-guard globale del sito vecchio
// (firebase-init.js redirigeva a benvenuto). Non autenticato -> /login.
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading)
    return (
      <div className="grid min-h-screen place-items-center bg-[#080a08] text-muted-foreground">
        Caricamento…
      </div>
    )
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
