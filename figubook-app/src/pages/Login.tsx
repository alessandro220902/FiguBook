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
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Check, X } from 'lucide-react'

import { auth, db, googleProvider } from '@/lib/firebase'
import { mapFirebaseError } from '@/lib/authErrors'
import { useAuth } from '@/hooks/useAuth'
import { registerWithEmail } from '@/lib/auth/register'
import { isUsernameFree, UsernameTakenError } from '@/lib/db/profile'
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

// Requisiti password (validazione client; il submit resta bloccato finché
// non sono tutti soddisfatti). Auth server impone comunque il minimo di base.
const PWD_RULES: { key: string; label: string; test: (p: string) => boolean }[] = [
  { key: 'len', label: 'Almeno 8 caratteri', test: (p) => p.length >= 8 },
  { key: 'upper', label: 'Una lettera maiuscola', test: (p) => /[A-Z]/.test(p) },
  { key: 'num', label: 'Un numero', test: (p) => /[0-9]/.test(p) },
  { key: 'spec', label: 'Un carattere speciale', test: (p) => /[^A-Za-z0-9]/.test(p) },
]
const pwdValid = (p: string) => PWD_RULES.every((r) => r.test(p))

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
      if (!pwdValid(regPass)) {
        setRegErr('La password non rispetta i requisiti.')
        setBusy(false)
        return
      }
      // Pre-check disponibilità (UX): il vincolo forte è la transazione in
      // registerWithEmail, qui evitiamo solo di creare l'account se è già preso.
      if (!(await isUsernameFree(username, ''))) {
        setRegErr('Nome utente già in uso, scegline un altro.')
        setBusy(false)
        return
      }
      await registerWithEmail({ username, email: regEmail.trim(), password: regPass, remember })
      navigate('/verifica', { replace: true })
    } catch (err) {
      if (err instanceof UsernameTakenError) {
        setRegErr('Nome utente già in uso, scegline un altro.')
      } else {
        setRegErr(mapFirebaseError((err as { code?: string }).code))
      }
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

  const toggle = () => setMode((m) => (m === 'login' ? 'register' : 'login'))

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080a08] text-[#f4efe6]">
      {/* sfondo dot-matrix full-page */}
      <div className="pointer-events-none absolute inset-0">
        <Suspense fallback={null}>
          <CanvasRevealEffect
            colors={[[200, 169, 110], [143, 116, 68]]}
            dotSize={3}
            showGradient={false}
          />
        </Suspense>
        {/* velo per leggibilita' */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,transparent,rgba(8,10,8,.65)_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080a08] via-transparent to-[#080a08]/40" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        {/* ════ FLIP-CARD ════ */}
        <div className="relative w-full max-w-[960px] overflow-hidden rounded-[28px] border border-white/10 bg-[#0c100c]/70 shadow-2xl backdrop-blur-xl md:h-[600px]">

          {/* ── PANNELLO ORO (scivola) — solo desktop ── */}
          <div
            className="absolute inset-y-0 left-0 z-20 hidden w-1/2 flex-col overflow-hidden bg-gradient-to-br from-[#d8bd85] via-[#c8a96e] to-[#8f7444] p-10 text-[#1a1508] transition-transform duration-[700ms] ease-[cubic-bezier(.65,0,.35,1)] motion-reduce:transition-none md:flex"
            style={{ transform: mode === 'register' ? 'translateX(100%)' : 'translateX(0)' }}
          >
            {/* texture: sheen alto-sx + vignette basso per profondita' */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_16%,rgba(255,255,255,.28),transparent_52%),radial-gradient(ellipse_at_50%_118%,rgba(26,21,8,.32),transparent_58%)]" />

            <div className="relative z-10 flex items-center gap-3">
              <span className="grid h-10 w-10 -rotate-6 place-items-center rounded-[10px] bg-[#1a1508] font-display text-2xl font-extrabold text-[#d8bd85]">F</span>
              <span className="font-display text-2xl font-extrabold tracking-tight">FiguBook</span>
            </div>

            {/* slogan + switch, raggruppati e centrati verticalmente */}
            <div className="relative z-10 flex flex-1 flex-col justify-center gap-7">
              <h2
                key={slogIdx}
                className="slogan-anim m-0 max-w-[15ch] font-display text-[34px] font-bold leading-[1.06] tracking-[-0.02em]"
              >
                {SLOGANS[slogIdx][0]}{' '}
                <em className="font-serif italic opacity-75">{SLOGANS[slogIdx][1]}</em>
              </h2>

              <div>
                <p className="mb-3 text-sm font-semibold opacity-80">
                  {mode === 'login' ? 'Non hai ancora un account?' : 'Hai già un account?'}
                </p>
                <button
                  type="button"
                  onClick={toggle}
                  className="group inline-flex items-center gap-2 rounded-full bg-[#1a1508] px-5 py-2.5 text-sm font-bold text-[#d8bd85] transition-[filter,transform] hover:brightness-110 active:translate-y-px"
                >
                  {mode === 'login' ? 'Crea un account' : 'Accedi'}
                  <ArrowRight className="h-4 w-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ── FORM LOGIN (metà destra su desktop) ── */}
          <div className={panelCls('right', mode === 'login')}>
            <FormShell
              title="Bentornato"
              subtitle="Accedi al tuo album e ai tuoi scambi."
              switchLabel="Non hai un account?"
              switchCta="Registrati"
              onSwitch={toggle}
            >
              <form onSubmit={handleLogin} className="flex flex-col gap-3">
                <Field label="Email" icon={<Mail className="h-4 w-4" />} htmlFor="login-email">
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="nome@esempio.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Password" icon={<Lock className="h-4 w-4" />} htmlFor="login-pass">
                  <input
                    id="login-pass"
                    type={showLoginPass ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    className={inputCls + ' pr-12'}
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
            </FormShell>
          </div>

          {/* ── FORM REGISTER (metà sinistra su desktop) ── */}
          <div className={panelCls('left', mode === 'register')}>
            <FormShell
              title="Crea il tuo account"
              subtitle="Inizia a tracciare la tua collezione."
              switchLabel="Hai già un account?"
              switchCta="Accedi"
              onSwitch={toggle}
            >
              <form onSubmit={handleRegister} className="flex flex-col gap-3">
                <Field label="Nome utente" icon={<User className="h-4 w-4" />} htmlFor="reg-user">
                  <input
                    id="reg-user"
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="es. luca94"
                    value={regUser}
                    onChange={(e) => setRegUser(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Email" icon={<Mail className="h-4 w-4" />} htmlFor="reg-email">
                  <input
                    id="reg-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="nome@esempio.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Password" icon={<Lock className="h-4 w-4" />} htmlFor="reg-pass">
                  <input
                    id="reg-pass"
                    type={showRegPass ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Almeno 8 caratteri"
                    value={regPass}
                    onChange={(e) => setRegPass(e.target.value)}
                    className={inputCls + ' pr-12'}
                  />
                  <PassToggle on={showRegPass} set={setShowRegPass} />
                </Field>

                <PwdChecklist pass={regPass} />

                <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5">
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

                <PrimaryButton label="Crea account" busy={busy} disabled={!regTerms || !pwdValid(regPass)} />
                <Divider />
                <GoogleButton onClick={() => handleGoogle(setRegErr)} disabled={busy} />
              </form>
            </FormShell>
          </div>
        </div>
      </div>
    </div>
  )
}

// Classi del pannello-form: su desktop occupa una metà in absolute e fa
// crossfade+slide; su mobile è un blocco normale, l'inattivo è rimosso (hidden).
function panelCls(side: 'left' | 'right', active: boolean) {
  const base =
    'flex w-full flex-col justify-center overflow-y-auto p-8 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none md:absolute md:inset-y-0 md:w-1/2 md:p-10 ' +
    (side === 'right' ? 'md:right-0 ' : 'md:left-0 ')
  const state = active
    ? 'opacity-100 md:visible md:pointer-events-auto md:opacity-100 md:translate-x-0'
    : 'hidden md:block md:invisible md:pointer-events-none md:opacity-0 ' +
      (side === 'right' ? 'md:translate-x-6' : 'md:-translate-x-6')
  return base + state
}

// Guscio del form: header brand mobile + titolo gradient + switch link mobile.
function FormShell({
  title,
  subtitle,
  switchLabel,
  switchCta,
  onSwitch,
  children,
}: {
  title: string
  subtitle: string
  switchLabel: string
  switchCta: string
  onSwitch: () => void
  children: React.ReactNode
}) {
  return (
    <div className="m-auto w-full max-w-[420px]">
      {/* brand mobile */}
      <div className="mb-6 flex items-center gap-3 md:hidden">
        <span className="grid h-9 w-9 -rotate-6 place-items-center rounded-[10px] bg-gradient-to-br from-[#d8bd85] to-[#8f7444] font-display text-xl font-extrabold text-[#1a1508]">F</span>
        <span className="font-display text-xl font-extrabold tracking-tight">FiguBook</span>
      </div>

      <h1 className="m-0 bg-gradient-to-br from-white from-20% to-[#c8a96e] bg-clip-text font-display text-[38px] font-bold leading-none tracking-[-0.025em] text-transparent">
        {title}
      </h1>
      <p className="mb-5 mt-1.5 text-sm text-muted-foreground">{subtitle}</p>

      {children}

      {/* switch mobile */}
      <p className="mt-6 text-center text-[13px] text-muted-foreground md:hidden">
        {switchLabel}{' '}
        <button onClick={onSwitch} className="font-semibold text-foreground underline underline-offset-4">
          {switchCta}
        </button>
      </p>
    </div>
  )
}

const inputCls =
  'w-full rounded-xl border border-border bg-card py-3 pl-11 pr-4 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-lime'

function Field({ label, icon, htmlFor, children }: { label: string; icon: React.ReactNode; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="group flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="flex font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label.split('').map((ch, i) => (
          <span
            key={i}
            style={{ transitionDelay: `${i * 28}ms` }}
            className="inline-block transition-[transform,color] duration-200 ease-out group-focus-within:-translate-y-[3px] group-focus-within:text-[#c8a96e] motion-reduce:transition-none motion-reduce:group-focus-within:translate-y-0"
          >
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-200 group-focus-within:text-[#c8a96e]">{icon}</span>
        {children}
      </div>
    </div>
  )
}

// Checklist requisiti password: compare quando l'utente inizia a digitare,
// ogni regola vira all'oro con la spunta appena soddisfatta.
function PwdChecklist({ pass }: { pass: string }) {
  if (!pass) return null
  return (
    <ul className="-mt-1 flex flex-col gap-1">
      {PWD_RULES.map((r) => {
        const ok = r.test(pass)
        return (
          <li
            key={r.key}
            className={
              'flex items-center gap-2 text-[12.5px] transition-colors duration-200 ' +
              (ok ? 'text-[#c8a96e]' : 'text-muted-foreground')
            }
          >
            {ok ? <Check className="h-3.5 w-3.5 shrink-0" /> : <X className="h-3.5 w-3.5 shrink-0 opacity-50" />}
            {r.label}
          </li>
        )
      })}
    </ul>
  )
}

function PassToggle({ on, set }: { on: boolean; set: (b: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => set(!on)}
      aria-label={on ? 'Nascondi password' : 'Mostra password'}
      className="absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
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
      className="group mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#d8bd85] to-[#c8a96e] py-3 font-bold text-[#1a1508] shadow-[0_10px_28px_-10px_rgba(200,169,110,.55)] transition-[filter,transform] hover:brightness-105 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label} <ArrowRight className="h-4 w-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
    </button>
  )
}

function Divider() {
  return (
    <div className="my-1.5 flex items-center gap-3 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
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
      className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[#c8a96e]/20 bg-[#c8a96e]/[0.06] py-2.5 text-[14.5px] font-semibold text-white/70 transition-[color,background-color,border-color,transform] hover:border-[#c8a96e]/35 hover:bg-[#c8a96e]/[0.1] hover:text-white/90 active:scale-[0.98] disabled:opacity-60"
    >
      <GoogleIcon /> Continua con Google
    </button>
  )
}
