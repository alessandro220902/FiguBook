// figubook-catalogo.js — S3
// Catalogo degli album disponibili. Aggiunta/rimozione via window.DB. MAI localStorage.

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

  let owned = [];      // albumId posseduti
  let activeF = 'all'; // filtro corrente (data-f)

  function matchesFilter(meta) {
    if (activeF === 'all') return true;
    return (meta.tags || []).indexOf(activeF) >= 0;
  }

  function card(meta) {
    const isOwned = owned.indexOf(meta.id) >= 0;
    const div = document.createElement('div');
    div.className = 'cat-card';
    div.dataset.tags = (meta.tags || []).join(',');
    div.style.cssText = 'background:var(--card,#fff);border:1px solid rgba(0,0,0,.08);' +
      'border-radius:18px;padding:18px;display:flex;flex-direction:column;gap:10px';
    div.innerHTML =
      '<div style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.04em">' +
        esc(meta.editor) + ' · ' + esc(meta.season) + '</div>' +
      '<div style="font-size:18px;font-weight:700">' + esc(meta.title) + '</div>' +
      '<div style="font-size:13px;color:var(--muted)">' + meta.total + ' figurine</div>' +
      '<button class="cat-toggle" style="margin-top:auto;border:none;cursor:pointer;border-radius:10px;' +
        'padding:10px 14px;font-weight:600;font-size:14px;' +
        (isOwned
          ? 'background:rgba(0,0,0,.06);color:var(--ink)">Rimuovi'
          : 'background:linear-gradient(90deg,#1f8a5b,#0a3a8b);color:#fff">+ Aggiungi') +
      '</button>';
    const btn = div.querySelector('.cat-toggle');
    btn.addEventListener('click', async function () {
      try {
        if (owned.indexOf(meta.id) >= 0) {
          await window.DB.removeAlbum(meta.id);
          toast('Rimosso dalla raccolta');
        } else {
          await window.DB.addAlbum(meta.id);
          toast('Aggiunto alla raccolta');
        }
        owned = await window.DB.getMyAlbums();
        render();
      } catch (e) { console.error(e); }
    });
    return div;
  }

  function render() {
    const grid = $('catGrid');
    if (!grid) return;
    grid.innerHTML = '';
    (window.ALBUM_CATALOG || []).filter(matchesFilter).forEach(function (meta) {
      grid.appendChild(card(meta));
    });
  }

  window.FB.onReady(async function () {
    const av = $('avatarBtn');
    if (av) av.textContent = window.DB.getUserInitial();
    const fy = $('footerYear');
    if (fy) fy.textContent = new Date().getFullYear();

    try { owned = await window.DB.getMyAlbums(); } catch (e) { owned = []; }

    document.querySelectorAll('#filterBar .filter-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('#filterBar .filter-btn').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        activeF = b.dataset.f;
        render();
      });
    });

    render();
  });

})();
