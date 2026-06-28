import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Repeat, ShieldCheck } from 'lucide-react'
import { FadeIn } from '@/components/home/FadeIn'

type Tab = 'scambi' | 'privacy'

const TABS: { id: Tab; label: string; icon: typeof Repeat }[] = [
  { id: 'scambi', label: 'Scambi', icon: Repeat },
  { id: 'privacy', label: 'Privacy', icon: ShieldCheck },
]

export default function ProfiloImpostazioni() {
  const [tab, setTab] = useState<Tab>('scambi')

  return (
    <div className="mx-auto w-full max-w-3xl">
      <FadeIn>
        <Link
          to="/profilo"
          className="inline-flex items-center gap-1.5 text-sm text-ink-2 transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Profilo
        </Link>
        <h1 className="mt-3 font-display text-[34px] font-semibold tracking-tight text-ink sm:text-[42px]">
          Impostazioni
        </h1>
        <p className="mt-1.5 text-base text-ink-2">
          Nome, avatar e bio si modificano dal profilo. Qui le preferenze di scambio e privacy.
        </p>

        {/* Tab */}
        <div className="mt-6 flex gap-1.5 rounded-2xl border border-white/[0.08] bg-surface p-1">
          {TABS.map((t) => {
            const Icon = t.icon
            const on = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={
                  'flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors ' +
                  (on ? 'bg-lime text-lime-ink' : 'text-ink-2 hover:text-ink')
                }
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            )
          })}
        </div>
      </FadeIn>

      <FadeIn>
        <div className="mt-6 rounded-2xl border border-white/[0.08] bg-surface px-5 py-10 text-center">
          <p className="text-base font-medium text-ink">
            {tab === 'scambi' ? 'Preferenze di scambio' : 'Privacy e visibilità'}
          </p>
          <p className="mt-1.5 text-sm text-ink-2">In arrivo.</p>
        </div>
      </FadeIn>
    </div>
  )
}
