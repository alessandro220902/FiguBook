// figubook-scambia.js — Scambia (gruppi). MAI localStorage.
// Renderizza tutto dentro #scambiaRoot. Tappa 7a: gruppi (stato senza gruppo,
// crea/entra, selettore gruppo, codice invito). Le card dei match arrivano in 7b.

(function () {

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  const state = { groups: [], activeId: null, busy: false };

  function setAvatar() {
    const av = $('avatarBtn');
    if (av) av.textContent = window.DB.getUserInitial();
    window.DB.wireProfileMenu();
    window.DB.wireNotifications();
    const out = $('pmEsci');
    if (out) out.addEventListener('click', function () {
      window.FB.auth.signOut().then(function () { window.location.href = 'figubook-benvenuto.html'; });
    });
  }

  function toast(msg) {
    const t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function () { t.classList.remove('show'); }, 1900);
  }

  // Dopo crea/entra: pubblica l'inventario corrente in tutti i gruppi.
  async function syncAllAlbums() {
    try {
      const ids = await window.DB.getMyAlbums();
      await Promise.all((ids || []).map(function (id) { return window.DB.syncInventory(id); }));
    } catch (e) { console.error('FiguBook: sync iniziale', e); }
  }

  // ── STATO SENZA GRUPPO ──
  function renderNoGroup(root) {
    root.innerHTML =
      '<div style="max-width:460px;margin:40px auto 0;text-align:center">' +
        '<div style="width:56px;height:56px;border-radius:99px;background:color-mix(in srgb,var(--accent) 18%,var(--bg-elev));display:grid;place-items:center;margin:0 auto 16px;font-size:26px">👥</div>' +
        '<div style="font-family:var(--f-display);font-size:22px;font-weight:700;margin-bottom:8px">Scambia con il tuo gruppo</div>' +
        '<div style="font-size:14px;color:var(--muted);line-height:1.6;margin-bottom:22px">Crea un gruppo con la tua classe, i tuoi amici o il quartiere. Scambiate dal vivo le doppie che vi servono — solo tra persone che inviti.</div>' +

        '<div style="display:flex;gap:8px;margin-bottom:14px">' +
          '<input id="grpNewName" type="text" placeholder="Nome del gruppo (es. 3ª B)" style="flex:1;padding:12px 14px;border-radius:12px;background:var(--bg);border:1px solid var(--line);color:var(--ink);font-size:14px;font-family:var(--f-body)" />' +
          '<button id="grpCreateBtn" style="padding:0 18px;border:0;border-radius:12px;background:var(--accent);color:var(--accent-ink,#0d1b2a);font-weight:600;font-size:14px;cursor:pointer">Crea</button>' +
        '</div>' +

        '<div style="display:flex;align-items:center;gap:12px;margin:14px 0;color:var(--muted);font-size:12px"><span style="flex:1;height:1px;background:var(--line)"></span>oppure<span style="flex:1;height:1px;background:var(--line)"></span></div>' +

        '<div style="display:flex;gap:8px">' +
          '<input id="grpJoinCode" type="text" placeholder="Codice gruppo (es. 7K2P9)" style="flex:1;text-align:center;text-transform:uppercase;letter-spacing:0.1em;padding:12px 14px;border-radius:12px;background:var(--bg);border:1px solid var(--line);color:var(--ink);font-size:14px;font-family:var(--f-mono)" />' +
          '<button id="grpJoinBtn" style="padding:0 18px;border:1px solid var(--line);border-radius:12px;background:var(--bg-elev);color:var(--ink);font-weight:600;font-size:14px;cursor:pointer">Entra</button>' +
        '</div>' +

        '<div style="font-size:12px;color:var(--muted);margin-top:22px;display:flex;align-items:center;justify-content:center;gap:6px">🔒 Niente sconosciuti. Solo chi ha il codice entra nel gruppo.</div>' +
      '</div>';

    const cBtn = $('grpCreateBtn');
    if (cBtn) cBtn.addEventListener('click', function () {
      const name = ($('grpNewName').value || '').trim();
      if (!name) { toast('Scrivi un nome per il gruppo'); return; }
      doCreate(name);
    });
    const jBtn = $('grpJoinBtn');
    if (jBtn) jBtn.addEventListener('click', function () {
      const code = ($('grpJoinCode').value || '').trim();
      if (!code) { toast('Inserisci un codice'); return; }
      doJoin(code);
    });
  }

  // ── VISTA GRUPPO (selettore + codice + segnaposto match) ──
  async function renderGroupView(root) {
    if (!state.activeId) state.activeId = state.groups[0].id;
    const active = state.groups.find(function (g) { return g.id === state.activeId; }) || state.groups[0];

    let code = '—', memberCount = 1;
    try {
      const snap = await window.FB.db.collection('groups').doc(active.id).get();
      if (snap.exists) { code = snap.data().inviteCode || '—'; memberCount = snap.data().memberCount || 1; }
    } catch (e) { console.error(e); }

    const options = state.groups.map(function (g) {
      return '<option value="' + esc(g.id) + '"' + (g.id === state.activeId ? ' selected' : '') + '>' + esc(g.name || 'Gruppo') + '</option>';
    }).join('');

    root.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:18px">' +
        '<select id="grpSel" style="padding:10px 14px;border-radius:12px;background:var(--bg-elev);border:1px solid var(--line);color:var(--ink);font-size:14px;font-weight:600;font-family:var(--f-body)">' + options + '</select>' +
        '<button id="grpAddBtn" style="padding:9px 14px;border:1px solid var(--line);border-radius:99px;background:var(--bg-elev);color:var(--ink-2);font-size:13px;cursor:pointer">+ Nuovo gruppo</button>' +
      '</div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:14px 18px;border-radius:14px;background:var(--bg-elev);border:1px solid var(--line);margin-bottom:18px">' +
        '<div><div style="font-size:12px;color:var(--muted);font-family:var(--f-mono);text-transform:uppercase;letter-spacing:0.08em">Codice del gruppo · ' + memberCount + ' membri</div>' +
        '<div style="font-family:var(--f-mono);font-size:24px;font-weight:700;letter-spacing:0.12em;margin-top:4px">' + esc(code) + '</div></div>' +
        '<button id="grpCopyCode" style="padding:9px 16px;border:0;border-radius:99px;background:var(--accent);color:var(--accent-ink,#0d1b2a);font-weight:600;font-size:13px;cursor:pointer">Copia e invita</button>' +
      '</div>' +
      '<div id="proposalsBox" style="margin-bottom:18px"></div>' +
      '<div id="matchArea"><div style="padding:30px;text-align:center;color:var(--muted);font-size:13px">Calcolo scambi…</div></div>';

    const sel = $('grpSel');
    if (sel) sel.addEventListener('change', function () { state.activeId = sel.value; renderGroupView(root); });
    const add = $('grpAddBtn');
    if (add) add.addEventListener('click', function () { renderNoGroup(root); });
    const copy = $('grpCopyCode');
    if (copy) copy.addEventListener('click', function () {
      if (navigator.clipboard) navigator.clipboard.writeText(code).then(function () { toast('Codice copiato'); }).catch(function () {});
    });

    renderProposals(root);
  }

  function albumName(id) {
    return (window.ALBUM_BY_ID && window.ALBUM_BY_ID[id] && window.ALBUM_BY_ID[id].title) ? window.ALBUM_BY_ID[id].title : id;
  }
  function chips(arr, max) {
    max = max || 12;
    return arr.slice(0, max).map(function (c) { return '<span style="font-family:var(--f-mono);font-size:12px;background:var(--bg);padding:2px 7px;border-radius:6px;margin:0 4px 4px 0;display:inline-block">' + esc(c) + '</span>'; }).join('') + (arr.length > max ? ' <span style="font-size:12px;color:var(--muted)">+' + (arr.length - max) + '</span>' : '');
  }
  function closeOverlay() { var o = $('fbOverlay'); if (o) o.remove(); }
  function openOverlay(title, bodyHtml) {
    closeOverlay();
    var w = document.createElement('div');
    w.id = 'fbOverlay';
    w.style.cssText = 'position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.55)';
    w.innerHTML = '<div style="background:var(--bg-elev);border:1px solid var(--line);border-radius:16px;max-width:580px;width:100%;max-height:85vh;overflow:auto">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 20px;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--bg-elev)">' +
      '<div style="font-family:var(--f-display);font-weight:700;font-size:17px">' + esc(title) + '</div>' +
      '<button id="fbOverlayClose" style="width:32px;height:32px;border-radius:99px;border:1px solid var(--line);background:var(--bg);color:var(--ink);cursor:pointer">✕</button></div>' +
      '<div style="padding:20px">' + bodyHtml + '</div></div>';
    document.body.appendChild(w);
    w.addEventListener('click', function (e) { if (e.target === w) closeOverlay(); });
    var c = $('fbOverlayClose'); if (c) c.addEventListener('click', closeOverlay);
  }
  function openAlbumsPopup(uid) {
    var t = (state.trades || []).find(function (x) { return x.uid === uid; });
    if (!t) return;
    var body = t.perAlbum.map(function (a) {
      return '<div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--line)">' +
        '<div style="font-family:var(--f-mono);font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:10px">' + esc(albumName(a.albumId)) + '</div>' +
        '<div style="display:flex;gap:20px;flex-wrap:wrap">' +
          '<div style="flex:1 1 200px"><div style="font-size:13px;color:var(--good);margin-bottom:6px">↙ Ha <b>' + a.receive.length + '</b> carte che ti mancano</div>' + chips(a.receive) + '</div>' +
          '<div style="flex:1 1 200px"><div style="font-size:13px;color:var(--warn);margin-bottom:6px">↗ Hai <b>' + a.give.length + '</b> carte che gli servono</div>' + chips(a.give) + '</div>' +
        '</div></div>';
    }).join('');
    openOverlay((t.displayName || 'Collezionista') + ' · album in comune', body);
  }

  function openProposeOverlay(uid) {
    var t = (state.trades || []).find(function (x) { return x.uid === uid; });
    if (!t || !t.perAlbum.length) { toast('Nessuna carta da scambiare con questo utente.'); return; }
    state.prop = { uid: uid, displayName: t.displayName, albumIdx: 0, sel: {} };
    // sel: { albumId: { receive:{code:true}, give:{code:true} } }
    t.perAlbum.forEach(function (a) { state.prop.sel[a.albumId] = { receive: {}, give: {} }; });
    renderProposeOverlay();
  }

  function renderProposeOverlay() {
    var t = (state.trades || []).find(function (x) { return x.uid === state.prop.uid; });
    if (!t) return;
    var a = t.perAlbum[state.prop.albumIdx];
    var sel = state.prop.sel[a.albumId];

    // selettore album (se più di uno)
    var albumSel = t.perAlbum.length > 1
      ? '<select id="propAlbum" style="width:100%;margin-bottom:14px;padding:10px 12px;border-radius:10px;background:var(--bg);border:1px solid var(--line);color:var(--ink);font-size:14px">' +
        t.perAlbum.map(function (p, i) { return '<option value="' + i + '"' + (i === state.prop.albumIdx ? ' selected' : '') + '>' + esc(albumName(p.albumId)) + '</option>'; }).join('') + '</select>'
      : '<div style="font-family:var(--f-mono);font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:14px">' + esc(albumName(a.albumId)) + '</div>';

    function col(side, arr, title, color) {
      var items = arr.map(function (c) {
        var on = !!sel[side][c];
        return '<label class="prop-item" data-side="' + side + '" data-code="' + esc(c) + '" style="display:flex;align-items:center;gap:8px;padding:8px;border-radius:8px;cursor:pointer;margin-bottom:4px;background:' + (on ? 'color-mix(in srgb,var(--good) 16%,var(--bg))' : 'var(--bg)') + '">' +
          '<input type="checkbox"' + (on ? ' checked' : '') + ' style="width:auto" />' +
          '<span style="font-family:var(--f-mono);font-size:13px;font-weight:600">' + esc(c) + '</span></label>';
      }).join('');
      return '<div style="flex:1 1 220px"><div style="font-size:13px;color:' + color + ';margin-bottom:8px;font-weight:600">' + title + '</div>' + (items || '<div style="font-size:12px;color:var(--muted)">Niente qui</div>') + '</div>';
    }

    var nRec = Object.keys(sel.receive).length;
    var nGive = Object.keys(sel.give).length;
    var balance = nRec === nGive ? '<span style="color:var(--good)">⚖ scambio pari</span>' : '<span style="color:var(--warn)">⚠ stai dando ' + (nGive - nRec > 0 ? (nGive - nRec) + ' in più' : (nRec - nGive) + ' in meno') + '</span>';

    var body =
      albumSel +
      '<div style="display:flex;gap:20px;flex-wrap:wrap">' +
        col('receive', a.receive, '↙ Prendi da ' + esc(t.displayName || 'lui') + ' (sue doppie che ti mancano)', 'var(--good)') +
        '<div style="flex:1 1 220px"><div style="font-size:12px;color:var(--warn);background:color-mix(in srgb,var(--warn) 12%,var(--bg));padding:8px 10px;border-radius:8px;margin-bottom:8px">💡 Queste servono a ' + esc(t.displayName || 'lui') + ' per ' + esc(albumName(a.albumId)) + '. Scegli quali dare.</div>' +
        col('give', a.give, '↗ Dai a ' + esc(t.displayName || 'lui'), 'var(--warn)').replace('<div style="flex:1 1 220px">', '<div>') + '</div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:18px;padding-top:16px;border-top:1px solid var(--line)">' +
        '<div style="font-size:14px">Ricevi <b>' + nRec + '</b> · Dai <b>' + nGive + '</b> · ' + balance + '</div>' +
        '<button id="propSend" style="padding:10px 18px;border:0;border-radius:99px;background:var(--accent);color:var(--accent-ink,#0d1b2a);font-weight:600;font-size:14px;cursor:pointer">Invia proposta</button>' +
      '</div>';

    openOverlay('Proponi scambio a ' + (t.displayName || 'Collezionista'), body);

    var asel = $('propAlbum');
    if (asel) asel.addEventListener('change', function () { state.prop.albumIdx = parseInt(asel.value, 10); renderProposeOverlay(); });
    document.querySelectorAll('.prop-item').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var side = el.dataset.side, code = el.dataset.code;
        if (sel[side][code]) delete sel[side][code]; else sel[side][code] = true;
        renderProposeOverlay();
      });
    });
    var send = $('propSend');
    if (send) send.addEventListener('click', doSendProposal);
  }

  async function doSendProposal() {
    var t = (state.trades || []).find(function (x) { return x.uid === state.prop.uid; });
    var a = t.perAlbum[state.prop.albumIdx];
    var sel = state.prop.sel[a.albumId];
    var receive = Object.keys(sel.receive);
    var give = Object.keys(sel.give);
    if (!receive.length && !give.length) { toast('Seleziona almeno una carta'); return; }
    try {
      await window.DB.createProposal(state.prop.uid, state.activeId, a.albumId, give, receive);
      closeOverlay();
      toast('Proposta inviata');
    } catch (e) { console.error(e); toast('Proposta non inviata. Controlla la connessione e riprova.'); }
  }

  async function openReviseOverlay(proposalId, otherUid, albumId, give, receive) {
    var pool = { receive: (receive || []).slice(), give: (give || []).slice() };
    try {
      var trades = await window.DB.getPossibleTrades(state.activeId);
      var t = trades.find(function (x) { return x.uid === otherUid; });
      if (t) {
        var a = t.perAlbum.find(function (p) { return p.albumId === albumId; });
        if (a) {
          // dal punto di vista di chi guarda: ricevo le sue doppie (a.receive), do le mie (a.give)
          var rset = {}; a.receive.forEach(function (c) { rset[c] = 1; }); (receive || []).forEach(function (c) { rset[c] = 1; });
          var gset = {}; a.give.forEach(function (c) { gset[c] = 1; }); (give || []).forEach(function (c) { gset[c] = 1; });
          pool.receive = Object.keys(rset);
          pool.give = Object.keys(gset);
        }
      }
    } catch (e) { console.error(e); }
    state.revise = { proposalId: proposalId, albumId: albumId, sel: { receive: {}, give: {} }, pool: pool };
    (receive || []).forEach(function (c) { state.revise.sel.receive[c] = true; });
    (give || []).forEach(function (c) { state.revise.sel.give[c] = true; });
    renderReviseOverlay(otherUid);
  }

  function renderReviseOverlay(otherUid) {
    var r = state.revise;
    function col(side, arr, title, color) {
      var items = arr.map(function (c) {
        var on = !!r.sel[side][c];
        return '<label class="rev-item" data-side="' + side + '" data-code="' + esc(c) + '" style="display:flex;align-items:center;gap:8px;padding:8px;border-radius:8px;cursor:pointer;margin-bottom:4px;background:' + (on ? 'color-mix(in srgb,var(--good) 16%,var(--bg))' : 'var(--bg)') + '">' +
          '<input type="checkbox"' + (on ? ' checked' : '') + ' style="width:auto" />' +
          '<span style="font-family:var(--f-mono);font-size:13px;font-weight:600">' + esc(c) + '</span></label>';
      }).join('');
      return '<div style="flex:1 1 220px"><div style="font-size:13px;color:' + color + ';margin-bottom:8px;font-weight:600">' + title + '</div>' + (items || '<div style="font-size:12px;color:var(--muted)">Niente qui</div>') + '</div>';
    }
    var nRec = Object.keys(r.sel.receive).length;
    var nGive = Object.keys(r.sel.give).length;
    var balance = nRec === nGive ? '<span style="color:var(--good)">⚖ scambio pari</span>' : '<span style="color:var(--warn)">⚠ ' + (nGive > nRec ? 'dai ' + (nGive - nRec) + ' in più' : 'ricevi ' + (nRec - nGive) + ' in più') + '</span>';
    var body =
      '<div style="font-family:var(--f-mono);font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:14px">' + esc(albumName(r.albumId)) + '</div>' +
      '<div style="display:flex;gap:20px;flex-wrap:wrap">' +
        col('receive', r.pool.receive, '↙ Ricevi', 'var(--good)') +
        col('give', r.pool.give, '↗ Dai', 'var(--warn)') +
      '</div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:18px;padding-top:16px;border-top:1px solid var(--line)">' +
        '<div style="font-size:14px">Ricevi <b>' + nRec + '</b> · Dai <b>' + nGive + '</b> · ' + balance + '</div>' +
        '<button id="revSend" style="padding:10px 18px;border:0;border-radius:99px;background:var(--accent);color:var(--accent-ink,#0d1b2a);font-weight:600;font-size:14px;cursor:pointer">Rimanda proposta</button>' +
      '</div>';
    openOverlay('Modifica e rimanda', body);
    document.querySelectorAll('.rev-item').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var side = el.dataset.side, code = el.dataset.code;
        if (r.sel[side][code]) delete r.sel[side][code]; else r.sel[side][code] = true;
        renderReviseOverlay(otherUid);
      });
    });
    var send = $('revSend');
    if (send) send.addEventListener('click', async function () {
      var give = Object.keys(r.sel.give);
      var receive = Object.keys(r.sel.receive);
      if (!give.length && !receive.length) { toast('Seleziona almeno una carta'); return; }
      try { await window.DB.reviseProposal(r.proposalId, give, receive); closeOverlay(); toast('Proposta rimandata'); reload(); }
      catch (e) { console.error(e); toast('Proposta non rimandata. Riprova.'); }
    });
  }

  async function renderProposals(root) {
    var box = $('proposalsBox');
    if (box) box.innerHTML = '';
    try {
      state.proposalsCache = await window.DB.getMyProposals();
    } catch (e) { console.error(e); state.proposalsCache = []; }
    try {
      var inv = await window.DB.getMyInventory(state.activeId);
      state.myInvAlbums = (inv && inv.albums) || {};
    } catch (e) { state.myInvAlbums = {}; }
    // ridisegna i match ora che ho proposte+inventario
    renderMatches(state.activeId);
    maybePromptFeedback();
  }

  function ownedSet(albumId) {
    var a = (state.myInvAlbums || {})[albumId];
    var s = {};
    if (a && a.owned) a.owned.forEach(function (c) { s[c] = 1; });
    return s;
  }

  function starsHtml(avg, count) {
    if (!count) return '<span style="font-size:11px;color:var(--muted)">nessuna recensione</span>';
    var full = Math.round(avg), s = '';
    for (var i = 1; i <= 5; i++) s += '<span style="color:' + (i <= full ? 'var(--warn)' : 'var(--line)') + '">★</span>';
    return '<span style="font-size:13px;letter-spacing:1px">' + s + '</span> <span style="font-size:12px;color:var(--muted)">' + avg.toFixed(1) + ' (' + count + ')</span>';
  }

  async function renderMatches(groupId) {
    const ma = $('matchArea');
    if (!ma) return;
    let trades = [];
    try { trades = await window.DB.getPossibleTrades(groupId); }
    catch (e) { console.error(e); ma.innerHTML = '<div style="padding:30px;text-align:center;color:var(--muted)">Non riusciamo a calcolare gli scambi. Ricarica la pagina.</div>'; return; }
    state.trades = trades;

    var ratings = {};
    await Promise.all(trades.map(async function (t) {
      try { ratings[t.uid] = await window.DB.getFeedback(t.uid); } catch (e) {}
    }));

    var uid = window.FB.auth.currentUser.uid;
    var props = (state.proposalsCache || []).filter(function (p) {
      return p.groupId === groupId && p.status !== 'rejected' && p.status !== 'completed' && p.status !== 'cancelled';
    });
    function propsWith(otherUid) {
      return props.filter(function (p) { return p.fromUid === otherUid || p.toUid === otherUid; });
    }

    if (!trades.length && !props.length) {
      ma.innerHTML = '<div style="padding:40px 24px;text-align:center;color:var(--muted)"><div style="font-size:30px;margin-bottom:8px">🔄</div><div style="font-size:15px;font-weight:600;color:var(--ink);margin-bottom:6px">Ancora nessuno scambio possibile</div><div style="font-size:13px;max-width:380px;margin:0 auto">Invita i tuoi amici col codice qui sopra. Appena segnano le loro doppie, gli scambi reciproci appaiono qui.</div></div>';
      return;
    }

    const cards = trades.map(function (t) {
      const initial = (t.displayName || '?').trim().charAt(0).toUpperCase();
      var myProps = propsWith(t.uid);
      var badge = '';
      if (myProps.length) {
        var inc = myProps.filter(function (p) { return p.toUid === uid; }).length;
        var out = myProps.length - inc;
        var rows = '';
        if (inc) rows += '<div style="font-size:12px;color:var(--accent);margin-bottom:6px">🔔 ' + inc + (inc === 1 ? ' proposta arrivata' : ' proposte arrivate') + '</div>';
        if (out) rows += '<div style="font-size:12px;color:var(--muted);margin-bottom:6px">↗ ' + out + (out === 1 ? ' proposta inviata' : ' proposte inviate') + '</div>';
        var btns = '';
        if (inc) btns += '<button class="js-viewprops" data-uid="' + esc(t.uid) + '" data-dir="in" style="width:100%;margin-bottom:8px;padding:9px;border:1px solid var(--accent);border-radius:10px;background:transparent;color:var(--accent);font-size:13px;font-weight:600;cursor:pointer">Visualizza ' + (inc === 1 ? 'proposta arrivata' : 'proposte arrivate') + '</button>';
        if (out) btns += '<button class="js-viewprops" data-uid="' + esc(t.uid) + '" data-dir="out" style="width:100%;padding:9px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink);font-size:13px;font-weight:600;cursor:pointer">Visualizza ' + (out === 1 ? 'proposta inviata' : 'proposte inviate') + '</button>';
        badge =
          '<div style="display:flex;align-items:center;gap:8px;margin:14px 0 10px"><span style="flex:1;height:1px;background:var(--line)"></span><span style="font-size:10px;font-family:var(--f-mono);text-transform:uppercase;letter-spacing:.08em;color:var(--muted)">Proposte</span><span style="flex:1;height:1px;background:var(--line)"></span></div>' +
          rows + btns;
      }
      return '<div style="background:var(--bg-elev);border:1px solid var(--line);border-radius:14px;padding:16px">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">' +
          '<div style="width:40px;height:40px;border-radius:99px;background:linear-gradient(135deg,var(--accent),#7a5ae0);display:grid;place-items:center;color:#fff;font-weight:700;flex-shrink:0">' + esc(initial) + '</div>' +
          '<div style="min-width:0"><div style="font-weight:600;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(t.displayName || 'Collezionista') + '</div>' +
          '<div style="margin:2px 0">' + starsHtml((ratings[t.uid] || {}).avg || 0, (ratings[t.uid] || {}).count || 0) + '</div>' +
          '<div style="font-size:12px;color:var(--muted)"><span style="color:var(--good)">↙ ' + t.totReceive + '</span> · <span style="color:var(--warn)">↗ ' + t.totGive + '</span></div></div>' +
        '</div>' +
        '<button class="js-albums" data-uid="' + esc(t.uid) + '" style="width:100%;margin-bottom:8px;padding:9px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink);font-size:13px;font-weight:600;cursor:pointer">' + t.perAlbum.length + ' album in comune</button>' +
        '<button class="js-propose" data-uid="' + esc(t.uid) + '" style="width:100%;padding:9px;border:0;border-radius:10px;background:var(--accent);color:var(--accent-ink,#0d1b2a);font-size:13px;font-weight:600;cursor:pointer">Proponi scambio</button>' +
        badge +
      '</div>';
    }).join('');

    ma.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px">' + cards + '</div>';

    document.querySelectorAll('.js-albums').forEach(function (b) {
      b.addEventListener('click', function () { openAlbumsPopup(b.dataset.uid); });
    });
    document.querySelectorAll('.js-propose').forEach(function (b) {
      b.addEventListener('click', function () { openProposeOverlay(b.dataset.uid); });
    });
    document.querySelectorAll('.js-viewprops').forEach(function (b) {
      b.addEventListener('click', function () { openProposalsOverlay(b.dataset.uid, b.dataset.dir); });
    });
  }

  function openProposalsOverlay(otherUid, dir) {
    var uid = window.FB.auth.currentUser.uid;
    var props = (state.proposalsCache || []).filter(function (p) {
      var ok = p.groupId === state.activeId && p.status !== 'rejected' && p.status !== 'completed' && p.status !== 'cancelled' && (p.fromUid === otherUid || p.toUid === otherUid);
      if (dir === 'in') ok = ok && p.toUid === uid;
      if (dir === 'out') ok = ok && p.fromUid === uid;
      return ok;
    });
    if (!props.length) { toast('Nessuna proposta con questo utente.'); return; }
    var owned = {};

    var body = props.map(function (p) {
      var incoming = p.toUid === uid;
      var iGet = incoming ? p.give : p.receive;
      var iGive = incoming ? p.receive : p.give;
      var oset = ownedSet(p.albumId);
      function chipsFound(arr) {
        return arr.map(function (c) {
          var found = !!oset[c];
          return '<span style="font-family:var(--f-mono);font-size:12px;background:' + (found ? 'color-mix(in srgb,var(--warn) 18%,var(--bg))' : 'var(--bg)') + ';color:' + (found ? 'var(--warn)' : 'var(--ink)') + ';padding:2px 7px;border-radius:6px;margin:0 4px 4px 0;display:inline-block">' + esc(c) + (found ? ' ⚠' : '') + '</span>';
        }).join('');
      }
      var foundList = iGet.filter(function (c) { return oset[c]; });
      var warn = foundList.length ? '<div style="font-size:12px;color:var(--warn);margin-top:6px">⚠ ' + (foundList.length === 1 ? 'La ' + foundList[0] + ' l\'hai già trovata — chiedine un\'altra' : 'Alcune carte (' + foundList.join(', ') + ') le hai già trovate — chiedine altre') + '</div>' : '';
      var statusLbl = p.status === 'accepted' ? 'In attesa di conferma' : (incoming ? 'Da rispondere' : 'In attesa di risposta');

      var actions = '';
      if (incoming && p.status === 'pending') {
        actions =
          '<button class="ov-accept" data-id="' + esc(p.id) + '" style="flex:1;padding:8px;border:0;border-radius:99px;background:var(--good);color:#fff;font-weight:600;font-size:13px;cursor:pointer">Accetta</button>' +
          '<button class="ov-revise" data-id="' + esc(p.id) + '" data-uid="' + esc(otherUid) + '" style="flex:1;padding:8px;border:1px solid var(--line);border-radius:99px;background:var(--bg);color:var(--ink);font-weight:600;font-size:13px;cursor:pointer">Modifica</button>' +
          '<button class="ov-reject" data-id="' + esc(p.id) + '" style="flex:1;padding:8px;border:1px solid var(--line);border-radius:99px;background:var(--bg);color:var(--warn);font-weight:600;font-size:13px;cursor:pointer">Rifiuta</button>';
      } else if (!incoming && p.status === 'pending') {
        actions =
          '<button class="ov-revise" data-id="' + esc(p.id) + '" data-uid="' + esc(otherUid) + '" style="flex:1;padding:8px;border:1px solid var(--line);border-radius:99px;background:var(--bg);color:var(--ink);font-weight:600;font-size:13px;cursor:pointer">Modifica</button>' +
          '<button class="ov-cancel" data-id="' + esc(p.id) + '" style="flex:1;padding:8px;border:1px solid var(--line);border-radius:99px;background:var(--bg);color:var(--warn);font-weight:600;font-size:13px;cursor:pointer">Annulla proposta</button>';
      } else if (p.status === 'accepted') {
        var iConfirmed = (p.confirmedBy || []).indexOf(uid) >= 0;
        actions = iConfirmed ? '<span style="font-size:13px;color:var(--muted)">In attesa dell\'altro</span>' : '<button class="ov-accept" data-id="' + esc(p.id) + '" style="flex:1;padding:8px;border:0;border-radius:99px;background:var(--good);color:#fff;font-weight:600;font-size:13px;cursor:pointer">Conferma scambio</button>';
      }

      return '<div style="border:1px solid var(--line);border-radius:12px;padding:14px;margin-bottom:12px">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px"><div style="font-size:13px;font-weight:600">' + esc(albumName(p.albumId)) + '</div><div style="font-family:var(--f-mono);font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)">' + statusLbl + '</div></div>' +
        '<div style="margin-bottom:8px"><div style="font-size:12px;color:var(--good);margin-bottom:4px">Ricevi ' + iGet.length + '</div>' + chipsFound(iGet) + warn + '</div>' +
        '<div style="margin-bottom:' + (actions ? '12px' : '0') + '"><div style="font-size:12px;color:var(--warn);margin-bottom:4px">Dai ' + iGive.length + '</div>' + chipsFound(iGive).replace(/var\(--warn\)/g, 'var(--ink)') + '</div>' +
        (actions ? '<div style="display:flex;gap:6px">' + actions + '</div>' : '') +
      '</div>';
    }).join('');

    openOverlay('Proposte', body);

    document.querySelectorAll('.ov-accept').forEach(function (b) {
      b.addEventListener('click', async function () {
        try { var r = await window.DB.acceptProposal(b.dataset.id); closeOverlay(); toast(r.completed ? 'Scambio completato!' : 'Accettato'); if (r.completed) { await openFeedbackOverlay(b.dataset.id, otherUid, nameForUid(otherUid)); } reload(); }
        catch (e) { console.error(e); toast('Non riusciamo ad accettare la proposta. Riprova.'); }
      });
    });
    document.querySelectorAll('.ov-reject').forEach(function (b) {
      b.addEventListener('click', async function () {
        try { await window.DB.rejectProposal(b.dataset.id); closeOverlay(); toast('Rifiutata'); reload(); }
        catch (e) { console.error(e); toast('Non riusciamo a rifiutare la proposta. Riprova.'); }
      });
    });
    document.querySelectorAll('.ov-revise').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = (state.proposalsCache || []).find(function (x) { return x.id === b.dataset.id; });
        if (!p) return;
        var u = window.FB.auth.currentUser.uid;
        var iGet = p.toUid === u ? p.give : p.receive;
        var iGive = p.toUid === u ? p.receive : p.give;
        closeOverlay();
        openReviseOverlay(p.id, b.dataset.uid, p.albumId, iGive, iGet);
      });
    });
    document.querySelectorAll('.ov-cancel').forEach(function (b) {
      b.addEventListener('click', async function () {
        try { await window.DB.cancelProposal(b.dataset.id); closeOverlay(); toast('Proposta annullata'); reload(); }
        catch (e) { console.error(e); toast('Non riusciamo ad annullare la proposta. Riprova.'); }
      });
    });
  }

  async function doCreate(name) {
    if (state.busy) return; state.busy = true;
    try {
      const res = await window.DB.createGroup(name);
      await syncAllAlbums();
      toast('Gruppo creato');
      state.activeId = res.groupId;
      await reload();
    } catch (e) { console.error(e); toast('Gruppo non creato. Riprova.'); }
    state.busy = false;
  }

  async function doJoin(code) {
    if (state.busy) return; state.busy = true;
    try {
      const res = await window.DB.joinGroup(code);
      await syncAllAlbums();
      toast(res.already ? 'Sei già in questo gruppo' : 'Sei entrato nel gruppo');
      state.activeId = res.groupId;
      await reload();
    } catch (e) { console.error(e); toast('Codice non valido'); }
    state.busy = false;
  }

  async function reload() {
    const root = $('scambiaRoot');
    if (!root) return;
    state.groups = await window.DB.myGroups();
    if (!state.groups.length) { renderNoGroup(root); return; }
    if (!state.activeId || !state.groups.find(function (g) { return g.id === state.activeId; })) {
      state.activeId = state.groups[0].id;
    }
    renderGroupView(root);
  }

  var FB_REVIEWED = (window.__fbReviewPrompted = window.__fbReviewPrompted || {});

  function nameForUid(uid) {
    var t = (state.trades || []).find(function (x) { return x.uid === uid; });
    return (t && t.displayName) || 'Collezionista';
  }

  async function openFeedbackOverlay(proposalId, ratedUid, ratedName) {
    FB_REVIEWED[proposalId] = true;
    if (!ratedName || ratedName === 'Collezionista') { try { var pp = await window.DB.getPublicProfile(ratedUid); if (pp && pp.displayName) ratedName = pp.displayName; } catch (e) {} }
    var rating = 5;
    var stars = '';
    for (var i = 1; i <= 5; i++) {
      stars += '<button class="fb-star" data-v="' + i + '" style="background:none;border:0;cursor:pointer;font-size:30px;line-height:1;color:var(--warn);padding:0">★</button>';
    }
    var body =
      '<div style="font-size:14px;color:var(--muted);margin-bottom:14px">Com\'è andato lo scambio con <b style="color:var(--ink)">' + esc(ratedName) + '</b>?</div>' +
      '<div id="fbStars" style="display:flex;gap:6px;margin-bottom:16px">' + stars + '</div>' +
      '<textarea id="fbComment" placeholder="Commento (opzionale)" style="width:100%;min-height:70px;box-sizing:border-box;background:var(--bg);border:1px solid var(--line);border-radius:10px;color:var(--ink);padding:10px;font-family:inherit;font-size:13px;resize:vertical;margin-bottom:14px"></textarea>' +
      '<button id="fbSubmit" data-id="' + esc(proposalId) + '" data-uid="' + esc(ratedUid) + '" style="width:100%;padding:11px;border:0;border-radius:99px;background:var(--good);color:#fff;font-weight:700;font-size:14px;cursor:pointer">Invia recensione</button>';
    openOverlay('Lascia una recensione', body);

    function paint() {
      var btns = document.querySelectorAll('#fbStars .fb-star');
      for (var j = 0; j < btns.length; j++) {
        btns[j].style.color = (j < rating) ? 'var(--warn)' : 'var(--line)';
      }
    }
    var sbtns = document.querySelectorAll('#fbStars .fb-star');
    for (var s = 0; s < sbtns.length; s++) {
      sbtns[s].addEventListener('click', function () { rating = parseInt(this.dataset.v, 10); paint(); });
    }
    paint();

    var sub = $('fbSubmit');
    if (sub) sub.addEventListener('click', async function () {
      var btn = this; btn.disabled = true; btn.textContent = 'Invio…';
      try {
        await window.DB.leaveFeedback(btn.dataset.id, btn.dataset.uid, rating, ($('fbComment').value || '').trim());
        closeOverlay(); toast('Recensione inviata!');
      } catch (e) { console.error(e); btn.disabled = false; btn.textContent = 'Invia recensione'; toast('Recensione non inviata. Controlla la connessione e riprova.'); }
    });
  }

  async function maybePromptFeedback() {
    var uid = window.FB.auth.currentUser && window.FB.auth.currentUser.uid;
    if (!uid) return;
    var done = (state.proposalsCache || []).filter(function (p) {
      return p.status === 'completed' && !FB_REVIEWED[p.id];
    });
    for (var k = 0; k < done.length; k++) {
      var p = done[k];
      var other = (p.participants || []).find(function (x) { return x !== uid; }) || (p.fromUid === uid ? p.toUid : p.fromUid);
      if (!other) continue;
      try {
        var snap = await window.FB.db.collection('users').doc(other).collection('feedback').doc(p.id + '__' + uid).get();
        if (snap.exists) { FB_REVIEWED[p.id] = true; continue; }
      } catch (e) { continue; }
      openFeedbackOverlay(p.id, other, nameForUid(other));
      return;
    }
  }

  window.FB.onReady(function () {
    setAvatar();
    reload();
  });

})();
