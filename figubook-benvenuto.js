// figubook-benvenuto.js — S3
// Pagina login/registrazione. Auth via window.FB (Firebase compat). MAI localStorage.
// Le funzioni richiamate dagli handler inline dell'HTML (togglePass, handleSubmit,
// handleGoogle, updateRegisterEnabled) sono esposte su window.

(function () {

  function $(id) { return document.getElementById(id); }

  // ── Slogan rotante (UI) ────────────────────────────────────────
  const SLOGANS = [
    'Ce l\'ho, ce l\'ho, manca… <em>ma non per molto.</em>',
    'La tua collezione, <em>sempre in tasca.</em>',
    'Trova le doppie, <em>chiudi l\'album.</em>',
    'Ogni figurina <em>al posto giusto.</em>',
    'Scambia con chi <em>ce l\'ha davvero.</em>',
    'Dalla bustina <em>all\'album, in un tocco.</em>',
  ];
  let slogIdx = 0, slogTimer = null;

  function renderSlogan() {
    const el = $('slogan');
    if (el) {
      el.classList.remove('fade');
      void el.offsetWidth; // restart animation
      el.innerHTML = SLOGANS[slogIdx];
      el.classList.add('fade');
    }
    const cnt = $('slogCount');
    if (cnt) cnt.textContent =
      String(slogIdx + 1).padStart(2, '0') + ' / ' + String(SLOGANS.length).padStart(2, '0');
    buildDots();
  }
  function buildDots() {
    const dots = $('slogDots');
    if (!dots) return;
    dots.innerHTML = '';
    SLOGANS.forEach(function (_, i) {
      const d = document.createElement('span');
      d.className = 'slogan-dot' + (i === slogIdx ? ' active' : '');
      d.style.cssText = 'display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:6px;' +
        'background:' + (i === slogIdx ? 'var(--ink,#111)' : 'rgba(0,0,0,.2)') + ';cursor:pointer';
      d.addEventListener('click', function () { slogIdx = i; renderSlogan(); restartTimer(); });
      dots.appendChild(d);
    });
  }
  function tick() { slogIdx = (slogIdx + 1) % SLOGANS.length; renderSlogan(); }
  function restartTimer() { clearInterval(slogTimer); slogTimer = setInterval(tick, 5000); }

  // ── Tabs login/registrazione (UI) ──────────────────────────────
  function setMode(mode) {
    const tabs = $('tabs');
    if (tabs) tabs.dataset.mode = mode;
    document.querySelectorAll('#tabs .tab').forEach(function (t) {
      t.classList.toggle('active', t.dataset.mode === mode);
    });
    document.querySelectorAll('.form-panel').forEach(function (p) {
      p.classList.toggle('active', p.dataset.panel === mode);
    });
    const title = $('authTitle'), sub = $('authSub');
    if (mode === 'register') {
      if (title) title.textContent = 'Crea il tuo account';
      if (sub) sub.textContent = 'Inizia a tracciare la tua collezione.';
    } else {
      if (title) title.textContent = 'Bentornato';
      if (sub) sub.textContent = 'Accedi al tuo album e ai tuoi scambi.';
    }
    const meta = document.querySelector('.top-meta');
    if (meta) {
      meta.innerHTML = (mode === 'register')
        ? 'Hai già un account? <a href="#" id="topGoLogin">Accedi</a>'
        : 'Non hai un account? <a href="#" id="topGoRegister">Registrati</a>';
      wireTopMeta();
    }
  }
  function wireTopMeta() {
    const r = $('topGoRegister'), l = $('topGoLogin');
    if (r) r.addEventListener('click', function (e) { e.preventDefault(); setMode('register'); });
    if (l) l.addEventListener('click', function (e) { e.preventDefault(); setMode('login'); });
  }

  // ── Helpers errore / loading ───────────────────────────────────
  function showError(which, msg) {
    const el = $(which === 'register' ? 'regError' : 'loginError');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  }
  function clearError(which) {
    const el = $(which === 'register' ? 'regError' : 'loginError');
    if (el) { el.textContent = ''; el.style.display = 'none'; }
  }
  function mapFirebaseError(code) {
    const m = {
      'auth/wrong-password':      'Password errata. Riprova.',
      'auth/user-not-found':      'Nessun account con questa email.',
      'auth/invalid-credential':  'Email o password non corretti.',
      'auth/email-already-in-use':'Esiste già un account con questa email.',
      'auth/invalid-email':       'Indirizzo email non valido.',
      'auth/weak-password':       'La password deve avere almeno 6 caratteri.',
      'auth/popup-closed-by-user':'Accesso annullato.',
      'auth/network-request-failed':'Problema di rete. Controlla la connessione.',
      'auth/too-many-requests':   'Troppi tentativi. Riprova più tardi.',
    };
    return m[code] || 'Si è verificato un errore. Riprova.';
  }

  // ── Auth ───────────────────────────────────────────────────────
  function goDashboard() { window.location.href = 'figubook-dashboard.html'; }

  window.handleSubmit = async function (mode) {
    clearError(mode);
    try {
      if (mode === 'login') {
        const email = $('loginEmail').value.trim();
        const pass  = $('loginPassword').value;
        await window.FB.auth.signInWithEmailAndPassword(email, pass);
        goDashboard();
      } else {
        const username = $('regUsername').value.trim();
        const email    = $('regEmail').value.trim();
        const pass     = $('regPassword').value;
        const cred = await window.FB.auth.createUserWithEmailAndPassword(email, pass);
        const user = cred.user;
        await user.updateProfile({ displayName: username });
        // Profilo in Firestore: users/{uid}/meta/profile.
        await window.FB.db.collection('users').doc(user.uid)
          .collection('meta').doc('profile')
          .set({ displayName: username, username: username, ts: Date.now() }, { merge: true });
        goDashboard();
      }
    } catch (e) {
      showError(mode, mapFirebaseError(e && e.code));
    }
  };

  window.handleGoogle = async function (mode) {
    clearError(mode);
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const cred = await window.FB.auth.signInWithPopup(provider);
      const user = cred.user;
      // Primo accesso Google: assicura un profilo meta minimo.
      if (cred.additionalUserInfo && cred.additionalUserInfo.isNewUser) {
        const name = user.displayName || (user.email || '').split('@')[0];
        await window.FB.db.collection('users').doc(user.uid)
          .collection('meta').doc('profile')
          .set({ displayName: name, username: name, ts: Date.now() }, { merge: true });
      }
      goDashboard();
    } catch (e) {
      showError(mode, mapFirebaseError(e && e.code));
    }
  };

  window.togglePass = function (inputId, btn) {
    const inp = $(inputId);
    if (!inp) return;
    inp.type = (inp.type === 'password') ? 'text' : 'password';
    if (btn) btn.classList.toggle('revealed', inp.type === 'text');
  };

  window.updateRegisterEnabled = function () {
    const terms = $('regTerms');
    const btn = $('registerBtn');
    if (btn) btn.disabled = !(terms && terms.checked);
  };

  // ── Boot ───────────────────────────────────────────────────────
  // Se l'utente è già autenticato, vai diritto alla dashboard.
  // (onReady viene messo in coda prima della risoluzione dell'auth: scatta
  //  solo se c'è davvero un utente, altrimenti resta su benvenuto.)
  window.FB.onReady(function () { goDashboard(); });

  document.addEventListener('DOMContentLoaded', function () {
    // Tabs.
    document.querySelectorAll('#tabs .tab').forEach(function (t) {
      t.addEventListener('click', function () { setMode(t.dataset.mode); });
    });
    wireTopMeta();
    window.updateRegisterEnabled();
    renderSlogan();
    restartTimer();
  });
  // Se il DOM è già pronto (script in fondo al body), inizializza subito.
  if (document.readyState !== 'loading') {
    document.querySelectorAll('#tabs .tab').forEach(function (t) {
      t.addEventListener('click', function () { setMode(t.dataset.mode); });
    });
    wireTopMeta();
    window.updateRegisterEnabled();
    renderSlogan();
    restartTimer();
  }

})();
