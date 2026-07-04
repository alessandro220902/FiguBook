import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, Mail } from 'lucide-react'
import { FadeIn } from '@/components/home/FadeIn'
import { useAuth } from '@/hooks/useAuth'
import { hasPasswordProvider, changePassword, sendReset } from '@/lib/auth/password'

const inputCls =
  'w-full rounded-xl border border-white/[0.1] bg-surface px-3.5 py-3 text-[16px] text-ink outline-none transition-colors placeholder:text-ink-2 focus:border-lime'
const lbl = 'font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-2'

function ChangePasswordForm({ email }: { email: string | null }) {
  const [cur, setCur] = useState('')
  const [next, setNext] = useState('')
  const [conf, setConf] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setMsg(null)
    if (next.length < 6) return setMsg({ kind: 'err', text: 'La nuova password deve avere almeno 6 caratteri.' })
    if (next !== conf) return setMsg({ kind: 'err', text: 'Le due password non coincidono.' })
    setBusy(true)
    try {
      await changePassword(cur, next)
      setMsg({ kind: 'ok', text: 'Password aggiornata.' })
      setCur(''); setNext(''); setConf('')
    } catch (err) {
      const code = (err as { code?: string }).code ?? ''
      const wrong = code.includes('wrong-password') || code.includes('invalid-credential')
      setMsg({ kind: 'err', text: wrong ? 'Password attuale errata.' : 'Operazione non riuscita, riprova.' })
    } finally {
      setBusy(false)
    }
  }

  async function reset() {
    if (!email) return
    try {
      await sendReset(email)
      setMsg({ kind: 'ok', text: 'Email di reset inviata.' })
    } catch {
      setMsg({ kind: 'err', text: 'Invio non riuscito, riprova.' })
    }
  }

  return (
    <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className={lbl}>Password attuale</span>
        <input type="password" autoComplete="current-password" className={inputCls}
          value={cur} onChange={(e) => setCur(e.target.value)} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className={lbl}>Nuova password</span>
          <input type="password" autoComplete="new-password" className={inputCls}
            value={next} onChange={(e) => setNext(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={lbl}>Conferma</span>
          <input type="password" autoComplete="new-password" className={inputCls}
            value={conf} onChange={(e) => setConf(e.target.value)} />
        </label>
      </div>
      {msg && (
        <p className={'text-sm ' + (msg.kind === 'ok' ? 'text-lime' : 'text-stat-missing')}>{msg.text}</p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-[15px] font-semibold text-lime-ink transition-opacity disabled:opacity-50">
          Aggiorna password
        </button>
        <button type="button" onClick={reset}
          className="text-sm font-medium text-ink-2 underline underline-offset-4 hover:text-ink">
          Password dimenticata?
        </button>
      </div>
    </form>
  )
}

export default function ProfiloImpostazioni() {
  const { user } = useAuth()
  const canChange = hasPasswordProvider(user ?? null)

  return (
    <div className="mx-auto w-full max-w-3xl">
      <FadeIn>
        <Link to="/profilo"
          className="inline-flex items-center gap-1.5 text-sm text-ink-2 transition-colors hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Profilo
        </Link>
        <h1 className="type-h1 mt-3 text-ink">
          Impostazioni
        </h1>
        <p className="mt-1.5 text-base text-ink-2">
          Nome, avatar e bio si modificano dal profilo. Qui la sicurezza dell'account.
        </p>
      </FadeIn>

      <FadeIn>
        <section className="mt-6 rounded-2xl border border-white/[0.1] bg-surface/40 p-6">
          <h2 className="inline-flex items-center gap-2 font-display text-xl font-semibold text-ink">
            <ShieldCheck className="h-5 w-5" /> Account e sicurezza
          </h2>
          {canChange ? (
            <ChangePasswordForm email={user?.email ?? null} />
          ) : (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-white/[0.08] bg-surface px-4 py-3.5">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-ink-2" />
              <p className="text-sm text-ink-2">
                Accedi con Google. La password si gestisce dal tuo account Google.
              </p>
            </div>
          )}
        </section>
      </FadeIn>
    </div>
  )
}
