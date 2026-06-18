import { AnimatePresence, motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// Adattata da expandable-tabs (victorwelander, 21st.dev):
// - niente "use client" (Vite)
// - CONTROLLATA: selected/onSelect dal parent, cosi' il click-outside e i
//   pannelli associati vivono nel parent (un solo ref attorno a tutto).
interface Tab {
  title: string
  icon: LucideIcon
  type?: never
}
interface Separator {
  type: 'separator'
  title?: never
  icon?: never
}
export type TabItem = Tab | Separator

interface ExpandableTabsProps {
  tabs: TabItem[]
  selected: number | null
  onSelect: (index: number | null) => void
  className?: string
  activeColor?: string
}

const buttonVariants = {
  initial: { gap: 0, paddingLeft: '.5rem', paddingRight: '.5rem' },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? '.5rem' : 0,
    paddingLeft: isSelected ? '1rem' : '.5rem',
    paddingRight: isSelected ? '1rem' : '.5rem',
  }),
}
const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: 'auto', opacity: 1 },
  exit: { width: 0, opacity: 0 },
}
const transition = { delay: 0.1, type: 'spring', bounce: 0, duration: 0.6 } as const

export function ExpandableTabs({
  tabs,
  selected,
  onSelect,
  className,
  activeColor = 'text-primary',
}: ExpandableTabsProps) {
  const Sep = () => <div className="mx-1 h-[24px] w-[1.2px] bg-border" aria-hidden="true" />

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1 rounded-2xl border border-border bg-card/80 p-1 shadow-lg backdrop-blur-lg',
        className,
      )}
    >
      {tabs.map((tab, index) => {
        if (tab.type === 'separator') return <Sep key={`separator-${index}`} />
        const Icon = tab.icon
        const isSelected = selected === index
        return (
          <motion.button
            key={tab.title}
            type="button"
            variants={buttonVariants}
            initial={false}
            animate="animate"
            custom={isSelected}
            onClick={() => onSelect(isSelected ? null : index)}
            transition={transition}
            className={cn(
              'relative flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors duration-300',
              isSelected
                ? cn('bg-muted', activeColor)
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon size={20} />
            <AnimatePresence initial={false}>
              {isSelected && (
                <motion.span
                  variants={spanVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transition}
                  className="overflow-hidden"
                >
                  {tab.title}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )
      })}
    </div>
  )
}
