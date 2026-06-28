import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, MapPin, Check, X, Settings } from 'lucide-react'
import { sendEmailVerification } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useCollection } from '@/hooks/useCollection'
import { Avatar } from '@/components/Avatar'
import { AVATARS } from '@/lib/avatars'
import { saveProfileAccount, saveAvatar, type ProfileDoc } from '@/lib/db/profile'
import { FadeIn } from '@/components/home/FadeIn'
import { AnimatedNumber } from '@/components/home/AnimatedNumber'

const TILE = 'rounded-2xl border border-white/[0.08] bg-surface px-4 py-4'
const LABEL = 'flex items-center gap-1.5 text-sm font-medium text-ink md:text-[15px]'
const NUM =
  'mt-2 block font-display text-4xl font-semibold tabular-nums tracking-tight text-ink md:text-[44px]'

const inputCls =
  'w-full rounded-xl border border-white/[0.1] bg-surface px-3.5 py-3 text-[16px] text-ink outline-none transition-colors placeholder:text-ink-2 focus:border-lime'

function Dot({ color }: { color: string }) {
  return <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
}

function memberSince(creationTime?: string): string | null {
  if (!creationTime) return null
  const d = new Date(creationTime)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
}

// Modal scelta avatar: griglia preset + monogramma. Selezione = salva subito.
function AvatarModal({
  uid,
  current,
  name,
  onClose,
}: {
  uid: string
  current?: string | null
  name: string
  onClose: () => void
}) {
  async function pick(id: string) {
    await saveAvatar(uid, id)
    onClose()
  }
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-white/10 bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold text-ink">Scegli avatar</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="grid h-8 w-8 place-items-center rounded-full text-ink-2 hover:bg-white/10 hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          <button
            type="button"
            onClick={() => pick('')}
            aria-pressed={!current}
            title="Monogramma"
            className={
              'overflow-hidden rounded-full border-2 transition-colors ' +
              (!current ? 'border-lime' : 'border-transparent hover:border-white/20')
            }
          >
            <Avatar id="" name={name} className="h-full w-full" />
          </button>
          {AVATARS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => pick(a.id)}
              aria-pressed={current === a.id}
              title={a.label}
              className={
                'overflow-hidden rounded-full border-2 transition-colors ' +
                (current === a.id ? 'border-lime' : 'border-transparent hover:border-white/20')
              }
            >
              <Avatar id={a.id} name={name} className="h-full w-full" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Form identità: stato seminato via initial; rimontato dal genitore con key
// quando arriva il doc => niente effect di sync (lint set-state-in-effect).
function IdentityEdit({
  uid,
  initial,
  onDone,
}: {
  uid: string
  initial: { nome: string; username: string; citta: string; bio: string }
  onDone: () => void
}) {
  const [nome, setNome] = useState(initial.nome)
  const [username, setUsername] = useState(initial.username)
  const [citta, setCitta] = useState(initial.citta)
  const [bio, setBio] = useState(initial.bio)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (saving) return
    if (!username.trim()) {
      setError('Lo username non può essere vuoto.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await saveProfileAccount(uid, { nome, username, citta, bio })
      onDone()
    } catch {
      setError('Salvataggio non riuscito. Riprova.')
      setSaving(false)
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-2">
            Username
          </span>
          <input className={inputCls} value={username} onChange={(e) => setUsername(e.target.value)} maxLength={24} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-2">
            Nome
          </span>
          <input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Il tuo nome" maxLength={40} />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-2">
          Città
        </span>
        <input className={inputCls} value={citta} onChange={(e) => setCitta(e.target.value)} placeholder="Es. Milano" maxLength={40} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-2">
          Bio
        </span>
        <textarea
          className={inputCls + ' min-h-[96px] resize-y leading-relaxed'}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Due righe su di te e cosa collezioni"
          maxLength={280}
        />
      </label>

      {error && <p className="text-sm text-stat-missing">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-[15px] font-semibold text-lime-ink transition-opacity disabled:opacity-40"
        >
          <Check className="h-4 w-4" /> {saving ? 'Salvataggio…' : 'Salva'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-[15px] font-medium text-ink-2 transition-colors hover:text-ink"
        >
          Annulla
        </button>
      </div>
    </div>
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
  }
}

export default function Profilo() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const { totals, albums, loading } = useCollection()

  const [editing, setEditing] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null)

  const name = user?.displayName?.trim() || user?.email?.split('@')[0] || 'Collezionista'
  const since = memberSince(user?.metadata?.creationTime)
  const verified = user?.emailVerified ?? false

  async function resendVerification() {
    if (!auth.currentUser) return
    try {
      await sendEmailVerification(auth.currentUser)
      setVerifyMsg('Email di verifica inviata.')
    } catch {
      setVerifyMsg('Invio non riuscito, riprova tra poco.')
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Intestazione */}
      <FadeIn>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="relative shrink-0">
            <Avatar
              id={profile?.avatarId}
              name={name}
              className="h-28 w-28 overflow-hidden rounded-full ring-1 ring-white/10"
            />
            <button
              type="button"
              onClick={() => setAvatarOpen(true)}
              aria-label="Cambia avatar"
              className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-lime text-lime-ink shadow-lg ring-2 ring-bg transition-transform hover:scale-105"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center gap-3 sm:justify-start">
              <h1 className="truncate font-display text-[36px] font-semibold tracking-tight text-ink sm:text-[44px]">
                {name}
              </h1>
              {!editing && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  aria-label="Modifica profilo"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-ink-2 transition-colors hover:text-ink"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>
            {user?.email && <p className="mt-1 truncate text-base text-ink-2">{user.email}</p>}

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
              <span
                className={
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ' +
                  (verified ? 'bg-lime/12 text-lime' : 'bg-stat-missing/15 text-stat-missing')
                }
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {verified ? 'Email verificata' : 'Email da verificare'}
              </span>
              {!verified && (
                <button
                  type="button"
                  onClick={resendVerification}
                  className="text-sm font-medium text-lime underline underline-offset-4"
                >
                  Invia di nuovo
                </button>
              )}
              {since && <span className="text-sm text-ink-2">Iscritto da {since}</span>}
            </div>
            {verifyMsg && <p className="mt-2 text-sm text-ink-2">{verifyMsg}</p>}

            {/* Nome reale · città · bio (solo in lettura) */}
            {!editing && (profile?.nome || profile?.citta || profile?.bio) && (
              <div className="mt-3 space-y-1.5">
                {(profile?.nome || profile?.citta) && (
                  <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-base text-ink sm:justify-start">
                    {profile?.nome && <span className="font-medium">{profile.nome}</span>}
                    {profile?.citta && (
                      <span className="inline-flex items-center gap-1 text-ink-2">
                        <MapPin className="h-4 w-4" /> {profile.citta}
                      </span>
                    )}
                  </p>
                )}
                {profile?.bio && (
                  <p className="max-w-prose text-base leading-relaxed text-ink-2">{profile.bio}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Form modifica inline */}
        {editing && user && (
          <IdentityEdit
            key={user.uid + (profile ? '-loaded' : '-empty')}
            uid={user.uid}
            initial={initialFrom(profile, user.displayName, user.email)}
            onDone={() => setEditing(false)}
          />
        )}
      </FadeIn>

      {/* Riepilogo collezione */}
      <FadeIn>
        <h2 className="mt-12 text-base font-medium text-ink-2">La tua collezione</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className={TILE}>
            <div className={LABEL}>
              <Dot color="var(--color-ink-2)" /> Album
            </div>
            <AnimatedNumber value={loading ? 0 : albums.length} className={NUM} />
          </div>
          <div className={TILE}>
            <div className={LABEL}>
              <Dot color="var(--color-stat-have)" /> Possedute
            </div>
            <AnimatedNumber value={loading ? 0 : totals.have} className={NUM} />
          </div>
          <div className={TILE}>
            <div className={LABEL}>
              <Dot color="var(--color-lime)" /> Doppie
            </div>
            <AnimatedNumber value={loading ? 0 : totals.doubles} className={NUM} />
          </div>
          <div className={TILE}>
            <div className={LABEL}>
              <Dot color="var(--color-stat-have)" /> Completamento
            </div>
            <div className="mt-2 flex items-baseline gap-0.5">
              <AnimatedNumber
                value={loading ? 0 : totals.pct}
                className="font-display text-4xl font-semibold tabular-nums tracking-tight text-ink md:text-[44px]"
              />
              <span className="font-display text-xl font-semibold text-ink-2">%</span>
            </div>
          </div>
        </div>
        {/* Barra completamento */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-lime transition-[width] duration-700"
            style={{ width: `${loading ? 0 : totals.pct}%` }}
          />
        </div>
      </FadeIn>

      {/* Account */}
      <FadeIn>
        <h2 className="mt-12 text-base font-medium text-ink-2">Account</h2>
        <div className="mt-4">
          <Link
            to="/profilo/impostazioni"
            className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-surface px-4 py-4 text-left transition-colors hover:border-white/20"
          >
            <span className="inline-flex items-center gap-2.5 text-[15px] font-medium text-ink">
              <Settings className="h-4 w-4 text-ink-2" /> Impostazioni
            </span>
            <span className="text-sm text-lime">Apri</span>
          </Link>
        </div>
      </FadeIn>

      {avatarOpen && user && (
        <AvatarModal
          uid={user.uid}
          current={profile?.avatarId}
          name={name}
          onClose={() => setAvatarOpen(false)}
        />
      )}
    </div>
  )
}
