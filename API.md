# NUR — REST API Specification

**Status:** Draft v1.0.0  
**Last updated:** 2026-07-25  
**Depends on:** `PRD.md`, `ARCHITECTURE.md`, `DATABASE.md`, `CONTENT_RULES.md`  
**Base URL (production):** `https://<render-api-host>/api/v1`  
**Base URL (local):** `http://localhost:<port>/api/v1`

---

## 1. Conventions

### 1.1 Protocol

- HTTPS in staging/production
- JSON request/response bodies (`Content-Type: application/json`) unless multipart upload endpoints are later added

### 1.2 Versioning

All product endpoints live under `/api/v1`.  
Health is outside versioning: `GET /health`.

### 1.3 Success envelope

```json
{
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

`meta` is required for paginated lists; optional otherwise.

### 1.4 Error envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable safe message",
    "details": [
      { "field": "email", "message": "Invalid email" }
    ]
  }
}
```

### 1.5 Common error codes

| HTTP | code | Meaning |
| --- | --- | --- |
| 400 | `BAD_REQUEST` | Malformed request |
| 401 | `UNAUTHORIZED` | Missing/invalid access token |
| 403 | `FORBIDDEN` | Authenticated but not allowed |
| 404 | `NOT_FOUND` | Resource missing or not public |
| 409 | `CONFLICT` | Unique constraint / state conflict |
| 422 | `VALIDATION_ERROR` | Semantic validation failed |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

### 1.6 Auth header

```http
Authorization: Bearer <accessToken>
```

### 1.7 Pagination

```http
GET /resource?page=1&limit=20
```

Defaults: `page=1`, `limit=20`, max `limit=100`.

### 1.8 Public content visibility

Public GETs for podcasts/books/research return only:

```js
{ status: 'published', deletedAt: null }
```

Editors/admins may use `/admin` routes to see drafts.

### 1.9 IDs vs slugs

- Internal IDs: MongoDB ObjectId strings
- Public content URLs prefer `slug` (and Qur’an uses `surahNumber`)

---

## 2. Health

### `GET /health`

**Auth:** none

**Response `200`**

```json
{
  "data": {
    "status": "ok",
    "uptime": 12345,
    "timestamp": "2026-07-25T00:00:00.000Z"
  }
}
```

---

## 3. Auth

### `POST /api/v1/auth/register`

**Auth:** none  
**Rate limit:** strict

**Body**

```json
{
  "email": "user@example.com",
  "password": "min-8-chars-policy",
  "displayName": "Husanboy"
}
```

**Response `201`**

```json
{
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "displayName": "Husanboy",
      "role": "user"
    },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

### `POST /api/v1/auth/login`

**Auth:** none  
**Rate limit:** strict

**Body**

```json
{
  "email": "user@example.com",
  "password": "..."
}
```

**Response `200`:** same token envelope as register.

### `POST /api/v1/auth/refresh`

**Auth:** none (refresh token in body)

**Body**

```json
{
  "refreshToken": "..."
}
```

**Response `200`:** new `accessToken` + rotated `refreshToken`.

### `POST /api/v1/auth/logout`

**Auth:** Bearer access token

**Body**

```json
{
  "refreshToken": "..."
}
```

**Response `200`**

```json
{ "data": { "success": true } }
```

### `GET /api/v1/users/me`

**Auth:** required

**Response `200`**

```json
{
  "data": {
    "id": "...",
    "email": "user@example.com",
    "displayName": "Husanboy",
    "avatarUrl": null,
    "role": "user",
    "preferences": {
      "theme": "system",
      "quranFontSize": 22,
      "reduceMotion": false,
      "language": "uz"
    }
  }
}
```

### `PATCH /api/v1/users/me`

**Auth:** required

**Body (any subset)**

```json
{
  "displayName": "Husanboy",
  "avatarUrl": "https://...",
  "preferences": {
    "theme": "dark",
    "quranFontSize": 24,
    "reduceMotion": true
  }
}
```

**Response `200`:** updated user (safe fields).

### `POST /api/v1/auth/password-reset/request` (P1)

**Body:** `{ "email": "..." }`  
**Response:** always `200` with generic success message (no email enumeration).

### `POST /api/v1/auth/password-reset/confirm` (P1)

**Body:** `{ "token": "...", "newPassword": "..." }`

---

## 4. Qur’an

### `GET /api/v1/quran/surahs`

**Auth:** none

**Query:** `q` (optional search by name/number)

**Response `200`:** list of surah metadata (no full ayahs).

### `GET /api/v1/quran/surahs/:number`

**Auth:** none  
**Params:** `number` 1–114

**Response `200`**

```json
{
  "data": {
    "surah": { "number": 67, "nameArabic": "...", "nameLatin": "Al-Mulk", "ayahCount": 30 },
    "ayahs": [
      {
        "surahNumber": 67,
        "ayahNumber": 1,
        "textArabic": "...",
        "textUz": "..."
      }
    ]
  }
}
```

### `GET /api/v1/quran/reciters`

**Auth:** none  
**Response:** active reciters.

### `GET /api/v1/quran/audio`

**Auth:** none

**Query**

- `reciterId` (required)
- `surahNumber` (required)
- `ayahNumber` (optional)
- `scope` = `ayah` | `surah` (optional)

**Response:** matching audio assets with `audioUrl`, `reciter`, rights summary.

### Qur’an progress

#### `GET /api/v1/quran/progress`

**Auth:** required  
**Response:** current user progress by mode.

#### `PUT /api/v1/quran/progress`

**Auth:** required

**Body**

```json
{
  "mode": "read",
  "surahNumber": 67,
  "ayahNumber": 12
}
```

### Qur’an bookmarks

#### `GET /api/v1/quran/bookmarks`

**Auth:** required

#### `POST /api/v1/quran/bookmarks`

**Auth:** required

```json
{ "surahNumber": 67, "ayahNumber": 12, "note": "optional" }
```

#### `DELETE /api/v1/quran/bookmarks/:id`

**Auth:** required (owner only)

---

## 5. Podcasts

### `GET /api/v1/podcasts/series`

**Auth:** none  
**Query:** `page`, `limit`, `q`, `topic`

**Response:** published series cards.

### `GET /api/v1/podcasts/series/:slug`

**Auth:** none  
**Response:** series detail + published episodes list (summary fields).

### `GET /api/v1/podcasts/episodes/:id`

**Auth:** none  
**Response:** published episode detail including `audioUrl`.

> Alternate: `GET /api/v1/podcasts/series/:slug/episodes/:episodeSlug`

### Podcast progress

#### `GET /api/v1/podcasts/progress`

**Auth:** required  
**Query:** optional `episodeId`  
**Response:** list or single progress; used for Continue Listening.

#### `PUT /api/v1/podcasts/progress`

**Auth:** required

```json
{
  "episodeId": "...",
  "positionSeconds": 760,
  "durationSeconds": 1800,
  "completed": false
}
```

### Favorites

#### `GET /api/v1/podcasts/favorites`

**Auth:** required

#### `POST /api/v1/podcasts/favorites`

```json
{ "targetType": "series", "targetId": "..." }
```

#### `DELETE /api/v1/podcasts/favorites/:id`

**Auth:** required

---

## 5b. Videos (YouTube embed)

Siyrat-first catalog. Stream stays on YouTube; NUR serves metadata + `youtube.com/embed/{id}` only. No download/rehost.

### `GET /api/v1/videos/series`

**Auth:** none  
**Query:** `page`, `limit`, `q`, `topic`  
**Response:** published series cards; `siyrat` topics sorted first.

### `GET /api/v1/videos/series/:slug`

**Auth:** none  
**Response:** series detail + published episodes (`youtubeVideoId`, `embedUrl`, `watchUrl`, thumbnail).

### `GET /api/v1/videos/episodes/:id`

**Auth:** none  
**Response:** published episode detail for curriculum deep-links.

---

## 6. Books

### `GET /api/v1/books`

**Auth:** none  
**Query:** `page`, `limit`, `q`, `category`

### `GET /api/v1/books/:slug`

**Auth:** none  
**Response:** book detail + published chapters list (title, slug, order; not necessarily full body).

### `GET /api/v1/books/:slug/chapters/:chapterSlug`

**Auth:** none  
**Response:** published chapter body.

### Book progress

#### `GET /api/v1/books/progress`

**Auth:** required

#### `PUT /api/v1/books/progress`

```json
{
  "bookId": "...",
  "chapterId": "...",
  "position": { "scrollRatio": 0.42 }
}
```

### Bookmarks

#### `GET /api/v1/books/bookmarks`

**Auth:** required

#### `POST /api/v1/books/bookmarks`

```json
{ "bookId": "...", "chapterId": "...", "note": "optional" }
```

#### `DELETE /api/v1/books/bookmarks/:id`

**Auth:** required

---

## 7. Research

### `GET /api/v1/research`

**Auth:** none  
**Query:** `page`, `limit`, `q`, `category`, `tag`

### `GET /api/v1/research/:slug`

**Auth:** none  
**Response:** published article including `sources[]`, authors, body.

### Bookmarks

#### `GET /api/v1/research/bookmarks`

**Auth:** required

#### `POST /api/v1/research/bookmarks`

```json
{ "articleId": "..." }
```

#### `DELETE /api/v1/research/bookmarks/:id`

**Auth:** required

---

## 8. Library (aggregate)

### `GET /api/v1/library/continue`

**Auth:** required

**Response `200`**

```json
{
  "data": {
    "quran": [
      { "mode": "read", "surahNumber": 67, "ayahNumber": 12, "updatedAt": "..." }
    ],
    "podcasts": [
      {
        "episodeId": "...",
        "seriesSlug": "...",
        "title": "...",
        "positionSeconds": 760,
        "durationSeconds": 1800,
        "updatedAt": "..."
      }
    ],
    "books": [
      {
        "bookSlug": "...",
        "chapterSlug": "...",
        "title": "...",
        "updatedAt": "..."
      }
    ]
  }
}
```

### `GET /api/v1/library/favorites`

**Auth:** required  
**Response:** unified favorites (podcasts first in v1; extensible).

### `GET /api/v1/library/bookmarks`

**Auth:** required  
**Response:** grouped bookmarks across Qur’an / books / research.

---

## 9. Search (P1)

### `GET /api/v1/search`

**Auth:** none (published only)

**Query:** `q` (required), `types` optional CSV: `quran,podcasts,videos,books,research`

**Response:** typed hit list with `type`, `title`, `slug`/`number`, snippet.

---

## 10. Admin API

**Auth:** Bearer + role `editor` or `admin`  
Base: `/api/v1/admin`

### 10.1 Common admin behaviors

- List supports `status` filter including drafts
- Create starts as `draft` unless explicitly published with validation
- Publish endpoints enforce CONTENT_RULES (sources, rights ≠ unknown, etc.)
- Soft delete via `DELETE` sets `deletedAt`

### 10.2 Podcasts

| Method | Path | Roles |
| --- | --- | --- |
| GET | `/admin/podcasts/series` | editor, admin |
| POST | `/admin/podcasts/series` | editor, admin |
| PATCH | `/admin/podcasts/series/:id` | editor, admin |
| POST | `/admin/podcasts/series/:id/publish` | editor*, admin |
| DELETE | `/admin/podcasts/series/:id` | editor, admin |
| GET | `/admin/podcasts/series/:id/episodes` | editor, admin |
| POST | `/admin/podcasts/episodes` | editor, admin |
| PATCH | `/admin/podcasts/episodes/:id` | editor, admin |
| POST | `/admin/podcasts/episodes/:id/publish` | editor*, admin |
| DELETE | `/admin/podcasts/episodes/:id` | editor, admin |

\*If policy later restricts publish to admin-only, enforce in authorize middleware.

### 10.2b Videos

| Method | Path | Roles |
| --- | --- | --- |
| GET | `/admin/videos/series` | editor, admin |
| POST | `/admin/videos/series` | editor, admin |
| PATCH | `/admin/videos/series/:id` | editor, admin |
| POST | `/admin/videos/series/:id/publish` | editor*, admin |
| DELETE | `/admin/videos/series/:id` | editor, admin |
| GET | `/admin/videos/series/:id/episodes` | editor, admin |
| POST | `/admin/videos/episodes` | editor, admin |
| PATCH | `/admin/videos/episodes/:id` | editor, admin |
| POST | `/admin/videos/episodes/:id/publish` | editor*, admin |
| DELETE | `/admin/videos/episodes/:id` | editor, admin |

Episode body accepts `youtubeVideoId` or a `youtube.com/watch?v=` / `youtu.be/` URL (normalized to 11-char ID).

### 10.3 Books

| Method | Path | Roles |
| --- | --- | --- |
| GET/POST | `/admin/books` | editor, admin |
| PATCH | `/admin/books/:id` | editor, admin |
| POST | `/admin/books/:id/publish` | editor*, admin |
| DELETE | `/admin/books/:id` | editor, admin |
| GET | `/admin/books/:id/chapters` | editor, admin |
| POST | `/admin/books/chapters` | editor, admin |
| PATCH | `/admin/books/chapters/:id` | editor, admin |
| POST | `/admin/books/chapters/:id/publish` | editor*, admin |

### 10.4 Research

| Method | Path | Roles |
| --- | --- | --- |
| GET/POST | `/admin/research` | editor, admin |
| PATCH | `/admin/research/:id` | editor, admin |
| POST | `/admin/research/:id/publish` | editor*, admin |
| DELETE | `/admin/research/:id` | editor, admin |

**Publish validation (422 if missing):**

- `sources.length >= 1`
- each source has `title`, `type`, `citation`
- `authors.length >= 1`
- `rights.licenseStatus` not `unknown` when rights apply

### 10.5 Qur’an admin

No general CRUD for ayah Arabic text.

Optional:

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/admin/quran/reciters` | editor, admin | manage reciters metadata |
| POST/PATCH | `/admin/quran/reciters` | admin | create/update reciter |
| POST/PATCH | `/admin/quran/audio` | admin | register audio URLs |

Dataset import remains script-based, not a casual HTTP “edit ayah” API.

### 10.6 Users (admin)

| Method | Path | Roles |
| --- | --- | --- |
| GET | `/admin/users` | admin |
| PATCH | `/admin/users/:id/role` | admin |
| PATCH | `/admin/users/:id/status` | admin | activate/deactivate |

---

## 11. Uploads (optional, only if needed)

### `POST /api/v1/admin/uploads`

**Auth:** editor/admin  
**Content-Type:** `multipart/form-data`  
**Field:** `file`  
**Constraints:** MIME allowlist, size limit, Multer  
**Response:** `{ data: { url, assetId, mimeType, sizeBytes } }`

Until this is required, do not implement.

---

## 12. Security Requirements for API Implementers

1. Validate all write bodies.
2. Hash passwords; never log tokens/passwords.
3. Rotate refresh tokens; reject revoked/expired.
4. Authorize by role on every admin route.
5. Return `404` (not `403`) for unpublished content on public GETs when appropriate to avoid existence leaks for drafts (acceptable alternative: 404 always for non-public).
6. Rate limit auth endpoints.
7. CORS allowlist frontend origin(s).
8. Sanitize HTML bodies on write for books/research.

---

## 13. Frontend Consumption Rules

1. Axios instance uses `VITE_API_BASE_URL`.
2. Attach access token on protected calls.
3. On `401`, try refresh once; else logout.
4. Feature API modules map 1:1 to domains (`authApi`, `quranApi`, …).
5. Never call MongoDB from the frontend.

---

## 14. Example Auth Flow

```text
POST /auth/register
  → store tokens securely (chosen strategy)
GET  /users/me
GET  /library/continue
PUT  /quran/progress
POST /auth/refresh   (when access expires)
POST /auth/logout
```

---

## 15. Open API Decisions

1. Refresh token transport: body + client storage vs httpOnly cookie (architecture open question).
2. Episode identity in public URLs: `id` vs `seriesSlug + episodeSlug` (both supported preferred).
3. Admin publish: editor allowed vs admin-only.

---

## 16. Approval

| Role | Decision |
| --- | --- |
| Product Owner | ☐ Approved |
| Engineering | ☐ Approved |

This document is the HTTP contract source of truth until `API.md` v1.1.0.
