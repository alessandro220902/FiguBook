import { useState, useEffect } from 'react'
import { Pencil, MapPin, X, Check, Search } from 'lucide-react'
import { sendEmailVerification } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { Avatar } from '@/components/Avatar'
import { TeamCrest } from '@/components/TeamCrest'
import { AVATARS } from '@/lib/avatars'
import { TEAMS, teamById } from '@/lib/teams'
import { teamAccent, teamPageBg, teamCardBg } from '@/lib/teamStyle'
import { saveProfileAccount, saveAvatar, savePrivacy, UsernameTakenError, type ProfileDoc, type PublicProfile } from '@/lib/db/profile'
import { getPublicByUid } from '@/lib/db/publicProfiles'
import { unblockUser } from '@/lib/db/blocks'
import { FadeIn } from '@/components/home/FadeIn'
import { CittaPicker } from '@/components/profile/CittaPicker'
import { DangerZone } from '@/components/profile/DangerZone'
import { syncAllIndexesCitta } from '@/lib/db/trade'

const inputCls =
  'w-full rounded-xl border border-white/[0.1] bg-surface px-3.5 py-3 text-[16px] text-ink outline-none transition-colors placeholder:text-ink-2 focus:border-lime'
const FIELD_LBL = 'font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-2'

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

// Picker squadra del cuore: barra ricerca + lista filtrata con stemma 2 colori.
function TeamPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const sel = teamById[value]
  const filtered = q.trim()
    ? TEAMS.filter((t) => t.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 40)
    : TEAMS.slice(0, 40)

  return (
    <div className="relative">
      {sel ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2.5 rounded-xl border border-white/[0.1] bg-surface px-3.5 py-2.5 text-left transition-colors hover:border-white/20"
        >
          <TeamCrest teamId={sel.id} c1={sel.c1} c2={sel.c2} className="h-6 w-[22px] shrink-0" />
          <span className="flex-1 text-[16px] text-ink">{sel.name}</span>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              onChange('')
            }}
            className="text-xs text-ink-2 hover:text-ink"
          >
            Rimuovi
          </span>
        </button>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-2" />
          <input
            className={inputCls + ' pl-10'}
            placeholder="Cerca la tua squadra…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
          />
        </div>
      )}

      {open && !sel && (
        <div className="absolute z-30 mt-1.5 max-h-72 w-full overflow-auto rounded-xl border border-white/10 bg-card p-1 shadow-2xl">
          {filtered.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                onChange(t.id)
                setOpen(false)
                setQ('')
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/10"
            >
              <TeamCrest teamId={t.id} c1={t.c1} c2={t.c2} className="h-5 w-[18px] shrink-0" />
              <span className="text-[15px] text-ink">{t.name}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-3 text-sm text-ink-2">Nessuna squadra trovata.</p>
          )}
        </div>
      )}
    </div>
  )
}

// Form info personali: sempre editabile (no toggle). Barra Salva/Annulla appare
// solo quando ci sono modifiche. Seminato via initial; il genitore lo rimonta
// con key al caricamento del doc => niente effect di sync.
function InfoForm({
  uid,
  email,
  initial,
}: {
  uid: string
  email?: string | null
  initial: { nome: string; username: string; citta: string; bio: string; favTeam: string; isPublic: boolean }
}) {
  const [nome, setNome] = useState(initial.nome)
  const [username, setUsername] = useState(initial.username)
  const [citta, setCitta] = useState(initial.citta)
  const [bio, setBio] = useState(initial.bio)
  const [favTeam, setFavTeam] = useState(initial.favTeam)
  const [isPublic, setIsPublic] = useState(initial.isPublic)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dirty =
    initial.nome !== nome.trim() ||
    initial.username !== username.trim() ||
    initial.citta !== citta.trim() ||
    initial.bio !== bio.trim() ||
    initial.favTeam !== favTeam

  function reset() {
    setNome(initial.nome)
    setUsername(initial.username)
    setCitta(initial.citta)
    setBio(initial.bio)
    setFavTeam(initial.favTeam)
    setError(null)
  }

  // Visibilità: salvataggio immediato col toggle (no Salva modifiche). Ottimistico.
  function togglePrivacy() {
    const next = !isPublic
    setIsPublic(next)
    savePrivacy(uid, next).catch(() => setIsPublic(!next))
  }

  async function save() {
    if (saving) return
    if (!username.trim()) {
      setError('Lo username non può essere vuoto.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await saveProfileAccount(uid, { nome, username, citta, bio, favTeam })
      // Propaga la città aggiornata al tradeIndex (usato da "Vicino a me" negli
      // Scambi, indipendente da profilo pubblico/privato). Non blocca il salvataggio.
      syncAllIndexesCitta(uid, citta).catch((e) => console.error('sync città indici', e))
    } catch (e) {
      setError(
        e instanceof UsernameTakenError
          ? 'Questo username è già preso. Scegline un altro.'
          : 'Salvataggio non riuscito. Riprova.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-surface/40 p-6 sm:p-7">
      <h2 className="font-display text-xl font-semibold text-ink">Informazioni personali</h2>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LBL}>Email</span>
          <input
            className={inputCls + ' cursor-not-allowed opacity-60'}
            value={email ?? ''}
            readOnly
          />
          <span className="text-xs text-ink-2">L'email è privata, non visibile agli altri.</span>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LBL}>Username</span>
          <input
            className={inputCls}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={24}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LBL}>Nome</span>
          <input
            className={inputCls}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Il tuo nome"
            maxLength={40}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LBL}>Città</span>
          <CittaPicker value={citta} onChange={setCitta} />
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-1.5">
        <span className={FIELD_LBL}>Squadra del cuore</span>
        <TeamPicker value={favTeam} onChange={setFavTeam} />
      </div>

      <label className="mt-5 flex flex-col gap-1.5">
        <span className={FIELD_LBL}>Bio</span>
        <textarea
          className={inputCls + ' min-h-[110px] resize-y leading-relaxed'}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Due righe su di te e cosa collezioni — visibile agli altri."
          maxLength={280}
        />
      </label>

      {/* Visibilità: salva subito (giallo/on = privato). No "Salva modifiche". */}
      <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-white/[0.1] bg-surface px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-ink">
            {isPublic ? 'Profilo pubblico' : 'Profilo privato'}
          </p>
          <p className="mt-0.5 text-sm text-ink-2">
            {isPublic
              ? 'Chiunque può vedere città, album e attività.'
              : 'Solo gli amici accettati vedono città, album e attività.'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={!isPublic}
          aria-label="Profilo privato"
          onClick={togglePrivacy}
          className={
            'relative h-7 w-12 shrink-0 rounded-full transition-colors ' +
            (!isPublic ? 'bg-lime' : 'bg-white/15')
          }
        >
          <span
            className={
              'absolute top-1 h-5 w-5 rounded-full bg-white transition-all ' +
              (!isPublic ? 'left-6' : 'left-1')
            }
          />
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-stat-missing">{error}</p>}

      {dirty && (
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-[15px] font-semibold text-lime-ink transition-opacity disabled:opacity-40"
          >
            <Check className="h-4 w-4" /> {saving ? 'Salvataggio…' : 'Salva modifiche'}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-white/10 px-5 py-2.5 text-[15px] font-medium text-ink-2 transition-colors hover:text-ink"
          >
            Annulla
          </button>
        </div>
      )}
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
    favTeam: profile?.favTeam ?? '',
    isPublic: profile?.isPublic ?? false,
  }
}

function BlockedUsers({ uid, blocked }: { uid: string; blocked: string[] }) {
  const [list, setList] = useState<PublicProfile[]>([])

  useEffect(() => {
    let active = true
    Promise.all(blocked.map((id) => getPublicByUid(id))).then(
      (rs) => active && setList(rs.filter((r): r is PublicProfile => !!r)),
    )
    return () => {
      active = false
    }
  }, [blocked])

  return (
    <section className="rounded-2xl border border-white/[0.1] bg-surface/40 p-6">
      <h2 className="font-display text-xl font-semibold text-ink">Utenti bloccati</h2>
      {blocked.length === 0 ? (
        <p className="mt-3 text-sm text-ink-2">Nessun utente bloccato.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {list.map((u) => (
            <li
              key={u.uid}
              className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-surface px-4 py-3"
            >
              <Avatar
                id={u.avatarId}
                name={u.username}
                className="h-9 w-9 shrink-0 overflow-hidden rounded-full"
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{u.username}</span>
              <button
                type="button"
                onClick={() => unblockUser(uid, u.uid)}
                className="rounded-full border border-white/15 px-3.5 py-1.5 text-sm font-medium text-ink-2 transition-colors hover:text-ink"
              >
                Sblocca
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function Profilo() {
  const { user } = useAuth()
  const { profile } = useProfile()

  const [avatarOpen, setAvatarOpen] = useState(false)
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null)

  const name = profile?.username || user?.displayName?.trim() || user?.email?.split('@')[0] || 'Collezionista'
  const since = memberSince(user?.metadata?.creationTime)
  const verified = user?.emailVerified ?? false
  const team = profile?.favTeam ? teamById[profile.favTeam] : undefined
  const accent = team ? teamAccent(team) : undefined

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
    <div className="mx-auto w-full max-w-6xl">
      {/* Sfondo pagina tinto squadra (solo /profilo): c1 sopra, verde sito in mezzo, c2 sotto */}
      {team && (
        <div
          aria-hidden
          className="fixed inset-0 -z-10"
          style={{ background: teamPageBg(team) }}
        />
      )}

      <FadeIn>
        <h1 className="type-h1 text-ink">
          Profilo
        </h1>
        <p className="mt-1.5 text-base text-ink-2">
          Gestisci le tue informazioni: nome, avatar e bio appaiono agli altri collezionisti.
        </p>
      </FadeIn>

      <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Colonna sinistra: card identità */}
        <FadeIn>
          <aside
            className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-surface/40 p-6 text-center"
            style={team ? { background: teamCardBg(team) } : undefined}
          >
            <div className="relative mx-auto w-fit">
              <Avatar
                id={profile?.avatarId}
                name={name}
                className="h-32 w-32 overflow-hidden rounded-full"
                style={accent ? { boxShadow: `0 0 0 3px ${accent}` } : undefined}
              />
              <button
                type="button"
                onClick={() => setAvatarOpen(true)}
                aria-label="Cambia avatar"
                className="absolute -bottom-1 -right-1 grid h-10 w-10 place-items-center rounded-full bg-lime text-lime-ink shadow-lg ring-2 ring-bg transition-transform hover:scale-105"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>

            <h2 className="mt-4 truncate font-display text-2xl font-semibold tracking-tight text-ink">
              {name}
            </h2>
            {team && (
              <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-ink">
                <TeamCrest teamId={team.id} c1={team.c1} c2={team.c2} className="h-5 w-[18px]" />
                {team.name}
              </p>
            )}
            {(profile?.nome || profile?.citta) && (
              <p className="mt-1 flex flex-wrap items-center justify-center gap-x-2 text-sm text-ink-2">
                {profile?.nome && <span>{profile.nome}</span>}
                {profile?.citta && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {profile.citta}
                  </span>
                )}
              </p>
            )}

            <div className="mt-4 flex flex-col items-center gap-2">
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
              {verifyMsg && <span className="text-xs text-ink-2">{verifyMsg}</span>}
              {since && <span className="text-xs text-ink-2">Iscritto da {since}</span>}
            </div>
          </aside>
        </FadeIn>

        {/* Colonna destra: form */}
        <FadeIn>
          {user && (
            <InfoForm
              key={user.uid + (profile ? '-loaded' : '-empty')}
              uid={user.uid}
              email={user.email}
              initial={initialFrom(profile, user.displayName, user.email)}
            />
          )}
        </FadeIn>
      </div>

      {user && (
        <FadeIn>
          <div className="mt-6">
            <BlockedUsers uid={user.uid} blocked={profile?.blocked ?? []} />
          </div>
        </FadeIn>
      )}

      {user && (
        <FadeIn>
          <DangerZone username={profile?.username ?? name} />
        </FadeIn>
      )}

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
