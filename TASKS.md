# NUR — Implementation Tasks

**Status:** Draft v1.0.0  
**Last updated:** 2026-07-25  
**Depends on:** `PRD.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `CONTENT_RULES.md`, `UI_GUIDELINES.md`, `DESIGN_SYSTEM.md`  
**Rule:** Do not start coding until PRD is approved. Then execute in phase order.

---

## 1. How to use this backlog

- Phases are sequential gates.
- Task IDs are stable references for commits/PRs (`feat(auth): T-041 …`).
- Definition of Done for every task:
  - Matches docs
  - No fake/placeholder production data
  - Typesafe TypeScript
  - Errors handled
  - Basic test or manual checklist noted where marked

Priority: **P0** must ship for v1 · **P1** should · **P2** later

---

## 2. Phase 0 — Specification gate

| ID | Task | Priority | Status |
| --- | --- | --- | --- |
| T-001 | Approve `PRD.md` | P0 | ☐ |
| T-002 | Approve `ARCHITECTURE.md` | P0 | ☐ |
| T-003 | Approve `CONTENT_RULES.md` | P0 | ☐ |
| T-004 | Approve `DATABASE.md` + `API.md` | P0 | ☐ |
| T-005 | Approve UI + Design System | P0 | ☐ |
| T-006 | Resolve open questions (licenses, refresh storage, publish roles) | P0 | ☐ |

**Gate:** No repo scaffolding until T-001 done (minimum). Prefer T-001–T-005.

---

## 3. Phase 1 — Repository scaffolding

| ID | Task | Priority | Status |
| --- | --- | --- | --- |
| T-010 | Create `apps/web` Vite + React + TS | P0 | ✅ |
| T-011 | Create `apps/api` Node + Express + TS | P0 | ✅ |
| T-012 | ESLint/Prettier configs for both apps | P0 | ✅ |
| T-013 | `.env.example` files (no secrets) | P0 | ✅ |
| T-014 | Root README run instructions | P0 | ✅ |
| T-015 | Feature-based folder skeletons (FE + BE) per ARCHITECTURE | P0 | ✅ |
| T-016 | Tailwind + tokens.css + font loading (web) | P0 | ✅ |
| T-017 | Axios `http` client shell + env config (web) | P0 | ✅ |
| T-018 | Express `app.ts` / `server.ts` + env validation (api) | P0 | ✅ |
| T-019 | Mongoose connection module | P0 | ✅ |
| T-020 | `GET /health` + central error handler | P0 | ✅ |
| T-021 | CORS allowlist + Helmet + auth rate-limit middleware | P0 | ✅ |

---

## 4. Phase 2 — Auth

| ID | Task | Priority | Status |
| --- | --- | --- | --- |
| T-030 | `User` + `RefreshToken` models | P0 | ✅ |
| T-031 | Register endpoint + validation | P0 | ✅ |
| T-032 | Login endpoint | P0 | ✅ |
| T-033 | Refresh rotation endpoint | P0 | ✅ |
| T-034 | Logout revoke endpoint | P0 | ✅ |
| T-035 | `GET/PATCH /users/me` | P0 | ✅ |
| T-036 | Auth middleware + role authorize helper | P0 | ✅ |
| T-037 | FE auth store (Zustand) + interceptors | P0 | ✅ |
| T-038 | Login/Register pages + protected route wrapper | P0 | ✅ |
| T-039 | Auth unit/integration tests (critical paths) | P0 | ✅ |
| T-040 | Password reset request/confirm | P1 | ✅ |

---

## 5. Phase 3 — Qur’an data + APIs

| ID | Task | Priority | Status |
| --- | --- | --- | --- |
| T-050 | Choose verified Qur’an dataset + record provenance | P0 | ✅ |
| T-051 | Import script for `surahs` + `ayahs` with checksum/version | P0 | ✅ |
| T-052 | Surah list + surah detail APIs | P0 | ✅ |
| T-053 | Reciter + audio registry models/APIs | P0 | ✅ |
| T-054 | Qur’an progress PUT/GET | P0 | ✅ |
| T-055 | Qur’an bookmarks CRUD | P0 | ✅ |
| T-056 | Public search surahs by name/number | P0 | ✅ |
| T-057 | Ayah text search | P1 | ✅ |
| T-058 | Multi-reciter UX support | P1 | ✅ |

---

## 6. Phase 4 — Qur’an frontend

| ID | Task | Priority | Status |
| --- | --- | --- | --- |
| T-060 | Surah list page + search | P0 | ✅ |
| T-061 | Reader page (Arabic RTL + translation + ayah numbers) | P0 | ✅ |
| T-062 | Reading settings (font size, theme) | P0 | ✅ |
| T-063 | Audio play for ayah/surah | P0 | ✅ |
| T-064 | Persist progress on navigation/pause | P0 | ✅ |
| T-065 | Bookmarks UI | P0 | ✅ |
| T-066 | Reader enter motion + reduced-motion safe | P0 | ✅ |

---

## 7. Phase 5 — Podcasts

| ID | Task | Priority | Status |
| --- | --- | --- | --- |
| T-070 | Series/Episode models + public list/detail APIs | P0 | ✅ |
| T-071 | Progress + favorites APIs | P0 | ✅ |
| T-072 | Admin series/episode CRUD + publish validation | P0 | ✅ |
| T-073 | FE series list/detail | P0 | ✅ |
| T-074 | Global/player store + playback + seek | P0 | ✅ |
| T-075 | Persist listening progress | P0 | ✅ |
| T-076 | Favorites UI | P0 | ✅ |
| T-077 | Playback speed | P1 | ✅ |
| T-078 | Seed **only** real licensed pilot content (or empty catalog) | P0 | ✅ |

---

## 8. Phase 6 — Books

| ID | Task | Priority | Status |
| --- | --- | --- | --- |
| T-080 | Book + chapter models + public APIs | P0 | ✅ |
| T-081 | Progress + bookmarks APIs | P0 | ✅ |
| T-082 | Admin book/chapter CRUD + publish gates | P0 | ✅ |
| T-083 | FE catalog + detail + chapter reader | P0 | ✅ |
| T-084 | Reading progress persistence | P0 | ✅ |
| T-085 | HTML sanitize on write + safe render | P0 | ✅ |
| T-086 | Highlights/notes | P1 | ✅ |

---

## 9. Phase 7 — Research

| ID | Task | Priority | Status |
| --- | --- | --- | --- |
| T-090 | Research model with `sources[]` | P0 | ✅ |
| T-091 | Public list/detail APIs (published only) | P0 | ✅ |
| T-092 | Publish endpoint enforces sources/authors/rights | P0 | ✅ |
| T-093 | Admin research CMS UI | P0 | ✅ |
| T-094 | FE list/detail with visible sources | P0 | ✅ |
| T-095 | Research bookmarks | P0 | ✅ |
| T-096 | Related articles | P1 | ✅ |

---

## 10. Phase 8 — Home, Library, Shell

| ID | Task | Priority | Status |
| --- | --- | --- | --- |
| T-100 | App shell layouts + nav (mobile/desktop) | P0 | ✅ |
| T-101 | Home composition per UI guidelines (brand + continue) | P0 | ✅ |
| T-102 | `GET /library/continue` + FE library page | P0 | ✅ |
| T-103 | Library favorites/bookmarks aggregate views | P0 | ✅ |
| T-104 | Profile/settings page | P0 | ✅ |
| T-105 | Home atmosphere + brand enter motion | P0 | ✅ |
| T-106 | Global search API + UI | P1 | ✅ |
| T-107 | Home «Bugungi yo‘l» checklist (curriculum progress) | P0 | ✅ |

---

## 11. Phase 9 — Admin hardening

| ID | Task | Priority | Status |
| --- | --- | --- | --- |
| T-110 | Admin layout + route guards | P0 | ✅ |
| T-111 | Status workflow UI across content types | P0 | ✅ |
| T-112 | Soft delete behaviors | P0 | ✅ |
| T-113 | Admin user role management | P0 | ✅ |
| T-114 | Optional Multer upload endpoint (only if needed) | P2 | ☐ |

---

## 12. Phase 10 — Quality, security, deploy

| ID | Task | Priority | Status |
| --- | --- | --- | --- |
| T-120 | Index verification on Atlas | P0 | ✅ script (`verify:indexes`) — run on Atlas before sign-off |
| T-121 | Security pass: JWT, validation, CORS, rate limit, XSS sanitize | P0 | ✅ |
| T-122 | Accessibility smoke on primary flows | P0 | ✅ |
| T-123 | Performance pass (Lighthouse / mobile) | P0 | ✅ baseline (lazy admin + images); full Lighthouse post-deploy |
| T-124 | Deploy API to Render | P0 | ✅ https://nur-api-ow0b.onrender.com |
| T-125 | Deploy web to Vercel | P0 | ✅ https://nur-web-orcin.vercel.app |
| T-126 | Connect production env vars | P0 | ✅ |
| T-127 | Uptime check on `/health` | P0 | ✅ mongo-aware `/health` + `check:health` |
| T-128 | Production checklist sign-off (ARCHITECTURE §24 + PRD §15) | P0 | ✅ live URLs recorded; Atlas backup still operator TODO |
| T-129 | Error tracking (Sentry or equivalent) | P1 | ✅ |

---

## 13. Phase 11 — Curriculum (deferred)

Only if product pulls curriculum into scope — see `CURRICULUM.md`.

| ID | Task | Priority | Status |
| --- | --- | --- | --- |
| T-140 | Curriculum schema + APIs | P2 | ✅ |
| T-141 | Curriculum FE paths | P2 | ✅ |
| T-142 | Link lessons to existing Qur’an/podcast/book/research entities | P2 | ✅ |
| T-143 | EXAMPLE 15-kun siyrat path seed + Home Kun X/15 | P0 | ✅ |
| T-144 | Journey UI polish (Ertalab/Yo‘lda/Kechqurun + progress) | P0 | ✅ |
| T-145 | Home date + kun-tugadi banner; nav «Bugun»; OWNER_CONTENT | P1 | ✅ |

---

## 14. Suggested build order (compressed)

```text
Approve docs
 → Scaffold FE/BE
 → Auth E2E
 → Qur’an import + reader
 → Podcasts + player
 → Books reader
 → Research + sources gate
 → Home/Library polish
 → Admin
 → Deploy + harden
```

---

## 15. Explicit non-tasks (do not do)

- Fake Islamic content generators
- Social feed / comments in v1
- Next.js migration without architecture revision
- Frontend direct MongoDB access
- Shipping with `licenseStatus: unknown` published content
- AI fatwa features

---

## 16. Approval

| Role | Decision |
| --- | --- |
| Product Owner | ☐ Approved as build plan |
