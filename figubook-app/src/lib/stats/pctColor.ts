// Scala colore per percentuale di completamento (da 21st gauge default-color-scale).
// Soglie: prende il colore della soglia più alta <= valore.
//   0-33  rosso   #e2162a
//   34-67 giallo  #ffae00
//   68-100 verde  #00ac3a
export function pctColor(value: number): string {
  const v = Math.max(0, Math.min(100, value))
  if (v >= 68) return '#00ac3a'
  if (v >= 34) return '#ffae00'
  return '#e2162a'
}
