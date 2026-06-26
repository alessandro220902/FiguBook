import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ALBUM_CATALOG } from '@/data/albumCatalog'
import albumTeamImg from '@/assets/landing/album-team.png'
import albumStatsImg from '@/assets/landing/album-stats.png'

function manageCookies() {
  localStorage.removeItem('figubook.cookieConsent')
  location.reload()
}

const EASE = 'cubic-bezier(0.16,1,0.3,1)'

// Entrata fade-up al primo ingresso in viewport. Rispetta prefers-reduced-motion
// e ha un fallback timer: il contenuto non resta mai invisibile (anche headless).
function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(true); return }
    const el = ref.current
    const io = el
      ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { setShown(true); io!.disconnect() } }), { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })
      : null
    if (el && io) io.observe(el)
    const t = setTimeout(() => setShown(true), 900) // fallback anti-blank
    return () => { io?.disconnect(); clearTimeout(t) }
  }, [])
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : 'translateY(16px)',
        transition: `opacity 700ms ${EASE} ${delay}ms, transform 700ms ${EASE} ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

// Anteprima reale dell'app: screenshot della sezione album (squadra + statistiche),
// dentro una cornice "finestra app" per dare contesto.
function PreviewFrame({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-white/10 bg-[#0c100c] shadow-[0_30px_80px_-28px_rgba(0,0,0,0.9)]">
      <div className="flex items-center gap-1.5 border-b border-white/8 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <figcaption className="ml-2 text-[11px] font-medium tracking-tight text-muted-foreground">{caption}</figcaption>
      </div>
      <img src={src} alt={alt} loading="lazy" className="block w-full" />
    </figure>
  )
}

function AlbumPreview() {
  return (
    <div className="flex flex-col gap-4">
      <PreviewFrame src={albumTeamImg} alt="Sezione squadra: griglia figurine con doppie e mancanti" caption="Album · Sezione squadra" />
      <PreviewFrame src={albumStatsImg} alt="Statistiche album: completamento, possedute, mancanti, doppie" caption="Album · Statistiche" />
    </div>
  )
}

const FEATURES = [
  {
    t: 'Smetti di sprecare',
    d: 'Niente più pacchetti comprati alla cieca. Scambi i doppioni e completi l’album spendendo meno.',
  },
  {
    t: 'Doppie e mancanti, sempre chiare',
    d: 'In ogni momento sai cosa hai in più e cosa ti manca. La lista si aggiorna mentre attacchi.',
  },
  {
    t: 'Scambi con collezionisti veri',
    d: 'Trovi chi ha quello che cerchi e cerca quello che hai. Niente intermediari, niente costi.',
  },
  {
    t: 'La collezione in tasca',
    d: 'Un tocco e l’album è in pari, ovunque tu sia. Dalla bustina alla pagina, senza fogli e penne.',
  },
]

export default function Landing() {
  const covers = ALBUM_CATALOG.slice(0, 6)
  return (
    <div className="min-h-screen bg-[#080a08] text-[#f4efe6]">
      {/* ── NAV ── */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#080a08]/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 -rotate-6 place-items-center rounded-[9px] bg-lime text-lg font-extrabold text-lime-ink">
              F
            </span>
            <span className="text-xl font-extrabold tracking-tight">FiguBook</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <Link
              to="/login"
              className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-white/30 hover:bg-white/5"
            >
              Accedi
            </Link>
            <Link
              to="/login?r=1"
              className="rounded-lg border border-lime px-4 py-2 text-sm font-bold text-lime transition-colors hover:bg-lime/10 active:translate-y-px"
            >
              Registrati
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="mx-auto max-w-[1240px] px-6 pb-20 pt-14 md:pb-28 md:pt-20">
        <div className="grid items-center gap-x-12 gap-y-14 md:grid-cols-2">
          <Reveal>
            <h1 className="text-balance text-[clamp(2.6rem,6vw,4.4rem)] font-bold leading-[0.98] tracking-[-0.02em]">
              Chiudi l’album.{' '}
              <span className="italic text-lime">Una doppia alla volta.</span>
            </h1>
            <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-ink-2">
              FiguBook tiene il conto della tua collezione, ti dice cosa ti manca e ti fa
              scambiare i doppioni con altri collezionisti. Gratis, senza abbonamenti.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link
                to="/login?r=1"
                className="rounded-lg border border-lime px-6 py-3 text-[15px] font-bold text-lime transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-lime/10 active:scale-[0.98]"
              >
                Inizia gratis
              </Link>
              <a
                href="#funziona"
                className="text-[15px] font-semibold text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Scopri come funziona
              </a>
            </div>
          </Reveal>

          <Reveal delay={120} className="mx-auto w-full max-w-[460px] md:mx-0 md:ml-auto">
            <AlbumPreview />
          </Reveal>
        </div>
      </section>

      {/* ── FEATURES (blocco editoriale, niente card uguali) ── */}
      <section id="funziona" className="border-t border-white/8">
        <div className="mx-auto max-w-[1240px] px-6 py-20 md:py-28">
          <Reveal>
            <h2 className="max-w-[16ch] text-balance text-[clamp(1.9rem,4vw,3rem)] font-bold leading-[1.04] tracking-[-0.02em]">
              Collezionare senza il quaderno dei numeri.
            </h2>
          </Reveal>
          <div className="mt-12 grid border-t border-white/10 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <Reveal
                key={f.t}
                delay={(i % 2) * 90}
                className={
                  'border-b border-white/10 py-8 sm:py-10 ' +
                  (i % 2 === 0 ? 'sm:border-r sm:pr-10' : 'sm:pl-10')
                }
              >
                <h3 className="flex items-baseline gap-3 text-[22px] font-bold tracking-tight">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 self-start rounded-full bg-lime" />
                  {f.t}
                </h3>
                <p className="mt-3 max-w-[48ch] text-[15px] leading-relaxed text-ink-2">{f.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── ALBUM (scaffale copertine) ── */}
      <section className="border-y border-white/10 bg-[#0e130e]">
        <div className="mx-auto max-w-[1240px] px-6 py-20 md:py-28">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-[clamp(1.9rem,4vw,3rem)] font-bold leading-[1.04] tracking-[-0.02em]">
              Album che puoi tracciare oggi
            </h2>
            <p className="text-[15px] italic text-muted-foreground">e tanti altri in arrivo</p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5">
            {covers.map((a, i) => (
              <Reveal key={a.id} delay={(i % 3) * 80}>
                <Link
                  to="/login?r=1"
                  aria-label={`Traccia ${a.title}`}
                  className="group relative block aspect-[3/4] overflow-hidden rounded-xl border border-white/10 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1"
                >
                  {a.cover ? (
                    <img
                      src={a.cover}
                      alt={a.title}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                      style={{ background: `linear-gradient(150deg, ${a.c1}, ${a.c2})` }}
                    />
                  )}
                  {/* vignetta per leggibilità + ring interno per tattilità */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/30" />
                  <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
                  {/* contenuto copertina */}
                  <div className="absolute inset-0 flex flex-col justify-between p-4">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">
                      {a.editor}
                    </span>
                    <div>
                      <h3 className="text-balance text-[19px] font-bold leading-[1.05] tracking-tight text-white drop-shadow">
                        {a.title}
                      </h3>
                      <div className="mt-1.5 h-px w-8 bg-lime transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-16" />
                      {/* delight: lo stato a riposo mostra il conteggio, l'hover invita all'azione */}
                      <div className="mt-1.5 grid">
                        <p className="col-start-1 row-start-1 text-[12px] italic text-white/70 transition-opacity duration-300 group-hover:opacity-0">
                          {a.total} figurine
                        </p>
                        <p className="col-start-1 row-start-1 translate-y-1 text-[12px] font-semibold text-lime opacity-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-hover:opacity-100">
                          Traccia questo album →
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINALE ── */}
      <section className="border-t border-white/8">
        <Reveal className="mx-auto max-w-[1240px] px-6 py-24 text-center md:py-32">
          <h2 className="mx-auto max-w-[18ch] text-balance text-[clamp(2.2rem,5vw,3.6rem)] font-bold leading-[1.02] tracking-[-0.02em]">
            La tua raccolta merita di essere <span className="italic text-lime">completata.</span>
          </h2>
          <div className="mt-10">
            <Link
              to="/login?r=1"
              className="inline-block rounded-lg border border-lime px-8 py-3.5 text-[15px] font-bold text-lime transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-lime/10 active:scale-[0.98]"
            >
              Inizia gratis
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-6 py-9 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-muted-foreground">
            <Link to="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
            <Link to="/termini" className="transition-colors hover:text-foreground">Termini</Link>
            <Link to="/cookie" className="transition-colors hover:text-foreground">Cookie</Link>
            <button type="button" onClick={manageCookies} className="transition-colors hover:text-foreground">
              Gestisci cookie
            </button>
          </div>
          <p className="text-[12px] italic text-muted-foreground">
            Non affiliato a Panini S.p.A. — strumento indipendente.
          </p>
        </div>
      </footer>
    </div>
  )
}
