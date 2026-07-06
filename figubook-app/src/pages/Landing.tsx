import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid, CheckSquare, ArrowLeftRight, Image as ImageIcon } from 'lucide-react'
import { ALBUM_CATALOG } from '@/data/albumCatalog'
import { ArcGalleryHero } from '@/components/landing/ArcGalleryHero'

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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const raf = requestAnimationFrame(() => setShown(true))
      return () => cancelAnimationFrame(raf)
    }
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

// Copertine per l'arco hero: prende le cover disponibili dal catalogo e le ripete
// per riempire il ventaglio (~13 card) mantenendo un ordine vario.
const HERO_COVERS: string[] = (() => {
  const covers = ALBUM_CATALOG.map((a) => a.cover).filter((c): c is string => Boolean(c))
  if (covers.length === 0) return []
  const out: string[] = []
  for (let i = 0; out.length < 13; i++) out.push(covers[i % covers.length])
  return out
})()

const STEPS = [
  {
    icon: LayoutGrid,
    t: 'Scegli l’album',
    d: 'Oltre 100 raccolte pronte — Calciatori, Adrenalyn, Mondiali e altre. Aprine una in un tap, o creala tu.',
  },
  {
    icon: CheckSquare,
    t: 'Segna possedute e doppioni',
    d: 'Inserimento rapido: tocca i numeri che hai attaccato e quelli in doppia. Mancanti e doppie si aggiornano da sole.',
  },
  {
    icon: ArrowLeftRight,
    t: 'Trova scambi e completa',
    d: 'FiguBook ti abbina a chi ha ciò che ti manca e cerca ciò che hai in più. Proponi lo scambio e chiudi l’album.',
  },
]

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
              className="rounded-full border border-white/25 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/12 active:bg-white active:text-neutral-900"
            >
              Accedi
            </Link>
            <Link
              to="/login?r=1"
              className="rounded-full border border-lime/70 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-lime/10 active:scale-[0.98]"
            >
              Registrati
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO (Arc Gallery: ventaglio di copertine album) ── */}
      <section className="px-6 pt-6 pb-20 md:pb-28">
        <ArcGalleryHero
          images={HERO_COVERS}
          title={<>Chiudi l’album. <span className="italic text-lime">Una doppia alla volta.</span></>}
          subtitle="FiguBook tiene il conto della tua collezione, ti dice cosa ti manca e ti fa scambiare i doppioni con altri collezionisti. Gratis, senza abbonamenti."
          actions={
            <>
              <Link
                to="/login?r=1"
                className="rounded-full border border-lime/70 px-6 py-3 text-[15px] font-bold text-white transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-lime/10 active:scale-[0.98]"
              >
                Inizia gratis
              </Link>
              <a
                href="#funziona"
                className="text-[15px] font-semibold text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Scopri come funziona
              </a>
            </>
          }
        />
      </section>

      {/* ── FEATURES (blocco editoriale, niente card uguali) ── */}
      {/* ── COME FUNZIONA (3 passi) ── */}
      <section id="funziona" className="border-t border-white/8">
        <div className="mx-auto max-w-[1240px] px-6 py-20 md:py-28">
          <Reveal>
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-lime">Come funziona</p>
            <h2 className="mt-3 max-w-[18ch] text-balance text-[clamp(1.9rem,4vw,3rem)] font-bold leading-[1.04] tracking-[-0.02em]">
              Dall’album vuoto agli scambi, in tre passi.
            </h2>
          </Reveal>
          <div className="mt-14 flex flex-col gap-16 md:gap-24">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              const flip = i % 2 === 1
              return (
                <Reveal key={s.t}>
                  <div className={'grid items-center gap-x-12 gap-y-8 md:grid-cols-2'}>
                    {/* testo */}
                    <div className={flip ? 'md:order-2 md:pl-6' : 'md:pr-6'}>
                      <div className="flex items-center gap-4">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-lime/40 font-display text-lg font-bold text-lime">
                          {i + 1}
                        </span>
                        <Icon className="h-6 w-6 text-lime" strokeWidth={1.5} />
                      </div>
                      <h3 className="mt-5 text-[clamp(1.5rem,2.6vw,2rem)] font-bold tracking-tight">{s.t}</h3>
                      <p className="mt-3 max-w-[44ch] text-[16px] leading-relaxed text-ink-2">{s.d}</p>
                    </div>
                    {/* placeholder immagine (screenshot in arrivo) */}
                    <div className={flip ? 'md:order-1' : ''}>
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-[color:var(--card-hair)] bg-[linear-gradient(160deg,#171717,#111)] shadow-[var(--card-shadow)]">
                        <div className="absolute inset-0 grid place-items-center text-center">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <ImageIcon className="h-8 w-8" strokeWidth={1.25} />
                            <span className="text-xs font-medium tracking-wide">Anteprima in arrivo</span>
                          </div>
                        </div>
                        <span className="pointer-events-none absolute left-4 top-4 rounded-full border border-lime/30 px-2.5 py-1 text-[11px] font-semibold text-lime">
                          Passo {i + 1}
                        </span>
                      </div>
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── VANTAGGI (perché) ── */}
      <section className="border-t border-white/8">
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
              className="inline-block rounded-full border border-lime/70 px-8 py-3.5 text-[15px] font-bold text-white transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-lime/10 active:scale-[0.98]"
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
