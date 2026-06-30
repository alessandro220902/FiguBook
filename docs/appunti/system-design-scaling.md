# System Design — Come scalano i sistemi (appunti)

Fonte: carosello Instagram @victor.premium.connect — "Software Engineering Series" (9 slide).
Salvato: 2026-06-30.

I 6 mattoni per servire milioni di utenti con esperienza veloce e affidabile.

---

## 1. Load Balancer (bilanciatore di carico)
Distribuisce il traffico su più server invece di schiacciarne uno solo.

- Metafora: 1 cassiere per 1000 persone ❌ vs 10 cassieri ✅
- Fa health check: server malato → rimosso dalla rotazione

**Strategie:**
- Round Robin — richieste distribuite a turno, equamente
- Least Connections — va al server con meno connessioni attive
- IP Hash — stesso IP client → sempre stesso server
- Health Checks — server non sani tolti automaticamente
- Geographic Routing — utente instradato al data center più vicino

**Esempi reali:** Netflix (streaming globale), Uber (corse), Instagram (reel/feed), Pay (pagamenti).

---

## 2. Caching Layers (cache)
Dati richiesti spesso tenuti in memoria/vicino all'utente → non si colpisce ogni volta il DB.

- **Cache Hit** = dato in cache → risposta lampo
- **Cache Miss** = non in cache → vai al DB, poi salvi in cache per la prossima

**Perché conta:** riduce carico DB, migliora tempi di risposta, abbatte costi infrastruttura.

**Soluzioni:** Redis (in-memory), Memcached, Amazon ElastiCache, DynamoDB (DAX), CDN, browser cache.

**Cosa si cacha:** sessioni utente, risposte API, dati prodotto, classifiche/feed, configurazioni/feature flag.

---

## 3. Databases That Scale (DB scalabili)
Il DB deve reggere milioni di richieste senza diventare il collo di bottiglia.

- **Primary (Write)** — gestisce le scritture, consistenza dati
- **Read Replicas** — copie sola-lettura, gestiscono il traffico di lettura, scalano orizzontalmente

**Strategie di scaling:**
- Read Replicas — distribuisci letture su più copie
- Sharding — spezzi i dati su più DB per chiave/regione
- Partitioning — spezzi tabelle grandi in pezzi gestibili
- Backups — backup regolari per durabilità e sicurezza

---

## 4. CDN (Content Delivery Network)
Contenuti statici (immagini, video, CSS, JS) serviti da edge server vicini all'utente.

- Edge locations globali (es. Lagos, Nairobi, Londra)
- Meno latenza, caricamenti più veloci, meno carico sui server origine

**Cosa fanno:** contenuti più veloci nel mondo, meno latenza, scaricano traffico dall'origine, migliorano affidabilità, reggono i picchi.

---

## 5. Microservices Architecture
Invece di una sola app monolitica → tanti servizi piccoli e indipendenti che collaborano.

- Es: User Service, Payment Service, Order Service, Notification Service — ognuno col suo DB
- Davanti: API Gateway

**Vantaggi:**
- Independent Scaling — scali solo ciò che serve
- Faster Deployments — deploy senza downtime
- Fault Isolation — se un servizio cade, gli altri reggono
- Tech Flexibility — stack migliore per ogni servizio
- Better Maintainability — codebase piccole più gestibili

---

## 6. Putting It All Together
Tutti i mattoni insieme = prodotto veloce e affidabile a scala enorme.

CDN + API/Microservices + Load Balancing + Caching + Databases.

> "Great products aren't just about features. They're about systems that scale."

**Real world:** Netflix (video globali), Uber (match rider/driver real-time), Instagram (miliardi di post/like/storie), Pay (milioni di pagamenti sicuri).

---

## Rilevanza per FiguBook (oggi)
Quasi nulla da costruire a mano. FiguBook = serverless Firebase → Google fornisce già load balancing, replica DB, CDN, scaling automatici sotto il cofano.

Già nostro gratis:
- **CDN** → GitHub Pages serve la SPA da edge
- **Browser cache** → asset versionati `?v=N`
- **DB scalabile + load balancing** → Firestore (gestito Google)

Quando ripensarci davvero: decine di migliaia di utenti attivi, query lente, o logica server-side (Cloud Functions per notifiche/anti-spam — già nei deferred dell'audit security). Per ora = cultura generale, non lavoro.
