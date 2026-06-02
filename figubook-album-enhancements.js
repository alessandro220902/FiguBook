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

      // Check section completion
      checkSectionCompletion();
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
    var rail = document.getElementById('railList');
    if (!rail) return;

    // Remove existing
    var old = rail.querySelector('.' + QUASI_GROUP_CLASS);
    if (old) old.remove();

    var group = buildQuasiSection();
    if (!group) return;

    // Insert at top of rail list
    rail.insertBefore(group, rail.firstChild);
  }

  function startRailObserver(){
    var rail = document.getElementById('railList');
    if (!rail || _railObserver) return;

    // Initial inject
    injectQuasiSection();

    _railObserver = new MutationObserver(function(mutations){
      // If only the quasi group changed, skip
      var relevant = mutations.some(function(m){
        return Array.from(m.addedNodes).some(function(n){
          return !(n.classList && n.classList.contains(QUASI_GROUP_CLASS));
        }) || Array.from(m.removedNodes).some(function(n){
          return !(n.classList && n.classList.contains(QUASI_GROUP_CLASS));
        });
      });
      if (!relevant) return;
      clearTimeout(_railInjectDebounce);
      _railInjectDebounce = setTimeout(injectQuasiSection, 60);
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

  // ── Init sequence ─────────────────────────────────────────────
  function init(){
    startRailObserver();
    injectActivitySection();

    // Also refresh activity section and hero prev-have after album-app renders
    setTimeout(function(){
      injectQuasiSection();
      var heroHave = document.querySelector('#heroHaveCount');
      if (heroHave) window._fbEnhPrevHave = parseInt(heroHave.textContent,10)||0;
      _prevSecStates = getSecStates();
    }, 500);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(init, 300); });
  } else {
    setTimeout(init, 300);
  }

})();
