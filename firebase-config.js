// FiguBook — Firebase initialization (CDN compat mode)
// Requires Firebase App/Auth/Firestore compat scripts to be loaded first.

(function () {
  'use strict';

  var firebaseConfig = {
    apiKey: "AIzaSyBdalsaKEhbwYEFLXXXfCJfe--R2kNTqmQ",
    authDomain: "figubook.firebaseapp.com",
    projectId: "figubook",
    storageBucket: "figubook.firebasestorage.app",
    messagingSenderId: "965305828400",
    appId: "1:965305828400:web:11415617115f66b45119f5",
    measurementId: "G-J6H0D7GHM7"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  var auth = firebase.auth();
  var db   = firebase.firestore();

  // ── Rilevamento cambio utente ────────────────────────────────
  // Garantisce che ogni utente parta sempre da zero.
  // Questo listener viene registrato PRIMA di tutti gli altri
  // così il localStorage è pulito prima che qualsiasi altro
  // listener lo legga.
  auth.onAuthStateChanged(function (user) {
    var prevUid = sessionStorage.getItem('figubook-current-uid');

    if (!user) {
      // Logout: pulisce tutto e rimuove l'uid
      if (window.FiguBookCore) FiguBookCore.clearAllUserData();
      sessionStorage.removeItem('figubook-current-uid');
      return;
    }

    // Pulisce SEMPRE quando l'uid è diverso — incluso il caso incognito
    // dove prevUid è null ma il localStorage potrebbe avere dati di un altro utente.
    if (prevUid !== user.uid) {
      if (window.FiguBookCore) FiguBookCore.clearAllUserData();
    }

    // Salva sempre l'uid corrente per il confronto al prossimo caricamento
    sessionStorage.setItem('figubook-current-uid', user.uid);
  });

  // ── Mapping: localStorage key → Firestore album document ID ──
  var KEY_TO_ID = {
    'figubook-calciatori-2526-v1':     'calciatori-25-26',
    'figubook-calciatori-2425-v1':     'calciatori-24-25',
    'figubook-calciatori-2324-v1':     'calciatori-23-24',
    'figubook-calciatori-2223-v1':     'calciatori-22-23',
    'figubook-fwc2026-v1':             'mondiali-2026',
    'figubook-serieb-2526-v1':         'calb-25-26',
    'figubook-adrenalyn-2526-v1':      'adrenalyn-25-26',
    'figubook-matchattax-ucl-2526-v1': 'match-attax-ucl',
  };

  // ── Low-level helpers ─────────────────────────────────────────

  function albumRef(uid, albumId) {
    return db.collection('users').doc(uid).collection('albums').doc(albumId);
  }

  // Push a single localStorage key to Firestore (fire-and-forget).
  function pushKeyToFirebase(storageKey) {
    var user = auth.currentUser;
    if (!user) return;
    var albumId = KEY_TO_ID[storageKey];
    if (!albumId) return;
    try {
      var raw = localStorage.getItem(storageKey);
      if (!raw) return;
      var data = JSON.parse(raw);
      albumRef(user.uid, albumId)
        .set(data, { merge: true })
        .catch(function (e) { console.warn('[FiguBook] Firestore push error:', e); });
    } catch (e) {}
  }

  // ── Public helpers (used by benvenuto/dashboard/album pages) ──

  async function saveAlbumToFirebase(albumId, data) {
    var user = auth.currentUser;
    if (!user) return;
    try {
      await albumRef(user.uid, albumId).set(data, { merge: true });
    } catch (e) {
      console.warn('[FiguBook] Firebase save error:', e);
    }
  }

  async function loadAlbumFromFirebase(albumId) {
    var user = auth.currentUser;
    if (!user) return null;
    try {
      var snap = await albumRef(user.uid, albumId).get();
      return snap.exists ? snap.data() : null;
    } catch (e) {
      console.warn('[FiguBook] Firebase load error:', e);
      return null;
    }
  }

  // ── Album sync: call once per album page ──────────────────────
  //
  // Wraps window.saveAlbum so every save also pushes to Firestore.
  // On first auth resolve, pulls from Firestore if newer and reloads
  // (once per session, guarded by sessionStorage to avoid loops).

  function initAlbumSync(storageKey) {
    var albumId = KEY_TO_ID[storageKey];
    if (!albumId) {
      console.warn('[FiguBook] Unknown storageKey for sync:', storageKey);
      return;
    }

    // ── 1. Wrap window.saveAlbum (call after all other wrappers) ──
    var _prevSave = window.saveAlbum;
    window.saveAlbum = function () {
      if (typeof _prevSave === 'function') _prevSave.apply(this, arguments);
      // Async push to Firestore — runs after localStorage is already updated
      pushKeyToFirebase(storageKey);
    };

    // ── 2. On auth state change: pull from Firestore if newer ────
    auth.onAuthStateChanged(function (user) {
      if (!user) return;

      var mergeFlag = 'fbMerged_' + storageKey;
      if (sessionStorage.getItem(mergeFlag)) return; // already merged this session

      db.collection('users').doc(user.uid)
        .collection('albums').doc(albumId)
        .get()
        .then(function (snap) {
          sessionStorage.setItem(mergeFlag, '1');

          if (!snap.exists) {
            // Firestore non ha dati per questo album.
            // Se localStorage ha dati (figurine già inserite), sincronizzali.
            pushKeyToFirebase(storageKey);
            return;
          }

          // Firestore ha dati → scrivi SEMPRE su localStorage (per compatibilità
          // con le pagine album singole che leggono da localStorage), poi ricarica.
          var fbData = snap.data();
          var localRaw = localStorage.getItem(storageKey);
          var localTs  = localRaw ? (JSON.parse(localRaw).ts || 0) : 0;
          if ((fbData.ts || 0) >= localTs) {
            // Firestore è più recente o equivalente → usa Firestore
            localStorage.setItem(storageKey, JSON.stringify(fbData));
            location.reload();
          } else {
            // localStorage è più recente → sincronizza verso Firestore
            pushKeyToFirebase(storageKey);
          }
        })
        .catch(function (e) {
          console.warn('[FiguBook] Firestore pull error:', e);
        });
    });
  }

  // ── My-albums list sync: call once from figubook-album.html ───
  //
  // Wraps FiguBookCore.saveMyAlbums so the album list is mirrored
  // to Firestore. On first auth resolve, pulls and unions the lists.

  // Firebase è SEMPRE la fonte di verità per la lista album.
  // Il localStorage è solo una cache — viene SEMPRE sovrascritto da Firebase.

  function initMyAlbumsSync() {
    if (!window.FiguBookCore) return;
    var albumId = '_my-albums';

    // Wrap FiguBookCore.saveMyAlbums: ogni modifica locale viene specchiata su Firestore
    var _prevSave = FiguBookCore.saveMyAlbums;
    FiguBookCore.saveMyAlbums = function (ids) {
      _prevSave.call(FiguBookCore, ids);
      var user = auth.currentUser;
      if (!user) return;
      db.collection('users').doc(user.uid)
        .collection('albums').doc(albumId)
        .set({ ids: ids, ts: Date.now() })
        .catch(function (e) { console.warn('[FiguBook] myAlbums Firestore error:', e); });
    };

    // Al login: Firebase decide cosa mostrare, non il localStorage
    auth.onAuthStateChanged(function (user) {
      if (!user) return;
      var mergeFlag = 'fbMerged__my-albums';
      if (sessionStorage.getItem(mergeFlag)) return;

      db.collection('users').doc(user.uid)
        .collection('albums').doc(albumId)
        .get()
        .then(function (snap) {
          sessionStorage.setItem(mergeFlag, '1');
          window._albumFirebaseReady = true; // Firebase ha risposto per questo utente

          // Firebase è la fonte di verità:
          // - se ha dati → usa quelli
          // - se non ha dati → lista vuota (nuovo utente, niente da mostrare)
          var fbIds = snap.exists ? (snap.data().ids || []) : [];

          var localIds = FiguBookCore.getMyAlbums();
          var isDifferent = fbIds.length !== localIds.length ||
            fbIds.some(function (id) { return localIds.indexOf(id) === -1; }) ||
            localIds.some(function (id) { return fbIds.indexOf(id) === -1; });

          // Sovrascrive SEMPRE il localStorage con la lista Firebase
          _prevSave.call(FiguBookCore, fbIds);

          if (isDifferent) {
            // La lista è cambiata → ricarica per mostrare dati corretti
            location.reload();
          } else {
            // Lista uguale → notifica la pagina (rimuove spinner se visibile)
            try {
              document.dispatchEvent(new CustomEvent('figubook:my-albums-synced', {
                detail: { ids: fbIds }
              }));
            } catch (e) {}
          }
        })
        .catch(function (e) {
          console.warn('[FiguBook] myAlbums pull error:', e);
          // In caso di errore di rete, notifica comunque la pagina
          try {
            document.dispatchEvent(new CustomEvent('figubook:my-albums-synced', {
              detail: { ids: [] }
            }));
          } catch (err) {}
        });
    });
  }

  // Logout: pulisce tutti i dati utente dal browser.
  // Garantisce che il prossimo utente parta da zero.

  async function clearUserData() {
    try { await auth.signOut(); } catch (e) {}
    // Pulizia completa: tutte le chiavi figubook-* e i flag sessionStorage
    if (window.FiguBookCore) FiguBookCore.clearAllUserData();
  }

  // ── Keep localStorage session in sync with Firebase Auth ─────

  auth.onAuthStateChanged(function (user) {
    if (!user) return;
    try {
      var stored = localStorage.getItem('figubook-session-v1');
      var session = stored ? JSON.parse(stored) : {};
      if (!session.uid || session.uid === user.uid) {
        localStorage.setItem('figubook-session-v1', JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || session.displayName || null,
          ts: Date.now()
        }));
      }
    } catch (e) {}
  });

  window.FiguBookFirebase = {
    auth: auth,
    db: db,
    // Low-level (used ad-hoc)
    saveAlbumToFirebase: saveAlbumToFirebase,
    loadAlbumFromFirebase: loadAlbumFromFirebase,
    // Page-level sync bootstrappers
    initAlbumSync: initAlbumSync,
    initMyAlbumsSync: initMyAlbumsSync,
    clearUserData: clearUserData,
  };
}());
