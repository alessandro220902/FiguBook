import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useProfile } from '@/hooks/useProfile'
import { showCompleteBanner, profileCompletion } from '@/lib/profile/status'

// Promemoria perenne (non chiudibile a mano): sparisce solo a profilo completo (100%).
export function CompleteProfileBanner() {
  const { profile, loading } = useProfile()
  if (loading || !showCompleteBanner(profile)) return null
  const pct = profileCompletion(profile)

  return (
    <Link
      to="/onboarding"
      className="group mb-6 flex items-center gap-4 rounded-2xl border border-lime/25 bg-lime/[0.06] px-5 py-4 transition-colors hover:border-lime/40"
    >
      {/* Anello percentuale */}
      <div className="relative grid h-12 w-12 shrink-0 place-items-center">
        <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
          <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-lime/15" />
          <circle
            cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
            className="text-lime" strokeDasharray={`${(pct / 100) * 100.5} 100.5`}
          />
        </svg>
        <span className="absolute text-[11px] font-bold text-lime">{pct}%</span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-ink">Completa il tuo profilo</p>
        <p className="mt-0.5 text-sm text-ink-2">
          Comune, CAP, squadra e avatar: ti trovano più facilmente e sei più riconoscibile.
        </p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-lime">
        Completa <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}
