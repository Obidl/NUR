# NUR — Product Requirements Document (PRD)

**Status:** Draft — awaiting product owner approval  
**Version:** 1.0.0  
**Last updated:** 2026-07-25  
**Owner:** Husanboy  
**Rule:** No implementation until this PRD is explicitly approved.

---

## 1. Document Control

| Field | Value |
| --- | --- |
| Product name | NUR |
| Product type | Mobile-web / Progressive Web App (App Store–grade quality bar) |
| Primary markets | Uzbekistan first; expandable to global Muslim audiences |
| Primary language | Uzbek (UI + content metadata); Arabic for Qur’an text |
| Document purpose | Define *what* to build, for *whom*, and *why* — before any code |
| Related docs | `PRODUCT.md`, `ARCHITECTURE.md`, `UI_GUIDELINES.md`, `DESIGN_SYSTEM.md`, `CONTENT_RULES.md`, `DATABASE.md`, `API.md`, `TASKS.md` |

### 1.1 Approval Gate

Implementation may begin only after:

1. This PRD is reviewed and approved in writing.
2. Architecture document (`ARCHITECTURE.md`) is aligned with this PRD.
3. Content authenticity rules (`CONTENT_RULES.md`) are agreed for Qur’an, books, podcasts, and research.

---

## 2. Product Vision (Summary)

> **NUR** is a calm, trustworthy Islamic learning and listening platform where users can read and listen to the Qur’an, discover authenticated Islamic podcasts and books, and access carefully curated Islamic research — without noise, clickbait, or unverified religious claims.

NUR is not a social network, not a debate forum, and not a generic “content dump.” It is a **spiritual utility product**: clarity, authenticity, and focus.

### 2.1 North Star

A user can open NUR and, within seconds, either:

- continue their Qur’an reading/listening progress, or  
- resume a trusted Islamic podcast/book, or  
- find a verified research answer on a specific Islamic topic —

with full confidence that sources are authentic and clearly attributed.

### 2.2 Brand Promise

| Promise | Meaning |
| --- | --- |
| Light | Interface is calm, readable, and distraction-free |
| Trust | Religious content is sourced, attributed, and reviewable |
| Continuity | Progress, bookmarks, and listening history persist |
| Craft | App Store–level polish in UX, performance, and accessibility |

---

## 3. Problem Statement

### 3.1 Problems We Solve

1. **Fragmentation** — Qur’an apps, podcast apps, book apps, and research sites are separate; spiritual learning is interrupted.
2. **Trust deficit** — Much Islamic content online lacks clear scholarly attribution or source quality.
3. **Noise** — Ads, feeds, and engagement tactics interrupt worship and study.
4. **Progress loss** — Users lose reading position, bookmarks, and listening history across tools.
5. **Weak mobile craft** — Many Islamic apps feel outdated, slow, or inaccessible.

### 3.2 Problems We Explicitly Do Not Solve (v1)

- Fatwa issuance engine / automated legal rulings
- Live imam chat / social messaging
- Marketplace / e-commerce for physical books
- User-generated unrestricted posting
- Political news aggregation
- Dating / community matching

---

## 4. Goals & Non-Goals

### 4.1 Business / Product Goals (v1)

| ID | Goal | Success signal |
| --- | --- | --- |
| G1 | Ship a production-ready core experience | Stable auth, Qur’an, podcasts, books, research browse |
| G2 | Establish content trust | 100% of published religious content has attribution fields |
| G3 | Retain daily spiritual habit | D7 retention of returning readers/listeners |
| G4 | App Store–grade quality bar | Lighthouse / a11y / performance checklist pass before release |
| G5 | Separated scalable architecture | FE / BE / DB independently deployable |

### 4.2 Non-Goals (v1)

- Offline-first full library download (may be v2)
- Multi-tenant white-label
- Admin CMS with full DAM (basic admin is enough for v1)
- AI-generated tafsir or AI fatwa
- Push notification campaigns as growth hack

---

## 5. Target Users

### 5.1 Primary Personas

#### Persona A — Daily Worshipper (“Aziz”)

- Age 18–35
- Reads/listens to Qur’an daily
- Wants last position, bookmarks, dark-friendly reading, clean audio
- Low patience for clutter

#### Persona B — Knowledge Seeker (“Madina”)

- Age 22–40
- Listens to Islamic podcasts while commuting
- Reads books/articles with notes and highlights
- Cares about scholar names and series continuity

#### Persona C — Student / Researcher (“Yusuf”)

- Madrasah / university student
- Needs searchable research topics with sources
- Needs citations, references, and clear content status (published / under review)

### 5.2 Secondary Personas

- Parent recommending trusted content for family
- Content curator / admin publishing approved materials

### 5.3 Anti-Personas (v1)

- Users seeking anonymous debate forums
- Users seeking entertainment TikTok-style Islamic clips as primary UX

---

## 6. Product Scope

### 6.1 Core Domains (v1)

| Domain | Description |
| --- | --- |
| Auth & Profile | Register, login, JWT sessions, profile, preferences |
| Qur’an | Surah/ayah browsing, reading, listening, bookmarks, last position |
| Podcasts | Series, episodes, playback, progress, favorites |
| Books | Catalog, reader (or chapter view), progress, bookmarks |
| Research | Curated Islamic research articles/topics with sources |
| Library / Progress | Unified continue-listening / continue-reading surface |
| Admin (minimal) | Authenticated content publish/unpublish for trusted roles |

### 6.2 Out of Scope for v1

- Live streaming
- Comments / public discussions
- User uploads of religious content
- Payments / subscriptions (architecture must allow later)
- Multi-language full localization beyond Uzbek + Arabic Qur’an text
- Native iOS/Android apps (web-first, App Store quality *standard*)

---

## 7. Functional Requirements

Priority legend:

- **P0** — Must ship in v1  
- **P1** — Should ship in v1 if schedule allows  
- **P2** — Planned for v1.x / v2  

### 7.1 Authentication & Account

| ID | Requirement | Priority |
| --- | --- | --- |
| AUTH-01 | User can register with email + password | P0 |
| AUTH-02 | User can log in and receive JWT access token | P0 |
| AUTH-03 | Access token expiry + refresh token rotation | P0 |
| AUTH-04 | User can log out (server-side refresh invalidation) | P0 |
| AUTH-05 | Password reset via email token flow | P1 |
| AUTH-06 | Profile: display name, avatar URL (optional), preferences | P0 |
| AUTH-07 | Role-based access: `user`, `editor`, `admin` | P0 |
| AUTH-08 | Protected routes on frontend; protected endpoints on backend | P0 |

### 7.2 Qur’an

| ID | Requirement | Priority |
| --- | --- | --- |
| QUR-01 | Browse all 114 surahs with metadata (name, ayah count, revelation type) | P0 |
| QUR-02 | Open a surah and read ayahs in Arabic | P0 |
| QUR-03 | Show ayah numbers clearly | P0 |
| QUR-04 | Optional translation line (Uzbek) where licensed/available | P0 |
| QUR-05 | Audio playback per ayah and/or full surah (licensed reciter) | P0 |
| QUR-06 | Save last reading position per user | P0 |
| QUR-07 | Bookmark ayahs | P0 |
| QUR-08 | Search surahs by name/number | P0 |
| QUR-09 | Search within ayah text (Arabic and/or translation) | P1 |
| QUR-10 | Multiple reciters selectable | P1 |
| QUR-11 | Reading settings: font size, line height, theme | P0 |
| QUR-12 | Never alter Qur’anic Arabic text; display only from verified source dataset | P0 |

### 7.3 Podcasts

| ID | Requirement | Priority |
| --- | --- | --- |
| POD-01 | Browse podcast series with cover, title, scholar/host, description | P0 |
| POD-02 | Browse episodes within a series | P0 |
| POD-03 | Stream episode audio with play/pause/seek | P0 |
| POD-04 | Persist listening progress per episode per user | P0 |
| POD-05 | Mark favorite series/episodes | P0 |
| POD-06 | Continue listening list on home/library | P0 |
| POD-07 | Episode show notes / description | P0 |
| POD-08 | Only published, approved podcast content is publicly visible | P0 |
| POD-09 | Playback speed control | P1 |
| POD-10 | Download for offline (v2) | P2 |

### 7.4 Books

| ID | Requirement | Priority |
| --- | --- | --- |
| BOOK-01 | Browse book catalog (title, author, cover, category, language) | P0 |
| BOOK-02 | Open book detail page with description and chapter list | P0 |
| BOOK-03 | Read chapters in-app (HTML/Markdown-rendered, sanitized) | P0 |
| BOOK-04 | Save reading progress (book + chapter + position) | P0 |
| BOOK-05 | Bookmark chapters/sections | P0 |
| BOOK-06 | Search books by title/author/category | P0 |
| BOOK-07 | Only approved books appear in public catalog | P0 |
| BOOK-08 | Highlight text / personal notes | P1 |
| BOOK-09 | PDF upload support (if needed later via Multer) | P2 |

### 7.5 Islamic Research

| ID | Requirement | Priority |
| --- | --- | --- |
| RES-01 | Browse research topics / articles by category | P0 |
| RES-02 | Article detail: title, summary, body, sources, scholar/reviewer | P0 |
| RES-03 | Mandatory source attribution fields before publish | P0 |
| RES-04 | Content status workflow: `draft` → `in_review` → `published` → `archived` | P0 |
| RES-05 | Search research by title/tags | P0 |
| RES-06 | Related articles suggestions | P1 |
| RES-07 | No AI-generated religious rulings presented as authoritative | P0 |

### 7.6 Home / Library / Discovery

| ID | Requirement | Priority |
| --- | --- | --- |
| HOME-01 | Home shows continue Qur’an / podcast / book | P0 |
| HOME-02 | Featured curated collections (editor-defined) | P0 |
| HOME-03 | Library aggregates bookmarks + favorites + progress | P0 |
| HOME-04 | Global search across domains with typed results | P1 |

### 7.7 Admin / Editorial (Minimal)

| ID | Requirement | Priority |
| --- | --- | --- |
| ADM-01 | Editors/admins can create/update/unpublish podcasts, books, research | P0 |
| ADM-02 | Audit fields: `createdBy`, `updatedBy`, `publishedAt` | P0 |
| ADM-03 | Soft-delete preferred over hard-delete for content | P0 |
| ADM-04 | Qur’an text dataset is not editable via casual admin UI | P0 |

---

## 8. Content & Authenticity Requirements

These are product requirements, not optional editorial preferences.

| ID | Rule |
| --- | --- |
| CONT-01 | Qur’anic Arabic must come from a verified digital mushaf source; no manual “approximate” text |
| CONT-02 | Translations must include translator credit and license status |
| CONT-03 | Recitation audio must include reciter name and license/permission status |
| CONT-04 | Podcasts/books/research must store author/scholar and source references |
| CONT-05 | Unpublished content must never leak via public API |
| CONT-06 | Research articles that lack sources cannot be published |
| CONT-07 | UI must never present unverified claims as “fatwa” or “absolute ruling” |
| CONT-08 | Content rules supersede growth/marketing copy if conflict arises |

Detailed operational rules will live in `CONTENT_RULES.md` (to be authored next).

---

## 9. Non-Functional Requirements

### 9.1 Performance

| ID | Requirement |
| --- | --- |
| NFR-P1 | Initial meaningful paint for home < 2.5s on mid-tier mobile (3G/4G target) |
| NFR-P2 | API p95 latency for read endpoints < 300ms (excluding cold starts) |
| NFR-P3 | Audio start (buffer) feels immediate; progressive streaming supported |
| NFR-P4 | Images/covers use responsive sizing and CDN-friendly URLs |

### 9.2 Reliability

| ID | Requirement |
| --- | --- |
| NFR-R1 | Backend health endpoint for uptime monitors |
| NFR-R2 | Graceful API error envelopes (no stack traces to clients in production) |
| NFR-R3 | MongoDB indexes for hot query paths (auth email, slugs, progress userId) |

### 9.3 Security

| ID | Requirement |
| --- | --- |
| NFR-S1 | Passwords hashed with bcrypt (or argon2); never stored plain |
| NFR-S2 | JWT secrets in environment variables only |
| NFR-S3 | Helmet, CORS allowlist, rate limiting on auth routes |
| NFR-S4 | Input validation on all write endpoints |
| NFR-S5 | XSS-safe rendering of book/research HTML |
| NFR-S6 | Role checks on every admin mutation |
| NFR-S7 | No secrets in frontend bundle |

### 9.4 Accessibility

| ID | Requirement |
| --- | --- |
| NFR-A1 | Keyboard navigable primary flows |
| NFR-A2 | Sufficient color contrast (WCAG AA) |
| NFR-A3 | Meaningful labels for icon-only controls |
| NFR-A4 | Respect `prefers-reduced-motion` for non-essential animation |

### 9.5 Internationalization / RTL

| ID | Requirement |
| --- | --- |
| NFR-I1 | Arabic Qur’an text rendered RTL correctly |
| NFR-I2 | Uzbek UI LTR; mixed pages must not break layout |
| NFR-I3 | Use proper Arabic typography (no Latin fallback for ayahs) |

### 9.6 Scalability & Architecture Constraints

| ID | Requirement |
| --- | --- |
| NFR-X1 | Frontend, Backend, Database are completely separated deployments |
| NFR-X2 | Feature-based folder structure on both FE and BE |
| NFR-X3 | Clean architecture boundaries (routes → controllers → services → repositories/models) |
| NFR-X4 | No fake data, no placeholder “lorem” in production paths |
| NFR-X5 | No demo shortcuts that block production hardening |

---

## 10. User Journeys (v1)

### 10.1 First Open → Qur’an Continue

1. User opens NUR  
2. Sees calm home with brand and primary continue CTA  
3. Signs up / logs in  
4. Opens Qur’an → selects Surah Al-Mulk  
5. Reads + listens  
6. Closes app  
7. Returns later → resumes exact ayah position  

### 10.2 Podcast Habit

1. User browses Podcasts  
2. Opens a series by a known scholar  
3. Plays episode 3  
4. Leaves at 12:40  
5. Returns via Continue Listening and resumes at 12:40  

### 10.3 Research Lookup

1. User searches “namoz shartlari” (example topic)  
2. Opens a published research article  
3. Reads body + sources  
4. Bookmarks for later  

### 10.4 Editor Publish Flow

1. Editor logs in  
2. Creates research draft with sources  
3. Submits for review / publishes (per role policy)  
4. Public users see content only after `published`  

---

## 11. Information Architecture (App Map)

```text
NUR
├── Home
├── Qur’an
│   ├── Surah list
│   ├── Surah reader / player
│   └── Bookmarks
├── Podcasts
│   ├── Series list
│   ├── Series detail
│   └── Episode player
├── Books
│   ├── Catalog
│   ├── Book detail
│   └── Chapter reader
├── Research
│   ├── Topic / article list
│   └── Article detail
├── Library
│   ├── Continue
│   ├── Favorites
│   └── Bookmarks
├── Search (P1)
├── Profile / Settings
└── Admin (role-gated)
    ├── Podcasts CMS
    ├── Books CMS
    └── Research CMS
```

---

## 12. UX Principles (Product-Level)

1. **One job per screen** — reading, listening, or researching; not all at once.  
2. **Brand first** — NUR is unmistakably present on first viewport.  
3. **No feed addiction patterns** — no infinite social engagement loops.  
4. **Progress is sacred** — never lose user position silently.  
5. **Trust visible** — author, reciter, sources shown near content.  
6. **Motion with purpose** — transitions support hierarchy; respect reduced motion.  
7. **Cards only for interaction containers** — avoid decorative card spam.  

Detailed visual rules: `UI_GUIDELINES.md` + `DESIGN_SYSTEM.md` (forthcoming).

---

## 13. Analytics & Success Metrics (v1)

Minimum events (privacy-respecting; no invasive tracking):

| Event | Purpose |
| --- | --- |
| `auth_signup` / `auth_login` | Acquisition |
| `quran_surah_open` | Engagement |
| `quran_audio_play` | Listening habit |
| `podcast_episode_progress` | Retention |
| `book_chapter_open` | Reading habit |
| `research_article_open` | Knowledge usage |
| `content_publish` (admin) | Editorial velocity |

KPIs:

- Weekly active users with ≥1 continue action  
- Median session length for Qur’an and podcasts  
- % published research with complete source fields (must be 100%)  
- Crash-free sessions / API error rate  

---

## 14. Risks & Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Unverified religious content | Trust collapse | Strict publish gates + CONTENT_RULES |
| Qur’an text/license mistakes | Legal + spiritual harm | Verified source only; no casual edits |
| Audio hosting costs | Budget | Stream from controlled storage; optimize bitrate |
| Scope creep (social features) | Delay | Enforce non-goals |
| Render cold starts | UX lag | Health checks, keep-alive strategy, lean boot |
| Hallucinated AI content in docs/code | Wrong religion claims | Human review; no AI fatwa features |

---

## 15. Release Criteria (v1 Go / No-Go)

Ship only if all are true:

- [ ] AUTH P0 complete and tested  
- [ ] Qur’an P0 complete with verified text source integrated  
- [ ] Podcasts P0 playback + progress works with real data  
- [ ] Books P0 catalog + chapter reading works with real data  
- [ ] Research P0 with mandatory sources enforced by API  
- [ ] No placeholder/fake production data paths  
- [ ] Security baseline (JWT, hashing, validation, CORS, rate limit)  
- [ ] Accessibility smoke pass on primary flows  
- [ ] Frontend on Vercel, Backend on Render, DB on MongoDB Atlas  
- [ ] Production checklist document signed off  

---

## 16. Technology Constraints (Binding)

These are product constraints for delivery, detailed in `ARCHITECTURE.md`:

### Frontend

- React.js + Vite + TypeScript  
- Tailwind CSS  
- Framer Motion  
- React Router  
- Zustand  
- Axios  
- Lucide React  

### Backend

- Node.js + Express.js  
- JWT Authentication  
- REST API  
- Multer only if file uploads become necessary  

### Database

- MongoDB Atlas + Mongoose ODM  

### Deployment

- Frontend → Vercel  
- Backend → Render  
- Database → MongoDB Atlas  

### Hard Rules

- Frontend / Backend / Database completely separated  
- Clean architecture  
- Feature-based folder structure  
- Scalable and production-ready  
- No shortcuts, no demo code, no placeholder code, no fake data  

---

## 17. Documentation Roadmap (After PRD Approval)

Order of remaining specification docs:

1. `PRODUCT.md` — expanded vision & positioning  
2. `ARCHITECTURE.md` — technical architecture (draft included in parallel for review)  
3. `DATABASE.md` — MongoDB schemas  
4. `API.md` — REST contract  
5. `CONTENT_RULES.md` — Qur’an / podcast / book / research rules  
6. `DESIGN_SYSTEM.md` + `UI_GUIDELINES.md`  
7. `CLAUDE.md` / Cursor AI rules  
8. `TASKS.md` — implementation backlog  
9. `CURRICULUM.md` — learning path content model (if retained)  
10. `README.md` — contributor entrypoint  

---

## 18. Open Questions (Need Owner Answers)

These block perfect completeness; PRD can still be approved with temporary decisions:

1. Exact Qur’an text/translation/recitation licenses to use?  
2. Is v1 Uzbek-only UI, or bilingual from day one?  
3. Are books primarily chapter HTML, or PDF-first?  
4. Will there be a paid plan in v1.x (affects user model)?  
5. Admin: built-in web CMS pages vs external headless CMS?  
6. Is “Curriculum” a v1 domain or deferred?  
7. Legal entity / content ownership / takedown process?

---

## 19. Approval

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Product Owner | Husanboy | ☐ Approved / ☐ Changes requested | |
| Engineering | — | ☐ Aligned with architecture | |

**Approval statement (to reply in chat):**

> “PRD approved. Proceed to next specification docs / implementation as instructed.”

Until that statement (or equivalent), **do not write application code**.

---

## Appendix A — Glossary

| Term | Definition |
| --- | --- |
| Ayah | Verse of the Qur’an |
| Surah | Chapter of the Qur’an |
| Reciter | Qur’an audio performer |
| Research article | Curated Islamic knowledge piece with sources |
| Continue surface | UI showing unfinished Qur’an/podcast/book progress |
| Published | Content status visible to public users |

## Appendix B — Requirement Traceability (Domains → Later Docs)

| Domain | PRD sections | Downstream docs |
| --- | --- | --- |
| Auth | 7.1 | API.md, DATABASE.md |
| Qur’an | 7.2, 8 | CONTENT_RULES.md, DATABASE.md, API.md |
| Podcasts | 7.3, 8 | CONTENT_RULES.md, API.md |
| Books | 7.4, 8 | CONTENT_RULES.md, API.md |
| Research | 7.5, 8 | CONTENT_RULES.md, API.md |
| Architecture | 16 | ARCHITECTURE.md |
| UX/UI | 12 | UI_GUIDELINES.md, DESIGN_SYSTEM.md |
