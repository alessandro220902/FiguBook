export interface TeamFacts {
  city?: string
  founded?: number
  stadium?: string
  nickname?: string
}

// chiave = id canonico (slug nome, vedi teamIdentity). Campi opzionali: assente => nascosto.
// Popolato progressivamente (Wikidata CC0 / conoscenza / web).
// Lotto 1: Serie A (Calciatori 24/25 + 25/26).
export const TEAM_FACTS: Record<string, TeamFacts> = {
  atalanta: { city: 'Bergamo', founded: 1907, stadium: 'Gewiss Stadium', nickname: 'La Dea' },
  bologna: { city: 'Bologna', founded: 1909, stadium: 'Renato Dall’Ara', nickname: 'Rossoblù' },
  cagliari: { city: 'Cagliari', founded: 1920, stadium: 'Unipol Domus', nickname: 'Isolani' },
  como: { city: 'Como', founded: 1907, stadium: 'Giuseppe Sinigaglia', nickname: 'Lariani' },
  cremonese: { city: 'Cremona', founded: 1903, stadium: 'Giovanni Zini', nickname: 'Grigiorossi' },
  empoli: { city: 'Empoli', founded: 1920, stadium: 'Carlo Castellani', nickname: 'Azzurri' },
  fiorentina: { city: 'Firenze', founded: 1926, stadium: 'Artemio Franchi', nickname: 'Viola' },
  genoa: { city: 'Genova', founded: 1893, stadium: 'Luigi Ferraris', nickname: 'Grifone' },
  'hellas-verona': { city: 'Verona', founded: 1903, stadium: 'Marcantonio Bentegodi', nickname: 'Scaligeri' },
  inter: { city: 'Milano', founded: 1908, stadium: 'San Siro', nickname: 'Nerazzurri' },
  juventus: { city: 'Torino', founded: 1897, stadium: 'Allianz Stadium', nickname: 'Bianconeri' },
  lazio: { city: 'Roma', founded: 1900, stadium: 'Stadio Olimpico', nickname: 'Biancocelesti' },
  lecce: { city: 'Lecce', founded: 1908, stadium: 'Via del Mare', nickname: 'Giallorossi' },
  milan: { city: 'Milano', founded: 1899, stadium: 'San Siro', nickname: 'Rossoneri' },
  monza: { city: 'Monza', founded: 1912, stadium: 'U-Power Stadium', nickname: 'Brianzoli' },
  napoli: { city: 'Napoli', founded: 1926, stadium: 'Diego Armando Maradona', nickname: 'Partenopei' },
  parma: { city: 'Parma', founded: 1913, stadium: 'Ennio Tardini', nickname: 'Crociati' },
  pisa: { city: 'Pisa', founded: 1909, stadium: 'Arena Garibaldi', nickname: 'Nerazzurri' },
  roma: { city: 'Roma', founded: 1927, stadium: 'Stadio Olimpico', nickname: 'Giallorossi' },
  sassuolo: { city: 'Sassuolo', founded: 1920, stadium: 'Mapei Stadium', nickname: 'Neroverdi' },
  torino: { city: 'Torino', founded: 1906, stadium: 'Olimpico Grande Torino', nickname: 'Granata' },
  udinese: { city: 'Udine', founded: 1896, stadium: 'Bluenergy Stadium', nickname: 'Friulani' },
  venezia: { city: 'Venezia', founded: 1907, stadium: 'Pier Luigi Penzo', nickname: 'Leoni Alati' },
}

export function factsForTeam(canonicalId: string): TeamFacts {
  return TEAM_FACTS[canonicalId] ?? {}
}
