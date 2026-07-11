import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { CittaPicker } from '@/components/profile/CittaPicker'
import { CapPicker } from '@/components/profile/CapPicker'
import { TeamPicker } from '@/components/profile/TeamPicker'
import { AvatarModal } from '@/components/profile/AvatarModal'
import { Avatar } from '@/components/Avatar'
import { saveProfileAccount, saveProfilePrivate, markOnboarded, isValidCap } from '@/lib/db/profile'

const HINT = 'text-xs text-ink-2 mt-1.5'

export default function Onboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile } = useProfile()

  const [citta, setCitta] = useState(profile?.citta ?? '')
  const [cap, setCap] = useState(profile?.cap ?? '')
  const [favTeam, setFavTeam] = useState(profile?.favTeam ?? '')
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [saving, setSaving] = useState(false)

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
      navigate('/home', { replace: true })
    } finally {
      setSaving(false)
    }
  }

  async function later() {
    if (!user) return
    await markOnboarded(user.uid)
    navigate('/home', { replace: true })
  }

  return (
    <div className="mx-auto w-full max-w-lg px-5 py-10">
      <h1 className="type-h1 text-ink">Benvenuto! Completa il tuo profilo</h1>
      <p className="mt-1.5 text-base text-ink-2">
        Bastano pochi dati per trovare collezionisti come te. Puoi anche farlo più tardi.
      </p>

      <div className="mt-8 space-y-6">
        <div>
          <label className="text-sm font-semibold text-ink">Comune <span className="text-lime">*</span></label>
          <div className="mt-1.5"><CittaPicker value={citta} onChange={setCitta} /></div>
          <p className={HINT}>Da dove collezioni — ci serve per la scoperta locale.</p>
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">CAP</label>
          <div className="mt-1.5"><CapPicker value={cap} onChange={setCap} /></div>
          <p className={HINT}>
            Aggiungi il CAP: gli scambi che ti consigliamo diventano molto più precisi, trovi
            collezionisti proprio vicino a te. Resta privato.
          </p>
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">Squadra del cuore</label>
          <div className="mt-1.5"><TeamPicker value={favTeam} onChange={setFavTeam} /></div>
          <p className={HINT}>
            Scegli la tua squadra: colora il tuo profilo e ti fa sentire parte della tua tifoseria.
          </p>
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">Immagine profilo</label>
          <div className="mt-1.5 flex items-center gap-3">
            <Avatar
              id={profile?.avatarId}
              name={profile?.username ?? ''}
              className="h-14 w-14 overflow-hidden rounded-full"
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

      <div className="mt-9 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || !capOk || saving}
          className="rounded-full bg-lime px-6 py-2.5 text-[15px] font-semibold text-lime-ink transition-opacity disabled:opacity-40"
        >
          {saving ? 'Salvataggio…' : 'Salva'}
        </button>
        <button
          type="button"
          onClick={later}
          className="rounded-full px-5 py-2.5 text-[15px] font-medium text-ink-2 transition-colors hover:text-ink"
        >
          Configura più tardi
        </button>
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
