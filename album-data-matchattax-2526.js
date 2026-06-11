// Match Attax UEFA Champions League 2025-2026 — Topps
// 574 figurine numeriche + 10 Jersey Relic (RS1–RS10)

function nums(s,e){const a=[];for(let i=s;i<=e;i++)a.push(String(i));return a;}
function pfx(p,s,e){const a=[];for(let i=s;i<=e;i++)a.push(p+i);return a;}

window.SECTIONS = [
  { id:'ucl-tots',       name:'UCL Team of the Season', short:'UCL TOTS',       group:'Apertura',      kind:'opening-trofei', codes:nums(1,25),    c1:'#001489', c2:'#0055a5' },
  { id:'hat-trick',      name:'Hat Trick Hero Legend',  short:'Hat Trick Hero', group:'Leggende',      kind:'special',        codes:nums(26,41),   c1:'#f5b800', c2:'#7a5a00' },
  { id:'ajax',           name:'AFC Ajax',                short:'Ajax',           group:'Squadre UCL',   kind:'team',           codes:nums(42,55),   c1:'#d4011d', c2:'#f4f4f4' },
  { id:'arsenal',        name:'Arsenal FC',              short:'Arsenal',        group:'Squadre UCL',   kind:'team',           codes:nums(56,69),   c1:'#EF0107', c2:'#9C1B00' },
  { id:'monaco',         name:'AS Monaco',               short:'Monaco',         group:'Squadre UCL',   kind:'team',           codes:nums(70,83),   c1:'#D4071A', c2:'#f4f4f4' },
  { id:'atalanta',       name:'Atalanta BC',             short:'Atalanta',       group:'Squadre UCL',   kind:'team',           codes:nums(84,97),   c1:'#001f5b', c2:'#1a1a1a' },
  { id:'athletic',       name:'Athletic Bilbao',         short:'Athletic Bilbao',group:'Squadre UCL',   kind:'team',           codes:nums(98,111),  c1:'#c01010', c2:'#f4f4f4' },
  { id:'atletico',       name:'Atletico de Madrid',      short:'Atletico Madrid',group:'Squadre UCL',   kind:'team',           codes:nums(112,125), c1:'#ce3024', c2:'#003087' },
  { id:'bayer',          name:'Bayer 04 Leverkusen',     short:'Bayer Leverkusen',group:'Squadre UCL',  kind:'team',           codes:nums(126,139), c1:'#e32221', c2:'#1a1a1a' },
  { id:'dortmund',       name:'Borussia Dortmund',       short:'Dortmund',       group:'Squadre UCL',   kind:'team',           codes:nums(140,153), c1:'#fde100', c2:'#14110d' },
  { id:'chelsea',        name:'Chelsea FC',              short:'Chelsea',        group:'Squadre UCL',   kind:'team',           codes:nums(154,167), c1:'#034694', c2:'#0a2a6a' },
  { id:'frankfurt',      name:'Eintracht Frankfurt',     short:'Frankfurt',      group:'Squadre UCL',   kind:'team',           codes:nums(168,181), c1:'#E1000F', c2:'#1a1a1a' },
  { id:'barcelona',      name:'FC Barcelona',            short:'Barcellona',     group:'Squadre UCL',   kind:'team',           codes:nums(182,195), c1:'#a50044', c2:'#004d98' },
  { id:'bayern',         name:'FC Bayern München',       short:'Bayern Monaco',  group:'Squadre UCL',   kind:'team',           codes:nums(196,209), c1:'#dc052d', c2:'#0066b2' },
  { id:'inter',          name:'FC Internazionale Milano',short:'Inter',          group:'Squadre UCL',   kind:'team',           codes:nums(210,223), c1:'#010E80', c2:'#1a1a1a' },
  { id:'galatasaray',    name:'Galatasaray',             short:'Galatasaray',    group:'Squadre UCL',   kind:'team',           codes:nums(224,237), c1:'#e6372e', c2:'#f5900f' },
  { id:'juventus',       name:'Juventus',                short:'Juventus',       group:'Squadre UCL',   kind:'team',           codes:nums(238,251), c1:'#1a1a1a', c2:'#f4f4f4' },
  { id:'liverpool',      name:'Liverpool FC',            short:'Liverpool',      group:'Squadre UCL',   kind:'team',           codes:nums(252,265), c1:'#c8102e', c2:'#00b2a9' },
  { id:'leading-legacy', name:'Leading Legacy',          short:'Leading Legacy', group:'Leggende',      kind:'special',        codes:nums(266,285), c1:'#f5b800', c2:'#7a5a00' },
  { id:'first-sticker',  name:'1st Sticker',             short:'1st Sticker',    group:'Speciali',      kind:'special',        codes:nums(286,297), c1:'#0ea5e9', c2:'#001489' },
  { id:'man-city',       name:'Manchester City',         short:'Man. City',      group:'Squadre UCL',   kind:'team',           codes:nums(298,311), c1:'#6CABDD', c2:'#1c2c5b' },
  { id:'newcastle',      name:'Newcastle United FC',     short:'Newcastle',      group:'Squadre UCL',   kind:'team',           codes:nums(312,325), c1:'#1a1a1a', c2:'#f4f4f4' },
  { id:'olympiacos',     name:'Olympiacos FC',           short:'Olympiacos',     group:'Squadre UCL',   kind:'team',           codes:nums(326,339), c1:'#cf122d', c2:'#f4f4f4' },
  { id:'marseille',      name:'Olympique de Marseille',  short:'Marsiglia',      group:'Squadre UCL',   kind:'team',           codes:nums(340,353), c1:'#009BDE', c2:'#0c1d5e' },
  { id:'psg',            name:'Paris Saint-Germain',     short:'PSG',            group:'Squadre UCL',   kind:'team',           codes:nums(354,367), c1:'#003a70', c2:'#da291c' },
  { id:'psv',            name:'PSV Eindhoven',           short:'PSV',            group:'Squadre UCL',   kind:'team',           codes:nums(368,381), c1:'#c01010', c2:'#f4f4f4' },
  { id:'real-madrid',    name:'Real Madrid CF',          short:'Real Madrid',    group:'Squadre UCL',   kind:'team',           codes:nums(382,395), c1:'#f4f4f4', c2:'#ffd700' },
  { id:'slavia',         name:'SK Slavia Prague',        short:'Slavia Prague',  group:'Squadre UCL',   kind:'team',           codes:nums(396,409), c1:'#cc0000', c2:'#f4f4f4' },
  { id:'sporting',       name:'Sporting CP',             short:'Sporting CP',    group:'Squadre UCL',   kind:'team',           codes:nums(410,423), c1:'#005e21', c2:'#f4f4f4' },
  { id:'napoli',         name:'SSC Napoli',              short:'Napoli',         group:'Squadre UCL',   kind:'team',           codes:nums(424,437), c1:'#00a8e0', c2:'#0a3a8b' },
  { id:'tottenham',      name:'Tottenham Hotspur FC',    short:'Tottenham',      group:'Squadre UCL',   kind:'team',           codes:nums(438,451), c1:'#132257', c2:'#f4f4f4' },
  { id:'union-sg',       name:'Royale Union Saint-Gilloise', short:'Union SG',  group:'Squadre UCL',   kind:'team',           codes:nums(452,465), c1:'#f5b800', c2:'#0a3a8b' },
  { id:'villarreal',     name:'Villarreal CF',           short:'Villarreal',     group:'Squadre UCL',   kind:'team',           codes:nums(466,479), c1:'#ffd600', c2:'#1a1a1a' },
  { id:'brugge',         name:'Club Brugge KV',          short:'Club Brugge',    group:'Altre Squadre', kind:'team',           codes:nums(480,491), c1:'#003087', c2:'#1a1a1a' },
  { id:'copenhagen',     name:'FC Copenhagen',           short:'Copenhagen',     group:'Altre Squadre', kind:'team',           codes:nums(492,503), c1:'#003087', c2:'#f4f4f4' },
  { id:'kairat',         name:'Kairat Almaty',           short:'Kairat',         group:'Altre Squadre', kind:'team',           codes:nums(504,515), c1:'#f5b800', c2:'#14110d' },
  { id:'bodo-glimt',     name:'FK Bodø/Glimt',          short:'Bodø/Glimt',     group:'Altre Squadre', kind:'team',           codes:nums(516,527), c1:'#fde100', c2:'#1a1a1a' },
  { id:'pafos',          name:'FC Pafos',                short:'Pafos',          group:'Altre Squadre', kind:'team',           codes:nums(528,539), c1:'#14110d', c2:'#ff7a3d' },
  { id:'qarabag',        name:'Qarabag FK',              short:'Qarabag',        group:'Altre Squadre', kind:'team',           codes:nums(540,551), c1:'#14110d', c2:'#a01d2e' },
  { id:'benfica',        name:'SL Benfica',              short:'Benfica',        group:'Altre Squadre', kind:'team',           codes:nums(552,563), c1:'#cc0000', c2:'#8B0000' },
  { id:'youth-league',   name:'UEFA Youth League',       short:'Youth League',   group:'Speciali',      kind:'special',        codes:['564','565','566'], c1:'#001489', c2:'#0055a5' },
  { id:'energy-legend',  name:'Energy Legend',           short:'Energy Legend',  group:'Leggende',      kind:'special',        codes:nums(567,574), c1:'#f5b800', c2:'#7a5a00' },
  { id:'jersey-relic',   name:'Jersey Relic',            short:'Jersey Relic',   group:'Speciali',      kind:'special',        codes:pfx('RS',1,10),c1:'#7a5ae0', c2:'#4a2a8b' },
];

window.GROUPS = ['Apertura', 'Leggende', 'Squadre UCL', 'Altre Squadre', 'Speciali'];

window.STICKER_STATES = {'1':'missing','2':'missing','3':'missing','4':'missing','5':'missing','6':'missing','7':'missing','8':'missing','9':'missing','10':'missing','11':'missing','12':'missing','13':'missing','14':'missing','15':'missing','16':'missing','17':'missing','18':'missing','19':'missing','20':'missing','21':'missing','22':'missing','23':'missing','24':'missing','25':'missing','26':'missing','27':'missing','28':'missing','29':'missing','30':'missing','31':'missing','32':'missing','33':'missing','34':'missing','35':'missing','36':'missing','37':'missing','38':'missing','39':'missing','40':'missing','41':'missing','42':'missing','43':'missing','44':'missing','45':'missing','46':'missing','47':'missing','48':'missing','49':'missing','50':'missing','51':'missing','52':'missing','53':'missing','54':'missing','55':'missing','56':'missing','57':'missing','58':'missing','59':'missing','60':'missing','61':'missing','62':'missing','63':'missing','64':'missing','65':'missing','66':'missing','67':'missing','68':'missing','69':'missing','70':'missing','71':'missing','72':'missing','73':'missing','74':'missing','75':'missing','76':'missing','77':'missing','78':'missing','79':'missing','80':'missing','81':'missing','82':'missing','83':'missing','84':'missing','85':'missing','86':'missing','87':'missing','88':'missing','89':'missing','90':'missing','91':'missing','92':'missing','93':'missing','94':'missing','95':'missing','96':'missing','97':'missing','98':'missing','99':'missing','100':'missing','101':'missing','102':'missing','103':'missing','104':'missing','105':'missing','106':'missing','107':'missing','108':'missing','109':'missing','110':'missing','111':'missing','112':'missing','113':'missing','114':'missing','115':'missing','116':'missing','117':'missing','118':'missing','119':'missing','120':'missing','121':'missing','122':'missing','123':'missing','124':'missing','125':'missing','126':'missing','127':'missing','128':'missing','129':'missing','130':'missing','131':'missing','132':'missing','133':'missing','134':'missing','135':'missing','136':'missing','137':'missing','138':'missing','139':'missing','140':'missing','141':'missing','142':'missing','143':'missing','144':'missing','145':'missing','146':'missing','147':'missing','148':'missing','149':'missing','150':'missing','151':'missing','152':'missing','153':'missing','154':'missing','155':'missing','156':'missing','157':'missing','158':'missing','159':'missing','160':'missing','161':'missing','162':'missing','163':'missing','164':'missing','165':'missing','166':'missing','167':'missing','168':'missing','169':'missing','170':'missing','171':'missing','172':'missing','173':'missing','174':'missing','175':'missing','176':'missing','177':'missing','178':'missing','179':'missing','180':'missing','181':'missing','182':'missing','183':'missing','184':'missing','185':'missing','186':'missing','187':'missing','188':'missing','189':'missing','190':'missing','191':'missing','192':'missing','193':'missing','194':'missing','195':'missing','196':'missing','197':'missing','198':'missing','199':'missing','200':'missing','201':'missing','202':'missing','203':'missing','204':'missing','205':'missing','206':'missing','207':'missing','208':'missing','209':'missing','210':'missing','211':'missing','212':'missing','213':'missing','214':'missing','215':'missing','216':'missing','217':'missing','218':'missing','219':'missing','220':'missing','221':'missing','222':'missing','223':'missing','224':'missing','225':'missing','226':'missing','227':'missing','228':'missing','229':'missing','230':'missing','231':'missing','232':'missing','233':'missing','234':'missing','235':'missing','236':'missing','237':'missing','238':'missing','239':'missing','240':'missing','241':'missing','242':'missing','243':'missing','244':'missing','245':'missing','246':'missing','247':'missing','248':'missing','249':'missing','250':'missing','251':'missing','252':'missing','253':'missing','254':'missing','255':'missing','256':'missing','257':'missing','258':'missing','259':'missing','260':'missing','261':'missing','262':'missing','263':'missing','264':'missing','265':'missing','266':'missing','267':'missing','268':'missing','269':'missing','270':'missing','271':'missing','272':'missing','273':'missing','274':'missing','275':'missing','276':'missing','277':'missing','278':'missing','279':'missing','280':'missing','281':'missing','282':'missing','283':'missing','284':'missing','285':'missing','286':'missing','287':'missing','288':'missing','289':'missing','290':'missing','291':'missing','292':'missing','293':'missing','294':'missing','295':'missing','296':'missing','297':'missing','298':'missing','299':'missing','300':'missing','301':'missing','302':'missing','303':'missing','304':'missing','305':'missing','306':'missing','307':'missing','308':'missing','309':'missing','310':'missing','311':'missing','312':'missing','313':'missing','314':'missing','315':'missing','316':'missing','317':'missing','318':'missing','319':'missing','320':'missing','321':'missing','322':'missing','323':'missing','324':'missing','325':'missing','326':'missing','327':'missing','328':'missing','329':'missing','330':'missing','331':'missing','332':'missing','333':'missing','334':'missing','335':'missing','336':'missing','337':'missing','338':'missing','339':'missing','340':'missing','341':'missing','342':'missing','343':'missing','344':'missing','345':'missing','346':'missing','347':'missing','348':'missing','349':'missing','350':'missing','351':'missing','352':'missing','353':'missing','354':'missing','355':'missing','356':'missing','357':'missing','358':'missing','359':'missing','360':'missing','361':'missing','362':'missing','363':'missing','364':'missing','365':'missing','366':'missing','367':'missing','368':'missing','369':'missing','370':'missing','371':'missing','372':'missing','373':'missing','374':'missing','375':'missing','376':'missing','377':'missing','378':'missing','379':'missing','380':'missing','381':'missing','382':'missing','383':'missing','384':'missing','385':'missing','386':'missing','387':'missing','388':'missing','389':'missing','390':'missing','391':'missing','392':'missing','393':'missing','394':'missing','395':'missing','396':'missing','397':'missing','398':'missing','399':'missing','400':'missing','401':'missing','402':'missing','403':'missing','404':'missing','405':'missing','406':'missing','407':'missing','408':'missing','409':'missing','410':'missing','411':'missing','412':'missing','413':'missing','414':'missing','415':'missing','416':'missing','417':'missing','418':'missing','419':'missing','420':'missing','421':'missing','422':'missing','423':'missing','424':'missing','425':'missing','426':'missing','427':'missing','428':'missing','429':'missing','430':'missing','431':'missing','432':'missing','433':'missing','434':'missing','435':'missing','436':'missing','437':'missing','438':'missing','439':'missing','440':'missing','441':'missing','442':'missing','443':'missing','444':'missing','445':'missing','446':'missing','447':'missing','448':'missing','449':'missing','450':'missing','451':'missing','452':'missing','453':'missing','454':'missing','455':'missing','456':'missing','457':'missing','458':'missing','459':'missing','460':'missing','461':'missing','462':'missing','463':'missing','464':'missing','465':'missing','466':'missing','467':'missing','468':'missing','469':'missing','470':'missing','471':'missing','472':'missing','473':'missing','474':'missing','475':'missing','476':'missing','477':'missing','478':'missing','479':'missing','480':'missing','481':'missing','482':'missing','483':'missing','484':'missing','485':'missing','486':'missing','487':'missing','488':'missing','489':'missing','490':'missing','491':'missing','492':'missing','493':'missing','494':'missing','495':'missing','496':'missing','497':'missing','498':'missing','499':'missing','500':'missing','501':'missing','502':'missing','503':'missing','504':'missing','505':'missing','506':'missing','507':'missing','508':'missing','509':'missing','510':'missing','511':'missing','512':'missing','513':'missing','514':'missing','515':'missing','516':'missing','517':'missing','518':'missing','519':'missing','520':'missing','521':'missing','522':'missing','523':'missing','524':'missing','525':'missing','526':'missing','527':'missing','528':'missing','529':'missing','530':'missing','531':'missing','532':'missing','533':'missing','534':'missing','535':'missing','536':'missing','537':'missing','538':'missing','539':'missing','540':'missing','541':'missing','542':'missing','543':'missing','544':'missing','545':'missing','546':'missing','547':'missing','548':'missing','549':'missing','550':'missing','551':'missing','552':'missing','553':'missing','554':'missing','555':'missing','556':'missing','557':'missing','558':'missing','559':'missing','560':'missing','561':'missing','562':'missing','563':'missing','564':'missing','565':'missing','566':'missing','567':'missing','568':'missing','569':'missing','570':'missing','571':'missing','572':'missing','573':'missing','574':'missing','RS1':'missing','RS2':'missing','RS3':'missing','RS4':'missing','RS5':'missing','RS6':'missing','RS7':'missing','RS8':'missing','RS9':'missing','RS10':'missing'};
window.STICKER_COUNTS = {};

window.STICKER_NAMES = {
  // UCL TEAM OF THE SEASON (1-25)
  '1':'UCL TOTS','2':'UCL TOTS','3':'UCL TOTS','4':'UCL TOTS','5':'UCL TOTS',
  '6':'UCL TOTS','7':'UCL TOTS','8':'UCL TOTS','9':'UCL TOTS','10':'UCL TOTS',
  '11':'UCL TOTS','12':'UCL TOTS','13':'UCL TOTS','14':'UCL TOTS','15':'UCL TOTS',
  '16':'UCL TOTS','17':'UCL TOTS','18':'UCL TOTS','19':'UCL TOTS','20':'UCL TOTS',
  '21':'UCL TOTS','22':'UCL TOTS','23':'UCL TOTS','24':'UCL TOTS','25':'UCL TOTS',
  // HAT TRICK HERO LEGEND (26-41)
  '26':'Asprilla','27':'Del Piero','28':'Ronaldo','29':'Rooney','30':'Messi',
  '31':'Adriano','32':'Ronaldinho','33':'Kaka','34':'Olic','35':'Bale',
  '36':'Lewandowski','37':'Gnabry','38':'Salah','39':'Haaland','40':'Raphinha','41':'Mbappe',
  // AFC AJAX (42-55)
  '42':'Stemma','43':'Klaassen','44':'Jaros','45':'Itakura','46':'Baas',
  '47':'Wijndal','48':'Berghuis','49':'Godts','50':'Rosa','51':'Taylor',
  '52':'Fitz-Jim','53':'Gloukh','54':'Moro','55':'Squadra',
  // ARSENAL FC (56-69)
  '56':'Stemma','57':'Odegaard','58':'Raya','59':'Saliba','60':'Zubimendi',
  '61':'Merino','62':'Magalhaes','63':'Lewis-Skelly','64':'Nwaneri','65':'Rice',
  '66':'Saka','67':'Gyokeres','68':'Eze','69':'Havertz',
  // AS MONACO (70-83)
  '70':'Stemma','71':'Zakaria','72':'Hradecky','73':'Caio Henrique','74':'Vanderson',
  '75':'Dier','76':'Minamino','77':'Akliouche','78':'Mawissa','79':'Camara',
  '80':'Pogba','81':'Biereth','82':'Fati','83':'Balogun',
  // ATALANTA BC (84-97)
  '84':'Stemma','85':'De Roon','86':'Carnesecchi','87':'Hien','88':'Scalvini',
  '89':'Ederson','90':'Djimsiti','91':'Ahanor','92':'Pasalic','93':'Bellanova',
  '94':'De Ketelaere','95':'Maldini','96':'Scamacca','97':'Lookman',
  // ATHLETIC BILBAO (98-111)
  '98':'Stemma','99':'I. Williams','100':'Simon','101':'Vivian','102':'Paredes',
  '103':'Jauregizar','104':'Berchiche','105':'Boiro','106':'Sancet','107':'Prados',
  '108':'Berenguer','109':'Gomez','110':'N. Williams','111':'Guruzeta',
  // ATLETICO DE MADRID (112-125)
  '112':'Stemma','113':'Koke','114':'Oblak','115':'Gimenez','116':'Hancko',
  '117':'Le Normand','118':'Griezmann','119':'Simeone','120':'Llorente','121':'Gallagher',
  '122':'Barrios','123':'Baena','124':'Alvarez','125':'Sorloth',
  // BAYER 04 LEVERKUSEN (126-139)
  '126':'Stemma','127':'Andrich','128':'Flekken','129':'Grimaldo','130':'Vazquez',
  '131':'Quansah','132':'Fernandez','133':'Maza','134':'Garcia','135':'Tella',
  '136':'Tillman','137':'Echeverri','138':'Ben Seghir','139':'Schick',
  // BORUSSIA DORTMUND (140-153)
  '140':'Stemma','141':'Can','142':'Kobel','143':'Couto','144':'Svensson',
  '145':'Schlotterbeck','146':'Brandt','147':'Beier','148':'Anton','149':'Sabitzer',
  '150':'Gross','151':'Nmecha','152':'Guirassy','153':'Adeyemi',
  // CHELSEA FC (154-167)
  '154':'Stemma','155':'James','156':'Sanchez','157':'Cucurella','158':'Adarabioyo',
  '159':'Caicedo','160':'Fernandez','161':'Estevao','162':'Palmer','163':'Garnacho',
  '164':'Neto','165':'Delap','166':'Joao Pedro','167':'Gittens',
  // EINTRACHT FRANKFURT (168-181)
  '168':'Stemma','169':'Koch','170':'Zetterer','171':'Theate','172':'Brown',
  '173':'Kristensen','174':'Gotze','175':'Uzun','176':'Knauff','177':'Larsson',
  '178':'Chaibi','179':'Doan','180':'Batshuayi','181':'Burkardt',
  // FC BARCELONA (182-195)
  '182':'Stemma','183':'Ter Stegen','184':'J. Garcia','185':'Araujo','186':'Balde',
  '187':'De Jong','188':'Kounde','189':'Cubarsi','190':'Pedri','191':'Gavi',
  '192':'Raphinha','193':'Lewandowski','194':'Yamal','195':'Rashford',
  // FC BAYERN MÜNCHEN (196-209)
  '196':'Stemma','197':'Neuer','198':'Kim','199':'Upamecano','200':'Davies',
  '201':'Tah','202':'Kimmich','203':'Pavlovic','204':'Goretzka','205':'Musiala',
  '206':'Jackson','207':'Diaz','208':'Kane','209':'Olise',
  // FC INTERNAZIONALE MILANO (210-223)
  '210':'Stemma','211':'L. Martinez','212':'Sommer','213':'Bastoni','214':'Dumfries',
  '215':'Dimarco','216':'Mkhitaryan','217':'Sucic','218':'C. Augusto','219':'Akanji',
  '220':'Barella','221':'Calhanoglu','222':'L. Henrique','223':'Thuram',
  // GALATASARAY (224-237)
  '224':'Stemma','225':'Icardi','226':'Guvenc','227':'Bardakci','228':'Sanchez',
  '229':'Singo','230':'Sane','231':'Yilmaz','232':'Gundogan','233':'Torreira',
  '234':'Sara','235':'Sallai','236':'Akgun','237':'Osimhen',
  // JUVENTUS (238-251)
  '238':'Stemma','239':'Locatelli','240':'Di Gregorio','241':'Gatti','242':'Cambiaso',
  '243':'Kelly','244':'Bremer','245':'Joao Mario','246':'Kalulu','247':'K. Thuram',
  '248':'Koopmeiners','249':'Conceicao','250':'David','251':'Yildiz',
  // LIVERPOOL FC (252-265)
  '252':'Stemma','253':'Van Dijk','254':'Alisson','255':'Kerkez','256':'Konate',
  '257':'Frimpong','258':'Salah','259':'Wirtz','260':'Mac Allister','261':'Szoboszlai',
  '262':'Gravenberch','263':'Isak','264':'Gakpo','265':'Ekitike',
  // LEADING LEGACY (266-285)
  '266':'Casillas','267':'Effenberg','268':'Maldini','269':'Renard','270':'Xavi',
  '271':'Schmeichel','272':'Gerrard','273':'Little','274':'Azpilicueta','275':'Iniesta',
  '276':'Lahm','277':'Guijarro','278':'Zanetti','279':'Marquinhos','280':'Lampard',
  '281':'Putellas','282':'Gundogan','283':'Ferdinand','284':'Sammer','285':'Neuer',
  // 1ST STICKER (286-297)
  '286':'Mokio','287':'Mbaye','288':'Mouzakitis','289':'Ngumoha','290':'Dro',
  '291':'Karl','292':'Urbig','293':'Tape','294':'Vagiannidis','295':'Bellingham',
  '296':'G. Garcia','297':'Leoni',
  // MANCHESTER CITY (298-311)
  '298':'Stemma','299':'B. Silva','300':'Donnarumma','301':'Gvardiol','302':'Khusanov',
  '303':'Dias','304':'Foden','305':'Cherki','306':'N. Gonzalez','307':'Rodri',
  '308':'Reijnders','309':'Haaland','310':'Doku','311':'Marmoush',
  // NEWCASTLE UNITED FC (312-325)
  '312':'Stemma','313':'Guimaraes','314':'Pope','315':'Burn','316':'Livramento',
  '317':'Joelinton','318':'Trippier','319':'Hall','320':'Tonali','321':'Ramsey',
  '322':'Wissa','323':'Gordon','324':'Elanga','325':'Woltemade',
  // OLYMPIACOS FC (326-339)
  '326':'Stemma','327':'Retsos','328':'Tzolakis','329':'Rodinei','330':'Ortega',
  '331':'Pirola','332':'El Kaabi','333':'Hezze','334':'Costinha','335':'D. Garcia',
  '336':'Chiquinho','337':'Yaremchuk','338':'Taremi','339':'Martins',
  // OLYMPIQUE DE MARSEILLE (340-353)
  '340':'Stemma','341':'Balerdi','342':'Rulli','343':'Murillo','344':'Egan-Riley',
  '345':'Pavard','346':'Hojbjerg','347':'Gomes','348':'Kondogbia','349':'Greenwood',
  '350':'Paixao','351':'Aubameyang','352':'Gouiri','353':'Weah',
  // PARIS SAINT-GERMAIN (354-367)
  '354':'Stemma','355':'Marquinhos','356':'Chevalier','357':'Pacho','358':'Mendes',
  '359':'Hakimi','360':'Vitinha','361':'Neves','362':'Zaire-Emery','363':'F. Ruiz',
  '364':'Dembele','365':'Kvaratskhelia','366':'Doue','367':'Barcola',
  // PSV EINDHOVEN (368-381)
  '368':'Stemma','369':'Schouten','370':'Kovar','371':'Flamingo','372':'Dest',
  '373':'Saibari','374':'Til','375':'Bajraktarevic','376':'Veerman','377':'Wanner',
  '378':'Perisic','379':'Pepi','380':'Van Bommel','381':'Man',
  // REAL MADRID CF (382-395)
  '382':'Stemma','383':'Carvajal','384':'Courtois','385':'Rudiger','386':'Huijsen',
  '387':'Carreras','388':'Vinicius Jr.','389':'Mastantuono','390':'Alexander-Arnold',
  '391':'Valverde','392':'Camavinga','393':'Bellingham','394':'Mbappe','395':'Endrick',
  // SK SLAVIA PRAGUE (396-409)
  '396':'Stemma','397':'Boril','398':'Stanek','399':'Zima','400':'Holes',
  '401':'Oscar','402':'Schranz','403':'Kusej','404':'Provod','405':'Sadilek',
  '406':'Zafeiris','407':'Doudera','408':'Chory','409':'Chytil',
  // SPORTING CP (410-423)
  '410':'Stemma','411':'Hjulmand','412':'R. Silva','413':'Diomande','414':'Inacio',
  '415':'Debast','416':'Reis','417':'Presneda','418':'Araujo','419':'Catamo',
  '420':'P. Goncalves','421':'Quenda','422':'L. Suarez','423':'Trincao',
  // SSC NAPOLI (424-437)
  '424':'Stemma','425':'Di Lorenzo','426':'Meret','427':'Beukema','428':'Olivera',
  '429':'Buongiorno','430':'McTominay','431':'Gilmour','432':'Lobotka','433':'Anguissa',
  '434':'De Bruyne','435':'Lukaku','436':'Neres','437':'Lang',
  // TOTTENHAM HOTSPUR FC (438-451)
  '438':'Stemma','439':'Romero','440':'Vicario','441':'Porro','442':'Van de Ven',
  '443':'Gray','444':'Palhinha','445':'Bergvall','446':'Simons','447':'Richarlison',
  '448':'Kolo Muani','449':'Kudus','450':'Johnson','451':'Solanke',
  // ROYALE UNION SAINT-GILLOISE (452-465)
  '452':'Stemma','453':'Burgess','454':'Chambaere','455':'Sykes','456':'Zorgane',
  '457':'Van de Perre','458':'Mac Allister','459':'Leysen','460':'Ait El Hadj',
  '461':'Rodriguez','462':'David','463':'Fuseini','464':'Niang','465':'Khalaili',
  // VILLARREAL CF (466-479)
  '466':'Stemma','467':'Moreno','468':'Junior','469':'Cardona','470':'Marin',
  '471':'Gueye','472':'Foyth','473':'Navarro','474':'Comesana','475':'Mikautadze',
  '476':'Moleiro','477':'Pepe','478':'Perez','479':'Buchanan',
  // CLUB BRUGGE KV (480-491)
  '480':'Stemma','481':'Vanaken','482':'Mignolet','483':'Ordonez','484':'Mechele',
  '485':'Spileers','486':'Spileers','487':'Onyedika','488':'Stankovic','489':'Tzolis',
  '490':'Forbs','491':'Vermant',
  // FC COPENHAGEN (492-503)
  '492':'Stemma','493':'Claesson','494':'Kotarski','495':'Huescas','496':'Pereira',
  '497':'Hatzidiakos','498':'Meling','499':'Lerager','500':'Elyounoussi',
  '501':'Cornelius','502':'Larsson','503':'Moukoko',
  // KAIRAT ALMATY (504-515)
  '504':'Stemma','505':'Martinovich','506':'Zarutskiy','507':'Mata','508':'Tapalov',
  '509':'Sorokin','510':'Arad','511':'Glazer','512':'Gromyko','513':'Edmilson',
  '514':'Jorginho','515':'Satpayev',
  // FK BODØ/GLIMT (516-527)
  '516':'Stemma','517':'Berg','518':'Haikin','519':'Bjorkan','520':'Sjovold',
  '521':'Bjortuft','522':'Aleesami','523':'Evjen','524':'Saltnes','525':'Hogh',
  '526':'Maatta','527':'Hauge',
  // FC PAFOS (528-539)
  '528':'Stemma','529':'Goldar','530':'Michael','531':'Luckassen','532':'Bruno',
  '533':'Pileas','534':'Sunjic','535':'Pepe','536':'Dragomir','537':'Orsic',
  '538':'Correia','539':'A. Silva',
  // QARABAG FK (540-551)
  '540':'Stemma','541':'Huseynov','542':'Kochalski','543':'M. Silva','544':'Mustafazade',
  '545':'Medina','546':'Bicalho','547':'Addai','548':'Borges','549':'Akhundzade',
  '550':'Andrade','551':'Zoubir',
  // SL BENFICA (552-563)
  '552':'Stemma','553':'Otamendi','554':'Trubin','555':'Dedic','556':'A. Silva',
  '557':'Dahl','558':'Rios','559':'Aursnes','560':'Barreiro','561':'Barrenechea',
  '562':'Pavlidis','563':'Schjelderup',
  // UEFA YOUTH LEAGUE (564-566)
  '564':'UEFA Youth League','565':'UEFA Youth League','566':'Junyent',
  // ENERGY LEGEND (567-574)
  '567':'Zidane','568':'Messi','569':'Drogba','570':'Henry',
  '571':'Muller','572':'Milito','573':'Seedorf','574':'Buffon',
  // JERSEY RELIC (RS1-RS10)
  'RS1':'Gakpo','RS2':'Foden','RS3':'E. Fernandez','RS4':'Solanke','RS5':'Camavinga',
  'RS6':'Vitinha','RS7':'Griezmann','RS8':'Raphinha','RS9':'Thuram','RS10':'Scalvini',
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

const FB_STORAGE_KEY = 'figubook-matchattax-ucl-2526-v1';


window.saveAlbum = function(){ /* persistenza gestita da Firestore, vedi figubook-db.js */ };
window.resetAlbum = function(){ /* reset gestito da figubook-album-single.js via Firestore */ };
