import { X } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { AVATARS } from '@/lib/avatars'
import { saveAvatar } from '@/lib/db/profile'

// Modal scelta avatar: griglia preset + monogramma. Selezione = salva subito.
export function AvatarModal({
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
