# Dev Roadmap — Full-Stack 2026 (appunti)

Fonte: carosello Instagram (Dev Roadmap, 5 slide + mappa mentale).
Salvato: 2026-06-30.

Percorso per diventare full-stack developer: Frontend + Backend.

---

## FASE 1 — FRONTEND (in ordine)
1. **HTML & CSS** — fondamenta di ogni sito (box, testo, colori, layout)
2. **JavaScript** — rende le pagine interattive/dinamiche (variabili, funzioni, DOM, eventi)
3. **Responsive Design** — approccio mobile-first (Flexbox, Grid, Media Queries)
4. **Git & GitHub** — controllo versione non negoziabile (commit, branch, pull request)
5. **React / Vue / Angular** — scegli UN framework e padroneggialo (componenti, state, hooks, routing)

### Frontend Tools (level up workflow)
npm/pnpm · Webpack/Vite · TypeScript · Tailwind CSS · Testing (Jest) · REST/GraphQL · CI/CD Basics · Docker intro · Web Performance

> Pro tip: padroneggia HTML/CSS + JS PRIMA di saltare a qualsiasi framework.

---

## FASE 2 — BACKEND (in ordine)
1. **Pick a Language** — Python, JavaScript (Node), Java, Go, PHP, Ruby — inizia con UNO
2. **Databases** — SQL: PostgreSQL/MySQL · NoSQL: MongoDB/Redis
3. **APIs & REST** — costruire e consumare REST API (metodi HTTP, status code, JSON)
4. **Auth & Security** — JWT, sessioni, OAuth, hashing, HTTPS, env variables
5. **Cloud & DevOps** — AWS/GCP/Azure basics, Docker, CI/CD, Nginx

---

## Riepilogo Full Stack

| Frontend | Backend |
|----------|---------|
| HTML + CSS | Node / Python |
| JavaScript | SQL + NoSQL |
| React/Vue/Angular | REST APIs |
| TypeScript | Auth & Security |
| Tailwind CSS | Docker + Cloud |
| Testing + CI/CD | Microservices |

### Timeline
- **0-3 mesi** → HTML/CSS/JS
- **3-6 mesi** → Framework + Git
- **6-12 mesi** → Backend + API
- **12+ mesi** → Full Stack 🏆

---

## Mappa mentale Web Development
- **Front End**
  - Language: HTML, CSS, JavaScript
  - Framework: React, Vue, Angular
  - Libraries: jQuery, Tailwind, Bootstrap
- **Back End**
  - Language: Node.js, Python, PHP, Ruby, Java
  - Database: MySQL, MongoDB, PostgreSQL
  - API: REST, GraphQL

---

## Rilevanza per FiguBook / me
Lato **Frontend** già coperto in buona parte: FiguBook usa React, Vite, TypeScript, Git/GitHub, deploy CI (GitHub Actions/Pages).

Lato **Backend** = punto più leggero, perché FiguBook è serverless Firebase → si saltano molti pezzi del backend tradizionale (niente linguaggio server, niente SQL a mano, auth gestita da Firebase Auth, scaling/DB da Google).

Pezzo backend che conta davvero qui: **Auth & Security** — infatti l'audit security 2026-06-30 tocca proprio questo (regole Firestore, email verificata, App Check, restrizione API key). Vedi docs/superpowers/specs/2026-06-30-security-audit-fixes.md.
