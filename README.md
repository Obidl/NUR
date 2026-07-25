# NUR

App Store–grade Islamic learning platform.

## Structure

```text
NUR/
├── *.md                 # Product & engineering specifications
├── PRODUCTION_CHECKLIST.md
├── render.yaml          # Render API blueprint
└── apps/
    ├── web/             # React + Vite → Vercel
    └── api/             # Node + Express → Render
```

## Prerequisites

- Node.js 20+
- MongoDB Atlas connection string

## Setup

### API

```bash
cd apps/api
cp .env.example .env
# fill MONGODB_URI and JWT secrets (min 32 chars)
npm install
npm run dev
```

Health: `GET http://localhost:4000/health`

### Web

```bash
cd apps/web
cp .env.example .env
npm install
npm run dev
```

App: `http://localhost:5173`

## Quality scripts

```bash
# API
cd apps/api
npm test
npm run verify:indexes   # against MONGODB_URI (Atlas)
HEALTH_URL=http://localhost:4000/health npm run check:health
```

## Deploy

See [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md).

- API: Render (`render.yaml`)
- Web: Vercel (`apps/web`, `vercel.json`)
- DB: MongoDB Atlas

## Qur’an import

```bash
cd apps/api
npm run import:quran
```

Provenance: `apps/api/scripts/QURAN_PROVENANCE.md`

## Local EXAMPLE demo seed (never production)

```bash
cd apps/api
npm run seed:demo
```

Creates EXAMPLE podcast / book / research / curriculum + editor  
`demo.editor@nur.local` / `password123`.  
Refuses to run when `NODE_ENV=production`.

## Specs

Start with [PRD.md](./PRD.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [CLAUDE.md](./CLAUDE.md), [TASKS.md](./TASKS.md).
