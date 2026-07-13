import { useEffect } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { rememberReferrer } from '@/lib/invite/referrer'

export default function InvitaLanding() {
  const { username = '' } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const clean = username.trim()

  useEffect(() => {
    if (!user && clean) rememberReferrer(clean)
  }, [user, clean])

  if (user) return <Navigate to={`/u/${clean}`} replace />

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="type-body text-ink-2">Sei stato invitato su FiguBook da</p>
      <h1 className="type-h1 mt-2 text-ink">@{clean}</h1>
      <p className="type-body mt-4 text-ink-2">
        Colleziona figurine, scambia doppioni e trova altri collezionisti.
      </p>
      <button
        onClick={() => navigate('/login?r=1')}
        className="group mt-8 inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3 font-semibold text-lime-ink transition-opacity hover:opacity-90"
      >
        Registrati
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </button>
    </div>
  )
}
