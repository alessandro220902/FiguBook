// figubook-album.js — S3
// Pagina "I miei album". Dati reali da Firestore (window.DB). MAI localStorage.

(function () {

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function toast(msg) {
    const t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove('show'); }, 1400);
  }

  let activeFilter = 'all';

  // Stato di un album per il filtro: 'done' (100%), 'active' (iniziato), 'new'.
  function statusOf(meta, stats) {
    if (stats.total > 0 && stats.have >= stats.total) return 'done';
    if (stats.have > 0) return 'active';
    return 'new'; // posseduto ma non ancora iniziato
  }

  function albumCard(meta, stats, status) {
    const div = document.createElement('div');
    div.className = 'album-card';
    div.dataset.status = status;
    div.dataset.tags = (meta.tags || []).join(',');
    const c1 = meta.c1 || '#2a2a2a', c2 = meta.c2 || '#1a1a1a';
    div.style.cssText = 'position:relative;cursor:pointer;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.5);' +
      'background:linear-gradient(135deg, ' + c1 + ' 0%, ' + c2 + ' 100%);' +
      'border:1px solid rgba(0,0,0,.08);border-radius:18px;padding:18px';
    div.innerHTML =
      '<button class="card-remove" title="Rimuovi dalla raccolta" ' +
        'style="position:absolute;top:10px;right:10px;border:none;background:rgba(255,255,255,.2);color:#fff;' +
        'width:26px;height:26px;border-radius:50%;cursor:pointer;font-size:14px;line-height:1">×</button>' +
      '<div style="font-size:11px;font-weight:600;color:rgba(255,255,255,.92);text-transform:uppercase;letter-spacing:.04em">' +
        esc(meta.editor) + ' · ' + esc(meta.season) + '</div>' +
      '<a href="' + meta.href + '" style="display:block;font-size:18px;font-weight:700;margin:4px 0 12px;' +
        'text-decoration:none;color:#fff">' + esc(meta.title) + '</a>' +
      '<div style="height:8px;background:rgba(255,255,255,.25);border-radius:99px;overflow:hidden">' +
        '<i style="display:block;height:100%;width:' + stats.pct + '%;background:var(--accent)"></i>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;margin-top:10px;font-size:13px">' +
        '<span>' + stats.have + ' / ' + stats.total + ' · ' + stats.doubles + ' doppie</span>' +
        '<span style="font-weight:700">' + stats.pct + '%</span>' +
      '</div>';
    // Tutta la card è cliccabile, tranne la × di rimozione e il titolo <a>.
    div.addEventListener('click', function (e) {
      if (e.target.closest('.card-remove')) return; // la × rimuove, non apre
      if (e.target.closest('a')) return;            // il titolo <a> naviga da solo
      window.location.href = meta.href;
    });
    return div;
  }

  function applyFilter() {
    const grid = $('albumsGrid');
    if (!grid) return;
    grid.querySelectorAll('.album-card').forEach(function (card) {
      const st = card.dataset.status;
      const tags = card.dataset.tags || '';
      let show = true;
      if (activeFilter === 'active')        show = (st === 'active');
      else if (activeFilter === 'done')     show = (st === 'done');
      else if (activeFilter === 'new')      show = tags.indexOf('2526') >= 0;
      else if (activeFilter === 'archived') show = false; // nessun sistema di archivio
      card.style.display = show ? '' : 'none';
    });
  }

  async function render() {
    const grid = $('albumsGrid');
    const av = $('avatarBtn');
    if (av) av.textContent = window.DB.getUserInitial();
    window.DB.wireProfileMenu();
    window.DB.wireNotifications();

    let ids = [];
    try { ids = await window.DB.getMyAlbums(); } catch (e) {}

    // Header totali.
    let all = { totalHave: 0, totalDoubles: 0, totalMissing: 0 };
    try { all = await window.DB.getAllStats(); } catch (e) {}
    if ($('statFigurine')) { $('statFigurine').textContent = all.totalHave; $('statFigurine').classList.remove('is-loading'); }
    if ($('albumHeaderSub')) $('albumHeaderSub').textContent =
      ids.length + (ids.length === 1 ? ' album in raccolta' : ' album in raccolta');

    if (!grid) return;
    grid.innerHTML = '';

    if (ids.length === 0) {
      // EMPTY STATE COMPATTO.
      grid.innerHTML =
        '<div style="grid-column:1/-1;padding:24px;text-align:center;color:var(--muted);font-size:14px">' +
        'Non hai ancora album. ' +
        '<a href="figubook-catalogo.html" style="color:var(--ink);font-weight:600;text-decoration:none">Aggiungine uno dal catalogo →</a></div>';
      if ($('statCompletati')) { $('statCompletati').textContent = '0'; $('statCompletati').classList.remove('is-loading'); }
      // Azzera i contatori dei filtri.
      setChipCount('all', 0); setChipCount('active', 0); setChipCount('done', 0);
      setChipCount('new', 0); setChipCount('archived', 0);
      return;
    }

    // Calcola stats e costruisce le card.
    const rows = await Promise.all(ids.map(async function (id) {
      const meta = window.ALBUM_BY_ID[id] ||
        { id: id, href: '#', editor: '', season: '', title: id, tags: [] };
      let stats;
      try { stats = await window.DB.getAlbumStats(id); }
      catch (e) { stats = { have: 0, total: 0, missing: 0, doubles: 0, pct: 0 }; }
      return { id: id, meta: meta, stats: stats, status: statusOf(meta, stats) };
    }));

    let completed = 0, active = 0, neu = 0;
    rows.forEach(function (r) {
      grid.appendChild(albumCard(r.meta, r.stats, r.status));
      if (r.status === 'done') completed++;
      else if (r.status === 'active') active++;
      if ((r.meta.tags || []).indexOf('2526') >= 0) neu++;
    });

    if ($('statCompletati')) { $('statCompletati').textContent = completed; $('statCompletati').classList.remove('is-loading'); }

    // Contatori filtri reali.
    setChipCount('all', rows.length);
    setChipCount('active', active);
    setChipCount('done', completed);
    setChipCount('new', neu);
    setChipCount('archived', 0);

    // Rimozione album.
    grid.querySelectorAll('.album-card').forEach(function (card, i) {
      const id = rows[i].id;
      const btn = card.querySelector('.card-remove');
      if (btn) btn.addEventListener('click', async function () {
        if (!confirm('Rimuovere "' + rows[i].meta.title + '" dalla tua raccolta? I dati restano salvati.')) return;
        try {
          await window.DB.removeAlbum(id);
          toast('Album rimosso');
          render();
        } catch (e) { console.error(e); }
      });
    });

    applyFilter();
  }

  function setChipCount(filter, n) {
    const chip = document.querySelector('#filterChips .chip[data-filter="' + filter + '"] .ct');
    if (chip) chip.textContent = n;
  }

  window.FB.onReady(function () {
    // Filtri.
    document.querySelectorAll('#filterChips .chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        document.querySelectorAll('#filterChips .chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        activeFilter = chip.dataset.filter;
        applyFilter();
      });
    });

    // "Aggiungi album" → catalogo (lì si sceglie quale aggiungere).
    const add = $('addAlbumBtn');
    if (add) add.addEventListener('click', function () {
      window.location.href = 'figubook-catalogo.html';
    });

    // Logout dal menu profilo, se presente.
    const out = $('pmEsci');
    if (out) out.addEventListener('click', function () {
      window.FB.auth.signOut().then(function () { window.location.href = 'figubook-benvenuto.html'; });
    });

    render();
  });

})();
