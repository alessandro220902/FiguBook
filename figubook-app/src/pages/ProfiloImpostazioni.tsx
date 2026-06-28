import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, User, Bell, ShieldCheck, Check } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { saveProfileAccount, type ProfileDoc } from '@/lib/db/profile'
import { AVATARS } from '@/lib/avatars'
import { Avatar } from '@/components/Avatar'
import { FadeIn } from '@/components/home/FadeIn'

type Tab = 'account' | 'scambi' | 'privacy'

const TABS: { id: Tab; label: string; icon: typeof User; ready: boolean }[] = [
  { id: 'account', label: 'Account', icon: User, ready: true },
  { id: 'scambi', label: 'Scambi', icon: Bell, ready: false },
  { id: 'privacy', label: 'Privacy', icon: ShieldCheck, ready: false },
]

const inputCls =
  'w-full rounded-xl border border-white/[0.1] bg-surface px-3.5 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-2 focus:border-lime'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-2">
        {label}
      </span>
      {children}
    </label>
  )
}

// Form Account: stato seminato dai valori iniziali (useState initializer).
// Il genitore lo rimonta via `key` quando arriva il doc => niente effect di sync.
function AccountForm({
  uid,
  initial,
}: {
  uid: string
  initial: { nome: string; username: string; citta: string; bio: string; avatarId: string }
}) {
  const [nome, setNome] = useState(initial.nome)
  const [username, setUsername] = useState(initial.username)
  const [citta, setCitta] = useState(initial.citta)
  const [bio, setBio] = useState(initial.bio)
  const [avatarId, setAvatarId] = useState(initial.avatarId)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dirty =
    initial.nome !== nome.trim() ||
    initial.username !== username.trim() ||
    initial.citta !== citta.trim() ||
    initial.bio !== bio.trim() ||
    initial.avatarId !== avatarId

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    if (!username.trim()) {
      setError('Lo username non può essere vuoto.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await saveProfileAccount(uid, { nome, username, citta, bio, avatarId })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Salvataggio non riuscito. Riprova.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSave} className="mt-6 flex flex-col gap-4">
      {/* Avatar: preset oggetti calcio + monogramma (nessuna selezione = monogramma) */}
      <div className="flex flex-col gap-2.5">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-2">
          Avatar
        </span>
        <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-9">
          <button
            type="button"
            onClick={() => setAvatarId('')}
            aria-pressed={avatarId === ''}
            title="Monogramma"
            className={
              'overflow-hidden rounded-full border-2 transition-colors ' +
              (avatarId === '' ? 'border-lime' : 'border-transparent hover:border-white/20')
            }
          >
            <Avatar id="" name={username || nome} className="h-full w-full" />
          </button>
          {AVATARS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAvatarId(a.id)}
              aria-pressed={avatarId === a.id}
              title={a.label}
              className={
                'overflow-hidden rounded-full border-2 transition-colors ' +
                (avatarId === a.id ? 'border-lime' : 'border-transparent hover:border-white/20')
              }
            >
              <Avatar id={a.id} name={username || nome} className="h-full w-full" />
            </button>
          ))}
        </div>
      </div>

      <Field label="Nome">
        <input
          className={inputCls}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Il tuo nome"
          maxLength={40}
        />
      </Field>
      <Field label="Username">
        <input
          className={inputCls}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username"
          maxLength={24}
        />
      </Field>
      <Field label="Città">
        <input
          className={inputCls}
          value={citta}
          onChange={(e) => setCitta(e.target.value)}
          placeholder="Es. Milano"
          maxLength={40}
        />
      </Field>
      <Field label="Bio">
        <textarea
          className={inputCls + ' min-h-[96px] resize-y leading-relaxed'}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Due righe su di te e cosa collezioni"
          maxLength={280}
        />
      </Field>

      {error && <p className="text-sm text-stat-missing">{error}</p>}

      <div className="mt-1 flex items-center gap-3">
        <button
          type="submit"
          disabled={!dirty || saving}
          className="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-sm font-semibold text-lime-ink transition-opacity disabled:opacity-40"
        >
          {saving ? 'Salvataggio…' : 'Salva modifiche'}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm text-lime">
            <Check className="h-4 w-4" /> Salvato
          </span>
        )}
      </div>
    </form>
  )
}

function initialFrom(
  profile: ProfileDoc | null,
  displayName?: string | null,
  email?: string | null,
) {
  return {
    nome: profile?.nome ?? '',
    username: profile?.username ?? displayName ?? email?.split('@')[0] ?? '',
    citta: profile?.citta ?? '',
    bio: profile?.bio ?? '',
    avatarId: profile?.avatarId ?? '',
  }
}

export default function ProfiloImpostazioni() {
  const { user } = useAuth()
  const { profile, loading } = useProfile()
  const [tab, setTab] = useState<Tab>('account')

  return (
    <div className="mx-auto w-full max-w-3xl">
      <FadeIn>
        <Link
          to="/profilo"
          className="inline-flex items-center gap-1.5 text-sm text-ink-2 transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Profilo
        </Link>
        <h1 className="mt-3 font-display text-[28px] font-semibold tracking-tight text-ink sm:text-[34px]">
          Impostazioni
        </h1>

        {/* Tab */}
        <div className="mt-6 flex gap-1.5 rounded-2xl border border-white/[0.08] bg-surface p-1">
          {TABS.map((t) => {
            const Icon = t.icon
            const on = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => t.ready && setTab(t.id)}
                disabled={!t.ready}
                className={
                  'relative flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ' +
                  (on
                    ? 'bg-lime text-lime-ink'
                    : t.ready
                      ? 'text-ink-2 hover:text-ink'
                      : 'cursor-not-allowed text-ink-2/50')
                }
              >
                <Icon className="h-4 w-4" />
                {t.label}
                {!t.ready && <span className="text-[10px] uppercase">presto</span>}
              </button>
            )
          })}
        </div>
      </FadeIn>

      {tab === 'account' &&
        (loading || !user ? (
          <p className="mt-6 text-sm text-ink-2">Caricamento…</p>
        ) : (
          <FadeIn>
            {/* key = identità del doc caricato: rimonta il form quando cambia */}
            <AccountForm
              key={user.uid + (profile ? '-loaded' : '-empty')}
              uid={user.uid}
              initial={initialFrom(profile, user.displayName, user.email)}
            />
          </FadeIn>
        ))}
    </div>
  )
}
