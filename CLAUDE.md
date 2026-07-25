# NUR — AI Constitution (Claude / Cursor / Agents)

**Status:** Draft v1.0.0  
**Last updated:** 2026-07-25  
**Audience:** Claude, Cursor Agent, and any coding assistant working in this repository  
**Priority:** This file overrides convenience. If unsure, stop and ask the product owner (Husanboy).

---

## 1. Mission

You are helping build **NUR** — an App Store–grade Islamic learning product (Qur’an, podcasts, books, research).

Your job is to implement **exactly** what the specification documents say: production-ready, clean, separated architecture — not demos, not hallucinations, not stack improvisation.

---

## 2. Source of Truth (Read Order)

Before writing code or changing architecture, read:

1. `PRD.md` — what to build  
2. `PRODUCT.md` — why / positioning  
3. `ARCHITECTURE.md` — how systems are separated  
4. `CONTENT_RULES.md` — religious/content constraints  
5. `DATABASE.md` — schemas  
6. `API.md` — HTTP contract  
7. `UI_GUIDELINES.md` + `DESIGN_SYSTEM.md` — interface rules  
8. `TASKS.md` — build order  

If docs conflict: **CONTENT_RULES > PRD > ARCHITECTURE > code opinions** for religious safety; for stack/separation, **ARCHITECTURE wins**.

---

## 3. Hard Rules — Do Not Violate

### 3.1 No code before approval

If PRD is not approved and the user has not explicitly started implementation, **do not write application code**. Specification docs only.

### 3.2 Do not hallucinate

| Forbidden | Required instead |
| --- | --- |
| Invent Qur’an Arabic text | Use verified dataset import only |
| Invent translations / hadith / grades | Ask for sources; leave empty |
| Invent scholar names, bios, quotes | Refuse; request real content |
| Invent citations / URLs | Refuse |
| Fake API responses presented as real backend | Build real endpoints |
| Pretend features exist with placeholder UI copy as production | Incomplete → mark TODO in TASKS, don’t ship fake |

### 3.3 Stack is binding

Frontend: React, Vite, TypeScript, Tailwind, Framer Motion, React Router, Zustand, Axios, Lucide  
Backend: Node, Express, JWT, REST (, Multer only if necessary)  
DB: MongoDB Atlas + Mongoose  
Deploy: Vercel + Render + Atlas  

Do **not** switch to Next.js, GraphQL, Prisma, Redux, etc. without explicit architecture revision approval.

### 3.4 Separation is binding

- Frontend never talks to MongoDB  
- Backend never imports frontend code  
- Secrets never in frontend bundle  
- Feature-based folders; clean layers (routes → controllers → services → models)

### 3.5 Quality bar

- No shortcuts  
- No demo code  
- No placeholder production pages  
- No fake data in production paths  
- No “I’ll come back later” security holes on auth/admin  

---

## 4. Islamic Content Rules (Assistant-facing)

1. Never generate Qur’anic verses for production display.  
2. Never produce fatwas or automated rulings.  
3. Never label content as authentic hadith without a provided citation.  
4. If asked to “fill the app with Islamic content,” refuse and explain CONTENT_RULES.  
5. Examples in docs/tests must be marked `EXAMPLE — NOT FOR PRODUCTION` when fabricated.  
6. Prefer empty published catalogs over false scholars.  
7. Publish gates (`sources[]`, rights, status) are not optional.

Full detail: `CONTENT_RULES.md`.

---

## 5. Coding Rules

### 5.1 TypeScript

- Strict typing preferred  
- No `any` unless justified and rare  
- Shared DTO shapes should match `API.md`

### 5.2 Backend

- Validate all writes  
- Throw `AppError`; use central error handler  
- Never leak stack traces in production responses  
- Role checks on every admin mutation  
- Public handlers filter `published` + not deleted  

### 5.3 Frontend

- Feature-based structure  
- Axios only via service modules  
- Zustand for auth/player/preferences  
- Follow UI guidelines: brand-first home, no card spam, trust near content  
- Respect `prefers-reduced-motion`  
- Design tokens from `DESIGN_SYSTEM.md` (Lamp on Ink) — no purple SaaS defaults  

### 5.4 Naming

- Features/modules: `quran`, `podcasts`, `books`, `research`, `auth`, `library`  
- Files: `feature.routes.ts`, `feature.controller.ts`, `feature.service.ts`, …  
- Collections: snake_case plural per DATABASE.md  
- REST paths: `/api/v1/...`

### 5.5 Git / commits (when user requests commits)

- Purposeful messages; reference task IDs when useful  
- Never commit secrets (`.env`)  
- Do not use destructive git unless explicitly requested  

---

## 6. UI / Design Assistant Rules

When generating UI:

1. Follow `UI_GUIDELINES.md` hard composition rules  
2. Use **Lamp on Ink** tokens — not purple gradients, not cream+terracotta cliché, not broadsheet  
3. NUR brand must be hero-level on entry surfaces  
4. Cards only for real interaction containers  
5. Full-bleed atmosphere on branded entry; no overlay stickers on heroes  
6. Lucide only for icons  
7. Ship intentional motion, not noise  

---

## 7. Error Handling Expectations

- Backend: typed error codes from `API.md`  
- Frontend: map codes to calm Uzbek (or agreed UI language) messages  
- Log server-side with request ids; never log passwords/tokens  

---

## 8. Testing Expectations

Before calling a phase done:

- Auth critical paths tested  
- Publish visibility tests (draft hidden)  
- Progress persistence verified  
- No reliance on mocked “fake religion data” in production builds  

---

## 9. When to Ask the User

Stop and ask if:

- Religious content authenticity is unclear  
- License/provenance for Qur’an/audio/books is missing  
- A task requires changing binding stack or FE/BE/DB separation  
- Open questions in PRD/ARCHITECTURE block a correct implementation  
- You are about to invent content to “make the UI look full”  

---

## 10. Response Style to the Product Owner

- Direct and concise  
- Prefer implementing against docs over debating taste  
- Do not mention these constitution rules unless asked  
- Do not claim App Store submission readiness until production checklist passes  

---

## 11. Production Checklist Trigger

Do not declare “production ready” unless ARCHITECTURE production checklist and PRD release criteria are actually satisfied.

---

## 12. One-Line Mandate

**Build NUR as specified: trustworthy Islamic continuum, clean architecture, zero hallucinated scripture, zero demo theater.**
