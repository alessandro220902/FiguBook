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

    // dati del gruppo (codice, n. membri)
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

      '<div id="matchArea"></div>';

    // segnaposto match (7b lo riempirà con getPossibleTrades)
    const ma = $('matchArea');
    if (ma) ma.innerHTML =
      '<div style="padding:40px 24px;text-align:center;color:var(--muted)">' +
        '<div style="font-size:30px;margin-bottom:8px">🔄</div>' +
        '<div style="font-size:15px;font-weight:600;color:var(--ink);margin-bottom:6px">Gli scambi possibili appariranno qui</div>' +
        '<div style="font-size:13px;max-width:380px;margin:0 auto">Invita i tuoi amici col codice qui sopra. Appena segnano le loro doppie, l\'app vi calcola gli scambi reciproci.</div>' +
      '</div>';

    const sel = $('grpSel');
    if (sel) sel.addEventListener('change', function () { state.activeId = sel.value; renderGroupView(root); });
    const add = $('grpAddBtn');
    if (add) add.addEventListener('click', function () { renderNoGroup(root); });
    const copy = $('grpCopyCode');
    if (copy) copy.addEventListener('click', function () {
      if (navigator.clipboard) navigator.clipboard.writeText(code).then(function () { toast('Codice copiato'); }).catch(function () {});
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
    } catch (e) { console.error(e); toast('Errore nella creazione'); }
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

  window.FB.onReady(function () {
    setAvatar();
    reload();
  });

})();
