// firebase-init.js — S3
// Richiede firebase-app-compat, firebase-auth-compat, firebase-firestore-compat già caricati via CDN.

(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyBdalsaKEhbwYEFLXXXfCJfe--R2kNTqmQ",
    authDomain: "figubook.firebaseapp.com",
    projectId: "figubook",
    storageBucket: "figubook.firebasestorage.app",
    messagingSenderId: "965305828400",
    appId: "1:965305828400:web:11415617115f66b45119f5",
    measurementId: "G-J6H0D7GHM7"
  };

  firebase.initializeApp(firebaseConfig);

  const auth = firebase.auth();
  const db   = firebase.firestore();

  // Callback registrate prima che l'auth si risolva.
  const _readyCallbacks = [];
  let   _authResolved   = false;
  let   _currentUser    = null;

  auth.onAuthStateChanged(function (user) {
    _authResolved = true;
    _currentUser  = user;

    if (!user) {
      // Non autenticato: redirect a benvenuto se non ci siamo già.
      const page = window.location.pathname.split('/').pop() || '';
      if (page !== 'figubook-benvenuto.html') {
        window.location.href = 'figubook-benvenuto.html';
      }
      return;
    }

    // Utente autenticato: notifica tutte le callback in attesa.
    _readyCallbacks.forEach(function (cb) { cb(user); });
    _readyCallbacks.length = 0;
  });

  window.FB = {
    auth: auth,
    db:   db,

    // Chiama callback quando l'utente è autenticato.
    // Se l'auth è già risolta con un utente valido, chiama subito.
    onReady: function (callback) {
      if (_authResolved && _currentUser) {
        callback(_currentUser);
      } else if (!_authResolved) {
        _readyCallbacks.push(callback);
      }
      // Se _authResolved && !_currentUser: non autenticato, il redirect
      // è già partito — non chiamare la callback.
    }
  };
})();
