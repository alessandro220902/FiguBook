---
target: figubook-app/src/pages/Album.tsx
total_score: 31
p0_count: 0
p1_count: 1
timestamp: 2026-06-20T20-16-53Z
slug: figubook-app-src-pages-album-tsx
---
# Critique — Album (figubook-app)

## Design Health (sintesi)
Detector deterministico: 0 anti-pattern. Register product. Pannello app-shell familiare, colore-squadra significante, inserimento rapido reale.

## Priority Issues
- [P1] Touch target stepper +/- = 24px su mobile (< requisito PRODUCT.md 44px). FIX applicato: 32px.
- [P2] Chip filtro bianco su gradiente squadra chiara (Hellas) rischio contrasto. FIX: scrim bg-black/45.
- [P2] Badge "1" verde ambiguo col conteggio stepper. FIX: icona ✓ (color-blind safe).
- [P3] Manca skeleton di caricamento sezione (ora "Caricamento album…" testo). Aperto.
- [P3] Barra completamento duplicata hero/landing. Aperto.

## What works
Contrasto stat (post-fix token), filtri nel banner compatti, scroll interni, sidebar sticky.
