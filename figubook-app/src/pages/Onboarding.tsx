import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { User } from 'firebase/auth'
import { ArrowRight, Check } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { CittaPicker } from '@/components/profile/CittaPicker'
import { CapPicker } from '@/components/profile/CapPicker'
import { TeamPicker } from '@/components/profile/TeamPicker'
import { AvatarModal } from '@/components/profile/AvatarModal'
import { Avatar } from '@/components/Avatar'
import { AlbumBrowser } from '@/components/onboarding/AlbumBrowser'
import { FadeIn } from '@/components/home/FadeIn'
import { saveProfileAccount, saveProfilePrivate, markOnboarded, isValidCap, type ProfileDoc } from '@/lib/db/profile'

const HINT = 'text-sm text-ink-2 mt-2'

// Gate: monta il form SOLO a profilo caricato, così gli stati iniziali leggono
// i dati già salvati (altrimenti partirebbero vuoti e sembrerebbero persi).
export default function Onboarding() {
  const { user } = useAuth()
  const { profile, loading } = useProfile()
  if (loading || !user) {
    return <div className="grid min-h-[60vh] place-items-center text-ink-2">Caricamento…</div>
  }
  return <OnboardingForm key={user.uid} user={user} profile={profile} />
}

function OnboardingForm({ user, profile }: { user: User; profile: ProfileDoc | null }) {
  const navigate = useNavigate()

  const [citta, setCitta] = useState(profile?.citta ?? '')
  const [cap, setCap] = useState(profile?.cap ?? '')
  const [favTeam, setFavTeam] = useState(profile?.favTeam ?? '')
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const dirty =
    citta !== (profile?.citta ?? '') ||
    cap !== (profile?.cap ?? '') ||
    favTeam !== (profile?.favTeam ?? '')
  const capOk = isValidCap(cap)

  async function save() {
    if (!user || !profile) return
    setSaving(true)
    try {
      await saveProfileAccount(user.uid, {
        username: profile.username,
        nome: profile.nome ?? '',
        citta,
        bio: profile.bio ?? '',
        favTeam,
      })
      await saveProfilePrivate(user.uid, { cap, onboarded: true })
      // Feedback "Salvato" prima di entrare nell'app.
      setSaving(false)
      setSaved(true)
      setTimeout(() => navigate('/home', { replace: true }), 800)
    } catch {
      setSaving(false)
    }
  }

  async function later() {
    if (!user) return
    await markOnboarded(user.uid)
    navigate('/home', { replace: true })
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6">
      <FadeIn>
        <h1 className="type-h1 text-ink">Benvenuto! Completa il tuo profilo</h1>
        <p className="mt-2 text-lg text-ink-2">
          Bastano pochi dati per trovare collezionisti come te e farti riconoscere.
        </p>
      </FadeIn>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <FadeIn delay={0.12} className="rounded-2xl border border-white/[0.12] bg-surface/60 p-6 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] sm:p-8">
        <div className="grid gap-6">
          <div>
            <label className="text-base font-semibold text-ink">Comune <span className="text-lime">*</span></label>
            <div className="mt-1.5"><CittaPicker value={citta} onChange={setCitta} /></div>
            <p className={HINT}>Da dove collezioni — ci serve per la scoperta locale.</p>
          </div>

          <div>
            <label className="text-base font-semibold text-ink">CAP</label>
            <div className="mt-1.5"><CapPicker value={cap} onChange={setCap} /></div>
            <p className={HINT}>
              Aggiungi il CAP: scambi consigliati più precisi, gente vicino a te. Resta privato.
            </p>
          </div>

          <div>
            <label className="text-base font-semibold text-ink">Squadra del cuore</label>
            <div className="mt-1.5"><TeamPicker value={favTeam} onChange={setFavTeam} /></div>
            <p className={HINT}>
              Scegli la tua squadra: colora il tuo profilo e ti fa sentire parte della tua tifoseria.
            </p>
          </div>

          <div>
            <label className="text-base font-semibold text-ink">Immagine profilo</label>
            <div className="mt-1.5 flex items-center gap-3">
              <Avatar
                id={profile?.avatarId}
                name={profile?.username ?? ''}
                className="h-14 w-14 shrink-0 overflow-hidden rounded-full"
              />
              <button
                type="button"
                onClick={() => setAvatarOpen(true)}
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-ink-2 transition-colors hover:text-ink"
              >
                Scegli avatar
              </button>
            </div>
            <p className={HINT}>Metti un avatar: ti rendi riconoscibile agli altri collezionisti.</p>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3 border-t border-white/[0.06] pt-6">
          <button
            type="button"
            onClick={save}
            disabled={!dirty || !capOk || saving || saved}
            className="group inline-flex cursor-pointer items-center gap-2 rounded-full bg-lime px-6 py-2.5 text-[15px] font-semibold text-lime-ink transition-transform duration-150 hover:-translate-y-px active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" /> Salvato
              </>
            ) : saving ? (
              'Salvataggio…'
            ) : (
              <>
                Salva
                <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              </>
            )}
          </button>
          <button
            type="button"
            onClick={later}
            className="cursor-pointer rounded-full border border-white/15 px-5 py-2.5 text-[15px] font-medium text-ink-2 transition-colors hover:border-white/30 hover:text-ink"
          >
            Configura più tardi
          </button>
        </div>
      </FadeIn>

      <FadeIn delay={0.2} className="rounded-2xl border border-white/[0.12] bg-surface/60 p-6 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] sm:p-8">
        <AlbumBrowser uid={user.uid} />
      </FadeIn>
      </div>

      {avatarOpen && user && (
        <AvatarModal
          uid={user.uid}
          current={profile?.avatarId}
          name={profile?.username ?? ''}
          onClose={() => setAvatarOpen(false)}
        />
      )}
    </div>
  )
}
