import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { deleteAccount, usernameMatches } from '@/lib/db/account'

export function DangerZone({ username }: { username: string }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const canConfirm = usernameMatches(typed, username) && !busy

  async function confirm() {
    setBusy(true)
    setError('')
    try {
      await deleteAccount()
      await signOut(auth)
      navigate('/', { replace: true })
    } catch {
      setError('Eliminazione non riuscita. Riprova.')
      setBusy(false)
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/[0.04] p-5 sm:p-6">
      <h2 className="text-[15px] font-semibold text-red-400">Zona pericolosa</h2>
      <p className="mt-1 text-sm text-ink-2">
        Eliminare l'account cancella per sempre profilo, album, scambi e amicizie. Azione
        irreversibile.
      </p>
      <button
        onClick={() => setOpen(true)}
        className="mt-4 rounded-full border border-red-500/50 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
      >
        Elimina account
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-6">
            <h3 className="text-lg font-semibold text-ink">Sei sicuro?</h3>
            <p className="mt-2 text-sm text-ink-2">
              Questa azione è definitiva. Per confermare, digita il tuo username
              <span className="font-medium text-ink"> {username}</span>.
            </p>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Il tuo username"
              className="mt-4 w-full rounded-xl border border-white/10 bg-surface px-4 py-2.5 text-[15px] text-ink outline-none focus:border-red-500"
            />
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => { setOpen(false); setTyped(''); setError('') }}
                disabled={busy}
                className="rounded-full px-4 py-2 text-sm text-ink-2 hover:text-ink"
              >
                Annulla
              </button>
              <button
                onClick={confirm}
                disabled={!canConfirm}
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {busy ? 'Eliminazione…' : 'Elimina definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
