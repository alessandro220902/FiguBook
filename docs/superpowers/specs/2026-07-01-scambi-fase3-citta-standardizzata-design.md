# Scambi Fase 3 — Città standardizzata (autocomplete comuni)

Data: 2026-07-01
Stato: design approvato, pronto per piano.

## Obiettivo

Rendere affidabile il filtro "Vicino a me" degli Scambi, che oggi = match città
esatta ma fallisce perché la città è **testo libero** (typo/varianti: "Roma" ≠
"roma" ≠ "Roma (RM)"). Soluzione: la città diventa un **autocomplete su dataset
comuni italiani**, che salva un valore canonico. Nessuna coordinata, nessun GPS,
nessun km, nessun calcolo distanza. "Vicino a me" resta match città esatta, ma ora
sul valore canonico → affidabile.

## Non-obiettivi (YAGNI)
- Coordinate/lat-lng, GPS, distanza in km, raggio configurabile → esclusi (decisione
  utente: "vicino a me = stessa città").
- Fallback per città vecchie: NESSUNO. Chi aveva città testo libero la riseleziona.

## Dataset comuni

- File generato `src/data/comuni-it.ts` (o `.json` importato): array di comuni
  italiani ISTAT, ciascuno `{ nome: string, prov: string }` (prov = sigla, es. "RM").
  ~8000 voci. Nessuna coordinata.
- Generato una tantum da fonte pubblica ISTAT (elenco comuni + sigla provincia),
  committato nel repo. Nessuna API a runtime.
- Valore canonico salvato come stringa: **`"<Nome> (<PROV>)"`**, es. `"Roma (RM)"`.
  Univoco a sufficienza per il match "stessa città" (comuni omonimi in province
  diverse restano distinti dalla sigla).

## Componente CittaPicker

- Nuovo `src/components/profile/CittaPicker.tsx` (pattern simile a TeamPicker).
- Props: `{ value: string; onChange: (v: string) => void }`. `value` = stringa
  canonica salvata (o '' se non impostata).
- Comportamento: input di testo con dropdown di suggerimenti filtrati per prefisso
  (case-insensitive) sul nome comune; mostra "Nome (PROV)". Selezione = set del valore
  canonico. Se l'utente digita senza selezionare, il valore NON è valido → non si
  salva testo libero (vedi validazione sotto).
- Filtro: match su `nome` (prefisso, poi contains), cap a ~8 risultati per performance.
  Il dataset è in memoria (import statico) → filtro sincrono.
- Modulo puro testabile `src/lib/geo/searchComuni.ts`: `searchComuni(query, max)` →
  `{ nome, prov }[]`. Con test.

## Validazione salvataggio

- In `profile.ts` (saveProfileAccount), la città accettata deve essere una stringa
  canonica presente nel dataset (o vuota). Helper puro `isValidComune(value)` in
  `src/lib/geo/searchComuni.ts` (lookup su un Set delle stringhe canoniche).
- Se il valore non è un comune valido → salvato come '' (città non impostata),
  così non inquina il match. La UI (CittaPicker) evita comunque di produrre valori
  invalidi selezionando dal dropdown.

## Flusso dati (invariato a valle)

- Città canonica salvata in `profile` → mirrorata in `publicProfiles` (se profilo
  pubblico, gate esistente) e in `tradeIndex` (già oggi `publishIndex(..., citta)`).
- Filtro Scambi "Vicino a me" invariato: `filters.nearMe ? r.entry.citta === myCitta`.
  Ora `citta` è canonica su entrambi i lati → match affidabile.
- MatchCard mostra la città (già lo fa) — ora sempre nel formato "Nome (PROV)".

## Migrazione utenti esistenti

- Nessun auto-fix. Le città vecchie testo-libero restano come sono finché l'utente
  non apre il Profilo e riseleziona dal CittaPicker. Fino ad allora "Vicino a me"
  non li include (il loro `citta` non combacia con un valore canonico altrui). Accettato.

## File coinvolti
- Create: `src/data/comuni-it.ts` (dataset generato).
- Create: `src/lib/geo/searchComuni.ts` (+ `.test.ts`) — searchComuni + isValidComune.
- Create: `src/components/profile/CittaPicker.tsx`.
- Modify: `src/pages/Profilo.tsx` — sostituisce l'input città con CittaPicker.
- Modify: `src/lib/db/profile.ts` — validazione città canonica in saveProfileAccount.
- (tradeIndex/publicProfiles/Scambi: nessuna modifica logica, solo dato più pulito.)

## Testing
- `searchComuni`: prefisso, case-insensitive, cap risultati, ordine (prefix prima).
- `isValidComune`: true su "Roma (RM)", false su "roma"/"Xyz".
- profile.ts: città non valida → salvata ''.
- Manuale: Profilo → digito "Rom" → seleziono "Roma (RM)" → salvo; altro account stessa
  città → compare in "Vicino a me".

## Rischi
- Peso bundle dataset (~qualche centinaio di KB). Mitigazione: solo `{nome, prov}`,
  eventuale lazy-import se pesa troppo (valutare in fase piano). Accettabile per ora.
