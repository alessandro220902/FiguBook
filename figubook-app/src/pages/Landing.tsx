import { Link } from 'react-router-dom'
import { ArrowRight, Wallet, Layers, Users, BookOpen } from 'lucide-react'
import { ALBUM_CATALOG } from '@/data/albumCatalog'

function manageCookies() {
  localStorage.removeItem('figubook.cookieConsent')
  location.reload()
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#080a08] text-[#f4efe6]">
      {/* ── NAV ── */}
      <header className="border-b border-white/5">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 -rotate-6 place-items-center rounded-[10px] bg-lime font-display text-xl font-extrabold text-lime-ink">
              F
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight">FiguBook</span>
          </div>

          {/* Accedi */}
          <Link
            to="/login"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-[#f4efe6] transition-colors hover:border-white/25 hover:bg-white/5"
          >
            Accedi
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="mx-auto max-w-[1100px] px-6 py-16 md:py-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* LEFT — copy */}
          <div className="flex flex-col gap-6">
            {/* eyebrow pill */}
            <div className="flex w-fit items-center gap-2 rounded-full border border-lime/30 bg-lime/10 px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-lime">
              <span className="h-[6px] w-[6px] rounded-full bg-lime" />
              Gratis per collezionisti
            </div>

            <h1 className="m-0 font-display text-5xl font-bold leading-[1.04] tracking-[-0.03em] md:text-6xl">
              Chiudi l&apos;album{' '}
              <em className="block font-serif font-normal italic text-lime">
                senza comprare pacchetti alla cieca.
              </em>
            </h1>

            <p className="max-w-[42ch] text-base leading-relaxed text-muted-foreground">
              Traccia la collezione, individua le doppie e scambia con altri collezionisti. Gratis.
            </p>

            {/* CTA row */}
            <div className="flex flex-wrap gap-3">
              <Link
                to="/login?r=1"
                className="flex items-center gap-2 rounded-xl bg-lime px-5 py-3 font-semibold text-lime-ink transition-[filter] hover:brightness-110"
              >
                Inizia gratis <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#funziona"
                className="flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 font-semibold text-[#f4efe6] transition-colors hover:border-white/30 hover:bg-white/5"
              >
                Scopri come funziona
              </a>
            </div>
          </div>

          {/* RIGHT — mockup avanzamento album */}
          <div className="flex justify-center md:justify-end">
            <div className="w-full max-w-[320px] rounded-2xl border border-white/10 bg-[#0c100c] p-6">
              {/* header row */}
              <div className="mb-5 flex items-center justify-between">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Album
                </span>
                <span className="rounded-full bg-lime/15 px-2.5 py-0.5 font-mono text-[11px] font-bold text-lime">
                  +1 figurina
                </span>
              </div>

              {/* album name */}
              <p className="mb-1 font-display text-lg font-bold leading-tight tracking-tight">
                Calciatori 2025/26
              </p>
              <p className="mb-5 font-mono text-[11px] text-muted-foreground">Panini · 784 figurine</p>

              {/* progress bar */}
              <div className="mb-2 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                <span>Completamento</span>
                <span className="font-bold text-[#f4efe6]">70%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[70%] rounded-full bg-lime" />
              </div>

              {/* sub-stats */}
              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/8 pt-5">
                {[
                  { label: 'Possedute', value: '549' },
                  { label: 'Mancanti', value: '235' },
                  { label: 'Doppie', value: '87' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                      {label}
                    </span>
                    <span className="font-display text-xl font-bold">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="funziona" className="mx-auto max-w-[1100px] px-6 py-16 md:py-24">
        {/* heading */}
        <div className="mb-10 flex flex-col gap-2">
          <h2 className="font-display text-3xl font-bold tracking-[-0.02em] md:text-4xl">
            Come funziona
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Tutto quello che ti serve per chiudere l&apos;album, in un posto solo.
          </p>
        </div>

        {/* bento grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* card 1 — wide (col-span-2) */}
          <div className="rounded-2xl border border-white/10 bg-[#0c100c] p-6 md:col-span-2">
            <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-lime/10 p-2 text-lime">
              <Wallet className="h-5 w-5" />
            </div>
            <h3 className="mb-2 font-display text-xl font-bold tracking-tight">Risparmia</h3>
            <p className="max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
              Smetti di comprare pacchetti alla cieca. Scambia i doppioni gratis e completa senza sprechi.
            </p>
          </div>

          {/* card 2 */}
          <div className="rounded-2xl border border-white/10 bg-[#0c100c] p-6">
            <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-lime/10 p-2 text-lime">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="mb-2 font-display text-xl font-bold tracking-tight">Trova le doppie</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Sai sempre cosa hai in più e cosa ti manca, aggiornato in tempo reale.
            </p>
          </div>

          {/* card 3 */}
          <div className="rounded-2xl border border-white/10 bg-[#0c100c] p-6">
            <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-lime/10 p-2 text-lime">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="mb-2 font-display text-xl font-bold tracking-tight">Scambia con persone reali</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Connettiti con altri collezionisti e chiudi gli scambi giusti.
            </p>
          </div>

          {/* card 4 */}
          <div className="rounded-2xl border border-white/10 bg-[#0c100c] p-6 md:col-span-2">
            <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-lime/10 p-2 text-lime">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="mb-2 font-display text-xl font-bold tracking-tight">Album sempre aggiornato</h3>
            <p className="max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
              Un tocco e la collezione è in pari, ovunque tu sia.
            </p>
          </div>
        </div>
      </section>

      {/* ── ALBUM IN EVIDENZA ── */}
      <section className="mx-auto max-w-[1100px] px-6 py-16 md:py-24">
        <div className="mb-10 flex flex-col gap-2">
          <h2 className="font-display text-3xl font-bold tracking-[-0.02em] md:text-4xl">
            Album in evidenza
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Gli album che puoi tracciare e scambiare già adesso.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {ALBUM_CATALOG.slice(0, 8).map((a) => (
            <div
              key={a.id}
              className="relative aspect-[3/4] overflow-hidden rounded-xl border border-white/10"
            >
              {a.cover ? (
                <img
                  src={a.cover}
                  alt={a.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div
                  className="h-full w-full"
                  style={{ background: `linear-gradient(135deg, ${a.c1}, ${a.c2})` }}
                />
              )}

              {/* bottom overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <p className="truncate text-sm font-semibold leading-tight text-white drop-shadow">
                  {a.title}
                </p>
                <span className="font-mono text-[10px] text-white/70">{a.total} figurine</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="mx-auto max-w-[1100px] px-6 py-16 md:py-24">
        <div className="rounded-3xl border border-lime/20 bg-lime/[0.06] p-10 text-center md:p-14">
          <h2 className="font-display text-4xl font-bold tracking-[-0.02em] md:text-5xl">
            Inizia a chiudere l&apos;album
          </h2>
          <p className="mx-auto mt-4 max-w-[48ch] text-base leading-relaxed text-muted-foreground">
            Traccia, scambia e completa — gratis, senza abbonamenti.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              to="/login?r=1"
              className="flex items-center gap-2 rounded-xl bg-lime px-6 py-3 font-semibold text-lime-ink transition-[filter] hover:brightness-110"
            >
              Inizia gratis <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-[1100px] px-6 py-10">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link
              to="/privacy"
              className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              to="/termini"
              className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-foreground"
            >
              Termini
            </Link>
            <Link
              to="/cookie"
              className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-foreground"
            >
              Cookie
            </Link>
            <button
              type="button"
              onClick={manageCookies}
              className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-foreground"
            >
              Gestisci cookie
            </button>
          </div>
          <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
            Non affiliato a Panini S.p.A. — strumento indipendente di tracking e scambio.
          </p>
        </div>
      </footer>
    </div>
  )
}
