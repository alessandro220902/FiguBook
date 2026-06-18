import { Newspaper } from 'lucide-react'

// Riquadro "Notizie": nessuna fonte dati ancora -> empty-state onesto.
// Quando avremo un feed (novita' collezioni / app), popola qui.
export function NewsPanel() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/[0.08] bg-surface p-5 sm:p-6">
      <h2 className="text-base font-medium tracking-tight text-ink">Notizie</h2>
      <div className="mt-4 flex grow flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-4 py-8 text-center">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.05] text-muted">
          <Newspaper className="h-5 w-5" />
        </span>
        <p className="mt-3 text-sm text-ink-2">Nessuna novità al momento.</p>
        <p className="mt-1 text-xs text-muted">Le ultime su collezioni e scambi appariranno qui.</p>
      </div>
    </div>
  )
}
