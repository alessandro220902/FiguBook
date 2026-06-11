// figubook-doppioni.js — pagina "Tutti i doppioni" di un album.
// Gemella di figubook-mancanti.js ma filtra sulle carte in stato 'double'
// e mostra il numero di doppie per carta. Dati reali da Firestore (window.DB).
// MAI localStorage. Il file dati (album-data*.js) è caricato via routing ?album=.

(function () {

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function resolveAlbumId() {
    var p = new URLSearchParams(window.location.search).get('album') || '2526';
    var entry = (window.ALBUM_CATALOG || []).find(function (a) { return a.missingParam === p; });
    return entry ? entry.id : null;
  }

  let albumId = null;
  let grouped = false;
  let searchQ = '';

  // Numero di doppie (copie extra oltre la prima) per una carta.
  function extraOf(code) {
    var n = window.STICKER_COUNTS[code];
    if (!n || n < 2) return 1; // in stato 'double' c'è almeno 1 copia extra
    return n - 1;
  }

  // Tutte le carte in doppia come {code, name, section, extra}.
  function doublesList() {
    const out = [];
    const SECTIONS = window.SECTIONS || [];
    SECTIONS.forEach(function (sec) {
      sec.codes.forEach(function (code) {
        if (window.STICKER_STATES[code] === 'double') {
          out.push({ code: code, name: window.STICKER_NAMES[code] || '', section: sec, extra: extraOf(code) });
        }
      });
    });
    return out;
  }

  function matchesSearch(item) {
    if (!searchQ) return true;
    const q = searchQ.toLowerCase();
    return item.code.toLowerCase().indexOf(q) >= 0 ||
           (item.name && item.name.toLowerCase().indexOf(q) >= 0) ||
           (item.section.name && item.section.name.toLowerCase().indexOf(q) >= 0);
  }

  function cardHtml(item) {
    var c1 = (item.section && item.section.c1) ? item.section.c1 : '#0a3a8b';
    var team = esc(item.section.short || item.section.name || '');
    var name = item.name ? esc(item.name) : '';
    var label = item.extra === 1 ? '1 doppia' : item.extra + ' doppie';
    return '<div class="miss-card" data-code="' + esc(item.code) + '" style="--card-c1:' + c1 + '">' +
      '<div class="team-line">' + team + '</div>' +
      '<div><div class="num">' + esc(item.code) + '</div>' +
      '<div class="section-hint">' + name + '</div></div>' +
      '<div class="found-btn" style="cursor:default;background:rgba(255,255,255,.2)">' + label + '</div>' +
    '</div>';
  }

  function renderStats() {
    const list = doublesList();
    const sections = {};
    let totalExtra = 0;
    list.forEach(function (i) { sections[i.section.id] = true; totalExtra += i.extra; });
    if ($('totalMissing')) $('totalMissing').textContent = totalExtra;
    if ($('totalSquads'))  $('totalSquads').textContent = Object.keys(sections).length;
    if ($('checkedToday')) $('checkedToday').textContent = list.length;
  }

  function render() {
    const wrap = $('missingWrap');
    if (!wrap) return;
    const list = doublesList().filter(matchesSearch);

    if (list.length === 0) {
      wrap.innerHTML = '<div style="padding:24px;text-align:center;color:var(--muted);font-size:14px">' +
        (searchQ ? 'Nessuna doppia corrisponde alla ricerca.' :
                   'Non hai ancora nessuna figurina doppia in questo album.') + '</div>';
      renderStats();
      return;
    }

    if (!grouped) {
      wrap.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px">' +
        list.map(cardHtml).join('') + '</div>';
    } else {
      const bySec = {};
      list.forEach(function (i) {
        (bySec[i.section.id] = bySec[i.section.id] || { sec: i.section, items: [] }).items.push(i);
      });
      wrap.innerHTML = Object.keys(bySec).map(function (sid) {
        const g = bySec[sid];
        return '<div style="margin-bottom:18px">' +
          '<h3 style="font-size:14px;margin:0 0 8px">' + esc(g.sec.name) +
            ' <span style="color:var(--muted);font-weight:400">(' + g.items.length + ')</span></h3>' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px">' +
          g.items.map(cardHtml).join('') + '</div></div>';
      }).join('');
    }

    renderStats();
  }

  function buildDoublesText() {
    const meta = window.ALBUM_BY_ID[albumId];
    const title = meta ? meta.title : 'Album';
    const items = doublesList();
    const parts = items.map(function (i) { return i.code + ' (x' + i.extra + ')'; });
    return 'Ho queste doppie di ' + title + ' (' + items.length + ' carte):\n' + parts.join(', ');
  }

  window.FB.onReady(async function () {
    const av = $('avatarBtn');
    if (av) av.textContent = window.DB.getUserInitial();
    window.DB.wireProfileMenu();

    albumId = resolveAlbumId();
    const meta = albumId ? window.ALBUM_BY_ID[albumId] : null;
    if (meta && $('crumbAlbum')) $('crumbAlbum').textContent = meta.title;

    if (!albumId) {
      const wrap = $('missingWrap');
      if (wrap) wrap.innerHTML = '<div style="padding:24px;text-align:center;color:var(--muted)">Album non riconosciuto.</div>';
      return;
    }

    try {
      const { states, counts } = await window.DB.getAlbumData(albumId);
      for (const code in states) { if (code in window.STICKER_STATES) window.STICKER_STATES[code] = states[code]; }
      for (const code in counts) { if (code in window.STICKER_STATES) window.STICKER_COUNTS[code] = counts[code]; }
    } catch (e) { console.error('FiguBook: errore caricamento doppie', e); }

    const searchEl = $('searchEl');
    if (searchEl) searchEl.addEventListener('input', function (e) { searchQ = e.target.value.trim(); render(); });

    document.querySelectorAll('#groupChips .chip[data-group]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        document.querySelectorAll('#groupChips .chip[data-group]').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        grouped = (chip.dataset.group === 'bySection');
        render();
      });
    });

    // ── Condividi doppie ──
    function showToast(msg){ var t=$('toast'); if(!t)return; t.textContent=msg; t.classList.add('show'); setTimeout(function(){t.classList.remove('show');},1800); }
    function downloadBlob(text, filename, mime){ var b=new Blob([text],{type:mime}); var u=URL.createObjectURL(b); var a=document.createElement('a'); a.href=u; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(u); }
    function openShare(){ var box=$('missShareTextBox'); if(box) box.textContent=buildDoublesText(); var m=$('missShareModal'),bk=$('missShareBackdrop'); if(m)m.classList.add('open'); if(bk)bk.classList.add('open'); }
    function closeShare(){ var m=$('missShareModal'),bk=$('missShareBackdrop'); if(m)m.classList.remove('open'); if(bk)bk.classList.remove('open'); }

    if ($('copiaMancanti')) $('copiaMancanti').addEventListener('click', openShare);
    if ($('missShareClose')) $('missShareClose').addEventListener('click', closeShare);
    if ($('missShareBackdrop')) $('missShareBackdrop').addEventListener('click', closeShare);

    if ($('missShareCopyBtn')) $('missShareCopyBtn').addEventListener('click', function(){
      if (navigator.clipboard) navigator.clipboard.writeText(buildDoublesText()).then(function(){ showToast('Copiato negli appunti'); }).catch(function(){});
    });
    if ($('missShareTxtBtn')) $('missShareTxtBtn').addEventListener('click', function(){ downloadBlob(buildDoublesText(), 'doppie.txt', 'text/plain'); });
    if ($('missShareXlsxBtn')) $('missShareXlsxBtn').addEventListener('click', function(){
      if (!window.XLSX) return;
      var rows = [['Codice','Nome','Sezione','Doppie']].concat(doublesList().map(function(i){ return [i.code, i.name||'', i.section.name, i.extra]; }));
      var ws = XLSX.utils.aoa_to_sheet(rows); var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Doppie'); XLSX.writeFile(wb, 'doppie.xlsx');
    });
    if ($('missShareWhatsappBtn')) $('missShareWhatsappBtn').addEventListener('click', function(){ window.open('https://wa.me/?text=' + encodeURIComponent(buildDoublesText()), '_blank'); });
    if ($('missShareMailBtn')) $('missShareMailBtn').addEventListener('click', function(){
      var m = window.ALBUM_BY_ID[albumId]; var subj = 'Figurine doppie' + (m ? ' — ' + m.title : '');
      window.location.href = 'mailto:?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(buildDoublesText());
    });

    render();
  });

})();
