// figubook-db.js — S3
// Espone window.DB. Dipende da window.FB (firebase-init.js già caricato).
// MAI localStorage. Solo Firestore.

// ── Catalogo album condiviso ───────────────────────────────────────────────
// Fonte unica di verità per nome, editore, pagina e file dati di ogni album.
// Usato da dashboard, lista album e catalogo. Esposto come window.ALBUM_CATALOG.
//
// `total` NON è un numero arbitrario: è il conteggio delle carte definite nel
// file dati corrispondente (album-data*.js), incluse tutte le speciali
// (UPD, C, U, STY, UPG, CEL, ecc.). I valori qui sotto sono stati CONTATI dai
// file dati in S3 (Object.keys(STICKER_STATES).length, che il file dati
// popola con ogni codice). Dove il file dati è caricato a runtime
// (pagine album singolo / mancanti) il totale viene ricalcolato live da
// _getAlbumTotal e ha la precedenza, così non resta mai disallineato.
const ALBUM_CATALOG = [
  { id:'calciatori-25-26', title:'Calciatori 2025/26',  editor:'Panini', season:'2025/26', total:784, href:'figubook-calciatori-2526.html', missingParam:'2526',    storageKey:'figubook-calciatori-2526-v1',     tags:['panini','2526'], c1:'#1b6fb8', c2:'#0a3d2e' },
  { id:'calciatori-24-25', title:'Calciatori 2024/25',  editor:'Panini', season:'2024/25', total:886, href:'figubook-calciatori-2425.html', missingParam:'2425',    storageKey:'figubook-calciatori-2425-v1',     tags:['panini','2425'], c1:'#f2c200', c2:'#1a1a1a' },
  { id:'calciatori-23-24', title:'Calciatori 2023/24',  editor:'Panini', season:'2023/24', total:816, href:'figubook-calciatori-2324.html', missingParam:'2324',    storageKey:'figubook-calciatori-2324-v1',     tags:['panini'], c1:'#1f7a4d', c2:'#c8d400' },
  { id:'calciatori-22-23', title:'Calciatori 2022/23',  editor:'Panini', season:'2022/23', total:739, href:'figubook-calciatori-2223.html', missingParam:'2223',    storageKey:'figubook-calciatori-2223-v1',     tags:['panini'], c1:'#2e8b57', c2:'#d4451f' },
  { id:'mondiali-2026',    title:'FIFA World Cup 2026',  editor:'Panini', season:'2026',    total:992, href:'figubook-fwc2026.html',        missingParam:'fwc2026', storageKey:'figubook-fwc2026-v1',             tags:['panini','2526'], c1:'#d4451f', c2:'#1b6fb8' },
  { id:'mondiali-2022',    title:'FIFA World Cup 2022',  editor:'Panini', season:'2022',    total:670, href:'figubook-fwc2022.html',        missingParam:'fwc2022', storageKey:'figubook-mondiali-2022-v1',       tags:['panini'], c1:'#7a1538', c2:'#c9a227' },
  { id:'calb-25-26',       title:'Calciatori Serie B 2025/26', editor:'Panini', season:'2025/26', total:440, href:'figubook-serieb-2526.html', missingParam:'serieb', storageKey:'figubook-serieb-2526-v1',         tags:['panini','2526'], c1:'#1f8a4d', c2:'#4a5560' },
  { id:'adrenalyn-25-26',  title:'Adrenalyn XL 2025/26', editor:'Panini', season:'2025/26', total:728, href:'figubook-adrenalyn-2526.html', missingParam:'adrenalyn2526',  storageKey:'figubook-adrenalyn-2526-v1',      tags:['panini','2526'], c1:'#6db82e', c2:'#1a1a1a' },
  { id:'match-attax-ucl',  title:'Match Attax UCL 25/26',editor:'Topps',  season:'2025/26', total:584, href:'figubook-matchattax-2526.html',missingParam:'matchattax2526', storageKey:'figubook-matchattax-ucl-2526-v1', tags:['topps','2526'], c1:'#2a1b6c', c2:'#c0297a' },
];

// Mappa albumId → totale (derivata dal catalogo, nessun numero a mano sciolto).
const ALBUM_TOTALS = ALBUM_CATALOG.reduce(function (acc, a) {
  acc[a.id] = a.total;
  return acc;
}, {});

// Lookup veloce id → entry di catalogo.
const ALBUM_BY_ID = ALBUM_CATALOG.reduce(function (acc, a) {
  acc[a.id] = a;
  return acc;
}, {});

window.ALBUM_CATALOG = ALBUM_CATALOG;
window.ALBUM_BY_ID = ALBUM_BY_ID;

(function () {

  // ── Helpers interni ─────────────────────────────────────────────────────

  function _uid() {
    return window.FB.auth.currentUser.uid;
  }

  function _albumsCol() {
    return window.FB.db.collection('users').doc(_uid()).collection('albums');
  }

  function _metaCol() {
    return window.FB.db.collection('users').doc(_uid()).collection('meta');
  }

  // Calcola il totale carte di un album, incluse le speciali.
  // Priorità:
  //  1. Variabile dati LIVE: se il file dati dell'album corrente è caricato
  //     (pagine album singolo / mancanti), window.STICKER_STATES contiene una
  //     chiave per OGNI carta dell'album → è il conteggio reale e autorevole.
  //     Lo usiamo solo se corrisponde all'album richiesto (via FB_STORAGE_KEY).
  //  2. ALBUM_TOTALS (derivato dal catalogo, a sua volta contato dai file dati).
  //  3. Fallback provvisorio: numero di chiavi negli states salvati su Firestore
  //     (PROVVISORIO: sottostima finché l'utente non tocca tutte le carte).
  function _getAlbumTotal(albumId, states) {
    // 1. Variabile dati live, se siamo sulla pagina di QUESTO album.
    try {
      if (typeof FB_STORAGE_KEY !== 'undefined' &&
          window.STICKER_STATES &&
          ALBUM_BY_ID[albumId] &&
          ALBUM_BY_ID[albumId].storageKey === FB_STORAGE_KEY) {
        return Object.keys(window.STICKER_STATES).length;
      }
    } catch (e) { /* FB_STORAGE_KEY non definita su questa pagina: ok */ }

    // 2. Totale da catalogo.
    if (ALBUM_TOTALS[albumId] !== undefined) {
      return ALBUM_TOTALS[albumId];
    }

    // 3. Fallback provvisorio.
    return states ? Object.keys(states).length : 0;
  }

  // ── Utente ───────────────────────────────────────────────────────────────

  function getUserName() {
    const user = window.FB.auth.currentUser;
    if (!user) return '';
    if (user.displayName && user.displayName.trim()) {
      return user.displayName.trim();
    }
    return (user.email || '').split('@')[0];
  }

  function getUserInitial() {
    const name = getUserName();
    return name ? name.charAt(0).toUpperCase() : '';
  }

  // ── Lista album ─────────────────────────────────────────────────────────

  async function getMyAlbums() {
    const snap = await _albumsCol().doc('_my-albums').get();
    if (!snap.exists) return [];
    return snap.data().ids || [];
  }

  async function addAlbum(albumId) {
    const ref = _albumsCol().doc('_my-albums');
    const snap = await ref.get();
    const ids = snap.exists ? (snap.data().ids || []) : [];

    const hadAlbum = await getEverHadAlbum();

    if (!ids.includes(albumId)) {
      await ref.set({ ids: firebase.firestore.FieldValue.arrayUnion(albumId) }, { merge: true });
    }

    if (!hadAlbum) {
      await setEverHadAlbum();
    }
  }

  async function removeAlbum(albumId) {
    await _albumsCol().doc('_my-albums').set(
      { ids: firebase.firestore.FieldValue.arrayRemove(albumId) },
      { merge: true }
    );
    // Il documento dati dell'album NON viene cancellato: i dati restano
    // disponibili se l'utente riaggiunge l'album in futuro.
  }

  // ── Dati album singolo ───────────────────────────────────────────────────

  async function getAlbumData(albumId) {
    const snap = await _albumsCol().doc(albumId).get();
    if (!snap.exists) return { states: {}, counts: {} };
    const data = snap.data();
    return {
      states: data.states || {},
      counts: data.counts || {}
    };
  }

  // Pubblica owned/doubles dell'album nella bacheca di ogni gruppo dell'utente.
  // Interna: esposta come DB.syncInventory per il primo sync all'ingresso in un gruppo.
  async function _syncInventory(albumId) {
    try {
      const uid = _uid();
      const db = window.FB.db;
      // leggi i gruppi dell'utente
      const groupsSnap = await db.collection('users').doc(uid).collection('groups').get();
      if (groupsSnap.empty) return;
      // leggi lo stato dell'album
      const albSnap = await _albumsCol().doc(albumId).get();
      const data = albSnap.exists ? albSnap.data() : {};
      const states = data.states || {};
      const owned = [];
      const doubles = [];
      Object.keys(states).forEach(function (code) {
        const s = states[code];
        if (s === 'have' || s === 'double') owned.push(code);
        if (s === 'double') doubles.push(code);
      });
      const dn = getUserName();
      // scrivi la bacheca in ogni gruppo
      await Promise.all(groupsSnap.docs.map(function (g) {
        const invRef = db.collection('groups').doc(g.id).collection('inventory').doc(uid);
        return invRef.set({
          displayName: dn,
          updatedAt: Date.now(),
          albums: { [albumId]: { owned: owned, doubles: doubles } }
        }, { merge: true });
      }));
    } catch (e) {
      console.error('FiguBook: errore sync bacheca', e);
    }
  }

  async function saveCardState(albumId, code, state, count) {
    const ref = _albumsCol().doc(albumId);
    const update = {
      states: { [code]: state },
      ts: Date.now()
    };
    if (state === 'double') {
      update.counts = { [code]: count || 2 };
    } else {
      update.counts = { [code]: firebase.firestore.FieldValue.delete() };
    }
    await ref.set(update, { merge: true });
    await _syncInventory(albumId);
  }

  async function resetAlbum(albumId) {
    const ref = _albumsCol().doc(albumId);
    const snap = await ref.get();
    const existing = snap.exists ? snap.data() : {};
    await ref.set({
      states: {},
      counts: {},
      names: existing.names || {},
      v: existing.v || 1,
      ts: Date.now()
    });
    await _syncInventory(albumId);
  }

  // ── Statistiche ─────────────────────────────────────────────────────────

  async function getAlbumStats(albumId) {
    const { states, counts } = await getAlbumData(albumId);
    const total = _getAlbumTotal(albumId, states);

    let have    = 0;
    let doubles = 0;

    Object.keys(states).forEach(function (code) {
      const s = states[code];
      if (s === 'have' || s === 'double') {
        have++;
        if (s === 'double') {
          doubles += (counts[code] || 2) - 1;
        }
      }
    });

    const missing = total - have;
    const pct     = total > 0 ? Math.round(have / total * 100) : 0;

    return { have, doubles, missing, total, pct };
  }

  async function getAllStats() {
    const ids = await getMyAlbums();
    let totalHave    = 0;
    let totalDoubles = 0;
    let totalMissing = 0;

    await Promise.all(ids.map(async function (albumId) {
      const s = await getAlbumStats(albumId);
      totalHave    += s.have;
      totalDoubles += s.doubles;
      totalMissing += s.missing;
    }));

    return { totalHave, totalDoubles, totalMissing };
  }

  // ── Meta ─────────────────────────────────────────────────────────────────

  async function setEverHadAlbum() {
    await _metaCol().doc('firstAlbum').set({ everHadAlbum: true }, { merge: true });
  }

  async function getEverHadAlbum() {
    const snap = await _metaCol().doc('firstAlbum').get();
    if (!snap.exists) return false;
    return snap.data().everHadAlbum === true;
  }

  // ── Navbar: menu profilo condiviso ───────────────────────────────────────
  // Aggancia l'apertura/chiusura di #profileMenu al click su #avatarBtn.
  // Idempotente: non aggancia due volte sulla stessa pagina.
  function wireProfileMenu() {
    const avatar = document.getElementById('avatarBtn');
    const menu = document.getElementById('profileMenu');
    if (!avatar || !menu) return;
    if (avatar.dataset.menuWired === '1') return;
    avatar.dataset.menuWired = '1';

    avatar.addEventListener('click', function (e) {
      e.stopPropagation();
      menu.classList.toggle('open');
    });

    document.addEventListener('click', function (e) {
      if (avatar.contains(e.target) || menu.contains(e.target)) return;
      menu.classList.remove('open');
    });
  }

  async function getIncomingProposals() {
    try {
      const uid = _uid();
      const snap = await window.FB.db.collection('proposals').where('participants', 'array-contains', uid).get();
      return snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); })
        .filter(function (p) { return p.toUid === uid && p.status === 'pending'; });
    } catch (e) { console.error(e); return []; }
  }

  async function wireNotifications() {
    const btn = document.getElementById('notifBtn');
    const panel = document.getElementById('notifPanel');
    if (!btn || !panel) return;
    if (btn.dataset.wired) return; btn.dataset.wired = '1';

    btn.addEventListener('click', function (e) { e.stopPropagation(); panel.classList.toggle('open'); });
    document.addEventListener('click', function (e) { if (!panel.contains(e.target) && e.target !== btn) panel.classList.remove('open'); });

    let props = [];
    try { props = await getIncomingProposals(); } catch (e) {}

    // nomi dei mittenti dai profili pubblici
    const names = {};
    await Promise.all(props.map(async function (p) {
      if (names[p.fromUid]) return;
      try { const pr = await getPublicProfile(p.fromUid); names[p.fromUid] = pr.displayName || 'Un collezionista'; }
      catch (e) { names[p.fromUid] = 'Un collezionista'; }
    }));

    const dot = document.getElementById('notifDot');
    const head = '<div class="notif-head"><h4>Notifiche</h4></div>';
    if (!props.length) {
      panel.innerHTML = head + '<div class="notif-item"><div class="notif-ic">ℹ️</div><div class="notif-txt"><div class="nm">Nessuna notifica</div><div class="info">Le proposte di scambio appariranno qui</div></div></div>';
      if (dot) dot.style.display = 'none';
      return;
    }
    if (dot) dot.style.display = '';
    panel.innerHTML = head + props.map(function (p) {
      const nm = names[p.fromUid] || 'Un collezionista';
      const album = (window.ALBUM_BY_ID && window.ALBUM_BY_ID[p.albumId] && window.ALBUM_BY_ID[p.albumId].title) ? window.ALBUM_BY_ID[p.albumId].title : p.albumId;
      return '<a href="figubook-scambia.html" style="text-decoration:none;color:inherit"><div class="notif-item unread"><div class="notif-ic">🔄</div><div class="notif-txt"><div class="nm">1 proposta ricevuta da ' + (nm.replace(/[<>&]/g,'')) + '</div><div class="info">' + (String(album).replace(/[<>&]/g,'')) + ' · tocca per aprire</div></div></div></a>';
    }).join('');
  }

  // ── Gruppi di scambio ────────────────────────────────────────────────────

  // Genera un codice invito di 5 caratteri (helper interno, non esportato).
  function _genCode() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var s = '';
    for (var i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  async function createGroup(name) {
    const uid = _uid();
    const db = window.FB.db;
    const groupRef = db.collection('groups').doc();
    const groupId = groupRef.id;
    let code = _genCode();
    // garantisci codice unico
    let exists = await db.collection('inviteCodes').doc(code).get();
    while (exists.exists) { code = _genCode(); exists = await db.collection('inviteCodes').doc(code).get(); }
    const dn = getUserName();
    await groupRef.set({ name: name, inviteCode: code, createdBy: uid, createdAt: Date.now(), memberCount: 1, settings: { allowShipping: false } });
    await groupRef.collection('members').doc(uid).set({ displayName: dn, role: 'owner', joinedAt: Date.now() });
    await db.collection('inviteCodes').doc(code).set({ groupId: groupId });
    await db.collection('users').doc(uid).collection('groups').doc(groupId).set({ name: name, joinedAt: Date.now() });
    return { groupId: groupId, code: code };
  }

  async function joinGroup(code) {
    const uid = _uid();
    const db = window.FB.db;
    code = String(code || '').trim().toUpperCase();
    const codeSnap = await db.collection('inviteCodes').doc(code).get();
    if (!codeSnap.exists) throw new Error('Codice non valido');
    const groupId = codeSnap.data().groupId;
    const memberRef = db.collection('groups').doc(groupId).collection('members').doc(uid);
    const already = await memberRef.get();
    if (already.exists) return { groupId: groupId, already: true };
    const groupSnap = await db.collection('groups').doc(groupId).get();
    const gname = groupSnap.exists ? (groupSnap.data().name || 'Gruppo') : 'Gruppo';
    await memberRef.set({ displayName: getUserName(), role: 'member', joinedAt: Date.now() });
    await db.collection('groups').doc(groupId).update({ memberCount: firebase.firestore.FieldValue.increment(1) });
    await db.collection('users').doc(uid).collection('groups').doc(groupId).set({ name: gname, joinedAt: Date.now() });
    return { groupId: groupId, already: false };
  }

  async function leaveGroup(groupId) {
    const uid = _uid();
    const db = window.FB.db;
    await db.collection('groups').doc(groupId).collection('inventory').doc(uid).delete().catch(function(){});
    await db.collection('groups').doc(groupId).collection('members').doc(uid).delete();
    await db.collection('groups').doc(groupId).update({ memberCount: firebase.firestore.FieldValue.increment(-1) }).catch(function(){});
    await db.collection('users').doc(uid).collection('groups').doc(groupId).delete();
  }

  async function myGroups() {
    const snap = await window.FB.db.collection('users').doc(_uid()).collection('groups').get();
    return snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
  }

  async function groupMembers(groupId) {
    const snap = await window.FB.db.collection('groups').doc(groupId).collection('members').get();
    return snap.docs.map(function (d) { return Object.assign({ uid: d.id }, d.data()); });
  }

  // ── Calcolo match di scambio ─────────────────────────────────────────────

  // Tutte le bacheche di un gruppo (escluso me).
  async function getGroupInventories(groupId) {
    const uid = _uid();
    const snap = await window.FB.db.collection('groups').doc(groupId).collection('inventory').get();
    return snap.docs
      .filter(function (d) { return d.id !== uid; })
      .map(function (d) { return Object.assign({ uid: d.id }, d.data()); });
  }

  // La mia bacheca (owned/doubles per ogni album).
  async function getMyInventory(groupId) {
    const snap = await window.FB.db.collection('groups').doc(groupId).collection('inventory').doc(_uid()).get();
    return snap.exists ? snap.data() : { albums: {} };
  }

  // Match con UN membro su UN album.
  // ricevo = sue doppie che non possiedo; do = mie doppie che lui non possiede.
  function _matchOnAlbum(mine, theirs) {
    const myOwned = (mine && mine.owned) || [];
    const myDoubles = (mine && mine.doubles) || [];
    const thOwned = (theirs && theirs.owned) || [];
    const thDoubles = (theirs && theirs.doubles) || [];
    const myOwnedSet = {}; myOwned.forEach(function (c) { myOwnedSet[c] = 1; });
    const thOwnedSet = {}; thOwned.forEach(function (c) { thOwnedSet[c] = 1; });
    const receive = thDoubles.filter(function (c) { return !myOwnedSet[c]; });
    const give = myDoubles.filter(function (c) { return !thOwnedSet[c]; });
    return { receive: receive, give: give };
  }

  // Match completo con un membro su TUTTI gli album in comune.
  function _matchMember(myInv, memberInv) {
    const myAlbums = (myInv && myInv.albums) || {};
    const memAlbums = (memberInv && memberInv.albums) || {};
    const perAlbum = [];
    let totReceive = 0, totGive = 0;
    Object.keys(myAlbums).forEach(function (albumId) {
      if (!memAlbums[albumId]) return; // album non in comune
      const m = _matchOnAlbum(myAlbums[albumId], memAlbums[albumId]);
      if (m.receive.length || m.give.length) {
        perAlbum.push({ albumId: albumId, receive: m.receive, give: m.give });
        totReceive += m.receive.length;
        totGive += m.give.length;
      }
    });
    return { perAlbum: perAlbum, totReceive: totReceive, totGive: totGive };
  }

  // "Scambi possibili" del gruppo: membri con cui ricevo>0 E do>0, ordinati per match migliore.
  async function getPossibleTrades(groupId) {
    const myInv = await getMyInventory(groupId);
    const others = await getGroupInventories(groupId);
    const out = [];
    others.forEach(function (m) {
      const r = _matchMember(myInv, m);
      if (r.totReceive > 0 && r.totGive > 0) {
        out.push({ uid: m.uid, displayName: m.displayName || 'Collezionista', perAlbum: r.perAlbum, totReceive: r.totReceive, totGive: r.totGive });
      }
    });
    out.sort(function (a, b) { return (b.totReceive + b.totGive) - (a.totReceive + a.totGive); });
    return out;
  }

  // ── Proposte di scambio ──────────────────────────────────────────────────

  async function createProposal(toUid, groupId, albumId, give, receive) {
    const uid = _uid();
    const db = window.FB.db;
    const ref = db.collection('proposals').doc();
    await ref.set({
      participants: [uid, toUid],
      fromUid: uid,
      toUid: toUid,
      groupId: groupId,
      albumId: albumId,
      give: give || [],
      receive: receive || [],
      status: 'pending',
      confirmedBy: [],
      lastActionBy: uid,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    await ref.collection('revisions').doc('0').set({ by: uid, give: give || [], receive: receive || [], at: Date.now() });
    return { proposalId: ref.id };
  }

  async function getMyProposals() {
    const uid = _uid();
    const snap = await window.FB.db.collection('proposals').where('participants', 'array-contains', uid).get();
    return snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
  }

  async function reviseProposal(proposalId, give, receive) {
    const uid = _uid();
    const db = window.FB.db;
    const ref = db.collection('proposals').doc(proposalId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error('Proposta inesistente');
    const revs = await ref.collection('revisions').get();
    const n = String(revs.size);
    await ref.collection('revisions').doc(n).set({ by: uid, give: give || [], receive: receive || [], at: Date.now() });
    // chi rimanda inverte i lati: il suo "give" diventa il give della proposta
    await ref.update({ give: give || [], receive: receive || [], status: 'pending', confirmedBy: [], lastActionBy: uid, updatedAt: Date.now() });
  }

  async function acceptProposal(proposalId) {
    const uid = _uid();
    const db = window.FB.db;
    const ref = db.collection('proposals').doc(proposalId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error('Proposta inesistente');
    const data = snap.data();
    const confirmed = (data.confirmedBy || []).slice();
    if (confirmed.indexOf(uid) < 0) confirmed.push(uid);
    const everyone = (data.participants || []).every(function (p) { return confirmed.indexOf(p) >= 0; });
    await ref.update({ confirmedBy: confirmed, status: everyone ? 'completed' : 'accepted', lastActionBy: uid, updatedAt: Date.now() });
    return { completed: everyone };
  }

  async function rejectProposal(proposalId) {
    await window.FB.db.collection('proposals').doc(proposalId).update({ status: 'rejected', lastActionBy: _uid(), updatedAt: Date.now() });
  }

  async function cancelProposal(proposalId) {
    await window.FB.db.collection('proposals').doc(proposalId).update({
      status: 'cancelled', lastActionBy: _uid(), updatedAt: Date.now()
    });
  }

  // ── Feedback e profili pubblici ──────────────────────────────────────────

  // Una recensione sola per scambio: id ancorato a proposta + valutatore.
  async function leaveFeedback(proposalId, ratedUid, rating, comment) {
    const uid = _uid();
    const db = window.FB.db;
    const fid = proposalId + '__' + uid;
    await db.collection('users').doc(ratedUid).collection('feedback').doc(fid).set({
      fromUid: uid,
      proposalId: proposalId,
      rating: rating,
      comment: comment || '',
      at: Date.now()
    });
    // aggiorna il contatore scambi completati nel profilo pubblico del valutato
    await db.collection('publicProfiles').doc(ratedUid).set({
      completedTrades: firebase.firestore.FieldValue.increment(1)
    }, { merge: true });
  }

  // Feedback di un utente (per media e reputazione).
  async function getFeedback(uid) {
    const snap = await window.FB.db.collection('users').doc(uid).collection('feedback').get();
    const list = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
    let avg = 0;
    if (list.length) avg = list.reduce(function (s, f) { return s + (f.rating || 0); }, 0) / list.length;
    return { list: list, count: list.length, avg: avg };
  }

  // Profilo pubblico (per nome/colore/scambi nelle card).
  async function getPublicProfile(uid) {
    const snap = await window.FB.db.collection('publicProfiles').doc(uid).get();
    return snap.exists ? Object.assign({ uid: uid }, snap.data()) : { uid: uid };
  }

  // Salva/aggiorna il MIO profilo pubblico (chiamato al login/onboarding).
  async function setMyPublicProfile(data) {
    await window.FB.db.collection('publicProfiles').doc(_uid()).set(
      Object.assign({ displayName: getUserName() }, data || {}),
      { merge: true }
    );
  }

  // ── Esposizione pubblica ─────────────────────────────────────────────────

  window.DB = {
    getUserName,
    getUserInitial,
    wireProfileMenu,
    getIncomingProposals,
    wireNotifications,

    getMyAlbums,
    addAlbum,
    removeAlbum,

    getAlbumData,
    saveCardState,
    resetAlbum,
    syncInventory: _syncInventory,

    getAlbumStats,
    getAllStats,

    setEverHadAlbum,
    getEverHadAlbum,

    createGroup,
    joinGroup,
    leaveGroup,
    myGroups,
    groupMembers,

    getGroupInventories,
    getMyInventory,
    getPossibleTrades,

    createProposal,
    getMyProposals,
    reviseProposal,
    acceptProposal,
    rejectProposal,
    cancelProposal,

    leaveFeedback,
    getFeedback,
    getPublicProfile,
    setMyPublicProfile
  };

})();
