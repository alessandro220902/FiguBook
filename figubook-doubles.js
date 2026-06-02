// FiguBook Doubles — "Tutti i doppioni" overlay for album pages
// Usage: call FiguBookDoubles.init(storageKey, albumName) after DOMContentLoaded
// Requires: window.SECTIONS (from album-data.js), FiguBookCore (from figubook-core.js)

(function(w) {
  'use strict';

  // ── CSS injected once into <head> ────────────────────────────
  function injectStyles() {
    if (document.getElementById('fb-dbl-style')) return;
    const s = document.createElement('style');
    s.id = 'fb-dbl-style';
    s.textContent = `
      /* Trigger button */
      .fb-doubles-btn {
        display:inline-flex;align-items:center;gap:8px;
        padding:9px 14px;border-radius:99px;
        background:var(--ink,#14110d);color:var(--bg,#f4efe6);border:0;
        font-family:inherit;font-size:13px;font-weight:600;
        cursor:pointer;
        box-shadow:0 4px 14px -4px rgba(20,17,13,.35);
        transition:transform .12s ease,filter .12s ease;
      }
      .fb-doubles-btn:hover{transform:translateY(-1px);filter:brightness(1.1)}
      .fb-doubles-btn .count-pill{
        font-family:var(--f-mono,monospace);font-size:11px;font-weight:700;
        padding:2px 8px;border-radius:99px;
        background:rgba(255,255,255,.18);color:inherit;
      }

      /* Backdrop */
      .fb-dbl-backdrop{
        position:fixed;inset:0;z-index:300;
        background:rgba(20,17,13,.6);backdrop-filter:blur(6px);
        opacity:0;pointer-events:none;
        transition:opacity .22s ease;
      }
      .fb-dbl-backdrop.open{opacity:1;pointer-events:auto}

      /* Side drawer */
      .fb-dbl-drawer{
        position:fixed;top:0;right:0;bottom:0;z-index:310;
        width:min(700px,100vw);
        background:var(--bg-elev,#fbf8f1);
        border-left:1px solid var(--line,#e3dccd);
        box-shadow:-20px 0 60px rgba(0,0,0,.15);
        display:flex;flex-direction:column;
        transform:translateX(100%);
        transition:transform .28s cubic-bezier(.4,0,.2,1);
        overflow:hidden;
      }
      .fb-dbl-drawer.open{transform:translateX(0)}

      /* Head */
      .fb-dbl-head{
        display:flex;align-items:flex-start;justify-content:space-between;gap:16px;
        padding:22px 24px 18px;
        border-bottom:1px solid var(--line,#e3dccd);
        flex-shrink:0;
      }
      .fb-dbl-head .eyebrow{
        font-family:var(--f-mono,monospace);font-size:10.5px;text-transform:uppercase;
        letter-spacing:.12em;color:var(--muted,#8a8275);margin-bottom:4px;
      }
      .fb-dbl-head h2{
        font-family:var(--f-display,'Bricolage Grotesque',ui-sans-serif);
        font-weight:700;font-size:22px;letter-spacing:-.015em;margin:0;
        color:var(--ink,#14110d);
      }
      .fb-dbl-close{
        width:36px;height:36px;border-radius:99px;
        background:var(--bg,#f4efe6);border:1px solid var(--line,#e3dccd);
        display:grid;place-items:center;cursor:pointer;
        color:var(--ink,#14110d);flex-shrink:0;
        font-size:18px;font-family:inherit;
        transition:border-color .12s ease;
      }
      .fb-dbl-close:hover{border-color:var(--ink,#14110d)}

      /* Summary bar */
      .fb-dbl-summary{
        display:flex;align-items:center;gap:16px;flex-wrap:wrap;
        padding:14px 24px;
        background:var(--bg,#f4efe6);
        border-bottom:1px solid var(--line,#e3dccd);
        flex-shrink:0;
      }
      .fb-dbl-stat{display:flex;flex-direction:column;gap:2px}
      .fb-dbl-stat .v{
        font-family:var(--f-display,'Bricolage Grotesque',ui-sans-serif);
        font-weight:700;font-size:24px;letter-spacing:-.02em;line-height:1;
        color:var(--ink,#14110d);
      }
      .fb-dbl-stat .l{
        font-family:var(--f-mono,monospace);font-size:10px;text-transform:uppercase;
        letter-spacing:.1em;color:var(--muted,#8a8275);
      }
      .fb-dbl-stat-sep{width:1px;height:36px;background:var(--line,#e3dccd)}
      .fb-dbl-share-open{
        margin-left:auto;
        display:inline-flex;align-items:center;gap:8px;
        padding:9px 16px;border-radius:99px;
        background:var(--ink,#14110d);color:var(--bg,#f4efe6);
        font-family:inherit;font-size:13px;font-weight:600;border:0;cursor:pointer;
        transition:filter .12s ease;
      }
      .fb-dbl-share-open:hover{filter:brightness(1.1)}

      /* Scrollable grid area */
      .fb-dbl-scroll{flex:1;overflow-y:auto;padding:20px 24px 40px;scrollbar-width:thin}

      /* Empty state */
      .fb-dbl-empty{
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        gap:12px;padding:60px 24px;text-align:center;color:var(--muted,#8a8275);
        grid-column:1/-1;
      }
      .fb-dbl-empty svg{opacity:.35}
      .fb-dbl-empty h3{
        font-family:var(--f-display,'Bricolage Grotesque',ui-sans-serif);
        font-weight:700;font-size:20px;margin:0;color:var(--ink,#14110d);
      }
      .fb-dbl-empty p{font-size:14px;margin:0}

      /* Cards grid */
      .fb-dbl-grid{
        display:grid;
        grid-template-columns:repeat(auto-fill,minmax(140px,1fr));
        gap:12px;
      }

      /* Individual card */
      .fb-dbl-card{
        position:relative;
        background:linear-gradient(160deg,var(--dc1,#0a3a8b) 0%,color-mix(in srgb,var(--dc1,#0a3a8b) 60%,#000) 100%);
        border-radius:14px;overflow:hidden;color:#fff;
        display:flex;flex-direction:column;
        aspect-ratio:3/4;
      }
      .fb-dbl-card::before{
        content:"";position:absolute;inset:0;pointer-events:none;
        background:
          radial-gradient(60% 70% at 100% 0%,rgba(255,255,255,.22),transparent 60%),
          repeating-linear-gradient(45deg,rgba(255,255,255,.04) 0 2px,transparent 2px 12px);
      }
      .fb-dbl-card-body{
        flex:1;display:flex;flex-direction:column;
        padding:12px 12px 8px;position:relative;z-index:1;
      }
      .fb-dbl-section-lbl{
        font-family:var(--f-mono,monospace);font-size:9.5px;font-weight:700;
        text-transform:uppercase;letter-spacing:.1em;opacity:.8;margin-bottom:auto;
      }
      .fb-dbl-code{
        font-family:var(--f-display,'Bricolage Grotesque',ui-sans-serif);
        font-weight:800;font-size:28px;letter-spacing:-.02em;line-height:1;
        margin:4px 0;
      }
      .fb-dbl-name{
        font-size:10.5px;font-weight:500;opacity:.9;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
      }
      .fb-dbl-extra-badge{
        position:absolute;top:8px;right:8px;z-index:2;
        background:rgba(0,0,0,.45);backdrop-filter:blur(4px);
        border:1px solid rgba(255,255,255,.2);border-radius:99px;
        font-family:var(--f-mono,monospace);font-size:10px;font-weight:700;
        padding:2px 7px;color:#fff;letter-spacing:.02em;
      }

      /* Remove strip */
      .fb-dbl-remove{
        flex-shrink:0;
        display:flex;align-items:center;justify-content:center;gap:6px;
        background:rgba(200,30,30,.85);color:#fff;
        font-size:12px;font-weight:700;
        padding:8px;border:0;cursor:pointer;
        width:100%;font-family:inherit;
        position:relative;z-index:1;
        transition:background .12s ease;
      }
      .fb-dbl-remove:hover{background:rgb(185,18,18)}

      /* Share modal */
      .fb-dbl-share-backdrop{
        position:fixed;inset:0;z-index:400;
        background:rgba(20,17,13,.55);backdrop-filter:blur(4px);
        opacity:0;pointer-events:none;transition:opacity .22s ease;
      }
      .fb-dbl-share-backdrop.open{opacity:1;pointer-events:auto}
      .fb-dbl-share-modal{
        position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(.96);
        z-index:410;width:min(620px,92vw);
        background:var(--bg-elev,#fbf8f1);border:1px solid var(--line,#e3dccd);
        border-radius:22px;display:flex;flex-direction:column;overflow:hidden;
        opacity:0;pointer-events:none;
        transition:opacity .22s ease,transform .22s ease;
        box-shadow:0 30px 80px -20px rgba(0,0,0,.5);
      }
      .fb-dbl-share-modal.open{opacity:1;pointer-events:auto;transform:translate(-50%,-50%) scale(1)}
      .fb-dbl-share-head{
        padding:20px 24px;
        display:flex;align-items:flex-start;justify-content:space-between;gap:18px;
        border-bottom:1px solid var(--line,#e3dccd);
      }
      .fb-dbl-share-head .eyebrow{
        font-family:var(--f-mono,monospace);font-size:10.5px;text-transform:uppercase;
        letter-spacing:.12em;color:var(--muted,#8a8275);margin-bottom:4px;
      }
      .fb-dbl-share-head h2{
        font-family:var(--f-display,'Bricolage Grotesque',ui-sans-serif);
        font-weight:700;font-size:20px;letter-spacing:-.01em;margin:0;line-height:1.1;
        color:var(--ink,#14110d);
      }
      .fb-dbl-share-close{
        width:34px;height:34px;border-radius:99px;
        background:var(--bg,#f4efe6);border:1px solid var(--line,#e3dccd);
        display:grid;place-items:center;color:var(--ink,#14110d);cursor:pointer;
        font-size:16px;font-family:inherit;
        transition:border-color .12s ease;
      }
      .fb-dbl-share-close:hover{border-color:var(--ink,#14110d)}
      .fb-dbl-share-text-box{
        margin:18px 24px 8px;padding:14px 16px;border-radius:12px;
        background:var(--bg,#f4efe6);border:1px solid var(--line,#e3dccd);
        font-family:var(--f-mono,monospace);font-size:12px;line-height:1.7;
        color:var(--ink,#14110d);white-space:pre-wrap;
        max-height:220px;overflow-y:auto;scrollbar-width:thin;
      }
      .fb-dbl-share-actions{
        display:grid;grid-template-columns:1fr 1fr;gap:8px;
        padding:12px 24px 22px;
      }
      .fb-dbl-share-btn{
        display:inline-flex;align-items:center;justify-content:center;gap:8px;
        padding:11px 14px;border-radius:10px;
        background:var(--bg,#f4efe6);border:1px solid var(--line,#e3dccd);
        font-family:inherit;font-size:13px;font-weight:600;
        color:var(--ink,#14110d);cursor:pointer;
        transition:border-color .12s ease,background .12s ease;white-space:nowrap;
      }
      .fb-dbl-share-btn:hover{border-color:var(--ink,#14110d);background:var(--bg-elev,#fbf8f1)}
      .fb-dbl-share-btn.primary{
        background:var(--ink,#14110d);color:var(--accent,#c8ff3d);
        border-color:var(--ink,#14110d);grid-column:span 2;
      }
      .fb-dbl-share-btn.primary:hover{filter:brightness(1.1)}
      .fb-dbl-share-btn.copied{
        background:var(--good,#1f8a5b);color:#fff;border-color:var(--good,#1f8a5b);
        grid-column:span 2;
      }
    `;
    document.head.appendChild(s);
  }

  // ── Helper: HTML-escape ──────────────────────────────────────
  function esc(s){
    return String(s).replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  }

  // ── Lookup section for a card code ──────────────────────────
  function getSectionForCode(code){
    const secs = w.SECTIONS || [];
    for (let i = 0; i < secs.length; i++){
      if (secs[i].codes && secs[i].codes.includes(code)) return secs[i];
    }
    return null;
  }

  // ── Read doubles from localStorage ──────────────────────────
  function getDoublesData(storageKey){
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      const { states, counts, names } = JSON.parse(raw);
      if (!states) return [];
      return Object.entries(states)
        .filter(([, st]) => st === 'double')
        .map(([code]) => {
          const count = (counts && counts[code]) ? counts[code] : 2;
          const name  = (names && names[code])   ? names[code]  : '';
          return { code, name, count, sec: getSectionForCode(code) };
        })
        .sort((a, b) => {
          const na = parseInt(a.code.replace(/\D/g,''), 10) || 0;
          const nb = parseInt(b.code.replace(/\D/g,''), 10) || 0;
          return na - nb || a.code.localeCompare(b.code);
        });
    } catch(e){ return []; }
  }

  // ── Remove one copy of a double from localStorage ────────────
  function removeOneDouble(code, storageKey){
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data.states || data.states[code] !== 'double') return;
      const count = (data.counts && data.counts[code]) ? data.counts[code] : 2;
      if (count <= 2){
        // Only one spare left → revert card to 'have'
        data.states[code] = 'have';
        if (data.counts) delete data.counts[code];
      } else {
        data.counts[code] = count - 1;
      }
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch(e){}
  }

  // ── Build share text ─────────────────────────────────────────
  function buildShareText(storageKey, albumName){
    const doubles = getDoublesData(storageKey);
    const lines = [`I miei doppioni — ${albumName}`];
    if (doubles.length === 0){
      lines.push('Nessun doppione');
    } else {
      doubles.forEach(({ code, name, count }) => {
        const extra = count - 1;
        const label = code + (name ? ' · ' + name : '');
        for (let i = 0; i < extra; i++) lines.push(label);
      });
    }
    lines.push('', 'Generato con FiguBook');
    return lines.join('\n');
  }

  // ── Build & inject overlay HTML ──────────────────────────────
  function buildOverlayHtml(){
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="fb-dbl-backdrop" id="fbDblBackdrop"></div>
      <div class="fb-dbl-drawer" id="fbDblDrawer" role="dialog" aria-modal="true">
        <div class="fb-dbl-head">
          <div>
            <div class="eyebrow">Doppioni</div>
            <h2 id="fbDblTitle">I tuoi doppioni</h2>
          </div>
          <button class="fb-dbl-close" id="fbDblClose" aria-label="Chiudi">✕</button>
        </div>
        <div class="fb-dbl-summary">
          <div class="fb-dbl-stat">
            <span class="v" id="fbDblTotalCards">0</span>
            <span class="l">Carte doppione</span>
          </div>
          <div class="fb-dbl-stat-sep"></div>
          <div class="fb-dbl-stat">
            <span class="v" id="fbDblTotalExtra">0</span>
            <span class="l">Disponibili per scambio</span>
          </div>
          <button class="fb-dbl-share-open" id="fbDblShareOpen">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
            Condividi doppioni
          </button>
        </div>
        <div class="fb-dbl-scroll">
          <div class="fb-dbl-grid" id="fbDblGrid"></div>
        </div>
      </div>

      <!-- Share modal -->
      <div class="fb-dbl-share-backdrop" id="fbDblShareBackdrop"></div>
      <div class="fb-dbl-share-modal" id="fbDblShareModal">
        <div class="fb-dbl-share-head">
          <div>
            <div class="eyebrow">Condividi</div>
            <h2 id="fbDblShareTitle">I miei doppioni</h2>
          </div>
          <button class="fb-dbl-share-close" id="fbDblShareClose" aria-label="Chiudi">✕</button>
        </div>
        <div class="fb-dbl-share-text-box" id="fbDblShareTextBox"></div>
        <div class="fb-dbl-share-actions">
          <button class="fb-dbl-share-btn primary" id="fbDblCopy">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copia negli appunti
          </button>
          <button class="fb-dbl-share-btn" id="fbDblTxt">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Scarica .txt
          </button>
          <button class="fb-dbl-share-btn" id="fbDblXlsx">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/></svg>
            Scarica .xlsx
          </button>
          <button class="fb-dbl-share-btn" id="fbDblWa">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            WhatsApp
          </button>
          <button class="fb-dbl-share-btn" id="fbDblMail">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            Invia per email
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);
  }

  // ── Main init ────────────────────────────────────────────────
  function init(storageKey, albumName){
    injectStyles();
    buildOverlayHtml();

    const backdrop   = document.getElementById('fbDblBackdrop');
    const drawer     = document.getElementById('fbDblDrawer');
    const closeBtn   = document.getElementById('fbDblClose');
    const grid       = document.getElementById('fbDblGrid');
    const totalCards = document.getElementById('fbDblTotalCards');
    const totalExtra = document.getElementById('fbDblTotalExtra');
    const shareOpen  = document.getElementById('fbDblShareOpen');
    const shareBkd   = document.getElementById('fbDblShareBackdrop');
    const shareModal = document.getElementById('fbDblShareModal');
    const shareClose = document.getElementById('fbDblShareClose');
    const shareText  = document.getElementById('fbDblShareTextBox');
    const shareTitle = document.getElementById('fbDblShareTitle');
    const copyBtn    = document.getElementById('fbDblCopy');
    const txtBtn     = document.getElementById('fbDblTxt');
    const xlsxBtn    = document.getElementById('fbDblXlsx');
    const waBtn      = document.getElementById('fbDblWa');
    const mailBtn    = document.getElementById('fbDblMail');

    // Update share modal title with album name
    if (shareTitle) shareTitle.textContent = `I miei doppioni — ${albumName}`;

    // ── Render doubles grid ──────────────────────────────────
    function renderGrid(){
      const doubles = getDoublesData(storageKey);
      const totalC  = doubles.length;
      const totalE  = doubles.reduce((s, d) => s + (d.count - 1), 0);

      if (totalCards) totalCards.textContent = totalC;
      if (totalExtra) totalExtra.textContent = totalE;
      updateTriggerPill();

      if (!grid) return;
      grid.innerHTML = '';

      if (doubles.length === 0){
        const empty = document.createElement('div');
        empty.className = 'fb-dbl-empty';
        empty.innerHTML = `
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <rect x="3" y="3" width="18" height="18" rx="3"/>
            <path d="M9 9h6M9 12h6M9 15h4"/>
          </svg>
          <h3>Nessun doppione</h3>
          <p>Non hai ancora carte doppie in questo album</p>`;
        grid.appendChild(empty);
        return;
      }

      doubles.forEach(({ code, name, count, sec }) => {
        const extra   = count - 1;
        const c1      = sec ? (sec.c1 || '#0a3a8b') : '#0a3a8b';
        const secName = sec ? (sec.short || sec.name || '') : '';

        const card = document.createElement('div');
        card.className = 'fb-dbl-card';
        card.style.setProperty('--dc1', c1);

        const badgeText = extra > 1 ? `×${extra} doppioni` : '×1 doppione';

        card.innerHTML = `
          <div class="fb-dbl-extra-badge">${esc(badgeText)}</div>
          <div class="fb-dbl-card-body">
            <div class="fb-dbl-section-lbl">${esc(secName)}</div>
            <div class="fb-dbl-code">${esc(code)}</div>
            <div class="fb-dbl-name">${esc(name)}</div>
          </div>
          <button class="fb-dbl-remove" data-code="${esc(code)}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Rimuovi 1 doppione
          </button>`;

        card.querySelector('.fb-dbl-remove').addEventListener('click', function(){
          removeOneDouble(code, storageKey);
          renderGrid();
          // Notify album-app.js to refresh counters
          try { w.dispatchEvent(new Event('figubook:stats-updated')); } catch(e){}
          if (w.FiguBookCore) w.FiguBookCore.fireStatsUpdate();
        });

        grid.appendChild(card);
      });
    }

    // ── Pill counter on the trigger button ───────────────────
    function updateTriggerPill(){
      const doubles = getDoublesData(storageKey);
      const total   = doubles.reduce((s, d) => s + (d.count - 1), 0);
      const pill = document.getElementById('fbDblCountPill');
      if (pill) pill.textContent = total;
    }

    // ── Drawer open / close ──────────────────────────────────
    function openDrawer(){
      renderGrid();
      backdrop.classList.add('open');
      drawer.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeDrawer(){
      backdrop.classList.remove('open');
      drawer.classList.remove('open');
      document.body.style.overflow = '';
    }

    // ── Share modal open / close ─────────────────────────────
    function openShareModal(){
      const text = buildShareText(storageKey, albumName);
      if (shareText) shareText.textContent = text;
      shareBkd.classList.add('open');
      shareModal.classList.add('open');
    }
    function closeShareModal(){
      shareBkd.classList.remove('open');
      shareModal.classList.remove('open');
      resetCopyBtn();
    }
    function resetCopyBtn(){
      if (!copyBtn) return;
      copyBtn.className = 'fb-dbl-share-btn primary';
      copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copia negli appunti`;
    }

    // ── Wire events ──────────────────────────────────────────
    backdrop.addEventListener('click', closeDrawer);
    closeBtn.addEventListener('click', closeDrawer);

    shareOpen.addEventListener('click', openShareModal);
    shareBkd.addEventListener('click', closeShareModal);
    shareClose.addEventListener('click', closeShareModal);

    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape'){
        if (shareModal.classList.contains('open')) closeShareModal();
        else closeDrawer();
      }
    });

    // Copy to clipboard
    copyBtn.addEventListener('click', function(){
      const text = buildShareText(storageKey, albumName);
      navigator.clipboard.writeText(text).then(function(){
        copyBtn.className = 'fb-dbl-share-btn copied';
        copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg> Copiato!`;
        setTimeout(resetCopyBtn, 2200);
      }).catch(function(){});
    });

    // Download .txt
    txtBtn.addEventListener('click', function(){
      const text = buildShareText(storageKey, albumName);
      const blob = new Blob([text], { type: 'text/plain' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      const safe = albumName.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
      a.href = url; a.download = `doppioni-${safe}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Download .xlsx
    xlsxBtn.addEventListener('click', function(){
      if (typeof XLSX === 'undefined'){
        alert('Libreria Excel non disponibile — riprova online');
        return;
      }
      const doubles = getDoublesData(storageKey);
      const rows = [['Codice', 'Giocatore', 'Sezione', 'Doppioni disponibili']];
      doubles.forEach(function({ code, name, count, sec }){
        rows.push([code, name, sec ? (sec.short || sec.name) : '', count - 1]);
      });
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Doppioni');
      const safe = albumName.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
      XLSX.writeFile(wb, `doppioni-${safe}.xlsx`);
    });

    // WhatsApp
    waBtn.addEventListener('click', function(){
      const text = buildShareText(storageKey, albumName);
      w.open('https://web.whatsapp.com/send?text=' + encodeURIComponent(text), '_blank');
    });

    // Email
    mailBtn.addEventListener('click', function(){
      const text = buildShareText(storageKey, albumName);
      w.location.href = 'mailto:?subject=' + encodeURIComponent(`I miei doppioni — ${albumName}`) + '&body=' + encodeURIComponent(text);
    });

    // Expose open function globally so the trigger button can call it
    w._fbDblOpen = openDrawer;

    // Initial pill update
    updateTriggerPill();

    // Auto-sync pill counter
    if (w.FiguBookCore){
      w.FiguBookCore.initAutoSync(updateTriggerPill);
      w.FiguBookCore.onStatsUpdate(updateTriggerPill);
    }
  }

  // ── Public API ───────────────────────────────────────────────
  w.FiguBookDoubles = { init: init, getDoublesData: getDoublesData };

}(window));
