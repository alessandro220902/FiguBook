// figubook-db.js — S3
// Espone window.DB. Dipende da window.FB (firebase-init.js già caricato).
// MAI localStorage. Solo Firestore.

// TODO S3: collegare alla variabile dati reale per ogni album.
// Mappa albumId → totale carte (incluse speciali). Da riempire in S3
// quando si conosce la variabile globale esposta dai file album-data*.js.
const ALBUM_TOTALS = {
  // 'calciatori-25-26': 784,
  // 'calciatori-24-25': 680,
  // ...
};

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

  // Calcola il totale carte di un album.
  // TODO S3: collegare alla variabile dati reale (es. ALBUM_DATA, albumCards, ecc.)
  // ed alla mappa albumId → variabile globale del file dati corrispondente.
  // Per ora usa ALBUM_TOTALS come fonte primaria e le chiavi di states come fallback
  // provvisorio (PROVVISORIO: sottostima se l'utente non ha ancora toccato tutte le carte).
  function _getAlbumTotal(albumId, states) {
    if (ALBUM_TOTALS[albumId] !== undefined) {
      return ALBUM_TOTALS[albumId];
    }
    // Fallback provvisorio: conta le chiavi in states.
    // PROVVISORIO — sostituire in S3 con il conteggio reale da album-data*.js.
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

  // ── Esposizione pubblica ─────────────────────────────────────────────────

  window.DB = {
    getUserName,
    getUserInitial,

    getMyAlbums,
    addAlbum,
    removeAlbum,

    getAlbumData,
    saveCardState,
    resetAlbum,

    getAlbumStats,
    getAllStats,

    setEverHadAlbum,
    getEverHadAlbum
  };

})();
