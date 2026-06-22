---
target: dashboard
total_score: 31
p0_count: 0
p1_count: 2
timestamp: 2026-06-19T14-23-34Z
slug: figubook-app-src-pages-dashboard-tsx
---
# Critique — Dashboard (figubook-app/src/pages/Dashboard.tsx)

## Anti-Patterns Verdict
LLM: non grida "IA", pulita e coerente, ma manca personalità di brand (pitch/foil/calcio sotto-sfruttati). Detector: [] su tutti i file (0 tell). Browser: non disponibile (review manuale). Indipendenza assessment: degraded (no sub-agent, no browser).

## Design Health Score
| # | Euristica | Score | Punto chiave |
|---|-----------|-------|-----------|
| 1 | Visibilità stato | 3 | skeleton+count-up+aria-live; manca stato errore |
| 2 | Match mondo reale | 4 | lessico figurine italiano perfetto |
| 3 | Controllo/libertà | 3 | carosello pausa/frecce/dots; read-only |
| 4 | Coerenza/standard | 3 | display font speccato (Barlow) != reso (Geist) |
| 5 | Prevenzione errori | 3 | nessuna azione distruttiva; no guardrail fail dati |
| 6 | Riconoscere>ricordare | 4 | tutto visibile/etichettato |
| 7 | Flessibilità/efficienza | 3 | no shortcut globali; deck frecce ok |
| 8 | Estetico/minimalista | 3 | pulito ma gerarchia debole, 5 tile equivalenti |
| 9 | Recupero errori | 2 | nessuno stato errore se Firestore fallisce |
| 10 | Aiuto/documentazione | 3 | empty-state insegnano; no tour |
| Totale | | 31/40 | Good |

## Overall
Mazzo album = anima/identita. Resto corretto ma anonimo. Occasione: portare il carattere del mazzo nel resto della pagina.

## What's Working
1. Mazzo album full-color sfogliabile con stat.
2. Lessico e match dominio (italiano figurine).
3. Fondamenta a11y/empty-state post-audit.

## Priority Issues
- [P1] Identita brand sotto-sfruttata: --pitch e --gold/foil definiti ma mai usati. Fix: foil su completamento, pitch su hero saluto. Cmd: colorize/bolder.
- [P1] 5 tile stat = griglia card identiche (anti-ref PRODUCT.md), gerarchia zero. Fix: "Possedute+anello" stat eroe, altre minori. Cmd: layout/bolder.
- [P2] Tipografia senza contrasto: --font-display sovrascritto Geist, perso Barlow Condensed sportivo. Fix: display condensato su titoli/numeri. Cmd: typeset.
- [P2] Nessuno stato errore dati (euristica 9 = 2). Fix: errore+retry. Cmd: harden.
- [P3] Momento benvenuto timido (typewriter piccolo). Fix: hero pitch/serif. Cmd: delight.

## Persona Red Flags
- Casey (mobile): nessun red flag grosso post-fix touch.
- Sam (a11y): solido; resta card-div cliccabile ridondante (minore).
- Alex (power): nessuno shortcut globale (accettabile per glance dashboard).

## Questions
- Far vincere il dato Possedute invece di parificarlo?
- Perche il mazzo vive isolato? E se colorasse la pagina?
- Versione sicura di se userebbe l'oro per la rarita.
