export interface Section {
  id: string
  name: string
  short: string
  group: string
  kind: 'team' | 'opening-trofei' | 'other' | string
  codes: string[]
  c1: string
  c2: string
}
export interface AlbumData {
  sections: Section[]
  groups: string[]
  names: Record<string, string>
}
