import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

// Benvenuto a macchina da scrivere, UNA volta a sessione (flag in memoria, niente
// storage). Navigando avanti/indietro sulla Dashboard non si riscrive. Reduced-motion
// o sessione già salutata → testo pieno subito.
let welcomed = false

export function Typewriter({ text, className }: { text: string; className?: string }) {
  const reduce = useReducedMotion()
  const instant = welcomed || !!reduce
  const [shown, setShown] = useState(instant ? text : '')

  useEffect(() => {
    if (instant) return
    welcomed = true
    let i = 0
    const id = window.setInterval(() => {
      i += 1
      setShown(text.slice(0, i))
      if (i >= text.length) window.clearInterval(id)
    }, 55)
    return () => window.clearInterval(id)
  }, [text, instant])

  const typing = !instant && shown.length < text.length
  return (
    <span className={className} aria-label={text}>
      {shown}
      {typing && <span className="ml-px inline-block animate-pulse text-lime/70">|</span>}
    </span>
  )
}
