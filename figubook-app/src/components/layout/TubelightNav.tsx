import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// Stile Instagram (solo mobile, bottom nav): scroll giù -> pill compatta,
// scroll su / vicino al top -> pill piena. Soglia anti-jitter + rAF.
function useScrollShrink() {
  const [compact, setCompact] = useState(false)
  const lastY = useRef(0)
  const ticking = useRef(false)
  useEffect(() => {
    lastY.current = window.scrollY
    function onScroll() {
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        const dy = y - lastY.current
        if (y < 48) setCompact(false)
        else if (dy > 6) setCompact(true)
        else if (dy < -6) setCompact(false)
        lastY.current = y
        ticking.current = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return compact
}

// La pill si rimpicciolisce solo su mobile (bottom nav); su desktop è top-nav.
function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const on = () => setMobile(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return mobile
}

// Adattata da tubelight-navbar (ayushmxxn, 21st.dev):
// - niente "use client" (Vite, non Next)
// - next/link -> react-router Link
// - stato attivo dalla ROTTA (useLocation), non da useState/click
// - --primary e' gia' mappato a lime nel nostro tema
export interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

export function TubelightNav({ items, className }: { items: NavItem[]; className?: string }) {
  const { pathname } = useLocation()
  const compact = useScrollShrink()
  const isMobile = useIsMobile()
  const shrink = compact && isMobile

  return (
    <div
      className={cn(
        // bottom-0 (mobile) + sm:top-0 insieme rendevano il wrapper alto tutto il
        // viewport e largo quanto la pill: una colonna invisibile al centro che
        // intercettava i clic del contenuto sottostante. sm:bottom-auto la rilascia.
        'fixed bottom-0 left-1/2 z-50 mb-6 -translate-x-1/2 sm:top-0 sm:bottom-auto sm:mb-0 sm:pt-6',
        className,
      )}
    >
      {/* Insta: scroll giù rimpicciolisce la pill (solo mobile). Spring framer per
          un movimento fluido invece dello scatto della transizione CSS. */}
      <motion.div
        className="flex origin-bottom items-center gap-1 rounded-full border border-border bg-card/80 px-1 py-1 shadow-lg backdrop-blur-lg"
        initial={false}
        animate={{ scale: shrink ? 0.9 : 1, opacity: shrink ? 0.8 : 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 30, mass: 0.7 }}
      >
        {items.map((item) => {
          const Icon = item.icon
          // attivo anche su sotto-rotte: /album/:id deve accendere "Album"
          const isActive = pathname === item.url || pathname.startsWith(item.url + '/')
          return (
            <Link
              key={item.name}
              to={item.url}
              className={cn(
                'relative cursor-pointer rounded-full px-6 py-2 text-sm font-semibold transition-colors',
                isActive ? 'text-neutral-900' : 'text-foreground/80 hover:text-foreground',
              )}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden">
                <Icon size={18} strokeWidth={2.5} />
              </span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 -z-10 w-full rounded-full bg-white"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          )
        })}
      </motion.div>
    </div>
  )
}
