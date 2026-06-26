import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

// Layout condiviso per i documenti legali (privacy, termini, cookie).
// Tono leggibile, stile coerente con l'app. Pubblico, nessun auth.
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#080a08] text-[#f4efe6]">
      <div className="mx-auto w-full max-w-[760px] px-6 py-12 sm:py-16">
        <Link
          to="/login"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Torna indietro
        </Link>

        <h1 className="m-0 font-display text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
          Ultimo aggiornamento: {updated}
        </p>

        <div className="legal-prose mt-10 space-y-6 text-[15px] leading-relaxed text-[#d8d2c6]">
          {children}
        </div>

        <div className="mt-14 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-6 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link to="/termini" className="hover:text-foreground">Termini</Link>
          <Link to="/cookie" className="hover:text-foreground">Cookie</Link>
        </div>
      </div>
    </div>
  )
}

// Titolo di sezione + corpo, stile uniforme.
export function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">{heading}</h2>
      {children}
    </section>
  )
}
