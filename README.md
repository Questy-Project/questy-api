<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="100" alt="Nest Logo" /></a>
</p>

<h1 align="center">Questy API</h1>

<p align="center">API backend de <a href="https://questy.vercel.app">Questy</a>, qui transforme la progression personnelle (sport, lecture, créativité, apprentissage...) en jeu de rôle.</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white" alt="NestJS 11" />
  <img src="https://img.shields.io/badge/TypeORM-PostgreSQL-336791?logo=postgresql&logoColor=white" alt="TypeORM + PostgreSQL" />
  <img src="https://img.shields.io/badge/license-proprietary-lightgrey" alt="License" />
  <a href="https://github.com/Questy-Project/questy-api/actions/workflows/keepalive.yml"><img src="https://github.com/Questy-Project/questy-api/actions/workflows/keepalive.yml/badge.svg" alt="Keepalive status" /></a>
</p>

---

## Sommaire

- [À propos](#à-propos)
- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Architecture des modules](#architecture-des-modules)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Lancer le projet](#lancer-le-projet)
- [Endpoints](#endpoints)
- [Tâches planifiées & seeders](#tâches-planifiées--seeders)
- [Tests](#tests)
- [Déploiement](#déploiement)
- [Ressources](#ressources)

## À propos

Questy API expose les données et la logique métier de [Questy](https://questy.vercel.app) : journal d'activités auto-déclaré, progression RPG d'un avatar (6 statistiques), défis quotidiens (physiques ou générés par IA), quiz de lecture IA, combats de tournoi contre l'avatar d'autres joueurs et classements. Consommée exclusivement par le frontend [`questy-web`](https://github.com/Questy-Project/questy-web).

## Fonctionnalités

- 🔐 **Authentification** JWT (inscription / connexion)
- 🏃 **Suivi d'activités** auto-déclaré (durée + intensité), ~140 activités réparties en 20 catégories (sport, lecture, musique, langues, arts, écriture, jeux de réflexion, code...), chacune liée à 1-2 des 6 statistiques de l'avatar
- 🧙 **Avatar RPG** : niveau, XP par statistique (courbe logarithmique plafonnée à 100), classe de héros calculée dynamiquement (simple ou hybride selon les stats dominantes), personnalisation libre et gratuite
- 🎯 **Défis quotidiens** : 1 par statistique, catalogue tournant sur 10 semaines — 4 stats en auto-déclaratif (objectif ou chrono, sans vérification), 2 stats (Intelligence, Esprit) en IA conversationnelle (quiz de culture générale, énigmes), consommant un « cœur » par tentative
- 📖 **Quiz de lecture IA** : quiz de compréhension généré dynamiquement sur un livre précis pour valider une activité de lecture déclarée
- 🫀 **Cœurs (parts)** : monnaie d'énergie (stock max 12) gagnée via activités/quiz, dépensée sur les défis, qui se déplète automatiquement et se recharge une fois par nuit
- ⚔️ **Tournoi** : combat contre l'avatar (stats + apparence réelles) d'un adversaire tiré au sort parmi les autres comptes, dont les actions sont jouées automatiquement par une IA de combat pondérée sur ses stats — asynchrone, pas de temps réel entre deux joueurs connectés. 1 combat/jour max, classement hebdomadaire
- 🏆 **Classement mensuel** alimenté par les points de tournoi, paliers par percentile avec récompense en pièces et reset mensuel des statistiques
- 🛠️ **Back-office admin** : gestion des utilisateurs, déclenchement manuel des tâches planifiées

## Stack technique

| Domaine | Choix |
|---|---|
| Framework | [NestJS 11](https://nestjs.com/) |
| ORM / BDD | [TypeORM](https://typeorm.io/) + PostgreSQL |
| Auth | JWT (`@nestjs/jwt`) + `passport-jwt` |
| Validation | `class-validator` / `class-transformer` via `ValidationPipe` global |
| IA | [OpenRouter](https://openrouter.ai) — fallback automatique entre 2 modèles gratuits si l'un est rate-limité |
| Tâches planifiées | `@nestjs/schedule` |
| Tests | Jest (unitaires + e2e) |
| Conteneurisation | Docker (image multi-stage) |

## Architecture des modules

Un module NestJS par domaine métier (`controller` / `service` / `module` / `dto` / `entities`) :

| Module | Rôle |
|---|---|
| `auth` | Authentification JWT (Passport) |
| `users` | Comptes utilisateurs |
| `activities` | Catalogue et journal des activités auto-déclarées |
| `avatar` | Progression RPG (niveau, 6 statistiques, classe de héros) et personnalisation |
| `parts` | Monnaie d'énergie « cœurs » (dépense/gain, déplétion et recharge automatiques) |
| `quiz` | Quiz de lecture générés par IA (OpenRouter), liés à une activité de lecture |
| `challenges` | Catalogue de défis quotidiens (physiques + IA), sessions et logs de complétion |
| `tournament` | Combats asynchrones contre l'avatar d'un adversaire tiré au sort + classement hebdomadaire |
| `rank` | Classement mensuel (alimenté par les points de tournoi) |
| `admin` | Gestion des joueurs, déclenchement manuel des crons, seeders |
| `health` | Endpoint de healthcheck (utilisé par le keep-alive Render) |

## Prérequis

- Node.js 20+
- PostgreSQL 16 (ou Docker)
- Une clé API OpenRouter (fonctionnalités IA)

## Installation

```powershell
git clone https://github.com/Questy-Project/questy-api.git
cd questy-api
npm install
Copy-Item .env.example .env
```

## Configuration

Renseigner `.env` :

| Variable | Description |
|---|---|
| `DATABASE_URL` | Chaîne de connexion PostgreSQL (`postgres://user:password@host:port/db`) |
| `JWT_SECRET` | Secret de signature des tokens JWT |
| `JWT_EXPIRES_IN` | Durée de validité des tokens (ex : `7d`) |
| `OPENROUTER_API_KEY` | Clé API OpenRouter (génération IA des quiz/défis) |
| `FRONTEND_URL` | Origine autorisée pour le CORS (ex : `http://localhost:3001`) |
| `PORT` | Port d'écoute de l'API (défaut `3000`) |
| `NODE_ENV` | `development` \| `production` — désactive `synchronize` TypeORM et les seeders en production |

## Lancer le projet

### Avec Docker (recommandé en dev)

```powershell
docker compose up -d
```

Démarre PostgreSQL (exposé en local sur le port `5433`) et l'API en mode watch (port `3000`), avec le code source monté pour le hot-reload.

### En local sans Docker

```powershell
# développement (watch mode)
npm run start:dev

# production
npm run build
npm run start:prod
```

L'API est exposée sous le préfixe `/api` (ex : `http://localhost:3000/api/health`).

## Endpoints

Tous préfixés par `/api`. Sauf mention contraire, les routes nécessitent un JWT (`JwtAuthGuard`, header `Authorization: Bearer <token>`).

| Module | Routes |
|---|---|
| `health` | `GET /health` *(public)* |
| `auth` | `POST /auth/register`, `POST /auth/login` *(publics)* |
| `users` | `GET /users/me`, `PATCH /users/me` |
| `activities` | `GET /activities`, `GET /activities/log`, `POST /activities/log` |
| `quiz` | `POST /quiz/start`, `POST /quiz/message` |
| `challenges` | `GET /challenges/today`, `POST /challenges/ia/{start,message,skip,abandon}`, `POST /challenges/:id/{start,complete,abandon,skip}` |
| `avatar` | `GET /avatar/me`, `PATCH /avatar/customization` |
| `parts` | `GET /parts/me` |
| `tournament` | `GET /tournament/status`, `POST /tournament/claim-slot`, `GET /tournament/combat/current`, `POST /tournament/combat/start`, `POST /tournament/combat/:id/turn`, `GET /tournament/ranking` |
| `rank` | `GET /rank/me`, `GET /rank/leaderboard` |
| `admin` | `POST /admin/crons/{monthly-reset,parts-recharge}`, `GET /admin/users`, `PATCH /admin/users/:id/{stats,parts,rank}`, `POST /admin/users/:id/reset` — requiert en plus `RolesGuard` (rôle admin) |

## Tâches planifiées & seeders

- `@nestjs/schedule` pilote les tâches récurrentes : déplétion des cœurs (3×/jour), recharge nightly des cœurs, clôture hebdomadaire du tournoi, clôture mensuelle du classement + reset des statistiques. La recharge des cœurs et le reset mensuel sont aussi déclenchables manuellement via `POST /admin/crons/*`.
- Les seeders (`admin`, `activities`, `challenges`) s'exécutent automatiquement au démarrage (`OnModuleInit`) et sont **désactivés en production** (`NODE_ENV=production`), pour peupler la base de données en développement.

## Tests

```powershell
npm run test        # unitaires
npm run test:e2e    # end-to-end
npm run test:cov    # couverture
```

## Déploiement

| Composant | Hébergeur |
|---|---|
| API | [Render](https://render.com) — Web Service déployé depuis le `Dockerfile` (stage `production`) |
| Base de données | [Neon](https://neon.tech) — PostgreSQL managé |
| Anti-cold-start | GitHub Actions ([`keepalive.yml`](.github/workflows/keepalive.yml)) — ping `GET /api/health` toutes les 10 min |

API en production : `https://questy-api.onrender.com/api`.

## Ressources

- [Documentation NestJS](https://docs.nestjs.com)
- [Documentation TypeORM](https://typeorm.io/)
- [Frontend Questy (questy-web)](https://github.com/Questy-Project/questy-web)
