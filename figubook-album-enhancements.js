/*
  FiguBook — Album page enhancements (shared across all 8 album pages)
  Features:
    5.  Completion animation — confetti + golden rail border + toast when a section completes
    8.  "Quasi complete" rail section — sections with 1-3 missing, injected via MutationObserver
    9.  "Attività recente" bottom section — history tracking + last-activity display

  IMPORTANT: does NOT touch album-app.js, localStorage keys already in use, or any functional logic.
  New localStorage keys:
    figubook-history-[albumid]-v1   — per-album insertion history
    figubook-sessions-v1            — session open timestamps + figurine-per-session counters
*/
(function(){
  'use strict';

  // ── Detect album id from current page filename ──────────────
  var PAGE_ALBUM_MAP = {
    'figubook-calciatori-2526.html': 'calciatori-25-26',
    'figubook-calciatori-2425.html': 'calciatori-24-25',
    'figubook-calciatori-2324.html': 'calciatori-23-24',
    'figubook-calciatori-2223.html': 'calciatori-22-23',
    'figubook-adrenalyn-2526.html':  'adrenalyn-25-26',
    'figubook-matchattax-2526.html': 'match-attax-ucl',
    'figubook-fwc2026.html':         'mondiali-2026',
    'figubook-serieb-2526.html':     'calb-25-26',
  };
  var filename = window.location.pathname.split('/').pop() || 'unknown';
  var ALBUM_ID = PAGE_ALBUM_MAP[filename] || filename.replace('.html','');
  var HISTORY_KEY = 'figubook-history-' + ALBUM_ID + '-v1';
  var SESSIONS_KEY = 'figubook-sessions-v1';

  // ── Tiny helpers ─────────────────────────────────────────────
  function lsGet(key){ try{ var r=localStorage.getItem(key); return r ? JSON.parse(r) : null; }catch(e){ return null; } }
  function lsSet(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){} }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); }

  // ── Feature 9 history: record insertion event ────────────────
  function recordHistory(count){
    if (!count || count <= 0) return;
    var hist = lsGet(HISTORY_KEY) || [];
    hist.push({ ts: Date.now(), added: count });
    // Keep last 200 events
    if (hist.length > 200) hist = hist.slice(-200);
    lsSet(HISTORY_KEY, hist);
  }

  // ── Feature 4 sessions: record page open ─────────────────────
  (function recordSession(){
    var sessions = lsGet(SESSIONS_KEY) || [];
    var today = new Date().toISOString().slice(0,10);
    var existing = sessions.find(function(s){ return s.date === today && s.albumId === ALBUM_ID; });
    if (!existing){
      sessions.push({ date: today, albumId: ALBUM_ID, opens: 1, added: 0, ts: Date.now() });
    } else {
      existing.opens = (existing.opens || 0) + 1;
    }
    // Keep last 90 days worth
    if (sessions.length > 500) sessions = sessions.slice(-500);
    lsSet(SESSIONS_KEY, sessions);
  })();

  // ── Feature 5: Wrap window.saveAlbum to detect completions + record history ──
  var _origSave = window.saveAlbum;
  if (typeof _origSave === 'function'){
    window.saveAlbum = function(state){
      // Count total 'have' before
      var before = 0, after = 0;
      var prevSections = null;
      try {
        // Read current live state from album-app internal
        // We proxy by comparing old vs new via the state argument
        // The state object mirrors STICKER_STATES — keys are sticker codes, values are counts
        if (state && typeof state === 'object'){
          Object.keys(state).forEach(function(k){ before += (state[k]||0); });
        }
      } catch(e){}

      // Call original
      _origSave.apply(window, arguments);

      // The call above mutated the state; but since state is passed by reference we can re-count after
      // Actually, saveAlbum saves whatever state is given — we compare old total to new
      // We detect have-increase by listening to album-app's rendered hero total
      // Use a simpler approach: snapshot before vs after via DOM readout
      try {
        var heroHave = document.querySelector('#heroHaveCount');
        var newHave = heroHave ? parseInt(heroHave.textContent, 10) : null;
        if (newHave !== null && !isNaN(newHave)){
          var prevHave = window._fbEnhPrevHave || 0;
          var delta = newHave - prevHave;
          if (delta > 0){
            recordHistory(delta);
            // Update session added count
            var sessions = lsGet(SESSIONS_KEY) || [];
            var today = new Date().toISOString().slice(0,10);
            var sess = sessions.find(function(s){ return s.date===today && s.albumId===ALBUM_ID; });
            if (sess) { sess.added = (sess.added||0) + delta; lsSet(SESSIONS_KEY, sessions); }
          }
          window._fbEnhPrevHave = newHave;
        }
      } catch(e){}

      // Check section + album completion
      checkSectionCompletion();
      checkAlbumCompletion();
      refreshDoublesCounter();
      // Refresh stats panel if open
      if (_statsVisible){
        var panel = document.getElementById('fbStatsPanel');
        if (panel) renderStats(panel);
      }
    };
  }

  // Track prev section states for completion detection
  var _prevSecStates = {};

  function getSecStates(){
    var states = {};
    document.querySelectorAll('.sec-row').forEach(function(row){
      var name = row.querySelector('.sec-name');
      var prog = row.querySelector('.sec-prog');
      if (name && prog){
        var m = prog.textContent.match(/(\d+)\s*\/\s*(\d+)/);
        if (m) states[name.textContent.trim()] = { have: parseInt(m[1],10), total: parseInt(m[2],10) };
      }
    });
    return states;
  }

  function checkSectionCompletion(){
    var curr = getSecStates();
    Object.keys(curr).forEach(function(sec){
      var c = curr[sec], p = _prevSecStates[sec];
      if (p && c.have >= c.total && p.have < c.total){
        fireCelebration(sec);
      }
    });
    _prevSecStates = curr;
  }

  // Initialize prev states once DOM is ready
  setTimeout(function(){
    _prevSecStates = getSecStates();
    // Also set initial have count
    var heroHave = document.querySelector('#heroHaveCount');
    if (heroHave) window._fbEnhPrevHave = parseInt(heroHave.textContent, 10) || 0;
  }, 800);

  // ── Feature 5: Celebration ────────────────────────────────────
  function fireCelebration(secName){
    showEnhToast('🎉 Squadra completata! · ' + secName);
    highlightRailRow(secName);
    launchConfetti();
  }

  function showEnhToast(msg){
    var t = document.getElementById('toast');
    if (!t){
      t = document.createElement('div');
      t.id = 'toast';
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(function(){ t.classList.remove('show'); }, 3000);
  }

  function highlightRailRow(secName){
    document.querySelectorAll('.sec-row').forEach(function(row){
      var name = row.querySelector('.sec-name');
      if (name && name.textContent.trim() === secName){
        row.style.outline = '2px solid #FFD700';
        row.style.outlineOffset = '-2px';
        setTimeout(function(){ row.style.outline = ''; row.style.outlineOffset = ''; }, 4000);
      }
    });
  }

  function launchConfetti(){
    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
    document.body.appendChild(canvas);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    var ctx = canvas.getContext('2d');
    var pieces = [];
    var colors = ['#FFD700','#c8ff3d','#FF6B6B','#4ECDC4','#45B7D1','#FF8C42','#A8E063'];
    for (var i=0; i<120; i++){
      pieces.push({
        x: Math.random()*canvas.width,
        y: Math.random()*canvas.height - canvas.height,
        w: 8+Math.random()*8,
        h: 4+Math.random()*4,
        color: colors[Math.floor(Math.random()*colors.length)],
        vx: (Math.random()-0.5)*4,
        vy: 2+Math.random()*4,
        rot: Math.random()*360,
        rotV: (Math.random()-0.5)*6
      });
    }
    var start = Date.now();
    var dur = 2200;
    function draw(){
      if (Date.now()-start > dur){ canvas.remove(); return; }
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pieces.forEach(function(p){
        p.x += p.vx; p.y += p.vy; p.rot += p.rotV;
        ctx.save();
        ctx.translate(p.x+p.w/2, p.y+p.h/2);
        ctx.rotate(p.rot*Math.PI/180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
        ctx.restore();
      });
      requestAnimationFrame(draw);
    }
    draw();
  }

  // ── Feature 8: "Quasi complete" rail section ─────────────────
  var QUASI_GROUP_CLASS = 'quasi-complete-group';
  var _railObserver = null;
  var _railInjectDebounce = null;

  function buildQuasiSection(){
    var states = getSecStates();
    var quasi = Object.keys(states).filter(function(s){
      var st = states[s];
      var miss = st.total - st.have;
      return miss >= 1 && miss <= 3;
    }).sort(function(a,b){ return (states[a].total-states[a].have)-(states[b].total-states[b].have) });

    if (!quasi.length) return null;

    var group = document.createElement('div');
    group.className = QUASI_GROUP_CLASS;
    group.style.cssText = 'margin:0 0 8px 0;';

    var header = document.createElement('div');
    header.style.cssText = 'font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted,#8a8275);padding:10px 16px 4px;border-top:1px solid var(--line,#e3dccd);';
    header.textContent = '⚡ Quasi complete';
    group.appendChild(header);

    quasi.forEach(function(secName){
      var st = states[secName];
      var miss = st.total - st.have;
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:7px 16px;cursor:pointer;border-radius:8px;margin:1px 6px;';
      row.innerHTML = '<span style="font-size:12px;font-weight:600;flex:1;color:var(--ink,#14110d)">' + esc(secName) + '</span>'
        + '<span style="font-size:11px;color:var(--muted,#8a8275)">' + st.have + '/' + st.total + '</span>'
        + '<span style="font-size:11px;font-weight:700;color:#f5b800;background:rgba(245,184,0,0.13);padding:2px 7px;border-radius:20px;">-' + miss + '</span>';
      row.addEventListener('mouseenter', function(){ row.style.background='var(--line,#e3dccd)'; });
      row.addEventListener('mouseleave', function(){ row.style.background=''; });
      // Click: find real sec-row and click it
      row.addEventListener('click', function(){
        var allRows = document.querySelectorAll('.sec-row');
        for (var i=0; i<allRows.length; i++){
          var nm = allRows[i].querySelector('.sec-name');
          if (nm && nm.textContent.trim() === secName){ allRows[i].click(); break; }
        }
      });
      group.appendChild(row);
    });

    var sep = document.createElement('div');
    sep.style.cssText = 'height:1px;background:var(--line,#e3dccd);margin:8px 16px 4px;';
    group.appendChild(sep);

    return group;
  }

  function injectQuasiSection(){
    var railList = document.getElementById('railList');
    if (!railList) return;

    // The quasi group lives OUTSIDE railList, as a sibling before it
    var railAside = railList.parentElement;
    if (!railAside) return;

    // Remove existing quasi group (sibling of railList)
    var old = railAside.querySelector('.' + QUASI_GROUP_CLASS);
    if (old) old.remove();

    var group = buildQuasiSection();
    if (!group) return;

    // Insert as sibling BEFORE railList — never inside railList
    railAside.insertBefore(group, railList);
  }

  function startRailObserver(){
    var rail = document.getElementById('railList');
    if (!rail || _railObserver) return;

    // Initial inject
    injectQuasiSection();

    // Observe railList for album-app re-renders, then re-inject quasi group outside it
    _railObserver = new MutationObserver(function(mutations){
      // Only care about mutations that represent album-app rebuilding the rail
      // (i.e. sec-rows being added/removed — not our quasi group)
      var relevant = mutations.some(function(m){
        return Array.from(m.addedNodes).concat(Array.from(m.removedNodes)).some(function(n){
          return n.nodeType === 1 && !(n.classList && n.classList.contains(QUASI_GROUP_CLASS));
        });
      });
      if (!relevant) return;
      clearTimeout(_railInjectDebounce);
      _railInjectDebounce = setTimeout(injectQuasiSection, 80);
    });

    _railObserver.observe(rail, { childList: true });
  }

  // ── Feature 9: "Attività recente" section ────────────────────
  function formatDate(ts){
    var d = new Date(ts);
    var now = new Date();
    var diffDays = Math.floor((Date.now()-ts)/(1000*60*60*24));
    if (diffDays === 0) return 'Oggi';
    if (diffDays === 1) return 'Ieri';
    return d.toLocaleDateString('it-IT',{day:'numeric',month:'short'});
  }

  function injectActivitySection(){
    // Don't inject twice
    if (document.getElementById('fbEnhActivity')) return;

    var disclaimer = document.querySelector('.disclaimer');
    if (!disclaimer) return;

    var hist = lsGet(HISTORY_KEY) || [];

    var section = document.createElement('section');
    section.id = 'fbEnhActivity';
    section.style.cssText = 'max-width:1480px;margin:24px auto 0;padding:0 28px;';

    var head = document.createElement('div');
    head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;';
    head.innerHTML = '<div>'
      + '<h3 style="margin:0;font-size:15px;font-weight:700;color:var(--ink,#14110d)">Attività recente</h3>'
      + '<div style="font-size:12px;color:var(--muted,#8a8275);margin-top:2px">Inserimenti in questo album</div>'
      + '</div>';
    section.appendChild(head);

    var body = document.createElement('div');
    body.style.cssText = 'background:var(--bg-elev,#fbf8f1);border:1px solid var(--line,#e3dccd);border-radius:14px;overflow:hidden;';

    if (!hist.length){
      body.innerHTML = '<div style="padding:20px 18px;font-size:13px;color:var(--muted,#8a8275)">Nessuna attività ancora. Inizia ad aggiungere figurine!</div>';
    } else {
      // Group by date
      var grouped = {};
      hist.slice().reverse().forEach(function(e){
        var dateKey = new Date(e.ts).toISOString().slice(0,10);
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(e);
      });

      var keys = Object.keys(grouped).slice(0,7); // last 7 days with activity
      keys.forEach(function(dk, idx){
        var events = grouped[dk];
        var totalAdded = events.reduce(function(s,e){ return s+(e.added||0); },0);
        var ts = events[0].ts;
        var row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:12px;padding:12px 18px;'
          + (idx < keys.length-1 ? 'border-bottom:1px solid var(--line,#e3dccd);' : '');
        row.innerHTML = '<span style="font-size:18px">📋</span>'
          + '<div style="flex:1">'
          +   '<div style="font-size:13px;font-weight:600;color:var(--ink,#14110d)">'
          +     (totalAdded > 0 ? '+' + totalAdded + ' figurine aggiunte' : 'Album aperto')
          +   '</div>'
          +   '<div style="font-size:11px;color:var(--muted,#8a8275);margin-top:1px">'
          +     events.length + (events.length===1?' inserimento':' inserimenti') + ' · ' + formatDate(ts)
          +   '</div>'
          + '</div>'
          + '<span style="font-size:11px;color:var(--muted,#8a8275);white-space:nowrap">'
          +   new Date(ts).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})
          + '</span>';
        body.appendChild(row);
      });
    }

    section.appendChild(body);
    disclaimer.parentNode.insertBefore(section, disclaimer);
  }

  // ── Feature 4 fix: Doubles counter ───────────────────────────
  function refreshDoublesCounter(){
    if (!window.STICKER_STATES) return;
    var physDouble = 0, cardsWithDouble = 0;
    for (var code in window.STICKER_STATES){
      if (window.STICKER_STATES[code] === 'double'){
        cardsWithDouble++;
        var cnt = (window.STICKER_COUNTS && window.STICKER_COUNTS[code]) ? window.STICKER_COUNTS[code] : 2;
        physDouble += cnt - 1;
      }
    }
    var pill = document.getElementById('fbDblCountPill');
    if (pill) pill.textContent = physDouble;
    var hdrDouble = document.getElementById('headerDouble');
    if (hdrDouble){
      hdrDouble.textContent = physDouble;
      var hdrDoubleParent = hdrDouble.parentElement;
      if (hdrDoubleParent){
        var txt = hdrDoubleParent.innerHTML || '';
        hdrDoubleParent.innerHTML = txt.replace(/doppia|doppie/, physDouble===1?'doppia':'doppie');
      }
    }
    // also update filter chip ct for double
    var doubleChip = document.querySelector('[data-filter="double"] .ct');
    if (doubleChip) doubleChip.textContent = cardsWithDouble;
  }

  // ── Feature 13: Album completion detection ────────────────────
  var _prevAlbumDone = false;
  function checkAlbumCompletion(){
    if (!window.albumStats) return;
    try {
      var stats = window.albumStats();
      var isDone = stats.total > 0 && stats.have >= stats.total;
      if (isDone && !_prevAlbumDone){
        _prevAlbumDone = true;
        fireAlbumCompletion();
      }
    } catch(e){}
  }

  function fireAlbumCompletion(){
    showEnhToast('🎉 Album completato! Collezione completa!');
    // Golden rail border flash
    var rail = document.getElementById('railList');
    if (rail){
      rail.style.outline = '2px solid #FFD700';
      setTimeout(function(){ rail.style.outline=''; }, 4000);
    }
    // Extra confetti (3 seconds)
    launchConfetti(3000);
    // Blinking COMPLETATO badge on hero
    var hero = document.getElementById('secHero');
    if (hero){
      var badge = document.createElement('div');
      badge.style.cssText = 'position:absolute;top:12px;right:12px;background:#FFD700;color:#14110d;font-weight:900;font-size:13px;padding:6px 14px;border-radius:20px;font-family:var(--f-mono,monospace);letter-spacing:.1em;animation:fb-blink 0.5s ease-in-out 4 alternate;z-index:10;';
      badge.textContent = 'COMPLETATO ★';
      hero.style.position = 'relative';
      hero.appendChild(badge);
      setTimeout(function(){ badge.remove(); }, 2200);
    }
    // Inject blink keyframe once
    if (!document.getElementById('fb-blink-style')){
      var s = document.createElement('style');
      s.id = 'fb-blink-style';
      s.textContent = '@keyframes fb-blink{from{opacity:1}to{opacity:0.2}}';
      document.head.appendChild(s);
    }
  }

  // Extend launchConfetti to accept duration param
  var _origLaunchConfetti = launchConfetti;
  function launchConfetti(dur){
    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
    document.body.appendChild(canvas);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    var ctx = canvas.getContext('2d');
    var pieces = [];
    var colors = ['#FFD700','#c8ff3d','#FF6B6B','#4ECDC4','#45B7D1','#FF8C42','#A8E063'];
    for (var i=0; i<120; i++){
      pieces.push({
        x:Math.random()*canvas.width, y:Math.random()*canvas.height-canvas.height,
        w:8+Math.random()*8, h:4+Math.random()*4,
        color:colors[Math.floor(Math.random()*colors.length)],
        vx:(Math.random()-0.5)*4, vy:2+Math.random()*4,
        rot:Math.random()*360, rotV:(Math.random()-0.5)*6
      });
    }
    var start = Date.now();
    var duration = dur || 2200;
    function draw(){
      if (Date.now()-start > duration){ canvas.remove(); return; }
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pieces.forEach(function(p){
        p.x+=p.vx; p.y+=p.vy; p.rot+=p.rotV;
        ctx.save(); ctx.translate(p.x+p.w/2,p.y+p.h/2); ctx.rotate(p.rot*Math.PI/180);
        ctx.fillStyle=p.color; ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h); ctx.restore();
      });
      requestAnimationFrame(draw);
    }
    draw();
  }

  // ── Feature 14: Search — album-app.js already handles #railSearch ────────────
  // NOTE: album-app.js (line 614) adds its own input listener on #railSearch that
  // calls renderRail(filterText) — which already filters sections by name AND handles
  // code-based queries. Adding a second listener here caused section navigation to break.
  // This function is intentionally a no-op; left as a stub so init() call is harmless.
  function initSearchFix(){
    // No-op: rail search is handled by album-app.js natively.
  }

  // ── STATS TAB (Part 4) ────────────────────────────────────────
  var _statsVisible = false;

  function injectStatsTab(){
    var chips = document.getElementById('filterChips');
    if (!chips || document.getElementById('fbStatsTab')) return;
    var btn = document.createElement('button');
    btn.id = 'fbStatsTab';
    btn.className = 'chip';
    btn.innerHTML = '📊 Statistiche';
    btn.addEventListener('click', function(){ toggleStats(); });
    chips.appendChild(btn);
  }

  function toggleStats(){
    var albumView = document.getElementById('albumView');
    var panel = document.getElementById('fbStatsPanel');
    if (!albumView) return;

    _statsVisible = !_statsVisible;
    var tab = document.getElementById('fbStatsTab');
    if (tab) tab.classList.toggle('active', _statsVisible);

    // Deactivate other chips when stats active
    if (_statsVisible){
      document.querySelectorAll('#filterChips .chip').forEach(function(c){ if(c.id !== 'fbStatsTab') c.classList.remove('active'); });
    }

    if (!panel){
      panel = buildStatsPanel();
      albumView.parentNode.insertBefore(panel, albumView.nextSibling);
    } else {
      panel.style.display = _statsVisible ? '' : 'none';
    }
    albumView.style.display = _statsVisible ? 'none' : '';
    if (_statsVisible) renderStats(panel);
  }

  function buildStatsPanel(){
    var div = document.createElement('div');
    div.id = 'fbStatsPanel';
    div.style.cssText = 'padding:0 0 24px 0;';
    div.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding:0">'
      + '<div><h3 style="margin:0;font-size:16px;font-weight:800">Le tue statistiche</h3><div style="font-size:12px;color:var(--muted)">Statistiche dettagliate per questo album</div></div>'
      + '<span style="font-size:11px;font-weight:700;color:var(--good);font-family:var(--f-mono);background:rgba(31,138,91,.1);padding:3px 9px;border-radius:20px;">AGGIORNATO ORA</span>'
      + '</div>'
      + '<div id="fbStatBlocks" style="display:flex;flex-direction:column;gap:16px;"></div>';
    return div;
  }

  function renderStats(panel){
    var root = panel.querySelector('#fbStatBlocks');
    if (!root) return;
    root.innerHTML = '';

    var states = window.STICKER_STATES || {};
    var counts = window.STICKER_COUNTS || {};
    var names = window.STICKER_NAMES || {};
    var sections = window.SECTIONS || [];

    // Count stats
    var totalCodes = Object.keys(states).length;
    var have = 0, missing = 0, physDoubles = 0, cardsDouble = 0;
    var maxDoubleCode = '', maxDoubleCount = 0, maxDoubleName = '';
    for (var c in states){
      var st = states[c];
      if (st==='have'){ have++; }
      else if (st==='double'){
        have++; cardsDouble++;
        var cnt = counts[c]||2;
        physDoubles += cnt-1;
        if (cnt > maxDoubleCount){ maxDoubleCount=cnt; maxDoubleCode=c; maxDoubleName=names[c]||c; }
      } else { missing++; }
    }
    var pct = totalCodes>0 ? (have/totalCodes*100) : 0;

    // Section stats
    var secStats = sections.map(function(sec){
      var sh=0, st=sec.codes.length;
      sec.codes.forEach(function(code){ if(states[code]==='have'||states[code]==='double') sh++; });
      return {name:sec.name, have:sh, total:st, pct:st>0?sh/st*100:0, c1:sec.c1, c2:sec.c2};
    }).filter(function(s){ return s.total > 0; });

    var completedSecs = secStats.filter(function(s){ return s.have>=s.total; }).length;
    var sortedSecs = secStats.slice().sort(function(a,b){ return b.pct-a.pct; });
    var topSec = sortedSecs[0]||null;
    var botSec = sortedSecs[sortedSecs.length-1]||null;

    // History data
    var hist = lsGet(HISTORY_KEY)||[];
    var today = new Date().toISOString().slice(0,10);
    var firstDate = hist.length ? new Date(hist[0].ts) : null;
    var lastEntry = hist.length ? hist[hist.length-1] : null;
    var todayTotal = hist.filter(function(e){ return new Date(e.ts).toISOString().slice(0,10)===today; }).reduce(function(s,e){ return s+(e.added||0); },0);
    // Weekly avg
    var weekMs = 7*24*60*60*1000;
    var weekHist = hist.filter(function(e){ return Date.now()-e.ts < weekMs; });
    var weekTotal = weekHist.reduce(function(s,e){ return s+(e.added||0); },0);
    var weeklyAvg = hist.length>0 ? Math.round(have / Math.max(1, Math.ceil((Date.now()-(firstDate||Date.now()))/(weekMs)))) : 0;
    // Most productive day
    var byDay = {};
    hist.forEach(function(e){ var d=new Date(e.ts).toISOString().slice(0,10); byDay[d]=(byDay[d]||0)+(e.added||0); });
    var bestDay = Object.keys(byDay).sort(function(a,b){ return byDay[b]-byDay[a]; })[0];
    // Streak
    var streak = 0;
    for (var i=0; i<60; i++){
      var dd = new Date(); dd.setDate(dd.getDate()-i);
      var dk = dd.toISOString().slice(0,10);
      if (byDay[dk]||0 > 0) streak++;
      else if (i>0) break;
    }

    // Special cards — detect by section kind
    var specialKinds = ['ai','transfer','other-league'];
    var specialCodes = {};
    sections.forEach(function(sec){
      if (specialKinds.indexOf(sec.kind)>=0 || sec.id==='potm' || sec.id==='cotm' || sec.id==='calciomercato'){
        sec.codes.forEach(function(c){ specialCodes[c]=true; });
      }
    });
    var specialHave=0, specialTotal=Object.keys(specialCodes).length;
    for (var sc in specialCodes){ if(states[sc]==='have'||states[sc]==='double') specialHave++; }

    // Top/bottom teams
    var teamSecs = secStats.filter(function(s){ return sections.find(function(sec){ return sec.name===s.name && sec.kind==='team'; }); });
    var topTeams = teamSecs.slice().sort(function(a,b){ return b.pct-a.pct; }).slice(0,3);
    var botTeams = teamSecs.slice().sort(function(a,b){ return a.pct-b.pct; }).slice(0,3);

    function block(icon, title, content){
      var d = document.createElement('div');
      d.style.cssText='background:var(--bg-elev);border:1px solid var(--line);border-radius:14px;padding:18px 20px;';
      d.innerHTML='<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">'
        +'<span style="font-size:18px">'+icon+'</span>'
        +'<h4 style="margin:0;font-size:14px;font-weight:700;color:var(--ink)">'+title+'</h4>'
        +'</div>'
        +'<div class="fb-stat-content">'+content+'</div>';
      return d;
    }

    function row(label, val, sub){
      return '<div style="display:flex;justify-content:space-between;align-items:baseline;padding:5px 0;border-bottom:1px solid var(--line)">'
        +'<span style="font-size:13px;color:var(--ink-2)">'+esc(label)+'</span>'
        +'<span style="font-size:15px;font-weight:700;color:var(--ink)">'+esc(String(val))+(sub?'<span style="font-size:11px;font-weight:400;color:var(--muted);margin-left:4px">'+esc(sub)+'</span>':'')+'</span>'
        +'</div>';
    }

    function teamBar(t, max){
      var w = max>0 ? (t.have/max*100) : t.pct;
      return '<div style="display:flex;align-items:center;gap:8px;padding:5px 0">'
        +'<span style="font-size:12px;font-weight:600;width:110px;flex-shrink:0;color:var(--ink-2)">'+esc(t.name)+'</span>'
        +'<div style="flex:1;height:6px;border-radius:99px;background:var(--line);overflow:hidden">'
        +'<div style="height:100%;border-radius:99px;width:'+t.pct.toFixed(1)+'%;background:linear-gradient(90deg,'+t.c1+','+t.c2+')"></div>'
        +'</div>'
        +'<span style="font-size:12px;font-weight:700;color:var(--ink);width:38px;text-align:right">'+t.pct.toFixed(0)+'%</span>'
        +'</div>';
    }

    // ── BLOCK 1: Completamento ────────────────────────────────
    var pctBig = pct.toFixed(1);
    var b1 = block('🎯', 'Completamento',
      '<div style="display:flex;align-items:center;gap:20px;margin-bottom:12px">'
        +'<div style="width:80px;height:80px;border-radius:50%;border:6px solid var(--accent);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px;font-weight:900;color:var(--ink)">'+pctBig+'%</div>'
        +'<div style="flex:1">'+row('Possedute',have,'/'+totalCodes)
          +row('Mancanti',missing)
          +row('Doppioni',physDoubles,'fisici')
        +'</div>'
      +'</div>'
      +row('Sezioni complete',completedSecs,'/'+secStats.length)
      +(topSec?row('Sezione + completa',topSec.name,topSec.pct.toFixed(0)+'%'):'')
      +(botSec&&botSec!==topSec?row('Sezione - completa',botSec.name,botSec.pct.toFixed(0)+'%'):'')
    );
    root.appendChild(b1);

    // ── BLOCK 2: La tua raccolta ──────────────────────────────
    var noHistory = !hist.length;
    var b2content;
    if (noHistory && have===0){
      b2content = '<div style="padding:12px 0;font-size:13px;color:var(--muted)">Inizia ad aggiungere figurine</div>';
    } else {
      b2content = (firstDate ? row('Prima figurina inserita',firstDate.toLocaleDateString('it-IT')) : '')
        +(lastEntry ? row('Ultima figurina',names[Object.keys(states).find(function(k){ return states[k]==='have'||states[k]==='double'; })||'']||'—') : row('Figurine possedute',have))
        +row('Media settimanale',weeklyAvg,'fig./settimana')
        +(bestDay ? row('Giorno + produttivo',new Date(bestDay).toLocaleDateString('it-IT'),'+'+byDay[bestDay]) : '')
        +row('Striscia attiva',streak,streak===1?'giorno':'giorni');
    }
    root.appendChild(block('📅', 'La tua raccolta', b2content));

    // ── BLOCK 3: Carte speciali ───────────────────────────────
    var specPct = specialTotal>0 ? (specialHave/specialTotal*100).toFixed(1) : '0';
    root.appendChild(block('✨', 'Carte speciali',
      row('Carte speciali possedute',specialHave,'/'+specialTotal)
      +row('Completamento speciali',specPct+'%')
    ));

    // ── BLOCK 4: Top squadre ──────────────────────────────────
    if (teamSecs.length){
      var b4 = block('🏆', 'Top squadre', '');
      var b4c = b4.querySelector('.fb-stat-content');
      b4c.innerHTML='<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px">Più complete</div>';
      topTeams.forEach(function(t){ b4c.innerHTML += teamBar(t,100); });
      b4c.innerHTML+='<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:10px 0 6px">Più lontane</div>';
      botTeams.forEach(function(t){ b4c.innerHTML += teamBar(t,100); });
      b4c.innerHTML += '<div style="margin-top:8px;font-size:12px;color:var(--muted)">'+completedSecs+' squadr'+(completedSecs===1?'a':'e')+' complet'+(completedSecs===1?'a':'e')+' al 100%</div>';
      root.appendChild(b4);
    }

    // ── BLOCK 5: Doppioni ─────────────────────────────────────
    var b5content = row('Totale doppioni',physDoubles,'per scambio')
      +row('Carte con doppioni',cardsDouble)
      +(maxDoubleCode ? row('Carta + doppiata','#'+maxDoubleCode+' '+maxDoubleName,maxDoubleCount+'x') : '');
    var b5 = block('🔄', 'Doppioni', b5content);
    var shareBtn = document.createElement('button');
    shareBtn.style.cssText='margin-top:12px;padding:8px 16px;border-radius:10px;background:var(--ink);color:var(--accent);border:none;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--f-body)';
    shareBtn.textContent='Condividi doppioni';
    shareBtn.addEventListener('click', function(){
      var lines=['I miei doppioni:'];
      for (var code in states){ if(states[code]==='double'){ var n=names[code]||''; lines.push('#'+code+(n?' — '+n:'')+(counts[code]?' ('+counts[code]+'x)':'')); }}
      var txt = lines.join('\n');
      if (navigator.clipboard){ navigator.clipboard.writeText(txt).then(function(){ showEnhToast('Doppioni copiati!'); }); }
      else { showEnhToast('Copia: '+txt.substring(0,50)+'…'); }
    });
    b5.querySelector('.fb-stat-content').appendChild(shareBtn);
    root.appendChild(b5);
  }

  // ── Init sequence ─────────────────────────────────────────────
  function init(){
    startRailObserver();
    injectActivitySection();
    injectStatsTab();
    initSearchFix();

    // Also refresh activity section and hero prev-have after album-app renders
    setTimeout(function(){
      injectQuasiSection();
      var heroHave = document.querySelector('#heroHaveCount');
      if (heroHave) window._fbEnhPrevHave = parseInt(heroHave.textContent,10)||0;
      _prevSecStates = getSecStates();
      refreshDoublesCounter();
      checkAlbumCompletion();
    }, 500);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(init, 300); });
  } else {
    setTimeout(init, 300);
  }

})();
