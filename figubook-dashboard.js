// figubook-dashboard.js — S3
// Popola la dashboard con dati reali da Firestore (window.DB). MAI localStorage.
// Nessun dato demo: niente notifiche finte, conversazioni hardcoded o badge a 0.

(function () {

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  // Nasconde un elemento e l'eventuale intestazione (.sec-head) che lo precede,
  // così non restano riquadri/titoli vuoti.
  function hideWithHeading(el) {
    if (!el) return;
    el.style.display = 'none';
    let prev = el.previousElementSibling;
    while (prev && !prev.classList.contains('sec-head')) prev = prev.previousElementSibling;
    if (prev && prev.classList.contains('sec-head')) prev.style.display = 'none';
  }

  // Card album per lo scroller orizzontale.
  function albumCard(meta, stats) {
    const a = document.createElement('a');
    a.href = meta.href;
    a.className = 'album-mini';
    const c1 = meta.c1 || '#2a2a2a', c2 = meta.c2 || '#1a1a1a';
    a.style.cssText = 'display:block;min-width:200px;text-decoration:none;color:#fff;' +
      'text-shadow:0 1px 2px rgba(0,0,0,.35);' +
      'background:linear-gradient(135deg, ' + c1 + ' 0%, ' + c2 + ' 100%);' +
      'border:1px solid rgba(0,0,0,.08);border-radius:16px;' +
      'padding:16px;margin-right:12px';
    a.innerHTML =
      '<div style="font-size:11px;font-weight:600;color:rgba(255,255,255,.85);text-transform:uppercase;letter-spacing:.04em">' +
        esc(meta.editor) + ' · ' + esc(meta.season) + '</div>' +
      '<div style="font-size:16px;font-weight:700;margin:4px 0 10px">' + esc(meta.title) + '</div>' +
      '<div style="height:8px;background:rgba(255,255,255,.25);border-radius:99px;overflow:hidden">' +
        '<i style="display:block;height:100%;width:' + stats.pct + '%;background:#fff"></i>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;margin-top:8px;font-size:13px">' +
        '<span>' + stats.have + ' / ' + stats.total + '</span>' +
        '<span style="font-weight:700">' + stats.pct + '%</span>' +
      '</div>';
    return a;
  }

  window.FB.onReady(async function () {
    // ── Saluto + avatar ──────────────────────────────────────────
    const name = window.DB.getUserName();
    let everHad = false;
    try { everHad = await window.DB.getEverHadAlbum(); } catch (e) {}
    const h1 = $('greetingH1');
    if (h1) {
      h1.innerHTML = (everHad ? 'Ciao ' : 'Benvenuto ') + esc(name) + ', <em>oggi che si fa?</em>';
      h1.classList.remove('is-loading');
    }
    const av = $('avatarBtn');
    if (av) av.textContent = window.DB.getUserInitial();
    window.DB.wireProfileMenu();

    const fy = $('footerYear');
    if (fy) fy.textContent = new Date().getFullYear();

    // ── Statistiche rapide ───────────────────────────────────────
    let all = { totalHave: 0, totalDoubles: 0, totalMissing: 0 };
    try { all = await window.DB.getAllStats(); } catch (e) {}
    if ($('qstatFigurine')) $('qstatFigurine').textContent = all.totalHave;
    if ($('qstatDoppie'))   $('qstatDoppie').textContent   = all.totalDoubles;
    if ($('qstatMancanti')) $('qstatMancanti').textContent = all.totalMissing;
    ['qstatFigurine', 'qstatDoppie', 'qstatMancanti'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.remove('is-loading');
    });

    // ── Album posseduti ──────────────────────────────────────────
    let ids = [];
    try { ids = await window.DB.getMyAlbums(); } catch (e) {}

    const scroller = $('albumsScroller');
    const todo = $('todoList');

    if (ids.length === 0) {
      // EMPTY STATE COMPATTO — niente riquadri vuoti, nessun dato inventato.
      if (scroller) {
        scroller.innerHTML =
          '<a href="figubook-album.html" style="text-decoration:none;color:var(--muted);font-size:14px">' +
          'Nessun album ancora. <span style="color:var(--ink);font-weight:600">Aggiungine uno →</span></a>';
      }
      if (todo) {
        todo.innerHTML =
          '<div style="font-size:14px;color:var(--muted)">Che aspetti? Aggiungi un album per iniziare. ' +
          '<a href="figubook-album.html" style="color:var(--ink);font-weight:600;text-decoration:none">Vai agli album →</a></div>';
      }
    } else {
      // Scroller con le card reali + todo "ti mancano X".
      const statsById = {};
      await Promise.all(ids.map(async function (id) {
        try { statsById[id] = await window.DB.getAlbumStats(id); }
        catch (e) { statsById[id] = { have: 0, total: 0, missing: 0, doubles: 0, pct: 0 }; }
      }));

      if (scroller) {
        scroller.innerHTML = '';
        scroller.style.cssText = 'display:flex;overflow-x:auto;padding-bottom:4px';
        ids.forEach(function (id) {
          const meta = window.ALBUM_BY_ID[id] ||
            { href: '#', editor: '', season: '', title: id };
          scroller.appendChild(albumCard(meta, statsById[id]));
        });
      }

      if (todo) {
        // Suggerimenti reali: gli album con più mancanti in cima.
        const ordered = ids.slice().sort(function (a, b) {
          return statsById[b].missing - statsById[a].missing;
        });
        todo.innerHTML = ordered.map(function (id) {
          const meta = window.ALBUM_BY_ID[id] || { title: id, href: '#' };
          const s = statsById[id];
          if (s.missing <= 0) {
            return '<div class="todo-item" style="padding:8px 0;font-size:14px">✓ ' +
              esc(meta.title) + ' completato!</div>';
          }
          return '<a href="' + meta.href + '" class="todo-item" style="display:block;padding:8px 0;' +
            'font-size:14px;text-decoration:none;color:inherit">Ti mancano <b>' + s.missing +
            '</b> figurine in ' + esc(meta.title) + '</a>';
        }).join('');
      }
    }

    // ── Match pronti: nessun sistema di matching multi-utente ─────
    const matchEmpty = $('matchEmptyMsg');
    const matchList  = $('matchListContainer');
    if (matchList) matchList.style.display = 'none';
    if (matchEmpty) matchEmpty.style.display = '';

    // ── Sezioni che richiedono dati non disponibili lato dashboard ─
    // (dettaglio obiettivi per squadra, missione, traguardi, grafico 7 giorni,
    //  sessioni). Le nascondiamo invece di riempirle con numeri inventati.
    hideWithHeading($('objectivesWrap'));
    hideWithHeading($('missionCard'));
    hideWithHeading($('badgesGrid'));

    // Attività "Stato collezione": riepilogo reale (stessi totali delle qstat).
    const actRows = $('activityRows');
    if (actRows) {
      actRows.innerHTML =
        '<div class="act-row" style="padding:10px 0;font-size:14px">Figurine possedute: <b>' + all.totalHave + '</b></div>' +
        '<div class="act-row" style="padding:10px 0;font-size:14px">Doppie: <b>' + all.totalDoubles + '</b></div>' +
        '<div class="act-row" style="padding:10px 0;font-size:14px">Mancanti: <b>' + all.totalMissing + '</b></div>';
    }

    // Grafico 7 giorni + sessioni: nascondi l'intera riga .cols che li contiene.
    const chart = $('chartWrap');
    if (chart) {
      const cols = chart.closest('.cols');
      if (cols) cols.style.display = 'none';
    }
  });

})();
