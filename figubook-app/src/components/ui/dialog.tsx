import type { ReactNode } from 'react'
import { Dialog } from '@base-ui/react/dialog'

export interface ModalProps {
  open: boolean
  /** Firma reale Base UI v1.5: (open, eventDetails) */
  onOpenChange: (open: boolean, eventDetails?: unknown) => void
  children: ReactNode
  /** larghezza max del popup (default sm) */
  size?: 'sm' | 'md'
}

const WIDTH = { sm: 'max-w-sm', md: 'max-w-md' }

// Wrapper modale sul Dialog di Base UI, tema album. Backdrop scuro + popup
// centrato. ESC e click backdrop => onOpenChange(false). Anim via data-attr.
export function Modal({ open, onOpenChange, children, size = 'sm' }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="album-theme fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <Dialog.Popup
          className={`album-theme fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] ${WIDTH[size]} -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-bg-elev p-6 text-ink shadow-[0_24px_64px_-24px_rgba(0,0,0,0.8)] transition-all duration-150 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0`}
        >
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export { Dialog }
