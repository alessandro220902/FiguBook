import { LayoutGrid, Rows3, Sparkles } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type AlbumView = 'sections' | 'flat'

export interface AlbumViewTabsProps {
  value: AlbumView
  onChange: (view: AlbumView) => void
}

export function AlbumViewTabs({ value, onChange }: AlbumViewTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => {
        if (v === 'sections' || v === 'flat') onChange(v)
      }}
      className="items-center"
    >
      <TabsList aria-label="Modalità vista album">
        <TabsTrigger value="sections" aria-label="Vista a sezioni" title="Vista a sezioni">
          <LayoutGrid aria-hidden />
        </TabsTrigger>
        <TabsTrigger value="flat" aria-label="Tutte le figurine" title="Tutte le figurine">
          <Rows3 aria-hidden />
        </TabsTrigger>
        <TabsTrigger value="more" disabled aria-label="In arrivo" title="In arrivo">
          <Sparkles aria-hidden />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
