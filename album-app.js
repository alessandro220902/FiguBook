// FiguBook — Album page app
// Rendering, state management, persistence, quick-mark interactions, list view.

// ── Official team color palette (Part 1 / Part 4) ──────────────
// Keyed by exact section name as it appears in SECTIONS data.
// Used for hero gradient and rail dot/active highlight.
window.FIGUBOOK_TEAM_COLORS = {
  // ── Serie A ─────────────────────────────────────────────────
  'Atalanta':            { c1:'#1C2B6E', c2:'#000000' },
  'Bologna':             { c1:'#003DA5', c2:'#CC0000' },
  'Cagliari':            { c1:'#CC0000', c2:'#003DA5' },
  'Como':                { c1:'#0055A5', c2:'#000000' },
  'Cremonese':           { c1:'#CC0000', c2:'#CCCCCC' },
  'Empoli':              { c1:'#0066CC', c2:'#003366' },
  'Fiorentina':          { c1:'#5B0FA8', c2:'#3D0070' },
  'Frosinone':           { c1:'#FFCC00', c2:'#003DA5' },
  'Genoa':               { c1:'#CC0000', c2:'#003DA5' },
  'Hellas Verona':       { c1:'#003DA5', c2:'#FFCC00' },
  'Inter':               { c1:'#000000', c2:'#003DA5' },
  'Juventus':            { c1:'#000000', c2:'#333333' },
  'Lazio':               { c1:'#87CEEB', c2:'#003DA5' },
  'Lecce':               { c1:'#FFCC00', c2:'#CC0000' },
  'Milan':               { c1:'#CC0000', c2:'#000000' },
  'Monza':               { c1:'#CC0000', c2:'#FFFFFF' },
  'Napoli':              { c1:'#00AAFF', c2:'#003DA5' },
  'Parma':               { c1:'#FFCC00', c2:'#003DA5' },
  'Roma':                { c1:'#CC0000', c2:'#FFCC00' },
  'Salernitana':         { c1:'#8B0000', c2:'#000000' },
  'Sampdoria':           { c1:'#003DA5', c2:'#CC0000' },
  'Sassuolo':            { c1:'#00AA44', c2:'#000000' },
  'Torino':              { c1:'#8B0000', c2:'#000000' },
  'Udinese':             { c1:'#000000', c2:'#FFFFFF' },
  'Venezia':             { c1:'#FF8C00', c2:'#000000' },
  // ── Serie B extras ──────────────────────────────────────────
  'Pisa':                { c1:'#003DA5', c2:'#000000' },
  'Spezia':              { c1:'#000000', c2:'#CC7700' },
  'Palermo':             { c1:'#CC0000', c2:'#FFCC00' },
  'Bari':                { c1:'#CC0000', c2:'#FFFFFF' },
  'Catanzaro':           { c1:'#CC0000', c2:'#FFDD00' },
  'Cesena':              { c1:'#000000', c2:'#FFFFFF' },
  'Juve Stabia':         { c1:'#FFDD00', c2:'#000000' },
  'Mantova':             { c1:'#CC0000', c2:'#000000' },
  'Modena':              { c1:'#FFDD00', c2:'#003DA5' },
  'Reggiana':            { c1:'#CC0000', c2:'#CCCCCC' },
  'Pescara':             { c1:'#FFFFFF', c2:'#003DA5' },
  'Avellino':            { c1:'#00AA44', c2:'#FFFFFF' },
  'Carrarese':           { c1:'#0055A5', c2:'#CCCCCC' },
  'Südtirol':            { c1:'#CC0000', c2:'#FFFFFF' },
  'Padova':              { c1:'#FFFFFF', c2:'#8B0000' },
  'Virtus Entella':      { c1:'#003DA5', c2:'#CC0000' },
};
// Helper: returns team colors if available, otherwise falls back to sec.c1/c2
function _teamClr(sec){
  return window.FIGUBOOK_TEAM_COLORS[sec.name] || { c1: sec.c1, c2: sec.c2 };
}

(function(){
  const SECTIONS = window.SECTIONS;
  const GROUPS   = window.GROUPS;
  const STATES   = window.STICKER_STATES;
  const COUNTS   = window.STICKER_COUNTS;
  const NAMES    = window.STICKER_NAMES;

  let activeSectionId = SECTIONS[0].id;
  let activeFilter = 'all';
  let activeCode = null;
  let quickMode = false;
  let viewMode = 'grid';        // 'grid' | 'list'

  // ── Helpers ─────────────────────────────────────────────────
  function getSection(id){ return SECTIONS.find(s => s.id === id); }
  function getSectionCounts(sec){
    let have=0, missing=0, doubles=0;
    sec.codes.forEach(c => {
      const s = STATES[c];
      if (s === 'have') have++;
      else if (s === 'double'){ have++; doubles++; }
      else missing++;
    });
    return { all: sec.codes.length, have, missing, double: doubles };
  }
  function ordinalOfSection(id){ return SECTIONS.findIndex(s => s.id === id) + 1; }
  function findSectionForCode(code){
    return SECTIONS.find(s => s.codes.includes(code));
  }
  function escapeHtml(s){ return String(s).replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch])); }

  // Split a name at first whitespace so the surname renders on a new line.
  // "Alessandro Bastoni" → "Alessandro<br>Bastoni"
  // "Calhanoglu"          → "Calhanoglu"
  // Already-multi-line input (contains \n) is honoured as-is.
  function nameHtml(raw){
    if (!raw) return '';
    const s = String(raw).trim();
    if (s.indexOf('\n') >= 0){
      return s.split('\n').map(part => escapeHtml(part.trim())).join('<br>');
    }
    const idx = s.indexOf(' ');
    if (idx < 0) return escapeHtml(s);
    return escapeHtml(s.slice(0, idx)) + '<br>' + escapeHtml(s.slice(idx + 1).trim());
  }

  function counterOf(code){
    const s = STATES[code];
    if (s === 'missing') return 0;
    if (s === 'have') return 1;
    if (s === 'double') return COUNTS[code] || 2;
    return 0;
  }

  // Extra copies beyond the first (used for the separate doubles chip)
  function extrasOf(code){
    const s = STATES[code];
    if (s === 'double') return (COUNTS[code] || 2) - 1;
    return 0;
  }

  // ── Persistence + toast feedback ────────────────────────────
  function persistAndToast(){
    if (typeof window.saveAlbum === 'function') window.saveAlbum();
    showToast('✓ Salvato');
  }
  let toastTimer = null;
  function showToast(msg){
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 1400);
  }

  // ── State mutation ──────────────────────────────────────────
  function setCounter(code, n){
    n = Math.max(0, Math.min(99, n));
    if (n === 0){
      STATES[code] = 'missing';
      delete COUNTS[code];
    } else if (n === 1){
      STATES[code] = 'have';
      delete COUNTS[code];
    } else {
      STATES[code] = 'double';
      COUNTS[code] = n;
    }
    persistAndToast();
  }
  function increment(code){ setCounter(code, counterOf(code) + 1); }
  function decrement(code){ setCounter(code, counterOf(code) - 1); }

  function setStickerState(code, newState){
    if (newState === 'missing') setCounter(code, 0);
    else if (newState === 'have') setCounter(code, 1);
    else if (newState === 'double') setCounter(code, Math.max(2, COUNTS[code] || 2));
  }

  // ── Rail ────────────────────────────────────────────────────
  function renderRail(filterText){
    const list = document.getElementById('railList');
    list.innerHTML = '';
    const q = (filterText || '').trim().toLowerCase();
    const isCodeQuery = isProbablyStickerCode(filterText);

    GROUPS.forEach(group => {
      const sections = SECTIONS.filter(s => s.group === group);
      const visibleSections = (q && !isCodeQuery)
        ? sections.filter(s => s.name.toLowerCase().includes(q) || (s.short && s.short.toLowerCase().includes(q)))
        : sections;
      if (visibleSections.length === 0) return;

      const h = document.createElement('div');
      h.className = 'rail-group-h';
      h.textContent = group;
      list.appendChild(h);

      visibleSections.forEach(sec => {
        const c = getSectionCounts(sec);
        const pct = Math.round(c.have / c.all * 100);
        const isActive = sec.id === activeSectionId;
        const tc = _teamClr(sec);  // official colors or fallback
        const row = document.createElement('div');
        row.className = 'sec-row' + (isActive ? ' active' : '');
        // Active row: use official team color instead of generic --ink
        if (isActive) {
          row.style.cssText = `background:linear-gradient(135deg,${tc.c1},${tc.c2});color:#fff`;
        }
        row.innerHTML = `
          <div class="sec-dot" style="--c1:${tc.c1};--c2:${tc.c2}">${initials(sec)}</div>
          <div>
            <div class="sec-name">${escapeHtml(sec.short || sec.name)}${sec.ia ? '<span class="tag-ia">IA</span>' : ''}</div>
            <div class="sec-bar"><i style="width:${pct}%"></i></div>
          </div>
          <div class="sec-prog">${c.have}/${c.all}<br/>${pct}%</div>
        `;
        row.addEventListener('click', () => {
          activeSectionId = sec.id;
          activeFilter = 'all';
          renderAll();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        list.appendChild(row);
      });
    });

    if (list.children.length === 0){
      const empty = document.createElement('div');
      empty.style.cssText = 'padding:20px;text-align:center;color:var(--muted);font-size:13px';
      empty.textContent = 'Nessuna sezione trovata.';
      list.appendChild(empty);
    }
  }

  function initials(sec){
    const map = {
      'trofei':'T','squadre-a':'A','nuove-firme':'NF','style':'ST','upgrade':'UP',
      'gem-squad':'GS','turbofreccia':'TF','color-up':'CU','super-glovez':'SG',
      'trick-maestro':'TM','boom-impatto':'BI','power-bros':'PB','family-legacy':'FL',
      'serie-b':'B','serie-c':'C','kinder':'K','celebration':'CL'
    };
    if (map[sec.id]) return map[sec.id];
    return sec.name.slice(0, 2).toUpperCase();
  }

  // ── Section hero ────────────────────────────────────────────
  function renderHero(sec){
    const hero = document.getElementById('secHero');
    hero.setAttribute('data-kind', sec.kind);
    // Use official team colors when available, otherwise fall back to sec colors
    const tc = _teamClr(sec);
    hero.style.setProperty('--c1', tc.c1);
    hero.style.setProperty('--c2', tc.c2);
    // ✅ Hero adattivo per sezioni piccole
    hero.classList.toggle('compact', sec.codes.length < 8);

    const ord = ordinalOfSection(sec.id);
    document.getElementById('heroEyebrow').textContent =
      `Sezione ${String(ord).padStart(2,'0')} · ${sec.group.toUpperCase()}`;
    document.getElementById('heroTitle').textContent = sec.name;
    document.getElementById('bcSection').textContent = sec.short || sec.name;

    const info = document.getElementById('heroInfo');
    info.innerHTML = '';
    const first = sec.codes[0], last = sec.codes[sec.codes.length-1];
    const codeRange = (first === last) ? `${first}` : `${first} – ${last}`;
    // Exclude logo-type codes (kind=logo or codes identified as logos) from count
    const nonLogoCodes = sec.codes.filter(c => sec.kind !== 'logo');
    info.appendChild(span(`Figurine ${codeRange}`));
    info.appendChild(span(`${nonLogoCodes.length} figurine`));
    if (sec.city) info.appendChild(span('Città: ' + sec.city));

    const c = getSectionCounts(sec);
    const badges = document.getElementById('heroBadges');
    badges.innerHTML = '';
    badges.appendChild(badge(`${c.have} possedute`));
    badges.appendChild(badge(`${c.missing} mancanti`));
    if (sec.ia) badges.appendChild(badge('Calciatori IA'));

    const pct = Math.round(c.have / c.all * 100);
    document.getElementById('heroPctBig').textContent = pct + '%';
    document.getElementById('heroPctBar').style.width = pct + '%';

    document.getElementById('drawerLabel').textContent = 'FIGURINA · ' + (sec.short || sec.name).toUpperCase();
    document.getElementById('sectionPos').textContent = `Sezione ${ord} di ${SECTIONS.length}`;
  }
  function span(text){ const s=document.createElement('span'); s.textContent=text; return s; }
  function badge(text){ const s=document.createElement('span'); s.className='badge'; s.textContent=text; return s; }

  // ── Filters ─────────────────────────────────────────────────
  function renderFilters(sec){
    const c = getSectionCounts(sec);
    document.querySelectorAll('#filterChips .chip').forEach(chip => {
      const f = chip.dataset.filter;
      let v;
      if (f === 'all') v = c.all;
      else if (f === 'have') v = c.have;
      else if (f === 'missing') v = c.missing;
      else if (f === 'double') v = c.double;
      chip.querySelector('.ct').textContent = v;
      chip.classList.toggle('active', f === activeFilter);
    });
  }

  // ── Grid / List ─────────────────────────────────────────────
  function renderGrid(sec){
    const container = document.getElementById('albumView');
    container.className = (viewMode === 'list') ? 'list-view' : 'grid';
    container.innerHTML = '';

    const teamPhotoColors = sec.kind === 'team-photos' ? teamColorMap() : null;
    const transferColors  = sec.kind === 'transfer'    ? transferColorMap(sec.codes) : null;

    const filtered = sec.codes.filter(code => {
      const st = STATES[code];
      if (activeFilter === 'all') return true;
      if (activeFilter === 'have') return st === 'have' || st === 'double';
      if (activeFilter === 'missing') return st === 'missing';
      if (activeFilter === 'double') return st === 'double';
    });

    document.getElementById('visibleCount').textContent = `${filtered.length} figurine visibili`;

    if (filtered.length === 0){
      container.innerHTML = '<div style="padding:30px;text-align:center;color:var(--muted);font-size:13px">Nessuna figurina in questo filtro.</div>';
      return;
    }

    filtered.forEach(code => {
      const node = (viewMode === 'list')
        ? buildListRow(sec, code, { teamPhotoColors, transferColors })
        : buildSticker(sec, code, { teamPhotoColors, transferColors });
      container.appendChild(node);
    });
  }

  function getCardColors(sec, code, colorMaps){
    let c1 = sec.c1, c2 = sec.c2;
    if (colorMaps && colorMaps.teamPhotoColors){
      const tc = colorMaps.teamPhotoColors[code];
      if (tc){ c1 = tc.c1; c2 = tc.c2; }
    } else if (colorMaps && colorMaps.transferColors){
      const tc = colorMaps.transferColors[code];
      if (tc){ c1 = tc.c1; c2 = tc.c2; }
    }
    return { c1, c2 };
  }

  function buildSticker(sec, code, colorMaps){
    const st = STATES[code];
    const owned = (st === 'have' || st === 'double') ? 1 : 0;
    const extras = extrasOf(code);
    const { c1, c2 } = getCardColors(sec, code, colorMaps);

    const div = document.createElement('div');
    div.className = `sticker kind-${sec.kind} ${st}`;
    div.dataset.code = code;
    div.style.setProperty('--card-c1', c1);
    div.style.setProperty('--card-c2', c2);

    const name = NAMES[code];
    const showHover = (st === 'have' || st === 'double') && !name;
    div.innerHTML = `
      ${owned > 0 ? `<span class="counter-chip">${owned}</span>` : ''}
      ${extras > 0 ? `<span class="double-chip">×${extras}</span>` : ''}
      <div class="num">${formatCode(code)}</div>
      ${name ? `<div class="player-name">${nameHtml(name)}</div>` : ''}
      ${showHover ? `<div class="player-name add">+ aggiungi nome</div>` : ''}
      <div class="quick-strip"><button class="q-minus" data-act="minus" aria-label="Rimuovi una copia">−</button></div>
      <button class="step minus" aria-label="Rimuovi una copia" data-act="minus">−</button>
      <button class="step plus" aria-label="Aggiungi una copia" data-act="plus">+</button>
    `;
    wireCardEvents(div, sec, code);
    return div;
  }

  function buildListRow(sec, code, colorMaps){
    const st = STATES[code];
    const owned = (st === 'have' || st === 'double') ? 1 : 0;
    const extras = extrasOf(code);
    const { c1, c2 } = getCardColors(sec, code, colorMaps);

    const div = document.createElement('div');
    div.className = `list-row kind-${sec.kind} ${st}`;
    div.dataset.code = code;
    div.style.setProperty('--card-c1', c1);
    div.style.setProperty('--card-c2', c2);

    const name = NAMES[code];
    const namePart = name
      ? `<span class="player-name">${nameHtml(name)}</span>`
      : `<span class="player-name placeholder">${st === 'missing' ? 'mancante' : '— senza nome —'}</span>`;

    div.innerHTML = `
      <span class="num">${formatCode(code)}</span>
      ${namePart}
      ${owned > 0 ? `<span class="counter-chip">${owned}</span>` : '<span></span>'}
      ${extras > 0 ? `<span class="double-chip">×${extras}</span>` : '<span></span>'}
      <button class="step minus" aria-label="Rimuovi una copia" data-act="minus">−</button>
      <button class="step plus" aria-label="Aggiungi una copia" data-act="plus">+</button>
    `;
    wireCardEvents(div, sec, code);
    return div;
  }

  function wireCardEvents(el, sec, code){
    // Body click → drawer (or quick-cycle in quick-mode / shift)
    el.addEventListener('click', e => {
      if (e.target.closest('.step')) return;
      if (quickMode || e.shiftKey){
        // Bug 10 fix: debounce 300ms — ignore rapid second click
        const now = Date.now();
        if (el._lastQuickClick && now - el._lastQuickClick < 300) return;
        el._lastQuickClick = now;
        increment(code);
        afterMutate(sec, code);
        return;
      }
      openDrawer(code);
    });
    el.addEventListener('dblclick', e => {
      if (e.target.closest('.step')) return;
      if (quickMode) return; // quick mode: click+debounce already handled it
      increment(code);
      afterMutate(sec, code);
    });

    el.querySelector('[data-act="plus"]').addEventListener('click', e => {
      e.stopPropagation();
      increment(code);
      afterMutate(sec, code);
    });
    // Wire all minus buttons (regular step + quick-strip)
    el.querySelectorAll('[data-act="minus"]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        decrement(code);
        afterMutate(sec, code);
      });
    });
  }

  function afterMutate(sec, code){
    refreshCard(code);
    renderHeader();
    renderHero(sec);
    renderFilters(sec);
    // Also update the rail counts for this section
    renderRail(document.getElementById('railSearch').value);
  }

  function refreshCard(code){
    const sec = getSection(activeSectionId);
    const old = document.querySelector(`#albumView .sticker[data-code="${code}"], #albumView .list-row[data-code="${code}"]`);
    if (!old) return;
    const teamPhotoColors = sec.kind === 'team-photos' ? teamColorMap() : null;
    const transferColors  = sec.kind === 'transfer'    ? transferColorMap(sec.codes) : null;
    const fresh = (viewMode === 'list')
      ? buildListRow(sec, code, { teamPhotoColors, transferColors })
      : buildSticker(sec, code, { teamPhotoColors, transferColors });

    const st = STATES[code];
    const shouldShow =
      activeFilter === 'all' ||
      (activeFilter === 'have' && (st === 'have' || st === 'double')) ||
      (activeFilter === 'missing' && st === 'missing') ||
      (activeFilter === 'double' && st === 'double');

    if (shouldShow){ old.replaceWith(fresh); }
    else { old.remove(); }
    document.getElementById('visibleCount').textContent =
      `${document.querySelectorAll('#albumView > [data-code]').length} figurine visibili`;

    if (activeCode === code) openDrawer(code);
  }

  function formatCode(code){
    // No "#" prefix per UX feedback — just the code as-is
    return code;
  }

  // ── Header progress ─────────────────────────────────────────
  function renderHeader(){
    const stats = window.albumStats();
    const pct = (stats.have / stats.total * 100).toFixed(1);
    document.getElementById('headerCount').innerHTML = `${stats.have}<span style="color:var(--muted);font-size:18px"> / ${stats.total}</span>`;
    document.getElementById('headerMiss').textContent = stats.missing;
    document.getElementById('headerDouble').textContent = stats.doubles;
    document.getElementById('headerPctRing').textContent = pct + '%';
    document.getElementById('headerBar').style.width = pct + '%';
    const ringEl = document.querySelector('.album-progress');
    if (ringEl) ringEl.style.setProperty('--p', Math.round(pct));
    // Also update the missing count pill next to "Tutte le figurine mancanti"
    const pill = document.getElementById('missingCountPill');
    if (pill) pill.textContent = stats.missing;
  }

  // ── Drawer ──────────────────────────────────────────────────
  function openDrawer(code){
    activeCode = code;
    document.querySelectorAll('#albumView > [data-code]').forEach(el => el.classList.toggle('selected', el.dataset.code === code));
    const sec = getSection(activeSectionId);
    const st = STATES[code];

    const drawerSticker = document.getElementById('drawerSticker');
    drawerSticker.className = 'big-sticker kind-' + sec.kind + ' ' + st;
    drawerSticker.style.setProperty('--card-c1', sec.c1);
    drawerSticker.style.setProperty('--card-c2', sec.c2);

    document.getElementById('drawerNum').textContent = formatCode(code);
    document.getElementById('drawerMeta').textContent = sec.short || sec.name;
    document.getElementById('drawerName').innerHTML = NAMES[code] ? nameHtml(NAMES[code]) : '—';
    document.getElementById('drawerTitle').textContent = NAMES[code] || `Figurina ${formatCode(code)}`;
    document.getElementById('drawerSubtitle').textContent = `Sezione: ${sec.name}`;

    const banner = document.getElementById('drawerBanner');
    banner.className = 'state-banner ' + st;
    const ic = document.getElementById('drawerBannerIcon');
    const bt = document.getElementById('drawerBannerTitle');
    const bs = document.getElementById('drawerBannerSub');
    if (st === 'have'){
      ic.textContent = '✓'; bt.textContent = 'Posseduta';
      bs.textContent = NAMES[code] ? 'Nome registrato.' : 'Aggiungi il nome quando vuoi.';
    } else if (st === 'double'){
      ic.textContent = '×' + (COUNTS[code] || 2);
      bt.textContent = `Doppia (${COUNTS[code] || 2} copie)`;
      bs.textContent = 'Pronta per essere scambiata.';
    } else {
      ic.textContent = '?'; bt.textContent = 'Mancante';
      bs.textContent = "Ti manca all'appello. Trova chi ce l'ha qua sotto.";
    }

    document.querySelectorAll('#stateButtons button').forEach(btn => {
      const s = btn.dataset.state;
      btn.classList.toggle('active', s === st);
      btn.classList.add(s);
    });

    const nameRow = document.getElementById('nameInputRow');
    const nameInp = document.getElementById('nameInput');
    if (st === 'have' || st === 'double'){
      nameRow.style.display = '';
      nameInp.value = NAMES[code] || '';
    } else {
      nameRow.style.display = 'none';
    }

    document.getElementById('ownersSection').style.display = (st === 'missing') ? '' : 'none';

    document.getElementById('drawer').classList.add('open');
    document.getElementById('drawer').setAttribute('aria-hidden','false');
    document.getElementById('drawerBackdrop').classList.add('open');
  }

  function closeDrawer(){
    document.getElementById('drawer').classList.remove('open');
    document.getElementById('drawer').setAttribute('aria-hidden','true');
    document.getElementById('drawerBackdrop').classList.remove('open');
    document.querySelectorAll('#albumView > [data-code]').forEach(el => el.classList.remove('selected'));
    activeCode = null;
  }

  // ── Color maps ──────────────────────────────────────────────
  function teamColorMap(){
    const teams = SECTIONS.filter(s => s.group === 'Squadre Serie A' && s.kind === 'team');
    const sorted = [...teams].sort((a,b) => a.name.localeCompare(b.name));
    const map = {};
    for (let i = 0; i < 20; i++){
      const code = String(4 + i);
      const t = sorted[i];
      if (t) map[code] = { c1: t.c1, c2: t.c2 };
    }
    return map;
  }
  function transferColorMap(codes){
    const teams = SECTIONS.filter(s => s.group === 'Squadre Serie A' && s.kind === 'team');
    const map = {};
    codes.forEach((code, i) => {
      const a = teams[(i*7) % teams.length];
      const b = teams[(i*7 + 5) % teams.length];
      map[code] = { c1: a.c1, c2: b.c1 };
    });
    return map;
  }

  // ── Smart search ────────────────────────────────────────────
  function isProbablyStickerCode(text){
    if (!text) return false;
    const t = text.trim().toUpperCase();
    if (/^\d+$/.test(t)) return true;
    if (/^(STY|UPG|K|CEL)\s?\d+$/.test(t)) return true;
    return false;
  }
  function normalizeCode(text){
    return text.trim().toUpperCase().replace(/\s+/g, '');
  }
  function jumpToCode(text){
    const code = normalizeCode(text);
    const sec = findSectionForCode(code) || findSectionForCode(code.replace(/^#/, ''));
    if (!sec) return false;
    activeSectionId = sec.id;
    activeFilter = 'all';
    renderAll();
    setTimeout(() => {
      const target = document.querySelector(`#albumView [data-code="${code}"]`);
      if (target){
        target.scrollIntoView({ behavior:'smooth', block:'center' });
        target.classList.add('flash');
        setTimeout(() => target.classList.remove('flash'), 2600);
      }
    }, 80);
    return true;
  }

  // ── Re-render ───────────────────────────────────────────────
  function renderAll(){
    const sec = getSection(activeSectionId);
    renderRail(document.getElementById('railSearch').value);
    renderHero(sec);
    renderFilters(sec);
    renderGrid(sec);
    renderHeader();
  }

  // ── Events ──────────────────────────────────────────────────
  document.querySelectorAll('#filterChips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      activeFilter = chip.dataset.filter;
      const sec = getSection(activeSectionId);
      renderFilters(sec);
      renderGrid(sec);
    });
  });

  const searchEl = document.getElementById('railSearch');
  searchEl.addEventListener('input', e => renderRail(e.target.value));
  searchEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && isProbablyStickerCode(e.target.value)){
      const jumped = jumpToCode(e.target.value);
      if (jumped){
        e.target.blur();
        setTimeout(() => { e.target.value = ''; renderRail(''); }, 800);
      }
    }
  });

  document.getElementById('drawerClose').addEventListener('click', closeDrawer);
  document.getElementById('drawerBackdrop').addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDrawer();
    if (e.target.matches('input, textarea')) return;
    if (e.key === '[' || e.key === ']'){
      const idx = SECTIONS.findIndex(s => s.id === activeSectionId);
      const next = e.key === ']' ? (idx + 1) % SECTIONS.length : (idx - 1 + SECTIONS.length) % SECTIONS.length;
      activeSectionId = SECTIONS[next].id;
      activeFilter = 'all';
      renderAll();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  // Drawer state buttons (kept by user request)
  document.querySelectorAll('#stateButtons button').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!activeCode) return;
      setStickerState(activeCode, btn.dataset.state);
      refreshCard(activeCode);
      renderHeader();
      renderHero(getSection(activeSectionId));
      renderFilters(getSection(activeSectionId));
      renderRail(document.getElementById('railSearch').value);
    });
  });

  // Name input → persist & live update
  document.getElementById('nameInput').addEventListener('input', e => {
    if (!activeCode) return;
    const val = e.target.value.trim();
    if (val) NAMES[activeCode] = val;
    else delete NAMES[activeCode];
    persistAndToast();

    const card = document.querySelector(`#albumView [data-code="${activeCode}"]`);
    if (card){
      const existing = card.querySelector('.player-name:not(.add):not(.placeholder)');
      if (val){
        if (existing) existing.innerHTML = nameHtml(val);
        else {
          const el = document.createElement('div');
          el.className = 'player-name';
          el.innerHTML = nameHtml(val);
          // Insert before steppers
          const stepperEl = card.querySelector('.step');
          if (stepperEl) card.insertBefore(el, stepperEl);
          else card.appendChild(el);
        }
        const hint = card.querySelector('.player-name.add');
        if (hint) hint.remove();
        const placeholder = card.querySelector('.player-name.placeholder');
        if (placeholder) placeholder.remove();
      } else {
        if (existing) existing.remove();
      }
    }
    document.getElementById('drawerName').innerHTML = val ? nameHtml(val) : '—';
    document.getElementById('drawerTitle').textContent = val || `Figurina ${formatCode(activeCode)}`;
  });

  // Quick-mode toggle
  const modeToggle = document.getElementById('modeToggle');
  modeToggle.addEventListener('click', () => {
    quickMode = !quickMode;
    modeToggle.setAttribute('aria-pressed', String(quickMode));
    modeToggle.querySelector('.mode-lbl').textContent = quickMode ? 'Inserimento ON' : 'Inserimento rapido';
    document.body.classList.toggle('quick-mode', quickMode);
  });

  // View toggle (Griglia / Lista)
  document.querySelectorAll('#viewToggle button').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.view;
      if (v === viewMode) return;
      viewMode = v;
      document.querySelectorAll('#viewToggle button').forEach(b => b.classList.toggle('active', b.dataset.view === viewMode));
      renderGrid(getSection(activeSectionId));
    });
  });

  // Reset
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('Azzerare lo stato dell\'album sul tuo dispositivo? L\'azione non si può annullare.')){
      window.resetAlbum();
    }
  });

  // ── Wrap saveAlbum to fire custom event ─────────────────────
  const _origSaveAlbum = window.saveAlbum;
  window.saveAlbum = function(){
    _origSaveAlbum.apply(this, arguments);
    try { document.dispatchEvent(new CustomEvent('figubook:stats-updated')); } catch(e){}
  };

  // ── Live sync on focus + cross-tab storage changes ────────────
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') renderHeader();
  });
  window.addEventListener('storage', e => {
    if (e.key && e.key.startsWith('figubook-')) renderHeader();
  });

  // Boot
  renderAll();
})();
