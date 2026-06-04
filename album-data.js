// Section data for Calciatori Panini 2025-2026 — 784 figurine, 37 sezioni
// All section names are taken verbatim from the printed album.

function nums(start, end){ const a=[]; for(let i=start;i<=end;i++) a.push(String(i)); return a; }
function pfx(p, start, end){ const a=[]; for(let i=start;i<=end;i++) a.push(p+i); return a; }

window.SECTIONS = [
  // ── APERTURA ──────────────────────────────────────────────
  { id:'trofei',      name:'Trofei',                     short:'Trofei',           group:'Apertura', kind:'opening-trofei', codes:nums(1,3),    c1:'#f5b800', c2:'#7a5a00' },
  { id:'squadre-a',   name:'Le squadre della Serie A',   short:'Squadre Serie A',  group:'Apertura', kind:'team-photos',    codes:nums(4,23),   c1:'#0a3a8b', c2:'#fcc500' },
  { id:'nuove-firme', name:'Nuove firme in città',       short:'Nuove firme',      group:'Apertura', kind:'transfer',       codes:nums(24,43),  c1:'#7a5ae0', c2:'#0ea5e9' },

  // ── SQUADRE SERIE A (con Style on Pitch nella sua posizione editoriale) ──
  { id:'atalanta',    name:'Atalanta',     group:'Squadre Serie A', kind:'team', codes:nums(44,65),   c1:'#0a4a8b', c2:'#1a1a1a', city:'Bergamo' },
  { id:'bologna',     name:'Bologna',      group:'Squadre Serie A', kind:'team', codes:nums(66,87),   c1:'#a01d2e', c2:'#1a4a8b', city:'Bologna' },
  { id:'cagliari',    name:'Cagliari',     group:'Squadre Serie A', kind:'team', codes:nums(88,109),  c1:'#a01d2e', c2:'#1a4a8b', city:'Cagliari' },
  { id:'como',        name:'Como',         group:'Squadre Serie A', kind:'team', codes:nums(110,131), c1:'#1a4a8b', c2:'#0ea5e9', city:'Como' },
  { id:'cremonese',   name:'Cremonese',    group:'Squadre Serie A', kind:'team', codes:nums(132,153), c1:'#a01d2e', c2:'#6a6a6a', city:'Cremona' },
  { id:'fiorentina',  name:'Fiorentina',   group:'Squadre Serie A', kind:'team', codes:nums(154,175), c1:'#7a5ae0', c2:'#4a2a8b', city:'Firenze' },
  { id:'genoa',       name:'Genoa',        group:'Squadre Serie A', kind:'team', codes:nums(176,197), c1:'#a01d2e', c2:'#0a3a8b', city:'Genova' },
  { id:'verona',      name:'Hellas Verona',short:'Hellas Verona', group:'Squadre Serie A', kind:'team', codes:nums(198,219), c1:'#fcc500', c2:'#0a3a8b', city:'Verona' },
  { id:'inter',       name:'Inter',        group:'Squadre Serie A', kind:'team', codes:nums(220,241), c1:'#0a3a8b', c2:'#1a1a1a', city:'Milano' },
  { id:'juventus',    name:'Juventus',     group:'Squadre Serie A', kind:'team', codes:nums(242,263), c1:'#1a1a1a', c2:'#f4f4f4', city:'Torino' },
  { id:'lazio',       name:'Lazio',        group:'Squadre Serie A', kind:'team', codes:nums(264,285), c1:'#8ec5ed', c2:'#0a3a8b', city:'Roma' },
  { id:'lecce',       name:'Lecce',        group:'Squadre Serie A', kind:'team', codes:nums(286,307), c1:'#fcc500', c2:'#a01d2e', city:'Lecce' },
  { id:'milan',       name:'Milan',        group:'Squadre Serie A', kind:'team', codes:nums(308,329), c1:'#a01d2e', c2:'#1a1a1a', city:'Milano' },
  { id:'napoli',      name:'Napoli',       group:'Squadre Serie A', kind:'team', codes:nums(330,351), c1:'#0ea5e9', c2:'#0a4a8b', city:'Napoli' },
  { id:'parma',       name:'Parma',        group:'Squadre Serie A', kind:'team', codes:nums(352,373), c1:'#fcc500', c2:'#0a3a8b', city:'Parma' },
  { id:'pisa',        name:'Pisa',         group:'Squadre Serie A', kind:'team', codes:nums(374,395), c1:'#0a4a8b', c2:'#1a1a1a', city:'Pisa' },
  { id:'roma',        name:'Roma',         group:'Squadre Serie A', kind:'team', codes:nums(396,417), c1:'#a01d2e', c2:'#fcc500', city:'Roma' },
  { id:'style',       name:'Style on Pitch', group:'Squadre Serie A', kind:'style', codes:pfx('STY',1,20), c1:'#ff3df5', c2:'#7a1a8b' },
  { id:'sassuolo',    name:'Sassuolo',     group:'Squadre Serie A', kind:'team', codes:nums(418,439), c1:'#0a5a3a', c2:'#1a1a1a', city:'Sassuolo' },
  { id:'torino',      name:'Torino',       group:'Squadre Serie A', kind:'team', codes:nums(440,461), c1:'#7a1212', c2:'#4a0a0a', city:'Torino' },
  { id:'udinese',     name:'Udinese',      group:'Squadre Serie A', kind:'team', codes:nums(462,483), c1:'#1a1a1a', c2:'#f4f4f4', city:'Udine' },

  // ── CALCIATORI IA ──────────────────────────────────────────
  { id:'gem-squad',     name:'Gem Squad',        group:'Calciatori IA', kind:'ai',      codes:nums(484,495), c1:'#c8ff3d', c2:'#1a4d2a', ia:true },
  { id:'turbofreccia',  name:'Turbofreccia',     group:'Calciatori IA', kind:'ai',      codes:nums(496,505), c1:'#0ea5e9', c2:'#0a3a8b', ia:true },
  { id:'color-up',      name:'Color Up',         group:'Calciatori IA', kind:'ai',      codes:nums(506,512), c1:'#ff3df5', c2:'#7a5ae0', ia:true },
  { id:'super-glovez',  name:'Super Glovez',     group:'Calciatori IA', kind:'ai',      codes:nums(513,520), c1:'#7a5ae0', c2:'#0a3a8b', ia:true },
  { id:'trick-maestro', name:'Trick Maestro',    group:'Calciatori IA', kind:'ai',      codes:nums(521,529), c1:'#fcc500', c2:'#a05a1a', ia:true },
  { id:'boom-impatto',  name:"Boom d'Impatto",   group:'Calciatori IA', kind:'ai',      codes:nums(530,539), c1:'#ff5b2e', c2:'#a01d2e', ia:true },
  { id:'power-bros',    name:'Power Bros',       group:'Calciatori IA', kind:'ai',      codes:nums(540,541), c1:'#c8ff3d', c2:'#1a4d2a', ia:true },
  { id:'upgrade',       name:'Calciatori Upgrade', short:'Upgrade', group:'Calciatori IA', kind:'upgrade', codes:pfx('UPG',1,80), c1:'#14110d', c2:'#1a1a2a' },
  { id:'family-legacy', name:'Family Legacy',    group:'Calciatori IA', kind:'ai',      codes:nums(542,543), c1:'#ff3df5', c2:'#7a1a8b', ia:true },

  // ── ALTRE SERIE ────────────────────────────────────────────
  { id:'serie-b', name:'Serie B', group:'Altre Serie', kind:'other-league', codes:nums(544,573), c1:'#1f8a5b', c2:'#0a3a2a' },
  { id:'serie-c', name:'Serie C', group:'Altre Serie', kind:'other-league', codes:nums(574,618), c1:'#7a5ae0', c2:'#3a1a8b' },

  // ── BONUS ──────────────────────────────────────────────────
  { id:'kinder',      name:'Kinder',                  short:'Kinder',       group:'Bonus', kind:'kinder',      codes:pfx('K',1,6),    c1:'#ff7a3d', c2:'#fcc500' },
  { id:'celebration', name:'Calciatori Celebration',  short:'Celebration',  group:'Bonus', kind:'celebration', codes:pfx('CEL',1,60), c1:'#ff3df5', c2:'#fcc500' },
];

// Group order (preserves album reading order)
window.GROUPS = ['Apertura', 'Squadre Serie A', 'Calciatori IA', 'Altre Serie', 'Bonus'];

window.STICKER_STATES = {};
window.STICKER_COUNTS = {};
window.STICKER_NAMES  = {};

// Default: tutte le figurine iniziano come "mancanti" (non possedute)
window.SECTIONS.forEach(sec => {
  sec.codes.forEach(code => {
    window.STICKER_STATES[code] = 'missing';
  });
});

// Compute initial counts
window.albumStats = function(){
  let have=0, missing=0, doubles=0, extras=0;
  for (const code in window.STICKER_STATES){
    const s = window.STICKER_STATES[code];
    if (s === 'have') have++;
    else if (s === 'missing') missing++;
    else if (s === 'double'){ have++; doubles++; extras += (window.STICKER_COUNTS[code] || 2) - 1; }
  }
  return { have, missing, doubles, total: have + missing, ownedSlots: have, totalPhysical: have + extras };
};

// ── Persistenza locale ──────────────────────────────────────
// Salva e ripristina lo stato dell'album sul dispositivo dell'utente,
// così le modifiche sopravvivono ai refresh.
const FB_STORAGE_KEY = 'figubook-calciatori-2526-v1';

(function loadFromStorage(){
  try {
    const raw = localStorage.getItem(FB_STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved && typeof saved === 'object'){
      if (saved.states && typeof saved.states === 'object'){
        // Override only keys that exist in the current data set
        for (const code in saved.states){
          if (code in window.STICKER_STATES) window.STICKER_STATES[code] = saved.states[code];
        }
      }
      if (saved.counts && typeof saved.counts === 'object'){
        for (const code in saved.counts){
          if (code in window.STICKER_STATES) window.STICKER_COUNTS[code] = saved.counts[code];
        }
      }
      if (saved.names && typeof saved.names === 'object'){
        Object.assign(window.STICKER_NAMES, saved.names);
      }
    }
  } catch(e){ console.warn('FiguBook: errore nel ripristino dello stato', e); }
})();

window.saveAlbum = function(){
  try {
    localStorage.setItem(FB_STORAGE_KEY, JSON.stringify({
      v: 1,
      states: window.STICKER_STATES,
      counts: window.STICKER_COUNTS,
      names: window.STICKER_NAMES,
      ts: Date.now()
    }));
  } catch(e){ console.warn('FiguBook: errore nel salvataggio', e); }
};

window.resetAlbum = function(){
  try { localStorage.removeItem(FB_STORAGE_KEY); } catch(e){}
  location.reload();
};
