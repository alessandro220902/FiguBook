// figubook-scambia.js — S3
// Caricato sia da figubook-scambia.html (hub) sia da figubook-scambia-dettaglio.html.
// Non esiste ancora un sistema di matching multi-utente: nessun dato finto,
// solo empty state onesti. MAI localStorage.

(function () {

  function $(id) { return document.getElementById(id); }

  function setAvatar() {
    const av = $('avatarBtn');
    if (av) av.textContent = window.DB.getUserInitial();
    const out = $('pmEsci');
    if (out) out.addEventListener('click', function () {
      window.FB.auth.signOut().then(function () { window.location.href = 'figubook-benvenuto.html'; });
    });
  }

  // ── Hub scambi (figubook-scambia.html) ─────────────────────────
  function renderHub() {
    const cards = $('cards');
    if (cards) {
      cards.innerHTML =
        '<div style="grid-column:1/-1;padding:40px 24px;text-align:center">' +
        '<div style="font-size:32px;margin-bottom:8px">🔄</div>' +
        '<div style="font-size:16px;font-weight:700;margin-bottom:6px">Non ci sono ancora match disponibili</div>' +
        '<div style="font-size:14px;color:var(--muted);max-width:420px;margin:0 auto">' +
        'Lo scambio fra collezionisti arriva presto. Intanto segna le tue doppie negli album: ' +
        'serviranno per trovare gli scambi giusti.</div></div>';
    }
    // Azzera i contatori dei tab (niente numeri inventati).
    ['tabCountMatch', 'tabCountReceived', 'tabCountSent', 'tabCountConfirmed',
     'ctAll', 'ctNearby', 'ctFriends'].forEach(function (id) {
      const el = $(id);
      if (el) el.textContent = '0';
    });
  }

  // ── Dettaglio proposta (figubook-scambia-dettaglio.html) ───────
  function renderDetail() {
    const main = document.querySelector('main');
    if (main) {
      main.innerHTML =
        '<div style="padding:60px 24px;text-align:center;max-width:480px;margin:0 auto">' +
        '<div style="font-size:36px;margin-bottom:10px">🚧</div>' +
        '<h1 style="font-size:22px;margin:0 0 8px">Funzione in arrivo</h1>' +
        '<p style="font-size:14px;color:var(--muted)">Il dettaglio degli scambi sarà disponibile ' +
        'appena attiveremo il sistema di matching fra collezionisti.</p>' +
        '<a href="figubook-scambia.html" style="display:inline-block;margin-top:18px;font-weight:600;' +
        'text-decoration:none;color:var(--ink)">← Torna agli scambi</a></div>';
    }
  }

  window.FB.onReady(function () {
    setAvatar();
    // Rilevamento pagina: la dettaglio ha #dealTitle, l'hub ha #cards.
    if (document.getElementById('dealTitle')) {
      renderDetail();
    } else {
      renderHub();
    }
  });

})();
