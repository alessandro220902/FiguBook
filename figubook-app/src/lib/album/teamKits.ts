import type { Section } from '@/data/albums/types'

export const PATTERNS = ['solid', 'stripes', 'halves', 'sash', 'hoops'] as const
export type KitPattern = (typeof PATTERNS)[number]

export interface TeamKit {
  c1: string
  c2: string
  accent?: string
  pattern: KitPattern
  foil?: boolean
}

// Punto di verità: chiave = section.id. Colori fedeli ai club/nazionali; pattern
// non-solid SOLO dove la maglia è inconfondibilmente quel disegno (righe/metà/fascia),
// altrimenti 'solid'. Le sezioni non presenti cadono sul fallback (kitFromColors).
export const KITS: Record<string, TeamKit> = {
  // --- Serie A / italiane (club) ---
  atalanta: { c1: '#1e71b8', c2: '#000000', pattern: 'stripes' },
  avellino: { c1: '#0a8a3c', c2: '#ffffff', pattern: 'solid' },
  bari: { c1: '#e2001a', c2: '#ffffff', pattern: 'solid' },
  bologna: { c1: '#1a2f5a', c2: '#a01e20', pattern: 'halves' },
  cagliari: { c1: '#c8102e', c2: '#002b5c', pattern: 'halves' },
  carrarese: { c1: '#ffd200', c2: '#0a3a8b', pattern: 'solid' },
  catanzaro: { c1: '#ffd200', c2: '#c8102e', pattern: 'halves' },
  cesena: { c1: '#ffffff', c2: '#000000', pattern: 'solid' },
  como: { c1: '#0b3d91', c2: '#ffffff', pattern: 'solid' },
  cremonese: { c1: '#a6192e', c2: '#5b5b5b', pattern: 'solid' },
  empoli: { c1: '#00579c', c2: '#ffffff', pattern: 'solid' },
  fiorentina: { c1: '#511e7f', c2: '#ffffff', pattern: 'solid' },
  frosinone: { c1: '#ffd200', c2: '#0a3a8b', pattern: 'solid' },
  genoa: { c1: '#c8102e', c2: '#002147', pattern: 'halves' },
  'hellas-verona': { c1: '#ffd200', c2: '#002b7f', pattern: 'solid' },
  inter: { c1: '#010e80', c2: '#000000', pattern: 'stripes' },
  'juve-stabia': { c1: '#ffd200', c2: '#002b7f', pattern: 'solid' },
  juventus: { c1: '#111111', c2: '#f4f4f4', pattern: 'stripes' },
  lazio: { c1: '#87ceeb', c2: '#ffffff', accent: '#c8a24a', pattern: 'solid' },
  lecce: { c1: '#ffd200', c2: '#c8102e', pattern: 'halves' },
  mantova: { c1: '#c8102e', c2: '#ffffff', pattern: 'solid' },
  milan: { c1: '#fb090b', c2: '#000000', pattern: 'stripes' },
  modena: { c1: '#ffd200', c2: '#0a3a8b', pattern: 'solid' },
  monza: { c1: '#c8102e', c2: '#ffffff', pattern: 'solid' },
  napoli: { c1: '#199fdb', c2: '#ffffff', pattern: 'solid' },
  padova: { c1: '#ffffff', c2: '#c8102e', pattern: 'solid' },
  palermo: { c1: '#eb6ea5', c2: '#000000', pattern: 'solid' },
  parma: { c1: '#ffffff', c2: '#0a3a8b', accent: '#f9d616', pattern: 'sash' },
  pescara: { c1: '#009fe3', c2: '#ffffff', pattern: 'solid' },
  pisa: { c1: '#000000', c2: '#0a3a8b', pattern: 'solid' },
  reggiana: { c1: '#8a1c2b', c2: '#ffffff', pattern: 'solid' },
  roma: { c1: '#960a2c', c2: '#f0bc42', pattern: 'solid' },
  's-dtirol': { c1: '#ffffff', c2: '#c8102e', pattern: 'solid' },
  salernitana: { c1: '#7a1f2b', c2: '#ffffff', pattern: 'solid' },
  sampdoria: { c1: '#12386b', c2: '#ffffff', accent: '#e30613', pattern: 'sash' },
  sassuolo: { c1: '#00a752', c2: '#000000', pattern: 'solid' },
  spezia: { c1: '#ffffff', c2: '#000000', pattern: 'solid' },
  torino: { c1: '#7a1f2b', c2: '#ffffff', pattern: 'solid' },
  udinese: { c1: '#000000', c2: '#ffffff', pattern: 'stripes' },
  venezia: { c1: '#000000', c2: '#f18a00', accent: '#00a752', pattern: 'sash' },
  'virtus-entella': { c1: '#009fe3', c2: '#ffffff', pattern: 'solid' },

  // --- Estere / europee (club) ---
  ajax: { c1: '#ffffff', c2: '#d2122e', pattern: 'solid' },
  arsenal: { c1: '#ef0107', c2: '#ffffff', pattern: 'solid' },
  athletic: { c1: '#ee2523', c2: '#ffffff', pattern: 'solid' },
  atletico: { c1: '#cb3524', c2: '#ffffff', accent: '#1c2a5e', pattern: 'stripes' },
  barcelona: { c1: '#004d98', c2: '#a50044', pattern: 'stripes' },
  bayer: { c1: '#e32221', c2: '#000000', pattern: 'solid' },
  bayern: { c1: '#dc052d', c2: '#ffffff', pattern: 'solid' },
  benfica: { c1: '#e40521', c2: '#ffffff', pattern: 'solid' },
  'bodo-glimt': { c1: '#ffed00', c2: '#000000', pattern: 'solid' },
  brugge: { c1: '#005baa', c2: '#000000', pattern: 'solid' },
  chelsea: { c1: '#034694', c2: '#ffffff', pattern: 'solid' },
  copenhagen: { c1: '#ffffff', c2: '#002b5c', pattern: 'solid' },
  dortmund: { c1: '#fde100', c2: '#000000', pattern: 'solid' },
  frankfurt: { c1: '#000000', c2: '#e1000f', pattern: 'solid' },
  galatasaray: { c1: '#a90432', c2: '#fdb912', pattern: 'solid' },
  kairat: { c1: '#ffd200', c2: '#000000', pattern: 'solid' },
  liverpool: { c1: '#c8102e', c2: '#ffffff', pattern: 'solid' },
  'man-city': { c1: '#6cabdd', c2: '#ffffff', pattern: 'solid' },
  marseille: { c1: '#ffffff', c2: '#2faee0', pattern: 'solid' },
  monaco: { c1: '#e30613', c2: '#ffffff', pattern: 'solid' },
  newcastle: { c1: '#000000', c2: '#ffffff', pattern: 'stripes' },
  olympiacos: { c1: '#c8102e', c2: '#ffffff', pattern: 'solid' },
  pafos: { c1: '#0a3a8b', c2: '#ff7f00', pattern: 'solid' },
  psg: { c1: '#004170', c2: '#e30613', accent: '#ffffff', pattern: 'solid' },
  psv: { c1: '#ed1c24', c2: '#ffffff', pattern: 'solid' },
  qarabag: { c1: '#000000', c2: '#ffffff', pattern: 'stripes' },
  'real-madrid': { c1: '#ffffff', c2: '#00529f', accent: '#febe10', pattern: 'solid' },
  slavia: { c1: '#d7141a', c2: '#ffffff', pattern: 'solid' },
  sporting: { c1: '#008057', c2: '#ffffff', pattern: 'solid' },
  tottenham: { c1: '#ffffff', c2: '#132257', pattern: 'solid' },
  'union-sg': { c1: '#ffd200', c2: '#0a3a8b', pattern: 'solid' },
  villarreal: { c1: '#ffcf00', c2: '#004b9b', pattern: 'solid' },

  // --- Nazionali (colori bandiera, sempre solid) ---
  arg: { c1: '#75aadb', c2: '#ffffff', pattern: 'solid' },
  aus: { c1: '#ffcd00', c2: '#00843d', pattern: 'solid' },
  bel: { c1: '#e30613', c2: '#000000', accent: '#ffd700', pattern: 'solid' },
  bra: { c1: '#ffdf00', c2: '#009c3b', pattern: 'solid' },
  can: { c1: '#d52b1e', c2: '#ffffff', pattern: 'solid' },
  cmr: { c1: '#007a5e', c2: '#ce1126', accent: '#fcd116', pattern: 'solid' },
  crc: { c1: '#c8102e', c2: '#002b5c', pattern: 'solid' },
  cro: { c1: '#ff0000', c2: '#ffffff', pattern: 'solid' },
  den: { c1: '#c60c30', c2: '#ffffff', pattern: 'solid' },
  ecu: { c1: '#ffd100', c2: '#0a3a8b', accent: '#ed1c24', pattern: 'solid' },
  eng: { c1: '#ffffff', c2: '#001489', pattern: 'solid' },
  esp: { c1: '#c60b1e', c2: '#ffc400', pattern: 'solid' },
  fra: { c1: '#0055a4', c2: '#ffffff', accent: '#ef4135', pattern: 'solid' },
  ger: { c1: '#ffffff', c2: '#000000', pattern: 'solid' },
  gha: { c1: '#ffffff', c2: '#ce1126', accent: '#fcd116', pattern: 'solid' },
  irn: { c1: '#ffffff', c2: '#239f40', accent: '#da0000', pattern: 'solid' },
  jpn: { c1: '#000d8c', c2: '#ffffff', pattern: 'solid' },
  kor: { c1: '#c8102e', c2: '#ffffff', pattern: 'solid' },
  ksa: { c1: '#006c35', c2: '#ffffff', pattern: 'solid' },
  mar: { c1: '#c1272d', c2: '#006233', pattern: 'solid' },
  mex: { c1: '#006847', c2: '#ffffff', accent: '#ce1126', pattern: 'solid' },
  ned: { c1: '#ff4f00', c2: '#ffffff', pattern: 'solid' },
  pol: { c1: '#ffffff', c2: '#dc143c', pattern: 'solid' },
  por: { c1: '#c8102e', c2: '#006600', pattern: 'solid' },
  qat: { c1: '#8a1538', c2: '#ffffff', pattern: 'solid' },
  sen: { c1: '#ffffff', c2: '#00853f', accent: '#e31b23', pattern: 'solid' },
  srb: { c1: '#c8102e', c2: '#0a3a8b', accent: '#ffffff', pattern: 'solid' },
  sui: { c1: '#d52b1e', c2: '#ffffff', pattern: 'solid' },
  tun: { c1: '#e70013', c2: '#ffffff', pattern: 'solid' },
  uru: { c1: '#7ab3e0', c2: '#ffffff', pattern: 'solid' },
  usa: { c1: '#ffffff', c2: '#002868', accent: '#bf0a30', pattern: 'solid' },
  wal: { c1: '#c8102e', c2: '#ffffff', pattern: 'solid' },

  // --- Nazionali extra (Mondiali 2026, colori bandiera) ---
  alg: { c1: '#006233', c2: '#d21034', pattern: 'solid' },
  aut: { c1: '#ed2939', c2: '#ffffff', pattern: 'solid' },
  bih: { c1: '#002395', c2: '#ffce00', pattern: 'solid' },
  civ: { c1: '#f77f00', c2: '#009a44', pattern: 'solid' },
  cod: { c1: '#007fff', c2: '#ce1126', pattern: 'solid' },
  col: { c1: '#fcd116', c2: '#003087', pattern: 'solid' },
  cpv: { c1: '#003893', c2: '#cf2027', pattern: 'solid' },
  cuw: { c1: '#002b7f', c2: '#f9e814', pattern: 'solid' },
  cze: { c1: '#d7141a', c2: '#11457e', pattern: 'solid' },
  egy: { c1: '#ce1126', c2: '#ffffff', pattern: 'solid' },
  hai: { c1: '#00209f', c2: '#d21034', pattern: 'solid' },
  irq: { c1: '#ce1126', c2: '#007a3d', pattern: 'solid' },
  jor: { c1: '#007a3d', c2: '#ce1126', pattern: 'solid' },
  nor: { c1: '#ef2b2d', c2: '#002868', pattern: 'solid' },
  nzl: { c1: '#00247d', c2: '#cc142b', pattern: 'solid' },
  pan: { c1: '#da121a', c2: '#003888', pattern: 'solid' },
  par: { c1: '#d52b1e', c2: '#ffffff', pattern: 'solid' },
  rsa: { c1: '#007a4d', c2: '#de3831', pattern: 'solid' },
  sco: { c1: '#003399', c2: '#ffffff', pattern: 'solid' },
  swe: { c1: '#006aa7', c2: '#fecc00', pattern: 'solid' },
  tur: { c1: '#e30a17', c2: '#ffffff', pattern: 'solid' },
  uzb: { c1: '#1eb53a', c2: '#ce1126', pattern: 'solid' },
}

export function kitFromColors(c1: string, c2: string): TeamKit {
  return { c1, c2, pattern: 'solid' }
}

// Alias per lo stesso team con id diversi tra album (Fase A: pochi, estendibile).
const ALIAS: Record<string, string> = {
  verona: 'hellas-verona', // stesso club, id diverso tra album
  hellas: 'hellas-verona', // Adrenalyn usa 'hellas' per Hellas Verona
}

// Risolve l'id sezione alla chiave KITS: alias espliciti, oppure gli id dei
// Mondiali 2026 nel formato 'girone-<lettera>-<cod3>' -> nazionale 'cod3'.
function resolveKey(id: string): string {
  if (ALIAS[id]) return ALIAS[id]
  const g = /^girone-[A-Za-z]+-([a-z]{3})$/.exec(id)
  if (g && KITS[g[1]]) return g[1]
  return id
}

export function hasCuratedKit(id: string): boolean {
  return !!KITS[resolveKey(id)]
}

export function kitForSection(section: Section): TeamKit {
  return KITS[resolveKey(section.id)] ?? kitFromColors(section.c1, section.c2)
}
