// Converte i vecchi album-data-*.js (window.SECTIONS/GROUPS/STICKER_NAMES)
// in moduli TS tipati. Esegue ogni file in uno scope con `window` shimmato.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
// file album-data → id catalogo (figubook-app/src/data/albumCatalog.ts)
const MAP = {
  'album-data-2223.js': 'calciatori-22-23',
  'album-data-2324.js': 'calciatori-23-24',
  'album-data-2425.js': 'calciatori-24-25',
  'album-data-fwc2022.js': 'mondiali-2022',
  'album-data-fwc2026.js': 'mondiali-2026',
  'album-data-serieb-2526.js': 'calb-25-26',
  'album-data-adrenalyn-2526.js': 'adrenalyn-25-26',
  'album-data-matchattax-2526.js': 'match-attax-ucl',
}
const outDir = resolve(root, 'figubook-app/src/data/albums')

for (const [file, id] of Object.entries(MAP)) {
  const path = resolve(root, file)
  if (!existsSync(path)) { console.warn('skip (manca):', file); continue }
  const src = readFileSync(path, 'utf8')
  const win = {}
  // esegue il file vecchio in uno scope con `window` shimmato.
  // Alcune sorgenti del vecchio sito hanno bug di sintassi (es. apostrofi non
  // escaped in "Costa d'Avorio") → si salta il file senza abortire il resto.
  try {
    new Function('window', src)(win)
  } catch (e) {
    console.warn('SKIP (sorgente rotta):', file, '·', e.message)
    continue
  }
  const sections = (win.SECTIONS || []).map((s) => ({
    id: s.id, name: s.name, short: s.short ?? s.name, group: s.group,
    kind: s.kind, codes: s.codes, c1: s.c1, c2: s.c2,
  }))
  const data = { sections, groups: win.GROUPS || [], names: win.STICKER_NAMES || {} }
  const ts = `// AUTO-GENERATO da scripts/convert-album-data.mjs (fonte: ${file}). Non modificare a mano.\n`
    + `import type { AlbumData } from './types'\n\n`
    + `const data: AlbumData = ${JSON.stringify(data, null, 0)}\n\n`
    + `export default data\n`
  writeFileSync(resolve(outDir, `${id}.ts`), ts)
  console.log('ok', id, '·', sections.length, 'sezioni')
}
