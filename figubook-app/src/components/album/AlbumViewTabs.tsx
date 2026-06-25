import { LayoutGrid, Rows3, Sparkles } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type AlbumView = 'sections' | 'flat'

export interface AlbumViewTabsProps {
  value: AlbumView
  onChange: (view: AlbumView) => void
}

// Trigger icon-only: target touch >=44px, attivo = lime brand (non i token shadcn
// che nel tema album rendono l'attivo più scuro della lista). twMerge lascia
// vincere queste classi sui default di ui/tabs.
// Attivo = solo contorno lime (niente fill pieno, troppo carico).
const trigger =
  'h-11 min-w-11 flex-none rounded-lg border border-transparent px-3 text-ink-2 transition-colors hover:text-ink disabled:opacity-40 ' +
  'data-active:border-lime data-active:bg-transparent data-active:text-lime data-active:shadow-none ' +
  'dark:data-active:border-lime dark:data-active:bg-transparent dark:data-active:text-lime'

export function AlbumViewTabs({ value, onChange }: AlbumViewTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => {
        if (v === 'sections' || v === 'flat') onChange(v)
      }}
    >
      <TabsList className="h-auto gap-1 rounded-xl border border-white/10 bg-bg-elev/60 p-1">
        <TabsTrigger value="sections" className={trigger} aria-label="Vista a sezioni" title="Vista a sezioni">
          <LayoutGrid className="size-5" aria-hidden />
        </TabsTrigger>
        <TabsTrigger value="flat" className={trigger} aria-label="Tutte le figurine" title="Tutte le figurine">
          <Rows3 className="size-5" aria-hidden />
        </TabsTrigger>
        <TabsTrigger value="more" disabled className={trigger} aria-label="In arrivo" title="In arrivo">
          <Sparkles className="size-5" aria-hidden />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
