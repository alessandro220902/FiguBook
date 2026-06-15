# PRODUCT.md — FiguBook

## Register

**Product** (l'estetica SERVE il prodotto). FiguBook è un'app di utilità per collezionisti: il design deve rendere veloce e piacevole gestire la collezione, non essere esso stesso il prodotto. Eccezione: la pagina di benvenuto/login ha una componente **brand** (split editoriale) ed è l'unica superficie dove il design può "parlare" di più.

## Cos'è

App web per **collezionisti italiani di figurine Panini** (e album affini: Calciatori, FIFA World Cup, Adrenalyn, Match Attax, Serie B). Permette di:
- tracciare quali figurine si hanno / mancano / doppie, album per album;
- vedere progressi e obiettivi di completamento;
- **scambiare** doppioni con altri collezionisti (richieste, accetta/rifiuta, recensioni);
- sfogliare un catalogo di album e attivarli nella propria raccolta.

Stack: **plain HTML/CSS/JS** (niente React, niente Tailwind, niente build step). Hosting **GitHub Pages**. Backend dati via Firebase. CSS principalmente inline in `<style>` per pagina + `figubook-album-overrides.css` + layer `figubook-impeccable.css`.

## Utenti & Contesto

- **Chi**: appassionati di calcio, 14+, dai ragazzi agli adulti collezionisti. Italiani.
- **Contesto d'uso**: a casa o in mobilità, spesso col pacchetto di figurine appena aperto in mano — vogliono segnare "ce l'ho / mi manca" rapidamente; oppure cercano con chi scambiare i doppioni.
- **Job-to-be-done principali**:
  1. Aggiornare lo stato della collezione velocemente (tap rapidi, zero frizione).
  2. Capire a colpo d'occhio quanto manca al completamento.
  3. Trovare scambi convenienti e gestirli senza ansia.

## Personalità del brand

Tre parole: **moderno, appassionato, leale.**

- **Moderno/premium ma accessibile**: pulito, tipografia forte, niente fronzoli; deve sembrare un'app curata del 2026, non un gestionale.
- **Appassionato di calcio**: l'energia del campo e della figurina rara, senza cadere nel kitsch da bar sport.
- **Leale/giocoso ma onesto**: lo scambio è sociale; tono diretto, italiano vero, niente corporate-speak.

## Anti-reference (cosa NON deve sembrare)

- **NON** dashboard enterprise / SaaS B2B (no griglie infinite di card identiche icona+titolo+testo, no hero-metric template, no eyebrow maiuscoletto su ogni sezione).
- **NON** corporate navy-and-gold "fintech del calcio".
- **NON** kitsch da app di scommesse (verdi acidi ovunque, bagliori al neon, gradient drenched).
- **NON** template Bootstrap generico.

## Principi di design (strategici)

1. **Velocità di marcatura prima di tutto**: lo stato figurina si cambia con un tap; il feedback è immediato e leggibile.
2. **Il progresso è il protagonista**: completamento album/sezione sempre chiaro e gratificante.
3. **Identità calcistica nei dettagli, non nello sfondo**: il "calcio" vive in accent, tipografia, micro-copy e nei colori per-album — non in texture o decorazioni.
4. **Onestà del dato di scambio**: bilanci e disponibilità chiari, mai ingannevoli.
5. **Accessibilità reale**: contrasto AA (≥4.5:1 corpo), focus da tastiera, `prefers-reduced-motion`, target tap ≥44px.

## Accessibilità

- Target WCAG **AA**.
- Pubblico 14+ → leggibilità su mobile prioritaria.
- `prefers-reduced-motion` rispettato (già nel layer impeccable).
- Daltonismo: lo stato "ho/manca/doppia" non deve dipendere dal solo colore — abbinare icona/etichetta.
