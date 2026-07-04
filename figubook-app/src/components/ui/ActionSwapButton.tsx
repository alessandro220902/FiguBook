import { useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

type Status = 'idle' | 'loading' | 'done'

interface Face {
  label: string
  icon?: ReactNode
}

interface ActionSwapButtonProps {
  /** Stato a riposo (label + icona). */
  idle: Face
  /** Stato "azione fatta" mostrato dopo il successo. */
  done: Face
  /** Label opzionale durante l'attesa (default: quella idle). */
  loadingLabel?: string
  /** Azione: risolve = successo (mostra `done`), throw = errore (torna idle). */
  onAction: () => void | Promise<unknown>
  /** Quanto tenere lo stato `done` prima di tornare idle (ms). */
  holdMs?: number
  disabled?: boolean
  /** Classi del bottone: passa lo stile nativo del punto d'uso. */
  className?: string
  type?: 'button' | 'submit'
}

// Bottone "action swap" (stile 21st be-ui, replicato brand): al click esegue
// l'azione, poi il contenuto si scambia con lo stato "fatto" (icona + label)
// con animazione, e torna a riposo dopo holdMs. Rispetta prefers-reduced-motion.
export function ActionSwapButton({
  idle,
  done,
  loadingLabel,
  onAction,
  holdMs = 1500,
  disabled,
  className,
  type = 'button',
}: ActionSwapButtonProps) {
  const [status, setStatus] = useState<Status>('idle')
  const reduce = useReducedMotion()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function run() {
    if (status !== 'idle') return
    setStatus('loading')
    try {
      await onAction()
      setStatus('done')
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setStatus('idle'), holdMs)
    } catch {
      setStatus('idle')
    }
  }

  const face: Face =
    status === 'done' ? done : status === 'loading' ? { label: loadingLabel ?? idle.label, icon: idle.icon } : idle
  const key = status === 'done' ? 'done' : 'idle'

  return (
    <button
      type={type}
      disabled={disabled || status === 'loading'}
      aria-live="polite"
      onClick={run}
      className={className}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={key}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap"
          initial={reduce ? false : { y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: status === 'loading' ? 0.7 : 1 }}
          exit={reduce ? { opacity: 0 } : { y: -8, opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {face.icon}
          {face.label}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
