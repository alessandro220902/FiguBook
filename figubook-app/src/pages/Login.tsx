import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  getAdditionalUserInfo,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react'

import { auth, db, googleProvider } from '@/lib/firebase'
import { mapFirebaseError } from '@/lib/authErrors'
import { useAuth } from '@/hooks/useAuth'
import { registerWithEmail } from '@/lib/auth/register'
import { needsVerification } from '@/lib/auth/verification'

// sfondo dot-matrix caricato lazy (porta three.js fuori dal bundle iniziale)
const CanvasRevealEffect = lazy(() =>
  import('@/components/ui/dot-matrix-bg').then((m) => ({ default: m.CanvasRevealEffect })),
)

// 19 slogan [testo, accento corsivo]
const SLOGANS: [string, string][] = [
  ['Ce l’ho, ce l’ho, manca…', 'ma non per molto.'],
  ['La tua collezione,', 'sempre in tasca.'],
  ['Trova le doppie,', 'chiudi l’album.'],
  ['Ogni figurina', 'al posto giusto.'],
  ['Scambia con chi', 'ce l’ha davvero.'],
  ['Dalla bustina', 'all’album, in un tocco.'],
  ['Le doppie non', 'restano in un cassetto.'],
  ['Conta una volta,', 'ricorda per sempre.'],
  ['L’album cresce', 'a ogni scambio.'],
  ['Niente più', 'fogli e penne.'],
  ['Sai sempre', 'cosa ti manca.'],
  ['Più scambi,', 'meno doppioni.'],
  ['La community', 'che colleziona con te.'],
  ['Apri la bustina,', 'aggiorna l’album.'],
  ['Dai un senso', 'a ogni doppia.'],
  ['Cerca, trova,', 'scambia.'],
  ['Il tuo album,', 'ovunque tu sia.'],
  ['Completa la raccolta', 'un tocco alla volta.'],
  ['Colleziona oggi,', 'scambia domani.'],
]

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-11.3 8c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.6 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3a12 12 0 0 1-7.3 2.5c-5.3 0-9.7-3.4-11.3-8L6.1 33C9.4 39.6 16.1 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.3 5.3c-.4.4 6.7-4.9 6.7-15 0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  )
}

type Mode = 'login' | 'register'

export default function Login() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [params] = useSearchParams()

  const [mode, setMode] = useState<Mode>(params.get('r') === '1' ? 'register' : 'login')
  const [slogIdx, setSlogIdx] = useState(0)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [remember, setRemember] = useState(true)

  const [regUser, setRegUser] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPass, setRegPass] = useState('')
  const [regTerms, setRegTerms] = useState(false)
  const [regErr, setRegErr] = useState('')

  const [showLoginPass, setShowLoginPass] = useState(false)
  const [showRegPass, setShowRegPass] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      navigate(needsVerification(user) ? '/verifica' : '/home', { replace: true })
    }
  }, [loading, user, navigate])

  useEffect(() => {
    const t = setInterval(() => setSlogIdx((i) => (i + 1) % SLOGANS.length), 4000)
    return () => clearInterval(t)
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginErr('')
    setBusy(true)
    try {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPass)
      navigate('/home', { replace: true })
    } catch (err) {
      setLoginErr(mapFirebaseError((err as { code?: string }).code))
    } finally {
      setBusy(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setRegErr('')
    setBusy(true)
    try {
      const username = regUser.trim()
      if (!username) {
        setRegErr('Inserisci un nome utente.')
        setBusy(false)
        return
      }
      await registerWithEmail({ username, email: regEmail.trim(), password: regPass, remember })
      navigate('/verifica', { replace: true })
    } catch (err) {
      setRegErr(mapFirebaseError((err as { code?: string }).code))
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogle(setErr: (m: string) => void) {
    setErr('')
    setBusy(true)
    try {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
      const cred = await signInWithPopup(auth, googleProvider)
      const u = cred.user
      // Scrivi il profilo SOLO al primo accesso: evita di sovrascrivere
      // un displayName scelto dall'utente a ogni re-login Google.
      if (getAdditionalUserInfo(cred)?.isNewUser) {
        const name = u.displayName || (u.email || '').split('@')[0]
        await setDoc(
          doc(db, 'users', u.uid, 'meta', 'profile'),
          { displayName: name, username: name, ts: Date.now() },
          { merge: true },
        )
      }
      navigate('/home', { replace: true })
    } catch (err) {
      setErr(mapFirebaseError((err as { code?: string }).code))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080a08] text-[#f4efe6]">
      {/* sfondo dot-matrix full-page */}
      <div className="pointer-events-none absolute inset-0">
        <Suspense fallback={null}>
          <CanvasRevealEffect
            colors={[[194, 242, 61], [31, 122, 89]]}
            dotSize={3}
            showGradient={false}
          />
        </Suspense>
        {/* velo per leggibilita' */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,transparent,rgba(8,10,8,.65)_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080a08] via-transparent to-[#080a08]/40" />
      </div>

      <div className="relative z-10 grid min-h-screen md:grid-cols-[1.05fr_0.95fr]">
      {/* ════ LEFT — manifesto ════ */}
      <section className="relative hidden flex-col overflow-hidden px-14 py-10 md:flex">

        <div className="relative z-10 flex items-center gap-3">
          <span className="grid h-10 w-10 -rotate-6 place-items-center rounded-[10px] bg-lime font-display text-2xl font-extrabold text-lime-ink shadow-[0_6px_14px_-2px_rgba(194,242,61,.6)]">
            F
          </span>
          <span className="font-display text-2xl font-extrabold tracking-tight">FiguBook</span>
        </div>

        <div className="relative z-10 mt-8 flex w-fit items-center gap-2.5 rounded-full border border-lime/35 bg-lime/10 px-3.5 py-2 font-mono text-[11.5px] font-semibold uppercase tracking-[0.1em] text-lime">
          <span className="dot-pulse h-[7px] w-[7px] rounded-full bg-lime shadow-[0_0_0_4px_rgba(194,242,61,.25)]" />
          La piattaforma sicura per famiglie e collezionisti di tutte le età
        </div>

        {/* slogan stage */}
        <div className="relative z-10 flex flex-1 flex-col justify-center py-6">
          <h1
            key={slogIdx}
            className="slogan-anim m-0 max-w-[14ch] font-display text-[clamp(38px,5.5vw,64px)] font-bold leading-[1.02] tracking-[-0.025em]"
          >
            {SLOGANS[slogIdx][0]}{' '}
            <em className="mt-1.5 block font-serif text-lime italic font-normal">
              {SLOGANS[slogIdx][1]}
            </em>
          </h1>
          <div className="mt-9 flex max-w-[540px] flex-wrap gap-1.5">
            {SLOGANS.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlogIdx(i)}
                aria-label={`Slogan ${i + 1}`}
                className={
                  'h-2 rounded-full transition-all ' +
                  (i === slogIdx ? 'w-[22px] bg-lime' : 'w-2 bg-[#2a241c] hover:bg-[#8a8275]')
                }
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-8 border-t border-[#2a241c] pt-5 font-mono text-[10.5px] uppercase leading-relaxed tracking-[0.1em] text-[#8a8275]">
          Sito non affiliato con Panini S.p.A.
          <br />
          Strumento di tracking della collezione e scambio fra utenti.
        </div>
      </section>

      {/* ════ RIGHT — auth ════ */}
      <section className="relative flex max-h-screen overflow-y-auto px-7 py-24 sm:px-14">
        <div className="absolute right-7 top-12 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground sm:right-14">
          {mode === 'login' ? (
            <>
              Non hai un account?{' '}
              <button onClick={() => setMode('register')} className="font-semibold text-foreground underline underline-offset-4">
                Registrati
              </button>
            </>
          ) : (
            <>
              Hai già un account?{' '}
              <button onClick={() => setMode('login')} className="font-semibold text-foreground underline underline-offset-4">
                Accedi
              </button>
            </>
          )}
        </div>

        <div className="m-auto w-full max-w-[440px] rounded-3xl border border-white/10 bg-[#0c100c]/70 p-7 shadow-2xl backdrop-blur-xl sm:p-9">
          {/* brand mobile */}
          <div className="mb-6 flex items-center gap-3 md:hidden">
            <span className="grid h-9 w-9 -rotate-6 place-items-center rounded-[10px] bg-lime font-display text-xl font-extrabold text-lime-ink">F</span>
            <span className="font-display text-xl font-extrabold tracking-tight">FiguBook</span>
          </div>

          <h1 className="m-0 font-display text-[42px] font-bold leading-none tracking-[-0.025em]">
            {mode === 'login' ? 'Bentornato' : 'Crea il tuo account'}
          </h1>
          <p className="mb-7 mt-1.5 text-sm text-muted-foreground">
            {mode === 'login' ? 'Accedi al tuo album e ai tuoi scambi.' : 'Inizia a tracciare la tua collezione.'}
          </p>

          {/* tabs */}
          <div className="relative mb-6 flex rounded-2xl border border-border bg-card p-1">
            <span
              className="absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-xl bg-foreground transition-transform duration-300"
              style={{ transform: mode === 'register' ? 'translateX(100%)' : 'translateX(0)' }}
            />
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={
                  'relative z-10 flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ' +
                  (mode === m ? 'text-background' : 'text-muted-foreground')
                }
              >
                {m === 'login' ? 'Accedi' : 'Registrati'}
              </button>
            ))}
          </div>

          {/* LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
              <Field label="Email" icon={<Mail className="h-4 w-4" />}>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="nome@esempio.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Password" icon={<Lock className="h-4 w-4" />}>
                <input
                  type={showLoginPass ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  className={inputCls + ' pr-11'}
                />
                <PassToggle on={showLoginPass} set={setShowLoginPass} />
              </Field>

              <div className="-mt-0.5 flex items-center justify-between text-[12px] text-muted-foreground">
                <label className="flex cursor-pointer items-center gap-2 select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 accent-lime"
                  />
                  Rimani connesso
                </label>
                <a href="#" className="font-semibold text-foreground underline underline-offset-4">
                  Password dimenticata?
                </a>
              </div>

              {loginErr && <p className="mt-1 text-sm text-destructive">{loginErr}</p>}

              <PrimaryButton label="Accedi" busy={busy} />
              <Divider />
              <GoogleButton onClick={() => handleGoogle(setLoginErr)} disabled={busy} />
            </form>
          )}

          {/* REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="flex flex-col gap-3.5">
              <Field label="Nome utente" icon={<User className="h-4 w-4" />}>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="es. luca94"
                  value={regUser}
                  onChange={(e) => setRegUser(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Email" icon={<Mail className="h-4 w-4" />}>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="nome@esempio.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Password" icon={<Lock className="h-4 w-4" />}>
                <input
                  type={showRegPass ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Almeno 8 caratteri"
                  value={regPass}
                  onChange={(e) => setRegPass(e.target.value)}
                  className={inputCls + ' pr-11'}
                />
                <PassToggle on={showRegPass} set={setShowRegPass} />
              </Field>

              <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border bg-card px-3.5 py-3">
                <input
                  type="checkbox"
                  checked={regTerms}
                  onChange={(e) => setRegTerms(e.target.checked)}
                  className="mt-0.5 h-5 w-5 accent-lime"
                />
                <span className="text-[13px] leading-snug text-card-foreground">
                  Confermo di avere almeno <b>14 anni</b> e accetto i{' '}
                  <Link to="/termini" className="font-semibold underline underline-offset-2">Termini di servizio</Link> e la{' '}
                  <Link to="/privacy" className="font-semibold underline underline-offset-2">Privacy Policy</Link>.
                </span>
              </label>

              {regErr && <p className="mt-1 text-sm text-destructive">{regErr}</p>}

              <PrimaryButton label="Crea account" busy={busy} disabled={!regTerms} />
              <Divider />
              <GoogleButton onClick={() => handleGoogle(setRegErr)} disabled={busy} />
            </form>
          )}
        </div>
      </section>
      </div>
    </div>
  )
}

const inputCls =
  'w-full rounded-xl border border-border bg-card py-3.5 pl-11 pr-4 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-lime'

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        {children}
      </div>
    </div>
  )
}

function PassToggle({ on, set }: { on: boolean; set: (b: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => set(!on)}
      aria-label={on ? 'Nascondi password' : 'Mostra password'}
      className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
    >
      {on ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  )
}

function PrimaryButton({ label, busy, disabled }: { label: string; busy: boolean; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={busy || disabled}
      className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-lime py-3.5 font-semibold text-lime-ink transition-[filter,transform] hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label} <ArrowRight className="h-4 w-4" />
    </button>
  )
}

function Divider() {
  return (
    <div className="my-2 flex items-center gap-3 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      oppure
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}

function GoogleButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-white py-3 text-[14.5px] font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 disabled:opacity-60"
    >
      <GoogleIcon /> Continua con Google
    </button>
  )
}
