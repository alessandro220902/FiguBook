import { Modal, Dialog } from '@/components/ui/dialog'
import { AlbumButton } from '@/components/album/ui/Button'

export interface ConfirmActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  body: string
  confirmLabel: string
  destructive?: boolean
  onConfirm: () => void
}

// Dialog di conferma generico (elimina/ripristina). Annulla = chiude;
// Conferma = onConfirm (il chiamante decide se chiudere).
export function ConfirmActionDialog({
  open, onOpenChange, title, body, confirmLabel, destructive = false, onConfirm,
}: ConfirmActionDialogProps) {
  return (
    <Modal open={open} onOpenChange={(o) => onOpenChange(o)}>
      <Dialog.Title className="text-lg font-semibold tracking-tight text-ink">{title}</Dialog.Title>
      <Dialog.Description className="mt-2 text-sm leading-relaxed text-ink-2">{body}</Dialog.Description>
      <div className="mt-6 flex justify-end gap-2">
        <AlbumButton variant="ghost" type="button" onClick={() => onOpenChange(false)}>Annulla</AlbumButton>
        <AlbumButton
          type="button"
          onClick={onConfirm}
          className={destructive ? 'bg-red-500 text-white hover:brightness-110' : ''}
        >
          {confirmLabel}
        </AlbumButton>
      </div>
    </Modal>
  )
}
