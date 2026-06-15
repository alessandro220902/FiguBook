/* FiguBook — toggle tema chiaro/scuro.
   Persistenza via COOKIE (fb-theme), niente localStorage.
   Lo stato iniziale è già applicato da uno script inline in <head>
   (classe html.fb-light) per evitare il flash. Qui si gestisce solo il bottone. */
(function () {
  function isLight() {
    return document.documentElement.classList.contains('fb-light');
  }
  function setCookie(theme) {
    document.cookie = 'fb-theme=' + theme + ';path=/;max-age=31536000;samesite=lax';
  }
  function paintBtn(btn) {
    var light = isLight();
    // mostra l'icona del tema verso cui si passa
    btn.textContent = light ? '☾' : '☀'; // ☾ : ☀
    btn.setAttribute('aria-label', light ? 'Passa al tema scuro' : 'Passa al tema chiaro');
    btn.setAttribute('title', light ? 'Tema scuro' : 'Tema chiaro');
  }
  function init() {
    var btn = document.getElementById('fb-theme-toggle');
    if (!btn) return;
    paintBtn(btn);
    btn.addEventListener('click', function () {
      var goLight = !isLight();
      document.documentElement.classList.toggle('fb-light', goLight);
      setCookie(goLight ? 'light' : 'dark');
      paintBtn(btn);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
