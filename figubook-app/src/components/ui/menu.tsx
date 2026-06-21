import type { ComponentProps, ReactNode } from 'react'
import { Menu } from '@base-ui/react/menu'

export function MenuRoot({ children }: { children: ReactNode }) {
  return <Menu.Root>{children}</Menu.Root>
}

export function MenuTrigger({ className = '', ...rest }: ComponentProps<typeof Menu.Trigger>) {
  return (
    <Menu.Trigger
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white/90 transition-transform duration-150 ease-out hover:bg-black/50 active:scale-[0.92] focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime ${className}`}
      {...rest}
    />
  )
}

export function MenuContent({ children }: { children: ReactNode }) {
  return (
    <Menu.Portal>
      <Menu.Positioner className="z-50" sideOffset={6} align="end">
        <Menu.Popup className="album-theme min-w-44 rounded-xl border border-white/10 bg-bg-elev p-1.5 text-ink shadow-[0_18px_48px_-20px_rgba(0,0,0,0.8)] transition-all duration-150 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0">
          {children}
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  )
}

export interface MenuItemProps extends ComponentProps<typeof Menu.Item> {
  destructive?: boolean
}

export function MenuItem({ destructive = false, className = '', ...rest }: MenuItemProps) {
  const tone = destructive
    ? 'text-red-400 data-[highlighted]:bg-red-500/15'
    : 'text-ink data-[highlighted]:bg-white/[0.06]'
  return (
    <Menu.Item
      className={`flex h-10 cursor-default select-none items-center gap-2 rounded-lg px-3 text-sm font-medium outline-none ${tone} ${className}`}
      {...rest}
    />
  )
}
