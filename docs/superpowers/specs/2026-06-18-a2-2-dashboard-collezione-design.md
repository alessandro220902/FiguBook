# A2.2 — Layer lettura album/stat + dashboard "cruscotto collezione" (design)

Data: 2026-06-18
Skill: brainstorming (approvato in chat). Lente: **architettura** (sopra [[no-buchi-costruzione-progressiva]]).
Parte di Step 2 → A2 layer dati, terzo slice. Vedi audit fondamenta, [[senior-engineer-lenses]], [[componenti-21st-urls]].

## Obiettivo
Rendere viva la Dashboard con dati reali di **album + figurine** letti da Firestore, ridisegnandola come **cruscotto scuro denso** (look trading: stat rosse/verdi semantiche, anelli, barre). Solo lettura. Nessun dato finto: ciò che non ha dato dietro non si mostra.

## Scope (deciso in brainstorming)
- **DENTRO**: layer lettura album+stat (live), dashboard ridisegnata con grafici reali.
- **FUORI → A2.3**: editing griglia figurine + store ottimistico + batch (fix B1), storico → recap giornaliero/settimanale, frecce trend ▲▼.
- **FUORI → slice scambi**: widget match/scambi attivi (servono gruppi/inventory). NON mostrati ora (niente segnaposto rotti).

## Modello dati (invariato, sito vecchio lo scrive ancora)
- `users/{uid}/albums/_my-albums` → `{ ids: string[] }`
- `users/{uid}/albums/{albumId}` → `{ states: {code: 'have'|'double'|...}, counts: {code: number}, ts }`
- Totale album = dal **catalogo tipato** (`albumCatalog.ts`), NON da `window.STICKER_STATES`/`FB_STORAGE_KEY` (fix B13).

## Componenti (piccoli, isolati, una responsabilità)

### Layer dati — `src/lib/db/albums.ts`
- Tipo `AlbumStats { have: number; doubles: number; missing: number; total: number; pct: number }`.
- Tipo `PerAlbumStats = AlbumStats & { id: string; entry: AlbumCatalogEntry }`.
- `subscribeMyAlbumIds(uid, cb): () => void` — onSnapshot su `_my-albums`; ritorna `ids` (`[]` se assente). Errore → `cb([])` + console.error.
- `subscribeAlbum(uid, albumId, cb): () => void` — onSnapshot doc album → `{ states, counts }` (`{},{}` se assente).
- `computeStats(albumId, states, counts): AlbumStats` — **funzione pura** (testabile senza Firestore). Logica portata fedele da `figubook-db.js:220` (have/doubles/missing/pct), totale dal catalogo. Fix B13.
- Nessuna scrittura in questo slice. Nessuna delete-in-lettura (fix B8 già rispettato perché non leggiamo notifiche qui).

### Hook — `src/hooks/useCollection.ts`
- Prende `uid` da `useAuth`.
- Sottoscrive `subscribeMyAlbumIds`; per ogni id apre/chiude `subscribeAlbum` (cleanup corretto su cambio lista/unmount — nessun listener orfano).
- Ritorna `{ albums: PerAlbumStats[], totals: AlbumStats, loading: boolean }`.
- `totals` = somma have/doubles/missing/total + pct ricalcolata sull'aggregato.
- Senza utente → stato vuoto, nessun setState in effect senza guardia (lint-clean, come `useNotifications`).

### UI — `src/pages/Dashboard.tsx` + `src/components/dashboard/*`
- `StatTicker.tsx` — riga tile cruscotto: **Possedute** (🟢 verde) · **Mancanti** (🔴 rosso) · **Doppie** (lime/neutro) · **Completamento %** globale. Numeri grandi mono. NIENTE ▲▼ (no storico).
- `CompletionRing.tsx` — donut recharts `RadialBarChart`, % globale al centro, arco verde. (Pattern da 21st `stats-2`.)
- `AlbumStatCard.tsx` — per album: anello radiale recharts + "`have` di `total`" + nome album. Griglia responsive.
- `ClosestAlbumCard.tsx` — album con `missing` minimo (>0): "Ti mancano N a X" + CTA "Apri" → rotta album.
- **Empty state** (nessun album): card unica "Aggiungi il primo album" → link `/album`.
- Stile: scuro, denso, rosso/verde **semantico** (verde=possedute/completo, rosso=mancanti). Caselle figurina NON coinvolte qui → [[figubook-figurine-cards-neutral]] resta valida (vale per la griglia in A2.3).

## Dipendenze
- `+ recharts` (anelli/donut). `framer-motion` e `lucide-react` già presenti.
- `border-beam` (da hero-195-1): **opzionale/decorativo**, non bloccante. Solo se non aggiunge fragilità.

## Fonti 21st (filtro anti-rotto applicato)
- `stats-2` (ephraimduncan) → **usato**: recharts RadialBarChart per anelli. Cuore grafici.
- `health-stat-card` (ruixenui) → **parziale**: look riga stat rosso/verde; **scartate ▲▼/delta%** (trend senza storico = finto).
- `hero-195-1` (shadcnblocks) → **solo vibe** (scuro, rosso/verde, cruscotto); border-beam opzionale.
- `statistics-card-8` (reui) → **scartato**: counter demo, nessun grafico.

## Fix audit applicati / rispettati
- B13 totale dal catalogo, niente global di pagina.
- B4 ogni read gated dietro uid valido (`requireUid`/`useAuth`).
- B8 nessuna delete in lettura.
- Logica stat "buona" dell'audit portata fedele.

## Checkpoint review (no-buchi, skill requesting-code-review a ognuno)
1. **Layer dati** (`albums.ts` + `useCollection.ts`) → `npm run build` + `lint` + review prima dell'UI.
2. **Componenti UI** isolati (ring/ticker/card) → build + lint + review.
3. **Dashboard cablata + live** → build + lint + review finale prima di commit/push.

## Verifica (zero-locale, no test runner per la parte Firestore)
- `computeStats` è pura → unit test possibile (TDD lì se utile).
- `npm run build` exit 0 + `npm run lint` (solo i 2 error shadcn pre-esistenti, nessuno mio).
- Live: dashboard mostra % e numeri reali; aggiunta/modifica album dal sito vecchio si riflette live; nessun album → empty-state CTA; non loggato → redirect login (ProtectedRoute già attivo).

## Self-review
Path esatti; nessun placeholder; scope ristretto (solo lettura, no editing/scambi/storico); compat sito vecchio garantita; widget senza dato esclusi (no buchi); dep nuova singola (recharts) motivata. Coerente coi pattern esistenti (notifiche: subscribe live + hook).
