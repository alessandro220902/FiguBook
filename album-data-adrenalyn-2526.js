// Adrenalyn XL Serie A 2025-2026 — Panini
// Base 1-498 (+ varianti bis) · NM1-NM11 · A1-A20 · M1-M5 · U01-U44 · Limited Edition · EG1 · I1-I2 · AU1-AU5

function nums(s,e){const a=[];for(let i=s;i<=e;i++)a.push(String(i));return a;}
function pfx(p,s,e,pad){const a=[];for(let i=s;i<=e;i++)a.push(p+(pad?String(i).padStart(2,'0'):i));return a;}

// Helpers to build codes with optional bis variants
function teamCodes(base,bisArr){
  // base = array of numbers; bisArr = array of numbers that have a 'bis' variant
  const set=new Set(bisArr||[]);
  const result=[];
  base.forEach(n=>{result.push(String(n));if(set.has(n))result.push(n+'bis');});
  return result;
}

window.SECTIONS = [
  // ── SQUADRE SERIE A ──────────────────────────────────────────────────────
  { id:'atalanta',    name:'Atalanta',       short:'Atalanta',    group:'Squadre Serie A', kind:'team',
    codes:teamCodes(nums(1,18).map(Number),[11]),                  c1:'#0a4a8b', c2:'#1a1a1a' },
  { id:'bologna',     name:'Bologna',        short:'Bologna',     group:'Squadre Serie A', kind:'team',
    codes:teamCodes(nums(19,36).map(Number),[27,33]),              c1:'#a01d2e', c2:'#1a4a8b' },
  { id:'cagliari',    name:'Cagliari',       short:'Cagliari',    group:'Squadre Serie A', kind:'team',
    codes:teamCodes(nums(37,54).map(Number),[42,45,49,52]),        c1:'#a01d2e', c2:'#1a4a8b' },
  { id:'como',        name:'Como',           short:'Como',        group:'Squadre Serie A', kind:'team',
    codes:teamCodes(nums(55,72).map(Number),[60,70,72]),           c1:'#1a4a8b', c2:'#0ea5e9' },
  { id:'cremonese',   name:'Cremonese',      short:'Cremonese',   group:'Squadre Serie A', kind:'team',
    codes:teamCodes(nums(73,90).map(Number),[74,75,77,81,82,83,86,87]), c1:'#6b7280', c2:'#a01d2e' },
  { id:'fiorentina',  name:'Fiorentina',     short:'Fiorentina',  group:'Squadre Serie A', kind:'team',
    codes:teamCodes(nums(91,108).map(Number),[93,107]),            c1:'#7a5ae0', c2:'#4a2a8b' },
  { id:'genoa',       name:'Genoa',          short:'Genoa',       group:'Squadre Serie A', kind:'team',
    codes:teamCodes(nums(109,126).map(Number),[112,115]),          c1:'#a01d2e', c2:'#0a3a8b' },
  { id:'hellas',      name:'Hellas Verona',  short:'Hellas Verona',group:'Squadre Serie A', kind:'team',
    codes:teamCodes(nums(127,144).map(Number),[131,133,142,144]), c1:'#fcc500', c2:'#0a3a8b' },
  { id:'inter',       name:'Inter',          short:'Inter',       group:'Squadre Serie A', kind:'team',
    codes:teamCodes(nums(145,162).map(Number),[149]),              c1:'#010E80', c2:'#1a1a1a' },
  { id:'juventus',    name:'Juventus',       short:'Juventus',    group:'Squadre Serie A', kind:'team',
    codes:teamCodes(nums(163,180).map(Number),[172,176,180]),      c1:'#1a1a1a', c2:'#f4f4f4' },
  { id:'lazio',       name:'Lazio',          short:'Lazio',       group:'Squadre Serie A', kind:'team',
    codes:nums(181,198),                                           c1:'#8ec5ed', c2:'#0a3a8b' },
  { id:'lecce',       name:'Lecce',          short:'Lecce',       group:'Squadre Serie A', kind:'team',
    codes:teamCodes(nums(199,216).map(Number),[202,214]),          c1:'#fcc500', c2:'#a01d2e' },
  { id:'milan',       name:'Milan',          short:'Milan',       group:'Squadre Serie A', kind:'team',
    codes:teamCodes(nums(217,234).map(Number),[219,223,225,226,231]), c1:'#a01d2e', c2:'#1a1a1a' },
  { id:'napoli',      name:'Napoli',         short:'Napoli',      group:'Squadre Serie A', kind:'team',
    codes:teamCodes(nums(235,252).map(Number),[250,252]),          c1:'#0ea5e9', c2:'#0a4a8b' },
  { id:'parma',       name:'Parma',          short:'Parma',       group:'Squadre Serie A', kind:'team',
    codes:teamCodes(nums(253,270).map(Number),[258,261,264]),      c1:'#fcc500', c2:'#0a3a8b' },
  { id:'pisa',        name:'Pisa',           short:'Pisa',        group:'Squadre Serie A', kind:'team',
    codes:teamCodes(nums(271,288).map(Number),[273,275,283,285,288]), c1:'#1a3a8b', c2:'#0a2a5a' },
  { id:'roma',        name:'Roma',           short:'Roma',        group:'Squadre Serie A', kind:'team',
    codes:teamCodes(nums(289,306).map(Number),[295]),              c1:'#a01d2e', c2:'#fcc500' },
  { id:'sassuolo',    name:'Sassuolo',       short:'Sassuolo',    group:'Squadre Serie A', kind:'team',
    codes:teamCodes(nums(307,324).map(Number),[318,321]),          c1:'#1f5a2a', c2:'#1a1a1a' },
  { id:'torino',      name:'Torino',         short:'Torino',      group:'Squadre Serie A', kind:'team',
    codes:teamCodes(nums(325,342).map(Number),[326,329,341]),      c1:'#7a1212', c2:'#4a0a0a' },
  { id:'udinese',     name:'Udinese',        short:'Udinese',     group:'Squadre Serie A', kind:'team',
    codes:teamCodes(nums(343,360).map(Number),[346,355,357,358,359,360]), c1:'#1a1a1a', c2:'#f4f4f4' },

  // ── SEZIONI SPECIALI NUMERATE ─────────────────────────────────────────────
  { id:'triade',       name:'Triade',              short:'Triade',         group:'Speciali', kind:'special',
    codes:['361','362','363','364','364bis','365','366','367','368','368bis','369','370','371','372','373','374','375','376','377','378','379','380','380bis'],
    c1:'#f5b800', c2:'#7a5a00' },
  { id:'guanto-oro',   name:'Guanto d\'Oro',        short:'Guanto d\'Oro',  group:'Speciali', kind:'special',
    codes:nums(381,387),                            c1:'#ffd700', c2:'#14110d' },
  { id:'diamante',     name:'Diamante',             short:'Diamante',       group:'Speciali', kind:'special',
    codes:['388','389','390','391','392','393','394','395','396','397','398','399','400','400bis','401','401bis','402','403','404','405'],
    c1:'#0ea5e9', c2:'#0055a5' },
  { id:'air-force',    name:'Air Force',            short:'Air Force',      group:'Speciali', kind:'special',
    codes:['406','407','408','408bis','409','409bis','410','410bis','411','412','413','414','414bis'],
    c1:'#87CEEB', c2:'#0a3a8b' },
  { id:'influencer',   name:'Influencer',           short:'Influencer',     group:'Speciali', kind:'special',
    codes:['415','416','417','417bis','418','419','420','421','422','423','424','425','426','427','428','429','430','431','432'],
    c1:'#7a5ae0', c2:'#4a2a8b' },
  { id:'impatto',      name:'Impatto',              short:'Impatto',        group:'Speciali', kind:'special',
    codes:nums(433,441),                            c1:'#ff7a3d', c2:'#c04a00' },
  { id:'super-stella', name:'Super Stella',         short:'Super Stella',   group:'Speciali', kind:'special',
    codes:['442','443','444','444bis','445','446','446bis','447','448','449','450','451','452','453','454','455','456','457','458','458bis','459','460','461','462','463','464','465','466','467','467bis'],
    c1:'#f5b800', c2:'#14110d' },
  { id:'campioni',     name:'Campioni',             short:'Campioni',       group:'Speciali', kind:'special',
    codes:['468'],                                  c1:'#ffd700', c2:'#14110d' },
  { id:'golden-baller',name:'Golden Baller',        short:'Golden Baller',  group:'Speciali', kind:'special',
    codes:nums(469,474),                            c1:'#ffd700', c2:'#7a5a00' },
  { id:'ssg-baller',   name:'Super Golden Baller',  short:'S.G. Baller',    group:'Speciali', kind:'special',
    codes:['475'],                                  c1:'#f5b800', c2:'#14110d' },
  { id:'carte-spec',   name:'Carte Speciali',       short:'Carte Speciali', group:'Speciali', kind:'special',
    codes:['476','477','478'],                      c1:'#7a5ae0', c2:'#4a2a8b' },
  { id:'mister',       name:'Mister',               short:'Mister',         group:'Speciali', kind:'special',
    codes:nums(479,498),                            c1:'#1a1a1a', c2:'#3a3a3a' },

  // ── SEZIONI PREFISSATE ────────────────────────────────────────────────────
  { id:'new-master',   name:'New Master',           short:'New Master',     group:'Esclusivi', kind:'special',
    codes:pfx('NM',1,11),                           c1:'#0ea5e9', c2:'#1a4a8b' },
  { id:'adreinrot',    name:'Adreinrot',            short:'Adreinrot',      group:'Esclusivi', kind:'special',
    codes:pfx('A',1,20),                            c1:'#dc052d', c2:'#8B0000' },
  { id:'momentum',     name:'Momentum',             short:'Momentum',       group:'Esclusivi', kind:'special',
    codes:pfx('M',1,5),                             c1:'#1f8a5b', c2:'#0a3a2a' },
  { id:'upgrade-ws',   name:'Winter Stars / Upgrade',short:'Winter Stars',  group:'Upgrade', kind:'special',
    codes:pfx('U',1,20,true),                       c1:'#0a3a8b', c2:'#0055a5' },
  { id:'upgrade-rk',   name:'Rookie / Upgrade',     short:'Rookie',         group:'Upgrade', kind:'special',
    codes:pfx('U',21,40),                           c1:'#1f8a5b', c2:'#0a3a2a' },
  { id:'upgrade-sp',   name:'Upgrade Speciali',     short:'Upgrade Speciali',group:'Upgrade', kind:'special',
    codes:['U41','U42','U43','U44'],                c1:'#7a5ae0', c2:'#14110d' },
  { id:'le-standard',  name:'Limited Edition Standard',short:'LE Standard', group:'Limited Edition', kind:'special',
    codes:['LE-AB','LE-ABE','LE-AJ','LE-CI','LE-JC','LE-KDB','LE-KDW','LE-LF','LE-LL','LE-LMO','LE-LS','LE-NK','LE-NM','LE-NP','LE-PK','LE-RO','LE-SL','LE-SR','LE-TA'],
    c1:'#f5b800', c2:'#7a5a00' },
  { id:'le-kickoff',   name:'Limited Edition Kick-Off',short:'LE Kick-Off', group:'Limited Edition', kind:'special',
    codes:['LE-KO1','LE-KO2','LE-KO3'],            c1:'#c8ff3d', c2:'#14110d' },
  { id:'le-signature', name:'Limited Edition Signature',short:'LE Signature',group:'Limited Edition', kind:'special',
    codes:['LE-AJ-s','LE-LL-s','LE-NK-s','LE-RO-s'], c1:'#f5b800', c2:'#14110d' },
  { id:'le-impatto',   name:'Limited Edition Impatto',short:'LE Impatto',   group:'Limited Edition', kind:'special',
    codes:['LE-AD','LE-AG','LE-AI','LE-AM','LE-FC','LE-FPE','LE-IK','LE-JF','LE-JM','LE-JR','LE-JV','LE-LB','LE-LC','LE-LM','LE-MN','LE-NEA','LE-NZ','LE-PE','LE-RP','LE-SB','LE-SE'],
    c1:'#ff7a3d', c2:'#7a3a00' },
  { id:'le-premium-oro',name:'Limited Edition Premium Oro',short:'LE Premium Oro',group:'Limited Edition', kind:'special',
    codes:['LE-GI','LE-RG','LE-YF','LE-NPA'],      c1:'#ffd700', c2:'#7a5a00' },
  { id:'le-speciali',  name:'Limited Edition Speciali',short:'LE Speciali', group:'Limited Edition', kind:'special',
    codes:['LE-HC','LE-ABU'],                       c1:'#7a5ae0', c2:'#4a2a8b' },
  { id:'upgrade-le',   name:'Upgrade LE',           short:'Upgrade LE',     group:'Limited Edition', kind:'special',
    codes:['LEU-ED','LEU-JV','LEU-PD','LEU-RL','LEU-SM'], c1:'#0ea5e9', c2:'#0a3a8b' },
  { id:'printed-sig',  name:'Printed Signature Upgrade',short:'Printed Signature',group:'Limited Edition', kind:'special',
    codes:['LEPU-ED','LEPU-JV','LEPU-MTB','LEPU-PD','LEPU-RL','LEPU-SM'], c1:'#f5b800', c2:'#14110d' },
  { id:'autografo-orig',name:'Autografo Originale', short:'Autografo',      group:'Limited Edition', kind:'special',
    codes:['LEAU-MTB'],                             c1:'#ffd700', c2:'#14110d' },
  { id:'extra-gold',   name:'Extra Gold',           short:'Extra Gold',     group:'Esclusivi', kind:'special',
    codes:['EG1'],                                  c1:'#ffd700', c2:'#f5b800' },
  { id:'invincibile',  name:'Mitici Invincibile',   short:'Invincibile',    group:'Esclusivi', kind:'special',
    codes:['I1','I2'],                              c1:'#c8ff3d', c2:'#14110d' },
  { id:'premio-prem',  name:'Premio Premium',       short:'Premio Premium', group:'Esclusivi', kind:'special',
    codes:['A','B','C'],                            c1:'#f5b800', c2:'#14110d' },
  { id:'card-online',  name:'Card Online',          short:'Card Online',    group:'Esclusivi', kind:'special',
    codes:['CO'],                                   c1:'#7a5ae0', c2:'#001489' },
  { id:'autograph',    name:'Autograph',            short:'Autograph',      group:'Esclusivi', kind:'special',
    codes:pfx('AU',1,5),                            c1:'#14110d', c2:'#3a342a' },
];

window.GROUPS = ['Squadre Serie A','Speciali','Upgrade','Esclusivi','Limited Edition'];

window.STICKER_STATES = {
  // Base card 1-360 con bis
  '1':'missing','2':'missing','3':'missing','4':'missing','5':'missing','6':'missing','7':'missing','8':'missing','9':'missing','10':'missing','11':'missing','11bis':'missing','12':'missing','13':'missing','14':'missing','15':'missing','16':'missing','17':'missing','18':'missing',
  '19':'missing','20':'missing','21':'missing','22':'missing','23':'missing','24':'missing','25':'missing','26':'missing','27':'missing','27bis':'missing','28':'missing','29':'missing','30':'missing','31':'missing','32':'missing','33':'missing','33bis':'missing','34':'missing','35':'missing','36':'missing',
  '37':'missing','38':'missing','39':'missing','40':'missing','41':'missing','42':'missing','42bis':'missing','43':'missing','44':'missing','45':'missing','45bis':'missing','46':'missing','47':'missing','48':'missing','49':'missing','49bis':'missing','50':'missing','51':'missing','52':'missing','52bis':'missing','53':'missing','54':'missing',
  '55':'missing','56':'missing','57':'missing','58':'missing','59':'missing','60':'missing','60bis':'missing','61':'missing','62':'missing','63':'missing','64':'missing','65':'missing','66':'missing','67':'missing','68':'missing','69':'missing','70':'missing','70bis':'missing','71':'missing','72':'missing','72bis':'missing',
  '73':'missing','74':'missing','74bis':'missing','75':'missing','75bis':'missing','76':'missing','77':'missing','77bis':'missing','78':'missing','79':'missing','80':'missing','81':'missing','81bis':'missing','82':'missing','82bis':'missing','83':'missing','83bis':'missing','84':'missing','85':'missing','86':'missing','86bis':'missing','87':'missing','87bis':'missing','88':'missing','89':'missing','90':'missing',
  '91':'missing','92':'missing','93':'missing','93bis':'missing','94':'missing','95':'missing','96':'missing','97':'missing','98':'missing','99':'missing','100':'missing','101':'missing','102':'missing','103':'missing','104':'missing','105':'missing','106':'missing','107':'missing','107bis':'missing','108':'missing',
  '109':'missing','110':'missing','111':'missing','112':'missing','112bis':'missing','113':'missing','114':'missing','115':'missing','115bis':'missing','116':'missing','117':'missing','118':'missing','119':'missing','120':'missing','121':'missing','122':'missing','123':'missing','124':'missing','125':'missing','126':'missing',
  '127':'missing','128':'missing','129':'missing','130':'missing','131':'missing','131bis':'missing','132':'missing','133':'missing','133bis':'missing','134':'missing','135':'missing','136':'missing','137':'missing','138':'missing','139':'missing','140':'missing','141':'missing','142':'missing','142bis':'missing','143':'missing','144':'missing','144bis':'missing',
  '145':'missing','146':'missing','147':'missing','148':'missing','149':'missing','149bis':'missing','150':'missing','151':'missing','152':'missing','153':'missing','154':'missing','155':'missing','156':'missing','157':'missing','158':'missing','159':'missing','160':'missing','161':'missing','162':'missing',
  '163':'missing','164':'missing','165':'missing','166':'missing','167':'missing','168':'missing','169':'missing','170':'missing','171':'missing','172':'missing','172bis':'missing','173':'missing','174':'missing','175':'missing','176':'missing','176bis':'missing','177':'missing','178':'missing','179':'missing','180':'missing','180bis':'missing',
  '181':'missing','182':'missing','183':'missing','184':'missing','185':'missing','186':'missing','187':'missing','188':'missing','189':'missing','190':'missing','191':'missing','192':'missing','193':'missing','194':'missing','195':'missing','196':'missing','197':'missing','198':'missing',
  '199':'missing','200':'missing','201':'missing','202':'missing','202bis':'missing','203':'missing','204':'missing','205':'missing','206':'missing','207':'missing','208':'missing','209':'missing','210':'missing','211':'missing','212':'missing','213':'missing','214':'missing','214bis':'missing','215':'missing','216':'missing',
  '217':'missing','218':'missing','219':'missing','219bis':'missing','220':'missing','221':'missing','222':'missing','223':'missing','223bis':'missing','224':'missing','225':'missing','225bis':'missing','226':'missing','226bis':'missing','227':'missing','228':'missing','229':'missing','230':'missing','231':'missing','231bis':'missing','232':'missing','233':'missing','234':'missing',
  '235':'missing','236':'missing','237':'missing','238':'missing','239':'missing','240':'missing','241':'missing','242':'missing','243':'missing','244':'missing','245':'missing','246':'missing','247':'missing','248':'missing','249':'missing','250':'missing','250bis':'missing','251':'missing','252':'missing','252bis':'missing',
  '253':'missing','254':'missing','255':'missing','256':'missing','257':'missing','258':'missing','258bis':'missing','259':'missing','260':'missing','261':'missing','261bis':'missing','262':'missing','263':'missing','264':'missing','264bis':'missing','265':'missing','266':'missing','267':'missing','268':'missing','269':'missing','270':'missing',
  '271':'missing','272':'missing','273':'missing','273bis':'missing','274':'missing','275':'missing','275bis':'missing','276':'missing','277':'missing','278':'missing','279':'missing','280':'missing','281':'missing','282':'missing','283':'missing','283bis':'missing','284':'missing','285':'missing','285bis':'missing','286':'missing','287':'missing','288':'missing','288bis':'missing',
  '289':'missing','290':'missing','291':'missing','292':'missing','293':'missing','294':'missing','295':'missing','295bis':'missing','296':'missing','297':'missing','298':'missing','299':'missing','300':'missing','301':'missing','302':'missing','303':'missing','304':'missing','305':'missing','306':'missing',
  '307':'missing','308':'missing','309':'missing','310':'missing','311':'missing','312':'missing','313':'missing','314':'missing','315':'missing','316':'missing','317':'missing','318':'missing','318bis':'missing','319':'missing','320':'missing','321':'missing','321bis':'missing','322':'missing','323':'missing','324':'missing',
  '325':'missing','326':'missing','326bis':'missing','327':'missing','328':'missing','329':'missing','329bis':'missing','330':'missing','331':'missing','332':'missing','333':'missing','334':'missing','335':'missing','336':'missing','337':'missing','338':'missing','339':'missing','340':'missing','341':'missing','341bis':'missing','342':'missing',
  '343':'missing','344':'missing','345':'missing','346':'missing','346bis':'missing','347':'missing','348':'missing','349':'missing','350':'missing','351':'missing','352':'missing','353':'missing','354':'missing','355':'missing','355bis':'missing','356':'missing','357':'missing','357bis':'missing','358':'missing','358bis':'missing','359':'missing','359bis':'missing','360':'missing','360bis':'missing',
  // Triade
  '361':'missing','362':'missing','363':'missing','364':'missing','364bis':'missing','365':'missing','366':'missing','367':'missing','368':'missing','368bis':'missing','369':'missing','370':'missing','371':'missing','372':'missing','373':'missing','374':'missing','375':'missing','376':'missing','377':'missing','378':'missing','379':'missing','380':'missing','380bis':'missing',
  // Guanto d'Oro
  '381':'missing','382':'missing','383':'missing','384':'missing','385':'missing','386':'missing','387':'missing',
  // Diamante
  '388':'missing','389':'missing','390':'missing','391':'missing','392':'missing','393':'missing','394':'missing','395':'missing','396':'missing','397':'missing','398':'missing','399':'missing','400':'missing','400bis':'missing','401':'missing','401bis':'missing','402':'missing','403':'missing','404':'missing','405':'missing',
  // Air Force
  '406':'missing','407':'missing','408':'missing','408bis':'missing','409':'missing','409bis':'missing','410':'missing','410bis':'missing','411':'missing','412':'missing','413':'missing','414':'missing','414bis':'missing',
  // Influencer
  '415':'missing','416':'missing','417':'missing','417bis':'missing','418':'missing','419':'missing','420':'missing','421':'missing','422':'missing','423':'missing','424':'missing','425':'missing','426':'missing','427':'missing','428':'missing','429':'missing','430':'missing','431':'missing','432':'missing',
  // Impatto
  '433':'missing','434':'missing','435':'missing','436':'missing','437':'missing','438':'missing','439':'missing','440':'missing','441':'missing',
  // Super Stella
  '442':'missing','443':'missing','444':'missing','444bis':'missing','445':'missing','446':'missing','446bis':'missing','447':'missing','448':'missing','449':'missing','450':'missing','451':'missing','452':'missing','453':'missing','454':'missing','455':'missing','456':'missing','457':'missing','458':'missing','458bis':'missing','459':'missing','460':'missing','461':'missing','462':'missing','463':'missing','464':'missing','465':'missing','466':'missing','467':'missing','467bis':'missing',
  // Campioni-Mister
  '468':'missing','469':'missing','470':'missing','471':'missing','472':'missing','473':'missing','474':'missing','475':'missing','476':'missing','477':'missing','478':'missing','479':'missing','480':'missing','481':'missing','482':'missing','483':'missing','484':'missing','485':'missing','486':'missing','487':'missing','488':'missing','489':'missing','490':'missing','491':'missing','492':'missing','493':'missing','494':'missing','495':'missing','496':'missing','497':'missing','498':'missing',
  // NM
  'NM1':'missing','NM2':'missing','NM3':'missing','NM4':'missing','NM5':'missing','NM6':'missing','NM7':'missing','NM8':'missing','NM9':'missing','NM10':'missing','NM11':'missing',
  // Adreinrot
  'A1':'missing','A2':'missing','A3':'missing','A4':'missing','A5':'missing','A6':'missing','A7':'missing','A8':'missing','A9':'missing','A10':'missing','A11':'missing','A12':'missing','A13':'missing','A14':'missing','A15':'missing','A16':'missing','A17':'missing','A18':'missing','A19':'missing','A20':'missing',
  // Momentum
  'M1':'missing','M2':'missing','M3':'missing','M4':'missing','M5':'missing',
  // Upgrade U01-U44
  'U01':'missing','U02':'missing','U03':'missing','U04':'missing','U05':'missing','U06':'missing','U07':'missing','U08':'missing','U09':'missing','U10':'missing','U11':'missing','U12':'missing','U13':'missing','U14':'missing','U15':'missing','U16':'missing','U17':'missing','U18':'missing','U19':'missing','U20':'missing','U21':'missing','U22':'missing','U23':'missing','U24':'missing','U25':'missing','U26':'missing','U27':'missing','U28':'missing','U29':'missing','U30':'missing','U31':'missing','U32':'missing','U33':'missing','U34':'missing','U35':'missing','U36':'missing','U37':'missing','U38':'missing','U39':'missing','U40':'missing','U41':'missing','U42':'missing','U43':'missing','U44':'missing',
  // LE Standard
  'LE-AB':'missing','LE-ABE':'missing','LE-AJ':'missing','LE-CI':'missing','LE-JC':'missing','LE-KDB':'missing','LE-KDW':'missing','LE-LF':'missing','LE-LL':'missing','LE-LMO':'missing','LE-LS':'missing','LE-NK':'missing','LE-NM':'missing','LE-NP':'missing','LE-PK':'missing','LE-RO':'missing','LE-SL':'missing','LE-SR':'missing','LE-TA':'missing',
  // LE Kick-Off
  'LE-KO1':'missing','LE-KO2':'missing','LE-KO3':'missing',
  // LE Signature
  'LE-AJ-s':'missing','LE-LL-s':'missing','LE-NK-s':'missing','LE-RO-s':'missing',
  // LE Impatto
  'LE-AD':'missing','LE-AG':'missing','LE-AI':'missing','LE-AM':'missing','LE-FC':'missing','LE-FPE':'missing','LE-IK':'missing','LE-JF':'missing','LE-JM':'missing','LE-JR':'missing','LE-JV':'missing','LE-LB':'missing','LE-LC':'missing','LE-LM':'missing','LE-MN':'missing','LE-NEA':'missing','LE-NZ':'missing','LE-PE':'missing','LE-RP':'missing','LE-SB':'missing','LE-SE':'missing',
  // LE Premium Oro
  'LE-GI':'missing','LE-RG':'missing','LE-YF':'missing','LE-NPA':'missing',
  // LE Speciali
  'LE-HC':'missing','LE-ABU':'missing',
  // Upgrade LE
  'LEU-ED':'missing','LEU-JV':'missing','LEU-PD':'missing','LEU-RL':'missing','LEU-SM':'missing',
  // Printed Signature Upgrade
  'LEPU-ED':'missing','LEPU-JV':'missing','LEPU-MTB':'missing','LEPU-PD':'missing','LEPU-RL':'missing','LEPU-SM':'missing',
  // Autografo Originale
  'LEAU-MTB':'missing',
  // Extra Gold · Invincibile · Premio Premium · Card Online · Autograph
  'EG1':'missing','I1':'missing','I2':'missing','A':'missing','B':'missing','C':'missing','CO':'missing','AU1':'missing','AU2':'missing','AU3':'missing','AU4':'missing','AU5':'missing',
};
window.STICKER_COUNTS = {};

window.STICKER_NAMES = {
  // ATALANTA
  '1':'Logo','2':'Carnesecchi','3':'Kolašinac','4':'Djimsiti','5':'Bellanova','6':'Kossounou','7':'Scalvini','8':'Hien','9':'De Roon','10':'Éderson','11':'Sulemana','11bis':'Pasalic','12':'Samardžić','13':'Brescianini','14':'Lookman','15':'K. Sulemana','16':'De Ketelaere','17':'Maldini','18':'Scamacca',
  // BOLOGNA
  '19':'Logo','20':'Skorupski','21':'Ravaglia','22':'Lucumí','23':'Holm','24':'Vitík','25':'Miranda','26':'Moro','27':'Aebischer','27bis':'Pobega','28':'Freuler','29':'Ferguson','30':'Fabbian','31':'Orsolini','32':'Odgaard','33':'Ndoye','33bis':'Bernardeschi','34':'Castro','35':'Cambiaghi','36':'Dallinga',
  // CAGLIARI
  '37':'Logo','38':'Caprile','39':'Radunović','40':'Luperto','41':'Zappa','42':'Zortea','42bis':'Palestra','43':'Obert','44':'Mina','45':'Wieteska','45bis':'Mazzitelli','46':'Prati','47':'Adopo','48':'Deiola','49':'Marin','49bis':'Folorunsho','50':'Gaetano','51':'Felici','52':'Piccoli','52bis':'Borrelli','53':'Luvumbo','54':'Pavoletti',
  // COMO
  '55':'Logo','56':'Butez','57':'Smolčić','58':'Dossena','59':'Kempf','60':'Alli','60bis':'Vojvoda','61':'Baturina','62':'Perrone','63':'S. Roberto','64':'Caqueret','65':'Da Cunha','66':'Paz','67':'Rodríguez','68':'Addai','69':'Douvikas','70':'Strefezza','70bis':'Morata','71':'Diao','72':'Cutrone','72bis':'Kuhn',
  // CREMONESE
  '73':'Logo','74':'Fulignati','74bis':'Audero','75':'Saro','75bis':'Baschirotto','76':'Bianchetti','77':'Ravanelli','77bis':'Terracciano','78':'Folino','79':'Barbieri','80':'Ceccherini','81':'Azzi','81bis':'Pezzella','82':'Pickel','82bis':'Zerbin','83':'Castagnetti','83bis':'Bondo','84':'Collocolo','85':'Vandeputte','86':'Zanimacchia','86bis':'Vazquez','87':'Nasti','87bis':'Sanabria','88':'Bonazzoli','89':'Johnsen','90':'De Luca',
  // FIORENTINA
  '91':'Logo','92':'De Gea','93':'P. Terracciano','93bis':'Sohm','94':'Comuzzo','95':'Ranieri','96':'Marí','97':'Gosens','98':'Pongračić','99':'Viti','100':'Parisi','101':'Dodô','102':'Richardson','103':'Fagioli','104':'Mandragora','105':'Guðmundsson','106':'Džeko','107':'Beltran','107bis':'Piccoli','108':'Kean',
  // GENOA
  '109':'Logo','110':'Leali','111':'Vásquez','112':'Bani','112bis':'Ostigard','113':'Martín','114':'Sabelli','115':'De Winter','115bis':'Carboni','116':'Grønbæk','117':'Stanciu','118':'Masini','119':'Thorsby','120':'Frendrup','121':'Ellertsson','122':'Malinovskyi','123':'Ekhator','124':'Ekuban','125':'Colombo','126':'Vitinha',
  // HELLAS VERONA
  '127':'Logo','128':'Montipò','129':'Perilli','130':'Slotsager','131':'Ghilardi','131bis':'Ebosse','132':'Frese','133':'Tchatchoua','133bis':'Nelsson','134':'Oyegoke','135':'Bernède','136':'Kastanos','137':'Serdar','138':'Harroui','139':'Niasse','140':'Suslov','141':'Sarr','142':'Cisse','142bis':'Nunez','143':'Mosquera','144':'Livramento','144bis':'Cham',
  // INTER
  '145':'Logo','146':'Sommer','147':'J. Martínez','148':'Bastoni','149':'Pavard','149bis':'Calhanoglu','150':'Acerbi','151':'Dimarco','152':'C. Augusto','153':'Bisseck','154':'Dumfries','155':'Frattesi','156':'Barella','157':'Zieliński','158':'Mkhitaryan','159':'L. Henrique','160':'F.P. Esposito','161':'Thuram','162':'L. Martínez',
  // JUVENTUS
  '163':'Logo','164':'Di Gregorio','165':'Perin','166':'Bremer','167':'Gatti','168':'Kelly','169':'Cambiaso','170':'Kalulu','171':'Cabal','172':'A. Costa','172bis':'Zhegrova','173':'Locatelli','174':'K. Thuram','175':'Koopmeiners','176':'D. Luiz','176bis':'Conceição','177':'McKennie','178':'David','179':'Yıldız','180':'N. González','180bis':'Vlahovic',
  // LAZIO
  '181':'Logo','182':'Provedel','183':'Mandas','184':'Romagnoli','185':'Gila','186':'Tavares','187':'Marušić','188':'Vecino','189':'Rovella','190':'Belahyane','191':'Dele-Bashiru','192':'Zaccagni','193':'Guendouzi','194':'Isaksen','195':'Pedro','196':'Noslin','197':'Castellanos','198':'Dia',
  // LECCE
  '199':'Logo','200':'Falcone','201':'Früchtl','202':'Baschirotto','202bis':'Tiago Gabriel','203':'Kouassi','204':'Gaspar','205':'Gallo','206':'Morente','207':'Pierret','208':'Ramadani','209':'Helgason','210':'Coulibaly','211':'Rafia','212':'Camarda','213':'N\'Dri','214':'Krstović','214bis':'Sottil','215':'Banda','216':'Pierotti',
  // MILAN
  '217':'Logo','218':'Maignan','219':'Sportiello','219bis':'De Winter','220':'Pavlović','221':'Gabbia','222':'Tomori','223':'Thiaw','223bis':'Athekame','224':'Modrić','225':'Bondo','225bis':'Estupinan','226':'Jiménez','226bis':'Jashari','227':'Fofana','228':'Loftus-Cheek','229':'Ricci','230':'Saelemaekers','231':'Chukwueze','231bis':'Rabiot','232':'Leão','233':'Pulisic','234':'Giménez',
  // NAPOLI
  '235':'Logo','236':'Meret','237':'Juan Jesus','238':'Buongiorno','239':'Rrahmani','240':'Olivera','241':'Spinazzola','242':'Di Lorenzo','243':'Lobotka','244':'Gilmour','245':'McTominay','246':'Anguissa','247':'De Bruyne','248':'Neres','249':'Politano','250':'Raspadori','250bis':'Lang','251':'Lukaku','252':'Simeone','252bis':'Lucca',
  // PARMA
  '253':'Logo','254':'Suzuki','255':'Corvi','256':'Circati','257':'Delprato','258':'Leoni','258bis':'Ndiaye','259':'Valenti','260':'Valeri','261':'Kouda','261bis':'Sorensen','262':'Keita','263':'Bernabé','264':'Sohm','264bis':'Oristanio','265':'Ordóñez','266':'Almqvist','267':'Benedyczak','268':'Djurić','269':'Ondrejka','270':'Pellegrino',
  // PISA
  '271':'Logo','272':'Šemper','273':'Loria','273bis':'Lusuardi','274':'Angori','275':'Rus','275bis':'Calabresi','276':'Caracciolo','277':'Canestrelli','278':'Esteves','279':'Piccinini','280':'Touré','281':'M. Marin','282':'Højholt','283':'Vignato','283bis':'Aebischer','284':'Léris','285':'Arena','285bis':'Stengs','286':'Moreo','287':'Tramoni','288':'Lind','288bis':'Meister',
  // ROMA
  '289':'Logo','290':'Svilar','291':'Sangaré','292':'Angeliño','293':'Ndicka','294':'Mancini','295':'Salah-Eddine','295bis':'Tsimikas','296':'Rensch','297':'Çelik','298':'Koné','299':'Pisilli','300':'Pellegrini','301':'El Shaarawy','302':'Baldanzi','303':'Cristante','304':'Dybala','305':'Dovbyk','306':'Soulé',
  // SASSUOLO
  '307':'Logo','308':'Turati','309':'Satalino','310':'Doig','311':'Romagna','312':'Odenthal','313':'Pieragnolo','314':'Muharemović','315':'Boloca','316':'Iannoni','317':'Thorstvedt','318':'Ghion','318bis':'Idzes','319':'Volpato','320':'Laurienté','321':'Mulattieri','321bis':'Fadera','322':'Pierini','323':'Moro','324':'Berardi',
  // TORINO
  '325':'Logo','326':'Milinković-Savić','326bis':'Israel','327':'Schuurs','328':'Masina','329':'Walukiewicz','329bis':'Asllani','330':'Maripán','331':'Coco','332':'Biraghi','333':'Pedersen','334':'Ismajli','335':'Lazaro','336':'Casadei','337':'Gineitis','338':'Anjorin','339':'Vlašić','340':'Adams','341':'Sanabria','341bis':'Ngonge','342':'Zapata',
  // UDINESE
  '343':'Logo','344':'Okoye','345':'Sava','346':'Giannetti','346bis':'Goglichidze','347':'Kamara','348':'Solet','349':'T. Kristensen','350':'Zemura','351':'Ehizibue','352':'Lovrić','353':'Karlström','354':'Ekkelenkamp','355':'Payero','355bis':'Piotrowski','356':'Atta','357':'Thauvin','357bis':'Zaniolo','358':'Sánchez','358bis':'Bayo','359':'Brenner','359bis':'Buksa','360':'L. Luca','360bis':'Davis',
  // SEZIONI SPECIALI (nomi generici)
  '361':'Triade','362':'Triade','363':'Triade','364':'Triade','364bis':'Triade','365':'Triade','366':'Triade','367':'Triade','368':'Triade','368bis':'Triade','369':'Triade','370':'Triade','371':'Triade','372':'Triade','373':'Triade','374':'Triade','375':'Triade','376':'Triade','377':'Triade','378':'Triade','379':'Triade','380':'Triade','380bis':'Triade',
  '381':'Guanto d\'Oro','382':'Guanto d\'Oro','383':'Guanto d\'Oro','384':'Guanto d\'Oro','385':'Guanto d\'Oro','386':'Guanto d\'Oro','387':'Guanto d\'Oro',
  '388':'Diamante','389':'Diamante','390':'Diamante','391':'Diamante','392':'Diamante','393':'Diamante','394':'Diamante','395':'Diamante','396':'Diamante','397':'Diamante','398':'Diamante','399':'Diamante','400':'Diamante','400bis':'Diamante','401':'Diamante','401bis':'Diamante','402':'Diamante','403':'Diamante','404':'Diamante','405':'Diamante',
  '406':'Air Force','407':'Air Force','408':'Air Force','408bis':'Air Force','409':'Air Force','409bis':'Air Force','410':'Air Force','410bis':'Air Force','411':'Air Force','412':'Air Force','413':'Air Force','414':'Air Force','414bis':'Air Force',
  '415':'Influencer','416':'Influencer','417':'Influencer','417bis':'Influencer','418':'Influencer','419':'Influencer','420':'Influencer','421':'Influencer','422':'Influencer','423':'Influencer','424':'Influencer','425':'Influencer','426':'Influencer','427':'Influencer','428':'Influencer','429':'Influencer','430':'Influencer','431':'Influencer','432':'Influencer',
  '433':'Impatto','434':'Impatto','435':'Impatto','436':'Impatto','437':'Impatto','438':'Impatto','439':'Impatto','440':'Impatto','441':'Impatto',
  '442':'Super Stella','443':'Super Stella','444':'Super Stella','444bis':'Super Stella','445':'Super Stella','446':'Super Stella','446bis':'Super Stella','447':'Super Stella','448':'Super Stella','449':'Super Stella','450':'Super Stella','451':'Super Stella','452':'Super Stella','453':'Super Stella','454':'Super Stella','455':'Super Stella','456':'Super Stella','457':'Super Stella','458':'Super Stella','458bis':'Super Stella','459':'Super Stella','460':'Super Stella','461':'Super Stella','462':'Super Stella','463':'Super Stella','464':'Super Stella','465':'Super Stella','466':'Super Stella','467':'Super Stella','467bis':'Super Stella',
  '468':'Campioni','469':'Golden Baller','470':'Golden Baller','471':'Golden Baller','472':'Golden Baller','473':'Golden Baller','474':'Golden Baller',
  '475':'Super Golden Baller','476':'Carta Speciale','477':'Carta Speciale','478':'Carta Speciale',
  '479':'Mister','480':'Mister','481':'Mister','482':'Mister','483':'Mister','484':'Mister','485':'Mister','486':'Mister','487':'Mister','488':'Mister','489':'Mister','490':'Mister','491':'Mister','492':'Mister','493':'Mister','494':'Mister','495':'Mister','496':'Mister','497':'Mister','498':'Mister',
  // Prefissate
  'NM1':'New Master','NM2':'New Master','NM3':'New Master','NM4':'New Master','NM5':'New Master','NM6':'New Master','NM7':'New Master','NM8':'New Master','NM9':'New Master','NM10':'New Master','NM11':'New Master',
  'A1':'Adreinrot','A2':'Adreinrot','A3':'Adreinrot','A4':'Adreinrot','A5':'Adreinrot','A6':'Adreinrot','A7':'Adreinrot','A8':'Adreinrot','A9':'Adreinrot','A10':'Adreinrot','A11':'Adreinrot','A12':'Adreinrot','A13':'Adreinrot','A14':'Adreinrot','A15':'Adreinrot','A16':'Adreinrot','A17':'Adreinrot','A18':'Adreinrot','A19':'Adreinrot','A20':'Adreinrot',
  'M1':'Momentum','M2':'Momentum','M3':'Momentum','M4':'Momentum','M5':'Momentum',
  'U01':'Winter Stars','U02':'Winter Stars','U03':'Winter Stars','U04':'Winter Stars','U05':'Winter Stars','U06':'Winter Stars','U07':'Winter Stars','U08':'Winter Stars','U09':'Winter Stars','U10':'Winter Stars','U11':'Winter Stars','U12':'Winter Stars','U13':'Winter Stars','U14':'Winter Stars','U15':'Winter Stars','U16':'Winter Stars','U17':'Winter Stars','U18':'Winter Stars','U19':'Winter Stars','U20':'Winter Stars',
  'U21':'Rookie','U22':'Rookie','U23':'Rookie','U24':'Rookie','U25':'Rookie','U26':'Rookie','U27':'Rookie','U28':'Rookie','U29':'Rookie','U30':'Rookie','U31':'Rookie','U32':'Rookie','U33':'Rookie','U34':'Rookie','U35':'Rookie','U36':'Rookie','U37':'Rookie','U38':'Rookie','U39':'Rookie','U40':'Rookie',
  'U41':'Upgrade Speciale','U42':'Upgrade Speciale','U43':'Upgrade Speciale','U44':'Upgrade Speciale',
  'LE-AB':'Limited Edition','LE-ABE':'Limited Edition','LE-AJ':'Limited Edition','LE-CI':'Limited Edition','LE-JC':'Limited Edition','LE-KDB':'Limited Edition','LE-KDW':'Limited Edition','LE-LF':'Limited Edition','LE-LL':'Limited Edition','LE-LMO':'Limited Edition','LE-LS':'Limited Edition','LE-NK':'Limited Edition','LE-NM':'Limited Edition','LE-NP':'Limited Edition','LE-PK':'Limited Edition','LE-RO':'Limited Edition','LE-SL':'Limited Edition','LE-SR':'Limited Edition','LE-TA':'Limited Edition',
  'LE-KO1':'LE Kick-Off','LE-KO2':'LE Kick-Off','LE-KO3':'LE Kick-Off',
  'LE-AJ-s':'LE Signature','LE-LL-s':'LE Signature','LE-NK-s':'LE Signature','LE-RO-s':'LE Signature',
  'LE-AD':'LE Impatto','LE-AG':'LE Impatto','LE-AI':'LE Impatto','LE-AM':'LE Impatto','LE-FC':'LE Impatto','LE-FPE':'LE Impatto','LE-IK':'LE Impatto','LE-JF':'LE Impatto','LE-JM':'LE Impatto','LE-JR':'LE Impatto','LE-JV':'LE Impatto','LE-LB':'LE Impatto','LE-LC':'LE Impatto','LE-LM':'LE Impatto','LE-MN':'LE Impatto','LE-NEA':'LE Impatto','LE-NZ':'LE Impatto','LE-PE':'LE Impatto','LE-RP':'LE Impatto','LE-SB':'LE Impatto','LE-SE':'LE Impatto',
  'LE-GI':'LE Premium Oro','LE-RG':'LE Premium Oro','LE-YF':'LE Premium Oro','LE-NPA':'LE Premium Oro',
  'LE-HC':'LE Speciale','LE-ABU':'LE Speciale',
  'LEU-ED':'Upgrade LE','LEU-JV':'Upgrade LE','LEU-PD':'Upgrade LE','LEU-RL':'Upgrade LE','LEU-SM':'Upgrade LE',
  'LEPU-ED':'Printed Signature','LEPU-JV':'Printed Signature','LEPU-MTB':'Printed Signature','LEPU-PD':'Printed Signature','LEPU-RL':'Printed Signature','LEPU-SM':'Printed Signature',
  'LEAU-MTB':'Autografo Originale',
  'EG1':'Extra Gold','I1':'Invincibile','I2':'Invincibile','A':'Premio Premium','B':'Premio Premium','C':'Premio Premium','CO':'Card Online',
  'AU1':'Autograph','AU2':'Autograph','AU3':'Autograph','AU4':'Autograph','AU5':'Autograph',
};

window.albumStats = function(){
  let have=0,missing=0,doubles=0,extras=0;
  for(const c in window.STICKER_STATES){
    const s=window.STICKER_STATES[c];
    if(s==='have')have++;
    else if(s==='missing')missing++;
    else if(s==='double'){have++;doubles++;extras+=(window.STICKER_COUNTS[c]||2)-1;}
  }
  return {have,missing,doubles,total:have+missing,ownedSlots:have,totalPhysical:have+extras};
};

const FB_STORAGE_KEY = 'figubook-adrenalyn-2526-v1';

(function loadFromStorage(){
  try {
    const raw = localStorage.getItem(FB_STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved && typeof saved === 'object'){
      if (saved.states) for (const c in saved.states) { if (c in window.STICKER_STATES) window.STICKER_STATES[c] = saved.states[c]; }
      if (saved.counts) for (const c in saved.counts) { if (c in window.STICKER_STATES) window.STICKER_COUNTS[c] = saved.counts[c]; }
      if (saved.names) Object.assign(window.STICKER_NAMES, saved.names);
    }
  } catch(e) {}
})();

window.saveAlbum = function(){
  try { localStorage.setItem(FB_STORAGE_KEY, JSON.stringify({v:1,states:window.STICKER_STATES,counts:window.STICKER_COUNTS,names:window.STICKER_NAMES,ts:Date.now()})); } catch(e) {}
};
window.resetAlbum = function(){ try { localStorage.removeItem(FB_STORAGE_KEY); } catch(e) {} location.reload(); };
