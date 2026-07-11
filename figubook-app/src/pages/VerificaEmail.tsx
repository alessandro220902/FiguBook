import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendEmailVerification, signOut } from 'firebase/auth'
import { MailCheck, RefreshCw, LogOut } from 'lucide-react'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { needsVerification } from '@/lib/auth/verification'

const RESEND_COOLDOWN = 60

export default function VerificaEmail() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN)
  const [msg, setMsg] = useState('')
  const [checking, setChecking] = useState(false)

  // Nessun utente -> login. Utente che non deve verificare -> home.
  useEffect(() => {
    if (loading) return
    if (!user) navigate('/login', { replace: true })
    else if (!needsVerification(user)) navigate('/home', { replace: true })
  }, [loading, user, navigate])

  // Cooldown reinvio
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  async function resend() {
    if (cooldown > 0 || !auth.currentUser) return
    setMsg('')
    try {
      await sendEmailVerification(auth.currentUser)
      setCooldown(RESEND_COOLDOWN)
      setMsg('Email reinviata. Controlla la posta (anche lo spam).')
    } catch {
      setMsg('Troppi tentativi. Riprova tra qualche minuto.')
    }
  }

  // Ricarica lo stato dal server: se verificata, ricarico la pagina così
  // l'AuthProvider riparte con emailVerified aggiornato e il gate apre /home.
  async function check() {
    if (!auth.currentUser) return
    setChecking(true)
    setMsg('')
    try {
      await auth.currentUser.reload()
      if (auth.currentUser.emailVerified) {
        // Conia un token FRESCO: il claim email_verified viene dal token, non
        // dallo stato live. Senza questo refresh le rules vedrebbero ancora
        // email_verified=false finche' il token non scade (~1h) o si rifa' login.
        await auth.currentUser.getIdToken(true)
        window.location.reload()
      } else setMsg('Email non ancora verificata. Clicca il link nella mail e riprova.')
    } finally {
      setChecking(false)
    }
  }

  async function logout() {
    await signOut(auth)
    navigate('/login', { replace: true })
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#080a08] px-6 text-[#f4efe6]">
      <div className="w-full max-w-[440px] rounded-3xl border border-white/10 bg-[#0c100c]/70 p-8 text-center shadow-2xl backdrop-blur-xl">
        <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-lime/15 text-lime">
          <MailCheck className="h-7 w-7" />
        </span>
        <h1 className="type-h1 m-0">Verifica la tua email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Abbiamo inviato un link di conferma a{' '}
          <b className="text-foreground">{user?.email}</b>. Devi aprirlo per accedere all'account.
        </p>

        <p className="mt-4 rounded-xl border border-lime/25 bg-lime/[0.06] px-4 py-3 text-sm text-muted-foreground">
          Non trovi la mail? Controlla la cartella <b className="text-foreground">spam</b> o
          posta indesiderata — a volte finisce lì.
        </p>

        {msg && <p className="mt-4 text-sm text-lime">{msg}</p>}

        <button
          type="button"
          onClick={check}
          disabled={checking}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-lime py-3.5 font-semibold text-lime transition-[filter] hover:bg-lime/10 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} /> Ho verificato, continua
        </button>

        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0}
          className="mt-3 w-full rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground transition-colors hover:bg-white/5 disabled:opacity-50"
        >
          {cooldown > 0 ? `Reinvia email (${cooldown}s)` : 'Reinvia email'}
        </button>

        <button
          type="button"
          onClick={logout}
          className="mx-auto mt-5 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-3.5 w-3.5" /> Esci e usa un altro account
        </button>
      </div>
    </div>
  )
}
