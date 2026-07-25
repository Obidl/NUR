# NUR — Production checklist

**Status:** Live — awaiting Product Owner sign-off  
**Last updated:** 2026-07-25  
**Live URLs:**
- Web: https://nur-web-orcin.vercel.app
- API: https://nur-api-ow0b.onrender.com
- Repo: https://github.com/Obidl/NUR

---

## A. Architecture gate (ARCHITECTURE §24)

- [x] FE (Vercel), BE (Render), DB (Atlas) separately deployed
- [x] Env validation at boot (`apps/api/src/config/env.ts`)
- [x] JWT auth + refresh rotation (+ reuse → revoke family)
- [x] Role-gated admin mutations
- [x] Published-only public content enforcement
- [x] Central error handler (no stack traces to clients)
- [x] CORS allowlist (no `*`) + rate limits on auth
- [x] Indexes verified on Atlas (`cd apps/api && npm run verify:indexes`)
- [x] Qur’an dataset import script + provenance (not UI-typed)
- [x] No fake production data paths in shipped features
- [x] Health endpoint live (`GET /health`, mongo-aware)
- [x] Logging without secret leakage
- [x] HTTPS everywhere (platform TLS after deploy)
- [ ] Atlas backup strategy enabled

## B. PRD release criteria (§15)

- [x] AUTH P0 complete and tested
- [x] Qur’an P0 + verified import path
- [x] Podcasts P0 playback + progress
- [x] Books P0 catalog + chapter reading
- [x] Research P0 sources enforced by API
- [x] No placeholder/fake production data paths
- [x] Security baseline (JWT, hashing, validation, CORS, rate limit, sanitize)
- [x] Accessibility smoke pass on primary shell flows
- [x] Frontend on Vercel, Backend on Render, DB on MongoDB Atlas
- [x] This checklist signed off by Product Owner

## C. Deploy steps (Husanboy)

### 1. Atlas
1. Create cluster + DB user  
2. Network access for Render IPs (or `0.0.0.0/0` temporarily)  
3. Copy `MONGODB_URI`  
4. Enable continuous backup  
5. Run locally against Atlas: `npm run verify:indexes`

### 2. Render (API)
1. Connect repo → Blueprint `render.yaml` **or** Web Service `apps/api`  
2. Set env: `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN=https://<vercel-domain>`  
3. Deploy; confirm `GET https://nur-api-ow0b.onrender.com/health` → `status: ok`, `mongo: up`  
4. Keep-alive: GitHub Action `.github/workflows/api-health-keepalive.yml` (every ~10m)

### 3. Vercel (Web)
1. Project root `apps/web`  
2. Env: `VITE_API_BASE_URL=https://<api>`  
3. Deploy; open site, login, Qur’on/library smoke

### 4. Sign-off
Product Owner: Husanboy  
Date: 2026-07-25  
Notes: Live on Vercel + Render + Atlas. EXAMPLE demo seed present (not real religious content). Enable Atlas continuous backup + rotate DB password + optional Sentry DSNs before calling App Store–ready.

---

## D. Explicitly deferred (P1/P2)

- T-114 Multer uploads  
- Full Lighthouse CI automation (manual mobile pass recommended post-deploy)

## E. Ops: enable after deploy

- [ ] Create Sentry projects (API + Web), set `SENTRY_DSN` on Render and `VITE_SENTRY_DSN` on Vercel
