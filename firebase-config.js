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
          if (!snap.exists) {
            // Nothing on Firestore yet — push what we have locally
            pushKeyToFirebase(storageKey);
            return;
          }

          var fbData = snap.data();
          var fbTs = fbData.ts || 0;

          var localRaw = localStorage.getItem(storageKey);
          var localTs = localRaw ? (JSON.parse(localRaw).ts || 0) : 0;

          if (fbTs > localTs) {
            // Firestore is more recent: write to localStorage then reload once
            localStorage.setItem(storageKey, JSON.stringify(fbData));
            sessionStorage.setItem(mergeFlag, '1');
            location.reload();
          } else {
            // localStorage is up-to-date (or empty): push to Firestore
            sessionStorage.setItem(mergeFlag, '1');
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

  function initMyAlbumsSync() {
    if (!window.FiguBookCore) return;
    var storageKey = 'figubook-my-albums-v1';
    var albumId    = '_my-albums';

    // Wrap FiguBookCore.saveMyAlbums
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

    // On auth state change: union local + Firestore list
    auth.onAuthStateChanged(function (user) {
      if (!user) return;
      var mergeFlag = 'fbMerged__my-albums';
      if (sessionStorage.getItem(mergeFlag)) return;

      db.collection('users').doc(user.uid)
        .collection('albums').doc(albumId)
        .get()
        .then(function (snap) {
          sessionStorage.setItem(mergeFlag, '1');

          if (!snap.exists) {
            // Push current local list to Firestore
            var localList = FiguBookCore.getMyAlbums();
            if (localList.length) {
              db.collection('users').doc(user.uid)
                .collection('albums').doc(albumId)
                .set({ ids: localList, ts: Date.now() })
                .catch(function (e) {});
            }
            return;
          }

          var fbIds = snap.data().ids || [];

          if (fbIds.length > 0) {
            // Firestore è la fonte di verità — sostituisce il localStorage locale
            var localIds = FiguBookCore.getMyAlbums();
            var isDifferent = fbIds.length !== localIds.length ||
              fbIds.some(function (id) { return localIds.indexOf(id) === -1; });
            if (isDifferent) {
              // Scrivi la lista di Firestore nel localStorage e ricarica
              _prevSave.call(FiguBookCore, fbIds);
              location.reload();
            }
            // Se uguale, nessuna azione necessaria
          } else {
            // Firestore ha una lista vuota — push quella locale
            var localList = FiguBookCore.getMyAlbums();
            if (localList.length) {
              db.collection('users').doc(user.uid)
                .collection('albums').doc(albumId)
                .set({ ids: localList, ts: Date.now() })
                .catch(function (e) {});
            }
          }
        })
        .catch(function (e) {
          console.warn('[FiguBook] myAlbums pull error:', e);
        });
    });
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
  };
}());
