// figubook-album-single.js — S3
// Caricato da tutte le pagine dei singoli album (calciatori-2526/2425/2324/2223,
// fwc2026, serieb-2526, adrenalyn-2526, matchattax-2526).
//
// Ruolo: collegare il motore di rendering (album-app.js, NON modificato) e i
// file dati (album-data*.js, NON modificati) al data layer Firestore (window.DB).
//
// Architettura:
//  - Il file dati definisce window.STICKER_STATES/COUNTS/NAMES (tutto 'missing'),
//    più window.saveAlbum/resetAlbum/albumStats (versioni localStorage).
//  - In S2 album-app.js è stato rimosso dall'HTML. Qui lo reiniettiamo DOPO aver
//    popolato i globali da Firestore e ridefinito saveAlbum/resetAlbum, così:
//      1) il primo render del motore mostra subito i dati veri;
//      2) album-app.js avvolge la NOSTRA saveAlbum (cattura _origSaveAlbum al load).
//  - MAI localStorage: la persistenza passa solo per window.DB → Firestore.

(function () {

  // Nome pagina HTML → albumId Firestore. Differenze volute.
  // (La const FB_STORAGE_KEY del file dati NON è leggibile da qui: una const
  //  top-level di uno script classico non finisce su window né è visibile da
  //  un altro file. Risolviamo quindi dall'URL della pagina corrente.)
  const PAGE_TO_ALBUM_ID = {
    'figubook-calciatori-2526.html': 'calciatori-25-26',
    'figubook-calciatori-2425.html': 'calciatori-24-25',
    'figubook-calciatori-2324.html': 'calciatori-23-24',
    'figubook-calciatori-2223.html': 'calciatori-22-23',
    'figubook-fwc2026.html':         'mondiali-2026',
    'figubook-fwc2022.html':         'mondiali-2022',
    'figubook-serieb-2526.html':     'calb-25-26',
    'figubook-adrenalyn-2526.html':  'adrenalyn-25-26',
    'figubook-matchattax-2526.html': 'match-attax-ucl',
  };

  function resolveAlbumId() {
    var page = (window.location.pathname.split('/').pop() || '').toLowerCase();
    return PAGE_TO_ALBUM_ID[page] || null;
  }

  // Inietta album-app.js dopo che i globali sono pronti. Restituisce una Promise.
  function injectAlbumApp() {
    return new Promise(function (resolve) {
      if (window.renderAlbum) { resolve(); return; } // già caricato
      const s = document.createElement('script');
      s.src = 'album-app.js';
      s.onload = function () { resolve(); };
      s.onerror = function () {
        console.error('FiguBook: impossibile caricare album-app.js');
        resolve();
      };
      document.body.appendChild(s);
    });
  }

  // ── Snapshot per il diff (stati + conteggi + nomi) ─────────────────────────
  let prevStates = {};
  let prevCounts = {};
  let prevNames  = {};

  function takeSnapshot() {
    prevStates = Object.assign({}, window.STICKER_STATES);
    prevCounts = Object.assign({}, window.STICKER_COUNTS);
    prevNames  = Object.assign({}, window.STICKER_NAMES);
  }

  // ── Persistenza per singola carta (diff sulla snapshot) ────────────────────
  function persistDiff(albumId) {
    const S = window.STICKER_STATES, C = window.STICKER_COUNTS, N = window.STICKER_NAMES;

    // Stati e conteggi: scrivi le carte cambiate.
    for (const code in S) {
      const stateChanged = prevStates[code] !== S[code];
      const countChanged = (C[code] || null) !== (prevCounts[code] || null);
      if (stateChanged || countChanged) {
        window.DB.saveCardState(albumId, code, S[code], C[code]);
      }
    }

    // Nomi: merge diretto nel campo `names` (schema esistente), niente DB API
    // dedicata perché saveCardState non gestisce i nomi.
    const namesPatch = {};
    let namesDirty = false;
    for (const code in N) {
      if (prevNames[code] !== N[code]) { namesPatch[code] = N[code]; namesDirty = true; }
    }
    for (const code in prevNames) {
      if (!(code in N)) { namesPatch[code] = firebase.firestore.FieldValue.delete(); namesDirty = true; }
    }
    if (namesDirty) {
      const uid = window.FB.auth.currentUser.uid;
      window.FB.db.collection('users').doc(uid).collection('albums').doc(albumId)
        .set({ names: namesPatch, ts: Date.now() }, { merge: true })
        .catch(function (e) { console.error('FiguBook: errore salvataggio nomi', e); });
    }

    takeSnapshot();
  }

  // ── Navbar minima: avatar reale + logout ───────────────────────────────────
  function initNavbar() {
    const av = document.getElementById('avatarBtn');
    if (av) av.textContent = window.DB.getUserInitial();
    window.DB.wireProfileMenu();
    const out = document.getElementById('pmEsci');
    if (out) out.addEventListener('click', function () {
      window.FB.auth.signOut().then(function () {
        window.location.href = 'figubook-benvenuto.html';
      });
    });
  }

  window.FB.onReady(async function () {
    initNavbar();

    const albumId = resolveAlbumId();

    if (!albumId) {
      console.error('FiguBook: albumId non risolto per pagina ' + window.location.pathname);
      await injectAlbumApp(); // carica comunque il motore (tutto mancante)
      return;
    }

    // 1. Carica gli stati salvati e popola i globali in-place (NON riassegnare
    //    gli oggetti: i riferimenti catturati dal motore restano validi).
    try {
      const { states, counts } = await window.DB.getAlbumData(albumId);
      for (const code in states) {
        if (code in window.STICKER_STATES) window.STICKER_STATES[code] = states[code];
      }
      for (const code in counts) {
        if (code in window.STICKER_STATES) window.STICKER_COUNTS[code] = counts[code];
      }
      // Nomi: getAlbumData non li restituisce, li leggiamo dal doc.
      const uid = window.FB.auth.currentUser.uid;
      const snap = await window.FB.db.collection('users').doc(uid)
        .collection('albums').doc(albumId).get();
      if (snap.exists && snap.data().names) {
        Object.assign(window.STICKER_NAMES, snap.data().names);
      }
    } catch (e) {
      console.error('FiguBook: errore nel caricamento album', e);
    }

    // 2. Override saveAlbum: nessun localStorage, salvataggio per carta via diff.
    window.saveAlbum = function () {
      try { persistDiff(albumId); }
      catch (e) { console.error('FiguBook: errore salvataggio', e); }
    };

    // 3. Override resetAlbum: azzera su Firestore + globali + re-render (no reload).
    window.resetAlbum = async function () {
      try { await window.DB.resetAlbum(albumId); }
      catch (e) { console.error('FiguBook: errore reset album', e); }
      for (const c in window.STICKER_STATES) window.STICKER_STATES[c] = 'missing';
      for (const c in window.STICKER_COUNTS) delete window.STICKER_COUNTS[c];
      for (const c in window.STICKER_NAMES)  delete window.STICKER_NAMES[c];
      takeSnapshot();
      if (window.renderAlbum) window.renderAlbum();
    };

    // 4. Istantanea iniziale e avvio del motore (primo render coi dati veri).
    takeSnapshot();
    await injectAlbumApp();
    if (window.renderAlbum) window.renderAlbum();
  });

})();
