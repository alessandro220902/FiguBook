// figubook-mancanti.js — S3
// Pagina "figurine mancanti" di un album. Dati reali da Firestore (window.DB).
// MAI localStorage. Il file dati (album-data*.js) è caricato via routing ?album=
// e definisce window.SECTIONS / STICKER_STATES / STICKER_NAMES + FB_STORAGE_KEY.

(function () {

  const KEY_TO_ALBUM_ID = {
    'figubook-calciatori-2526-v1':     'calciatori-25-26',
    'figubook-calciatori-2425-v1':     'calciatori-24-25',
    'figubook-calciatori-2324-v1':     'calciatori-23-24',
    'figubook-calciatori-2223-v1':     'calciatori-22-23',
    'figubook-fwc2026-v1':             'mondiali-2026',
    'figubook-serieb-2526-v1':         'calb-25-26',
    'figubook-adrenalyn-2526-v1':      'adrenalyn-25-26',
    'figubook-matchattax-ucl-2526-v1': 'match-attax-ucl',
  };

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function resolveStorageKey() {
    try { if (typeof FB_STORAGE_KEY !== 'undefined' && FB_STORAGE_KEY) return FB_STORAGE_KEY; }
    catch (e) {}
    return null;
  }

  let albumId = null;
  let grouped = false;       // false = lista unica, true = per sezione
  let searchQ = '';
  let foundToday = 0;

  // Tutte le carte mancanti come {code, name, section}.
  function missingList() {
    const out = [];
    const SECTIONS = window.SECTIONS || [];
    SECTIONS.forEach(function (sec) {
      sec.codes.forEach(function (code) {
        if (window.STICKER_STATES[code] === 'missing') {
          out.push({ code: code, name: window.STICKER_NAMES[code] || '', section: sec });
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
    return '<div class="miss-card" data-code="' + esc(item.code) + '" ' +
      'style="background:var(--card,#fff);border:1px solid rgba(0,0,0,.08);border-radius:14px;' +
      'padding:12px;display:flex;align-items:center;gap:10px">' +
      '<span style="font-family:var(--f-mono,monospace);font-weight:700;min-width:42px">' + esc(item.code) + '</span>' +
      '<span style="flex:1;font-size:13px;color:var(--muted)">' +
        (item.name ? esc(item.name) : esc(item.section.short || item.section.name)) + '</span>' +
      '<button class="miss-found" style="border:none;cursor:pointer;border-radius:9px;padding:7px 12px;' +
        'font-weight:600;font-size:13px;background:linear-gradient(90deg,#1f8a5b,#0a3a8b);color:#fff">Trovata</button>' +
      '</div>';
  }

  function renderStats() {
    const list = missingList();
    const sections = {};
    list.forEach(function (i) { sections[i.section.id] = true; });
    if ($('totalMissing')) $('totalMissing').textContent = list.length;
    if ($('totalSquads'))  $('totalSquads').textContent = Object.keys(sections).length;
    if ($('checkedToday')) $('checkedToday').textContent = foundToday;
  }

  function render() {
    const wrap = $('missingWrap');
    if (!wrap) return;
    const list = missingList().filter(matchesSearch);

    if (list.length === 0) {
      // EMPTY STATE COMPATTO.
      wrap.innerHTML = '<div style="padding:24px;text-align:center;color:var(--muted);font-size:14px">' +
        (searchQ ? 'Nessuna figurina mancante corrisponde alla ricerca.' :
                   '🎉 Album completo: non ti manca nessuna figurina!') + '</div>';
      renderStats();
      return;
    }

    if (!grouped) {
      wrap.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px">' +
        list.map(cardHtml).join('') + '</div>';
    } else {
      // Raggruppa per sezione.
      const bySec = {};
      list.forEach(function (i) {
        (bySec[i.section.id] = bySec[i.section.id] || { sec: i.section, items: [] }).items.push(i);
      });
      wrap.innerHTML = Object.keys(bySec).map(function (sid) {
        const g = bySec[sid];
        return '<div style="margin-bottom:18px">' +
          '<h3 style="font-size:14px;margin:0 0 8px">' + esc(g.sec.name) +
            ' <span style="color:var(--muted);font-weight:400">(' + g.items.length + ')</span></h3>' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px">' +
          g.items.map(cardHtml).join('') + '</div></div>';
      }).join('');
    }

    // Wire "Trovata".
    wrap.querySelectorAll('.miss-card').forEach(function (card) {
      const code = card.dataset.code;
      const btn = card.querySelector('.miss-found');
      if (btn) btn.addEventListener('click', async function () {
        window.STICKER_STATES[code] = 'have';
        foundToday++;
        try { await window.DB.saveCardState(albumId, code, 'have'); }
        catch (e) { console.error('FiguBook: errore salvataggio', e); }
        card.style.transition = 'opacity .25s';
        card.style.opacity = '0';
        setTimeout(function () { render(); }, 260);
        renderStats();
      });
    });

    renderStats();
  }

  function buildMissingText() {
    const meta = window.ALBUM_BY_ID[albumId];
    const title = meta ? meta.title : 'Album';
    const codes = missingList().map(function (i) { return i.code; });
    return 'Mi mancano queste figurine di ' + title + ' (' + codes.length + '):\n' + codes.join(', ');
  }

  window.FB.onReady(async function () {
    const av = $('avatarBtn');
    if (av) av.textContent = window.DB.getUserInitial();

    const storageKey = resolveStorageKey();
    albumId = storageKey ? KEY_TO_ALBUM_ID[storageKey] : null;

    // Intestazione album.
    const meta = albumId ? window.ALBUM_BY_ID[albumId] : null;
    if (meta && $('crumbAlbum')) $('crumbAlbum').textContent = meta.title;

    if (!albumId) {
      const wrap = $('missingWrap');
      if (wrap) wrap.innerHTML = '<div style="padding:24px;text-align:center;color:var(--muted)">Album non riconosciuto.</div>';
      return;
    }

    // Carica stati salvati nei globali (stesso meccanismo di album-single).
    try {
      const { states, counts } = await window.DB.getAlbumData(albumId);
      for (const code in states) {
        if (code in window.STICKER_STATES) window.STICKER_STATES[code] = states[code];
      }
      for (const code in counts) {
        if (code in window.STICKER_STATES) window.STICKER_COUNTS[code] = counts[code];
      }
    } catch (e) { console.error('FiguBook: errore caricamento mancanti', e); }

    // Ricerca.
    const searchEl = $('searchEl');
    if (searchEl) searchEl.addEventListener('input', function (e) {
      searchQ = e.target.value.trim();
      render();
    });

    // Toggle lista unica / per sezione.
    document.querySelectorAll('#groupChips .chip[data-group]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        document.querySelectorAll('#groupChips .chip[data-group]').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        grouped = (chip.dataset.group === 'bySection');
        render();
      });
    });

    // Copia mancanti.
    const copyBtn = $('copiaMancanti');
    if (copyBtn) copyBtn.addEventListener('click', function () {
      const text = buildMissingText();
      if (navigator.clipboard) navigator.clipboard.writeText(text).catch(function () {});
    });

    render();
  });

})();
