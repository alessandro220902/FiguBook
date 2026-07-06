import { Newspaper } from 'lucide-react'

// Riquadro "Notizie": nessuna fonte dati ancora -> empty-state onesto.
// Quando avremo un feed (novita' collezioni / app), popola qui.
export function NewsPanel() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-[color:var(--card-hair)] bg-surface p-5 shadow-[var(--card-shadow)] sm:p-6">
      <h2 className="type-section">Notizie</h2>
      <div className="mt-4 flex grow flex-col items-center justify-center rounded-xl border border-dashed border-[color:var(--card-hair-strong)] px-4 py-8 text-center">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--chip-fill)] text-muted-foreground">
          <Newspaper className="h-5 w-5" />
        </span>
        <p className="mt-3 text-sm text-ink-2">Nessuna novità al momento.</p>
        <p className="mt-1 text-xs text-muted-foreground">Le ultime su collezioni e scambi appariranno qui.</p>
      </div>
    </div>
  )
}
