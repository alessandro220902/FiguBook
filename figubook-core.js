// FiguBook Core — shared localStorage utilities
// DO NOT rename any localStorage key — existing user data depends on them.

(function(w){
  'use strict';

  // ── 1. SESSIONE ──────────────────────────────────────────────

  function getSession(){
    try { const r = localStorage.getItem('figubook-session-v1'); return r ? JSON.parse(r) : null; } catch(e){ return null; }
  }

  function setSession(email){
    try { localStorage.setItem('figubook-session-v1', JSON.stringify({ email, ts: Date.now() })); } catch(e){}
  }

  function clearSession(){
    try { localStorage.removeItem('figubook-session-v1'); } catch(e){}
  }

  function requireSession(){
    if (!getSession()) window.location.replace('FiguBook Benvenuto.html');
  }

  // ── 2. ALBUM IN RACCOLTA ─────────────────────────────────────

  function getMyAlbums(){
    try { const r = localStorage.getItem('figubook-my-albums-v1'); return r ? JSON.parse(r) : []; } catch(e){ return []; }
  }

  function saveMyAlbums(ids){
    try { localStorage.setItem('figubook-my-albums-v1', JSON.stringify(ids)); } catch(e){}
  }

  function addAlbum(id){
    const ids = getMyAlbums();
    if (!ids.includes(id)){ ids.push(id); saveMyAlbums(ids); }
  }

  function removeAlbum(id){
    saveMyAlbums(getMyAlbums().filter(x => x !== id));
  }

  // ── 3. STATISTICHE ALBUM ─────────────────────────────────────

  const ALBUM_STORAGE_KEYS = {
    'calciatori-25-26': 'figubook-calciatori-2526-v1',
    'calciatori-24-25': 'figubook-calciatori-2425-v1',
    'calciatori-23-24': 'figubook-calciatori-2324-v1',
    'calciatori-22-23': 'figubook-calciatori-2223-v1',
    'mondiali-2026':    'figubook-fwc2026-v1',
    'calb-25-26':       'figubook-serieb-2526-v1',
    'match-attax-ucl':  'figubook-matchattax-ucl-2526-v1',
    'adrenalyn-25-26':  'figubook-adrenalyn-2526-v1',
  };

  function getAlbumStats(storageKey){
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return { have: 0, total: 0, doubles: 0, pct: 0 };
      const { states, counts } = JSON.parse(raw);
      if (!states) return { have: 0, total: 0, doubles: 0, pct: 0 };
      let have = 0, doubles = 0, total = 0;
      Object.entries(states).forEach(([code, st]) => {
        total++;
        if (st === 'have') { have++; }
        else if (st === 'double') {
          have++;
          doubles += (counts && counts[code] ? counts[code] - 1 : 1);
        }
      });
      const pct = total > 0 ? +((have / total) * 100).toFixed(1) : 0;
      return { have, total, doubles, pct };
    } catch(e) { return { have: 0, total: 0, doubles: 0, pct: 0 }; }
  }

  function getAllStats(){
    const ids = getMyAlbums();
    let totalHave = 0, totalMissing = 0, totalDoubles = 0, completed = 0;
    ids.forEach(id => {
      const key = ALBUM_STORAGE_KEYS[id];
      if (!key) return;
      const s = getAlbumStats(key);
      totalHave    += s.have;
      totalDoubles += s.doubles;
      totalMissing += (s.total - s.have);
      if (s.total > 0 && s.have >= s.total) completed++;
    });
    return { totalHave, totalMissing, totalDoubles, completed };
  }

  // ── 4. AGGIORNAMENTO IN TEMPO REALE ─────────────────────────

  function onStatsUpdate(callback){
    window.addEventListener('figubook:stats-updated', callback);
  }

  function fireStatsUpdate(){
    try { window.dispatchEvent(new Event('figubook:stats-updated')); } catch(e){}
  }

  function initAutoSync(callback){
    document.addEventListener('visibilitychange', function(){
      if (!document.hidden) callback();
    });
    window.addEventListener('storage', function(e){
      if (e.key && e.key.startsWith('figubook-')) callback();
    });
  }

  // ── 5. NOTIFICHE E MESSAGGI ──────────────────────────────────

  function getNotifRead(){
    try { return localStorage.getItem('figubook-notif-read-v1') === 'true'; } catch(e){ return false; }
  }

  function setNotifRead(){
    try { localStorage.setItem('figubook-notif-read-v1', 'true'); } catch(e){}
  }

  function getMessages(){
    try { const r = localStorage.getItem('figubook-messages-v1'); return r ? JSON.parse(r) : null; } catch(e){ return null; }
  }

  function saveMessages(data){
    try { localStorage.setItem('figubook-messages-v1', JSON.stringify(data)); } catch(e){}
  }

  // ── Export ───────────────────────────────────────────────────

  w.FiguBookCore = {
    // session
    getSession, setSession, clearSession, requireSession,
    // albums
    getMyAlbums, saveMyAlbums, addAlbum, removeAlbum,
    ALBUM_STORAGE_KEYS,
    // stats
    getAlbumStats, getAllStats,
    // sync
    onStatsUpdate, fireStatsUpdate, initAutoSync,
    // notif & messages
    getNotifRead, setNotifRead, getMessages, saveMessages,
  };

}(window));
