// Estrae la sigla provincia dall'etichetta comune canonica "Nome (PROV)".
// '' se il formato non è canonico o l'input è vuoto.
export function provinciaOf(citta: string): string {
  const m = citta.trim().match(/\(([A-Za-z]{2})\)\s*$/)
  return m ? m[1].toUpperCase() : ''
}
