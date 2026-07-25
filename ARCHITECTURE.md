# NUR — Technical Architecture Document

**Status:** Draft — aligned with PRD v1.0.0  
**Version:** 1.0.0  
**Last updated:** 2026-07-25  
**Rule:** No application code until PRD is approved. This document defines *how* the system will be built.

---

## 1. Purpose

This document defines the complete technical architecture for **NUR**:

- System context and boundaries
- Technology stack (binding)
- Deployment topology
- Clean architecture layers
- Feature-based folder structures
- Auth, security, data, and API patterns
- Cross-cutting concerns (errors, logging, config, testing)
- Production readiness constraints

It replaces any prior informal architecture notes. If a later doc conflicts with this one on stack or separation rules, **this document wins** until explicitly revised.

---

## 2. Architecture Goals

| Goal | Implication |
| --- | --- |
| Separation | Frontend, Backend, Database are independent systems |
| Scalability | Features can grow without rewriting the core |
| Production readiness | No demo shortcuts, no fake data paths |
| Clean boundaries | UI ≠ HTTP ≠ business rules ≠ persistence |
| Trust & safety | AuthZ on every mutation; content publish gates |
| Operability | Deploy, monitor, and roll back each tier independently |

### 2.1 Non-Negotiable Constraints

1. Frontend / Backend / Database must be **completely separated**.
2. Follow **clean architecture** principles.
3. Use **feature-based** folder structure.
4. Everything must be **scalable** and **production ready**.
5. **No shortcuts. No demo code. No placeholder code. No fake data.**
6. Stack below is **binding** for the entire project unless a formal architecture revision is approved.

---

## 3. Binding Technology Stack

### 3.1 Frontend

| Technology | Role |
| --- | --- |
| React.js | UI library |
| Vite | Build tool / dev server |
| TypeScript | Type-safe application code |
| Tailwind CSS | Styling system |
| Framer Motion | Motion / transitions |
| React Router | Client-side routing |
| Zustand | Client state management |
| Axios | HTTP client |
| Lucide React | Icon system |

### 3.2 Backend

| Technology | Role |
| --- | --- |
| Node.js | Runtime |
| Express.js | HTTP framework |
| JWT | Authentication tokens |
| REST API | Public/backend contract style |
| Multer | File uploads **only if necessary** |

### 3.3 Database

| Technology | Role |
| --- | --- |
| MongoDB Atlas | Managed database |
| Mongoose ODM | Schemas, validation, queries |

### 3.4 Deployment

| Tier | Platform |
| --- | --- |
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |

### 3.5 Explicitly Out of Stack (v1)

- Next.js (unless architecture is formally revised)
- GraphQL
- Prisma / SQL (v1)
- Redux / React Query as defaults (may revisit; Zustand + Axios is baseline)
- Monorepo requirement (optional later; start with two repos or two top-level apps)

---

## 4. System Context

```text
┌─────────────────────────────────────────────────────────────┐
│                         Users                                │
│              (Browser / Mobile Web)                          │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Vercel)                        │
│         React + Vite + TS + Tailwind + Zustand               │
│         Talks ONLY to Backend via REST (Axios)               │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS + JWT
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend (Render)                         │
│              Node.js + Express + REST                        │
│     Auth • Qur’an • Podcasts • Books • Research • Admin      │
└───────────────────────────┬─────────────────────────────────┘
                            │ TLS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Database (MongoDB Atlas)                    │
│                     Mongoose ODM                             │
└─────────────────────────────────────────────────────────────┘

Optional later (not required to start coding after approval):
- Object storage / CDN for audio & covers
- Email provider for password reset
- Uptime monitor hitting GET /health
```

### 4.1 Separation Rules

| Rule | Detail |
| --- | --- |
| FE never talks to MongoDB | All data access through Backend REST |
| BE never imports FE code | Shared types only via explicit contract docs or a future shared package |
| DB has no business UI knowledge | Schemas store domain data, not Tailwind class names |
| Secrets never in FE | `VITE_*` only for public config (API base URL) |
| One deploy ≠ one rewrite | Each tier deploys independently |

---

## 5. High-Level Component View

```text
FRONTEND
├── app shell (layout, routing, theme)
├── features (auth, quran, podcasts, books, research, library, admin)
├── shared UI primitives
├── services (Axios API modules)
└── stores (Zustand)

BACKEND
├── transport (Express routes, middleware)
├── application (controllers / use-case orchestration)
├── domain (services / business rules)
├── infrastructure (Mongoose models, mailer, storage)
└── config / security / errors

DATABASE
└── collections per domain + indexes + migrations/seed strategy for verified Qur’an dataset only
```

---

## 6. Clean Architecture (Backend)

Dependency rule: **outer layers depend inward; domain does not depend on Express or Mongoose types leaking upward unchecked.**

Practical Express mapping (production-pragmatic clean architecture):

```text
HTTP Request
    ↓
Route (path + middleware only)
    ↓
Controller (parse/validate input, map HTTP ↔ DTO, call service)
    ↓
Service (business rules, orchestration, authz checks)
    ↓
Repository / Model (persistence)
    ↓
MongoDB Atlas
```

### 6.1 Layer Responsibilities

| Layer | May do | Must not do |
| --- | --- | --- |
| Route | Mount paths, attach middleware | Business logic, direct DB calls |
| Controller | Validate request shape, status codes | Embed complex domain rules |
| Service | Domain rules, transactions orchestration | Touch `req`/`res` objects |
| Model/Repo | Queries, indexes, schema constraints | HTTP concerns, JWT parsing |
| Middleware | Auth, rate limit, logging | Feature business decisions |

### 6.2 Feature Module Shape (Backend)

Each feature owns its vertical slice:

```text
feature-name/
├── feature.routes.ts
├── feature.controller.ts
├── feature.service.ts
├── feature.validation.ts
├── feature.types.ts
└── feature.model.ts          # or models/ subfolder if multiple
```

Shared kernels (auth middleware, error handler, logger) live outside features.

---

## 7. Frontend Architecture

### 7.1 Principles

1. **Feature-based** folders — not type-based dumping grounds (`components/`, `hooks/` mega-folders as primary structure).
2. **Pages compose features**; features own UI + hooks + local store slices if needed.
3. **API access only through service modules** (Axios) — no raw Axios in random components.
4. **Zustand for client state** (auth session mirror, player state, UI preferences).
5. **Server state** fetched via services; avoid inventing a second backend in the client.
6. **Route-level code splitting** where it improves TTI.
7. **No fake fixtures in production builds.**

### 7.2 State Ownership

| State | Owner |
| --- | --- |
| Access/refresh tokens strategy | Auth store + http-only or secure storage policy (see Auth) |
| Current user profile | Auth store (hydrated from `/me`) |
| Audio player (now playing, queue) | Player store (Zustand) |
| Qur’an reading settings | Preferences store + persisted user settings API |
| Server entities (surahs, episodes) | Fetched on demand; cache lightly in feature stores if needed |

### 7.3 Routing Map (Logical)

```text
/                    Home
/login               Auth
/register            Auth
/quran               Surah list
/quran/:surahNumber  Reader/player
/podcasts            Series list
/podcasts/:slug      Series detail
/podcasts/:slug/:episodeSlug  Episode focus (optional)
/books               Catalog
/books/:slug         Book detail
/books/:slug/:chapterSlug  Reader
/research            List
/research/:slug      Article
/library             Continue / favorites / bookmarks
/settings            Profile & preferences
/admin/*             Role-gated CMS surfaces
```

---

## 8. Repository / Monorepo Layout

Recommended **two deployable applications** under one workspace (or two repos with identical contracts):

```text
NUR/
├── docs/                          # or keep markdown at NUR/*.md as already started
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   └── ...
├── apps/
│   ├── web/                       # Frontend (Vercel)
│   └── api/                       # Backend (Render)
└── README.md
```

If a monorepo is delayed, equivalent:

```text
nur-web/     → Vercel
nur-api/     → Render
```

Contracts remain synchronized via `API.md`.

---

## 9. Frontend Folder Structure (Feature-Based)

```text
apps/web/
├── public/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   ├── providers.tsx
│   │   └── layouts/
│   │       ├── RootLayout.tsx
│   │       ├── AuthLayout.tsx
│   │       └── AdminLayout.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   ├── store/
│   │   │   ├── api/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   ├── quran/
│   │   ├── podcasts/
│   │   ├── books/
│   │   ├── research/
│   │   ├── library/
│   │   ├── search/
│   │   ├── profile/
│   │   └── admin/
│   ├── shared/
│   │   ├── components/          # truly shared primitives only
│   │   ├── hooks/
│   │   ├── lib/                 # cx(), formatters, guards
│   │   ├── constants/
│   │   ├── types/
│   │   └── utils/
│   ├── services/
│   │   ├── http.ts              # Axios instance + interceptors
│   │   └── endpoints.ts
│   ├── styles/
│   │   ├── index.css
│   │   └── tokens.css           # CSS variables from design system
│   ├── assets/
│   ├── config/
│   │   └── env.ts
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── vite.config.ts
```

### 9.1 Frontend Coding Boundaries

- `features/x` may import `shared/*` and `services/*`.
- `features/x` must **not** import from `features/y` deeply; share via `shared` or explicit public `index.ts` if unavoidable.
- UI components do not call Axios directly.
- Lucide icons only through a thin wrapper if icon policy requires consistency.

---

## 10. Backend Folder Structure (Feature-Based + Clean Layers)

```text
apps/api/
├── src/
│   ├── server.ts                 # bootstrap HTTP server
│   ├── app.ts                    # Express app composition
│   ├── config/
│   │   ├── env.ts                # zod/env validation at boot
│   │   └── cors.ts
│   ├── infrastructure/
│   │   ├── db/
│   │   │   └── mongoose.ts
│   │   ├── storage/              # optional uploads later
│   │   └── email/                # password reset later
│   ├── shared/
│   │   ├── errors/
│   │   │   ├── AppError.ts
│   │   │   └── errorHandler.ts
│   │   ├── middleware/
│   │   │   ├── authenticate.ts
│   │   │   ├── authorize.ts
│   │   │   ├── rateLimit.ts
│   │   │   └── validate.ts
│   │   ├── utils/
│   │   └── types/
│   ├── modules/                  # features
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.validation.ts
│   │   │   ├── auth.types.ts
│   │   │   └── user.model.ts
│   │   ├── quran/
│   │   ├── podcasts/
│   │   ├── books/
│   │   ├── research/
│   │   ├── library/              # progress, bookmarks aggregates
│   │   ├── search/
│   │   └── admin/                # optional façade; or admin routes inside modules
│   └── types/
├── package.json
├── tsconfig.json
└── .env.example
```

### 10.1 Module Independence

- Adding `notes` later should mean adding `modules/notes` + FE `features/notes` without rewriting auth or Qur’an.
- Cross-module calls go through services, not by reaching into another module’s model from a controller.

---

## 11. Authentication & Session Architecture

### 11.1 Model

- **Access Token (JWT)** — short-lived (e.g., 15m), sent as `Authorization: Bearer <token>`.
- **Refresh Token** — longer-lived, stored as hash in MongoDB, rotated on use.
- Passwords hashed with **bcrypt** (or argon2 if approved later); cost factor production-safe.

### 11.2 Flows

```text
Register → hash password → create user → issue token pair
Login    → verify password → issue token pair
Refresh  → verify refresh hash → rotate → new token pair
Logout   → revoke refresh token(s)
Me       → authenticate → return safe user profile
```

### 11.3 Authorization

Roles: `user` | `editor` | `admin`

| Action | user | editor | admin |
| --- | --- | --- | --- |
| Read published content | ✓ | ✓ | ✓ |
| Manage own progress/bookmarks | ✓ | ✓ | ✓ |
| Create/edit drafts | | ✓ | ✓ |
| Publish/unpublish | | ✓* | ✓ |
| Manage users / roles | | | ✓ |

\*Exact publish policy can require admin-only; decide in PRD open questions / CONTENT_RULES.

### 11.4 Frontend Auth Wiring

- Axios request interceptor attaches access token.
- 401 response → attempt refresh once → retry; else logout and route to `/login`.
- Protected route wrapper checks auth store hydration.

---

## 12. REST API Architecture

### 12.1 Conventions

| Concern | Standard |
| --- | --- |
| Style | REST JSON |
| Versioning | `/api/v1/...` |
| Success shape | `{ "data": ..., "meta"?: ... }` |
| Error shape | `{ "error": { "code": string, "message": string, "details"?: unknown } }` |
| Auth header | `Authorization: Bearer <accessToken>` |
| IDs | MongoDB ObjectId strings; public content also has `slug` |
| List pagination | `?page=&limit=` with `meta.total`, `meta.page`, `meta.limit` |
| Filtering | Explicit query params per resource |

### 12.2 Resource Groups (v1)

```text
/api/v1/auth
/api/v1/users/me
/api/v1/quran/surahs
/api/v1/quran/surahs/:number
/api/v1/quran/bookmarks
/api/v1/quran/progress
/api/v1/podcasts/series
/api/v1/podcasts/episodes
/api/v1/podcasts/progress
/api/v1/books
/api/v1/books/:slug/chapters
/api/v1/books/progress
/api/v1/research
/api/v1/library
/api/v1/search
/api/v1/admin/...
/health
```

Full endpoint contract: `API.md` (after PRD approval).

### 12.3 Public vs Protected

- Public: published catalog reads, Qur’an text reads, health.
- Protected: progress, bookmarks, favorites, profile, admin writes.
- Unpublished content: **never** returned from public list/detail handlers.

---

## 13. Data Architecture (MongoDB)

### 13.1 Principles

- One collection family per domain aggregate.
- Enforce publish gates in schema + service.
- Index hot paths early.
- Qur’an text is **reference data** — import from verified source; not casually edited.
- No embedding of unbounded arrays that grow per user action without care (prefer progress collections).

### 13.2 Logical Collections (v1)

| Collection | Purpose |
| --- | --- |
| `users` | Accounts, roles, profile, password hash |
| `refresh_tokens` | Refresh token hashes, expiry, revocation |
| `surahs` / `ayahs` | Qur’an reference data (or combined strategy documented in DATABASE.md) |
| `quran_progress` | Per-user last position |
| `quran_bookmarks` | Per-user ayah bookmarks |
| `podcast_series` | Series metadata |
| `podcast_episodes` | Episodes + audio URL + publish status |
| `podcast_progress` | Per-user episode progress |
| `books` | Book metadata + status |
| `book_chapters` | Chapter content |
| `book_progress` | Per-user reading progress |
| `research_articles` | Articles + sources + status workflow |
| `media_assets` | Optional later for uploads |

Exact schemas: `DATABASE.md`.

### 13.3 Content Status Pattern

Shared enum for editorial content:

`draft` → `in_review` → `published` → `archived`

Public queries: `status: "published"` AND `deletedAt: null`.

### 13.4 Progress Pattern

```text
{ userId, targetType, targetId, position, updatedAt }
```

`position` meaning varies:

- Qur’an: `{ surahNumber, ayahNumber }`
- Podcast: `{ seconds }`
- Book: `{ chapterId, scrollRatio | blockId }`

---

## 14. Media & File Uploads

### 14.1 Default (Preferred)

- Audio and covers hosted on object storage / CDN.
- Backend stores URLs + metadata only.

### 14.2 Multer

Use **only if necessary** (e.g., admin cover upload).

Rules if enabled:

- Memory or temp disk with strict size limits
- MIME allowlist
- Virus scanning optional later
- Never serve user uploads from the API process as a long-term strategy
- Persist to storage provider; save returned URL in MongoDB

---

## 15. Security Architecture

| Control | Implementation |
| --- | --- |
| Transport | HTTPS only in production |
| CORS | Allowlist Vercel FE origin(s) |
| Helmet | Secure HTTP headers |
| Rate limit | Stricter on `/auth/login`, `/auth/register` |
| Validation | Schema validation on all writes |
| AuthN | JWT access + rotating refresh |
| AuthZ | Role middleware on admin routes |
| XSS | Sanitize rich text for books/research |
| Secrets | Render/Vercel env vars; `.env.example` without secrets |
| Logging | No passwords/tokens in logs |
| Dependency hygiene | Lockfiles; audit before release |

---

## 16. Error Handling Architecture

### 16.1 Backend

- Throw `AppError(code, message, status, details?)` from services.
- Central `errorHandler` maps to REST error envelope.
- Unexpected errors → `INTERNAL_ERROR` + log with request id.
- Production: never send stack traces to clients.

### 16.2 Frontend

- Map API error codes to user-safe messages.
- Distinguish network vs 401 vs 403 vs 404 vs 422.
- Player and reader must fail gracefully (retry, non-destructive UI).

---

## 17. Configuration & Environments

| Env | Frontend | Backend | Database |
| --- | --- | --- | --- |
| local | Vite dev | Node local | Atlas free/dev cluster or local Mongo (Atlas preferred for parity) |
| staging | Vercel Preview | Render staging service | Atlas staging DB |
| production | Vercel Production | Render production | Atlas production |

### 17.1 Required Backend Env (illustrative)

```text
NODE_ENV=
PORT=
MONGODB_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=
JWT_REFRESH_EXPIRES_IN=
CORS_ORIGIN=
```

### 17.2 Required Frontend Env

```text
VITE_API_BASE_URL=
```

Boot must **fail fast** if required env vars are missing.

---

## 18. Deployment Architecture

```text
Git push main
   ├─► Vercel builds apps/web → CDN edge
   └─► Render deploys apps/api → web service

MongoDB Atlas sits outside both; connection string only on Render.
```

### 18.1 Frontend (Vercel)

- Static SPA build from Vite
- Rewrites for React Router (`/* → /index.html`)
- Env: `VITE_API_BASE_URL` pointing to Render API

### 18.2 Backend (Render)

- Node web service
- Health check: `GET /health`
- Auto-deploy from main (or release branch)
- Scale plan chosen for production traffic; avoid free-tier as sole production strategy when quality bar is App Store–grade

### 18.3 Database (Atlas)

- Network access restricted to Render IPs / safe allowlist strategy
- Daily backups enabled
- Separate staging vs production clusters or databases

---

## 19. Cross-Cutting Frontend Concerns

| Concern | Approach |
| --- | --- |
| Styling | Tailwind + design tokens (CSS variables) |
| Motion | Framer Motion; respect `prefers-reduced-motion` |
| Icons | Lucide React; consistent sizes/strokes |
| Typography | Design system fonts; Arabic-capable face for Qur’an |
| A11y | Semantic HTML, labels, focus states, AA contrast |
| Responsive | Mobile-first layouts; reader comfort on small screens |

---

## 20. Testing Architecture

| Layer | What |
| --- | --- |
| Backend unit | Services (auth, publish gates, progress updates) |
| Backend integration | Routes + DB (test database) |
| Frontend unit | Pure utils, store logic |
| Frontend integration | Critical flows with mocked API |
| E2E (later) | Auth → Qur’an progress → podcast resume |

Minimum before production:

- Auth register/login/refresh tests
- Published-only content visibility tests
- Progress persistence tests

---

## 21. Observability

| Signal | Tooling approach |
| --- | --- |
| Uptime | External monitor → `/health` |
| API logs | Structured JSON logs with `requestId` |
| Error tracking | Add Sentry (or equivalent) when implementation starts — plan the slot now |
| Perf | Vercel Analytics optional; Lighthouse in release checklist |

---

## 22. Git & Delivery Rules (Engineering)

- Conventional, purposeful commits (feat/fix/docs/refactor/test/chore)
- No secrets committed
- PR against main with checklist linking PRD requirement IDs where relevant
- Docs updated when architecture changes
- Feature branches; no force-push to main

Detailed commit rules will live in project AI/constitution docs.

---

## 23. AI Assistant Rules (Architecture Implications)

When Cursor / Claude / other agents work on NUR:

1. Read `PRD.md` + this file before coding.
2. Do not invent religious rulings or Qur’an text.
3. Do not introduce alternate stacks without explicit approval.
4. Do not create placeholder pages that pretend to be production features.
5. Do not connect frontend directly to MongoDB.
6. Prefer extending a feature module over creating orphan utilities.
7. If unsure about Islamic content handling → stop and ask; do not hallucinate sources.

---

## 24. Production Readiness Checklist (Architecture Gate)

Before calling the system production-ready:

- [ ] FE, BE, DB separately deployed
- [ ] Env validation at boot
- [ ] JWT auth + refresh rotation
- [ ] Role-gated admin mutations
- [ ] Published-only public content enforcement
- [ ] Central error handler
- [ ] CORS allowlist + rate limits on auth
- [ ] Indexes for user email, slugs, progress userId
- [ ] Qur’an dataset imported from verified source (not typed by hand in UI)
- [ ] No `TODO: fake data` in main paths
- [ ] Health endpoint live
- [ ] Logging without secret leakage
- [ ] HTTPS everywhere
- [ ] Backup strategy on Atlas

---

## 25. Implementation Sequence (After PRD Approval)

1. Finalize remaining docs: `DATABASE.md`, `API.md`, `CONTENT_RULES.md`, design docs  
2. Scaffold `apps/api` and `apps/web` with folder structures above  
3. Config + DB connection + health + error handler  
4. Auth module end-to-end  
5. Qur’an read APIs + FE reader shell  
6. Podcasts → Books → Research  
7. Progress/Library unification  
8. Admin publish flows  
9. Hardening, tests, deploy pipelines  
10. Production checklist sign-off  

**Do not start step 2 until PRD is approved.**

---

## 26. Decision Log

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | SPA (React+Vite) not Next.js | Binding stack choice; FE fully separated |
| D2 | REST not GraphQL | Simpler contract, fits Express, clear caching later |
| D3 | Zustand not Redux | Less boilerplate for this product scale |
| D4 | Feature-based modules | Scalability and team clarity |
| D5 | JWT access + refresh | Stateless API on Render with revoke capability |
| D6 | Atlas + Mongoose | Binding DB choice; flexible documents for content |
| D7 | Vercel + Render | Binding deploy targets; independent scaling |
| D8 | Multer optional | Avoid upload complexity until required |

---

## 27. Open Architecture Questions

1. Single Git monorepo vs two repositories?  
2. Refresh token storage: httpOnly cookie vs secure local storage? (Security preference needed)  
3. Audio hosting provider (S3/R2/Cloudinary)?  
4. Shared TypeScript types package across FE/BE?  
5. Staging environment required before first production content?

---

## 28. Document Approval

| Role | Decision | Date |
| --- | --- | --- |
| Product Owner | ☐ Architecture accepted with PRD | |
| Engineering | ☐ Ready to implement after PRD approval | |

This architecture is the technical source of truth for stack, separation, folder structure, and production constraints until version 1.1.0.
