import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

// Benvenuto a macchina da scrivere, UNA volta a sessione (flag in memoria, niente
// storage). Navigando avanti/indietro sulla Dashboard non si riscrive. Reduced-motion
// o sessione gia' salutata => testo pieno subito.
// NB: il flag `welcomed` NON sta nei deps dell'effect (altrimenti la sua mutazione
// rilancia l'effect e killa l'intervallo a meta' parola).
let welcomed = false

export function Typewriter({ text, className }: { text: string; className?: string }) {
  const reduce = useReducedMotion()
  const startFull = welcomed || !!reduce
  const [count, setCount] = useState(startFull ? text.length : 0)

  useEffect(() => {
    if (welcomed || reduce) return
    welcomed = true
    const id = window.setInterval(() => {
      setCount((c) => {
        if (c >= text.length) {
          window.clearInterval(id)
          return c
        }
        return c + 1
      })
    }, 60)
    return () => window.clearInterval(id)
  }, [text, reduce])

  const shown = text.slice(0, count)
  const typing = count < text.length
  return (
    <span className={className} aria-label={text}>
      {shown}
      {typing && <span className="ml-px inline-block animate-pulse text-lime/70">|</span>}
    </span>
  )
}
