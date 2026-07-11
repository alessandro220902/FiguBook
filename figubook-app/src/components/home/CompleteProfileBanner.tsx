import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useProfile } from '@/hooks/useProfile'
import { showCompleteBanner } from '@/lib/profile/status'

// Promemoria perenne (non chiudibile a mano): sparisce solo quando il comune è valido.
export function CompleteProfileBanner() {
  const { profile, loading } = useProfile()
  if (loading || !showCompleteBanner(profile)) return null

  return (
    <Link
      to="/onboarding"
      className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-lime/25 bg-lime/[0.06] px-5 py-4 transition-colors hover:border-lime/40"
    >
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-ink">Completa il tuo profilo</p>
        <p className="mt-0.5 text-sm text-ink-2">
          Aggiungi il tuo comune per trovare collezionisti vicino a te.
        </p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-lime">
        Completa <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  )
}
