# NUR — Database Specification (MongoDB + Mongoose)

**Status:** Draft v1.0.0  
**Last updated:** 2026-07-25  
**Depends on:** `PRD.md`, `ARCHITECTURE.md`, `CONTENT_RULES.md`  
**Database:** MongoDB Atlas  
**ODM:** Mongoose

---

## 1. Principles

1. Feature-aligned collections; clear ownership per domain.
2. Public reads must be enforceable via `status` + `deletedAt`.
3. Progress/bookmarks are per-user documents (not unbounded arrays on user).
4. Qur’an Arabic text is reference data with provenance — not casual CMS edits.
5. All timestamps in UTC (`createdAt`, `updatedAt` via Mongoose timestamps where applicable).
6. No fake seed data in production databases.

---

## 2. Shared Enums & Subdocuments

### 2.1 Roles

```ts
type UserRole = 'user' | 'editor' | 'admin';
```

### 2.2 Content status

```ts
type ContentStatus = 'draft' | 'in_review' | 'published' | 'archived';
```

### 2.3 License status

```ts
type LicenseStatus =
  | 'owned'
  | 'licensed'
  | 'permission_granted'
  | 'public_domain';
// NOTE: 'unknown' may exist in drafts only; publish validation rejects it.
```

### 2.4 Source subdocument (research)

```ts
interface ContentSource {
  title: string;
  type: 'book' | 'article' | 'scholar' | 'quran' | 'hadith_collection' | 'other';
  citation: string;
  url?: string;
  notes?: string;
}
```

### 2.5 Rights subdocument

```ts
interface RightsInfo {
  licenseStatus: LicenseStatus | 'unknown';
  licenseNotes?: string;
}
```

### 2.6 Soft delete

```ts
deletedAt?: Date | null;
```

Query helper for public content:

```js
{ status: 'published', deletedAt: null }
```

---

## 3. Collection Overview

| Collection | Domain |
| --- | --- |
| `users` | Auth / profile |
| `refresh_tokens` | Auth sessions |
| `surahs` | Qur’an metadata |
| `ayahs` | Qur’an text (+ optional translation fields) |
| `reciters` | Recitation metadata |
| `quran_audio` | Audio assets mapped to surah/ayah + reciter |
| `quran_progress` | User reading/listening position |
| `quran_bookmarks` | User ayah bookmarks |
| `podcast_series` | Podcast shows |
| `podcast_episodes` | Episodes |
| `podcast_progress` | User episode progress |
| `podcast_favorites` | User favorites |
| `video_series` | YouTube embed series (siyrat-first) |
| `video_episodes` | Episodes with `youtubeVideoId` (no rehost) |
| `books` | Book catalog |
| `book_chapters` | Chapters |
| `book_progress` | User reading progress |
| `book_bookmarks` | User bookmarks |
| `research_articles` | Research |
| `research_bookmarks` | User bookmarks |
| `media_assets` | Optional uploads registry (if Multer used) |

---

## 4. Schemas

### 4.1 `users`

```ts
User {
  _id: ObjectId
  email: string              // unique, lowercase, trimmed
  passwordHash: string
  displayName: string
  avatarUrl?: string
  role: UserRole             // default 'user'
  preferences: {
    theme: 'system' | 'light' | 'dark'
    quranFontSize: number    // e.g. 16–40
    reduceMotion: boolean
    language: 'uz'           // v1
  }
  isActive: boolean          // default true
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}
```

**Indexes**

- unique: `email`
- `role`
- `deletedAt`

**Rules**

- Never return `passwordHash` in API responses.
- Email unique among non-deleted users (enforce in service if soft-deleted emails can re-register).

---

### 4.2 `refresh_tokens`

```ts
RefreshToken {
  _id: ObjectId
  userId: ObjectId           // ref: users
  tokenHash: string          // sha256 of refresh token
  expiresAt: Date
  revokedAt?: Date | null
  userAgent?: string
  ip?: string
  createdAt: Date
  updatedAt: Date
}
```

**Indexes**

- `userId`
- unique: `tokenHash`
- TTL optional on `expiresAt` (MongoDB TTL index)
- `revokedAt`

---

### 4.3 `surahs`

```ts
Surah {
  _id: ObjectId
  number: number             // 1–114, unique
  nameArabic: string
  nameLatin: string          // e.g. Al-Fatiha
  nameUz?: string
  ayahCount: number
  revelationType: 'meccan' | 'medinan'
  createdAt: Date
  updatedAt: Date
}
```

**Indexes**

- unique: `number`
- text optional on `nameLatin`, `nameUz`

---

### 4.4 `ayahs`

```ts
Ayah {
  _id: ObjectId
  surahNumber: number        // 1–114
  ayahNumber: number         // within surah
  textArabic: string         // verified source only
  textUz?: string            // licensed translation line
  translationMeta?: {
    translatorName: string
    translationKey: string
    rights: RightsInfo
  }
  sourceMeta: {
    datasetName: string
    datasetVersion: string
    importedAt: Date
    checksum?: string
  }
  createdAt: Date
  updatedAt: Date
}
```

**Indexes**

- unique compound: `{ surahNumber: 1, ayahNumber: 1 }`
- `surahNumber`

**Rules**

- No public editor update routes for `textArabic`.
- Import via controlled migration/seed scripts with provenance.

---

### 4.5 `reciters`

```ts
Reciter {
  _id: ObjectId
  name: string
  slug: string               // unique
  bio?: string
  photoUrl?: string
  rights: RightsInfo
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

**Indexes**

- unique: `slug`

---

### 4.6 `quran_audio`

```ts
QuranAudio {
  _id: ObjectId
  reciterId: ObjectId
  scope: 'ayah' | 'surah'
  surahNumber: number
  ayahNumber?: number        // required if scope === 'ayah'
  audioUrl: string
  durationSeconds?: number
  bitrateKbps?: number
  rights: RightsInfo
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

**Indexes**

- `{ reciterId: 1, surahNumber: 1, ayahNumber: 1 }`
- `{ scope: 1, surahNumber: 1 }`

**Publish rule**

- `rights.licenseStatus` must not be `unknown` when `isActive=true`.

---

### 4.7 `quran_progress`

```ts
QuranProgress {
  _id: ObjectId
  userId: ObjectId
  surahNumber: number
  ayahNumber: number
  mode: 'read' | 'listen'
  updatedAt: Date
  createdAt: Date
}
```

**Indexes**

- unique: `{ userId: 1 }` (one continue position) **or** unique `{ userId: 1, mode: 1 }` if separate read/listen positions are desired.

**Decision (v1 default):** unique `{ userId: 1, mode: 1 }`.

---

### 4.8 `quran_bookmarks`

```ts
QuranBookmark {
  _id: ObjectId
  userId: ObjectId
  surahNumber: number
  ayahNumber: number
  note?: string
  createdAt: Date
  updatedAt: Date
}
```

**Indexes**

- unique: `{ userId: 1, surahNumber: 1, ayahNumber: 1 }`
- `{ userId: 1, createdAt: -1 }`

---

### 4.9 `podcast_series`

```ts
PodcastSeries {
  _id: ObjectId
  title: string
  slug: string               // unique
  description: string
  hostOrScholar: string
  coverUrl: string
  language: string           // 'uz'
  topics: string[]
  status: ContentStatus
  rights: RightsInfo
  createdBy: ObjectId
  updatedBy?: ObjectId
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}
```

**Indexes**

- unique: `slug`
- `{ status: 1, publishedAt: -1 }`
- `{ deletedAt: 1, status: 1 }`

---

### 4.10 `podcast_episodes`

```ts
PodcastEpisode {
  _id: ObjectId
  seriesId: ObjectId
  title: string
  slug: string
  description: string
  audioUrl: string
  coverUrl?: string
  durationSeconds: number
  episodeNumber?: number
  status: ContentStatus
  rights: RightsInfo
  createdBy: ObjectId
  updatedBy?: ObjectId
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}
```

**Indexes**

- unique: `{ seriesId: 1, slug: 1 }`
- `{ seriesId: 1, episodeNumber: 1 }`
- `{ status: 1, publishedAt: -1 }`

---

### 4.11 `podcast_progress`

```ts
PodcastProgress {
  _id: ObjectId
  userId: ObjectId
  episodeId: ObjectId
  positionSeconds: number
  durationSeconds: number
  completed: boolean
  updatedAt: Date
  createdAt: Date
}
```

**Indexes**

- unique: `{ userId: 1, episodeId: 1 }`
- `{ userId: 1, updatedAt: -1 }`

---

### 4.12 `podcast_favorites`

```ts
PodcastFavorite {
  _id: ObjectId
  userId: ObjectId
  targetType: 'series' | 'episode'
  targetId: ObjectId
  createdAt: Date
}
```

**Indexes**

- unique: `{ userId: 1, targetType: 1, targetId: 1 }`

---

### 4.12a `video_series`

YouTube **embed** catalog only — files are not rehosted (`CONTENT_RULES` G-04).

```ts
VideoSeries {
  _id: ObjectId
  title: string
  slug: string               // unique
  description: string
  hostOrScholar: string
  coverUrl: string
  language: string
  topics: string[]           // prefer 'siyrat'
  channelUrl?: string | null
  status: ContentStatus
  rights: RightsInfo         // permission_granted + embed notes
  createdBy: ObjectId
  updatedBy?: ObjectId
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}
```

**Indexes**

- unique: `slug`
- `{ status: 1, publishedAt: -1 }`
- `{ deletedAt: 1, status: 1 }`
- `{ topics: 1, status: 1 }`

---

### 4.12b `video_episodes`

```ts
VideoEpisode {
  _id: ObjectId
  seriesId: ObjectId
  title: string
  slug: string
  description: string
  youtubeVideoId: string     // 11-char ID; stream stays on YouTube
  coverUrl?: string | null   // often i.ytimg.com thumbnail
  durationSeconds?: number | null
  episodeNumber?: number | null
  status: ContentStatus
  rights: RightsInfo
  createdBy: ObjectId
  updatedBy?: ObjectId
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}
```

**Indexes**

- unique: `{ seriesId: 1, slug: 1 }`
- `{ seriesId: 1, episodeNumber: 1 }`
- `{ status: 1, publishedAt: -1 }`
- `{ youtubeVideoId: 1 }`

---

### 4.13 `books`

```ts
Book {
  _id: ObjectId
  title: string
  slug: string
  authors: string[]
  translator?: string
  description: string
  coverUrl: string
  language: string
  categories: string[]
  status: ContentStatus
  rights: RightsInfo
  createdBy: ObjectId
  updatedBy?: ObjectId
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}
```

**Indexes**

- unique: `slug`
- `{ status: 1, publishedAt: -1 }`
- `{ categories: 1, status: 1 }`

---

### 4.14 `book_chapters`

```ts
BookChapter {
  _id: ObjectId
  bookId: ObjectId
  title: string
  slug: string
  order: number
  body: string               // sanitized HTML or Markdown source
  bodyFormat: 'html' | 'markdown'
  status: ContentStatus      // usually follows book; allow chapter-level draft if needed
  createdBy: ObjectId
  updatedBy?: ObjectId
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}
```

**Indexes**

- unique: `{ bookId: 1, slug: 1 }`
- unique: `{ bookId: 1, order: 1 }`

---

### 4.15 `book_progress`

```ts
BookProgress {
  _id: ObjectId
  userId: ObjectId
  bookId: ObjectId
  chapterId: ObjectId
  position: {
    scrollRatio?: number     // 0–1
    blockId?: string
  }
  updatedAt: Date
  createdAt: Date
}
```

**Indexes**

- unique: `{ userId: 1, bookId: 1 }`
- `{ userId: 1, updatedAt: -1 }`

---

### 4.16 `book_bookmarks`

```ts
BookBookmark {
  _id: ObjectId
  userId: ObjectId
  bookId: ObjectId
  chapterId: ObjectId
  note?: string
  createdAt: Date
}
```

**Indexes**

- unique: `{ userId: 1, bookId: 1, chapterId: 1 }`

---

### 4.17 `research_articles`

```ts
ResearchArticle {
  _id: ObjectId
  title: string
  slug: string
  summary: string
  body: string
  bodyFormat: 'html' | 'markdown'
  category: string
  tags: string[]
  authors: string[]
  reviewer?: string
  sources: ContentSource[]   // min 1 when publishing
  language: string
  coverUrl?: string
  status: ContentStatus
  createdBy: ObjectId
  updatedBy?: ObjectId
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}
```

**Indexes**

- unique: `slug`
- `{ status: 1, publishedAt: -1 }`
- `{ category: 1, status: 1 }`
- `{ tags: 1, status: 1 }`
- text index on `title`, `summary`, `tags` (optional for v1 search)

**Validation (service-level publish)**

- `sources.length >= 1`
- each source has `title`, `type`, `citation`
- no `fatwa` label field in v1

---

### 4.18 `research_bookmarks`

```ts
ResearchBookmark {
  _id: ObjectId
  userId: ObjectId
  articleId: ObjectId
  createdAt: Date
}
```

**Indexes**

- unique: `{ userId: 1, articleId: 1 }`

---

### 4.19 `media_assets` (optional)

Only if Multer uploads are enabled:

```ts
MediaAsset {
  _id: ObjectId
  uploaderId: ObjectId
  kind: 'image' | 'audio' | 'document'
  originalFileName: string
  mimeType: string
  sizeBytes: number
  storageUrl: string
  rights: RightsInfo
  createdAt: Date
  deletedAt?: Date | null
}
```

---

## 5. Relationship Diagram

```text
users ─┬─ refresh_tokens
       ├─ quran_progress / quran_bookmarks
       ├─ podcast_progress / podcast_favorites
       ├─ book_progress / book_bookmarks
       └─ research_bookmarks

surahs ── ayahs
reciters ── quran_audio → (surahNumber, ayahNumber?)

podcast_series ── podcast_episodes
video_series ── video_episodes   // youtubeVideoId → embed only
books ── book_chapters
research_articles (standalone + sources[])
```

---

## 6. Data Integrity Rules

| Rule | Enforcement |
| --- | --- |
| Unique emails | DB unique index + service normalization |
| Unique slugs | DB unique index |
| Publish requires sources (research) | Service validation |
| Publish requires non-unknown rights | Service validation |
| Public API filters published only | Service / repository layer |
| Soft-deleted hidden | Default query scopes |
| Qur’an text immutability | No general CRUD update; import scripts only |

---

## 7. Seeding & Migrations

### 7.1 Allowed production seeds

- Verified Qur’an surah/ayah import with `sourceMeta`
- Initial admin user created via secure script (not hardcoded password in repo)

### 7.2 Forbidden production seeds

- Lorem podcasts/books/research
- Fake scholars
- Random ayah text generators

### 7.3 Migration approach

- Prefer additive migrations / versioned import scripts under `apps/api/scripts/`
- Record dataset version in `ayahs.sourceMeta.datasetVersion`

---

## 8. Backup & Ops

| Item | Requirement |
| --- | --- |
| Atlas backups | Enabled for production |
| Staging DB | Separated from production |
| Indexes | Created before traffic |
| Connection | `MONGODB_URI` only on backend |

---

## 9. Open Schema Decisions

1. Store Uzbek translation in `ayahs.textUz` vs separate `ayah_translations` collection (v1: inline field OK for one translation).
2. Single Qur’an progress vs per-mode progress (v1 default: per-mode).
3. Chapter `status` independent of book vs inherited (v1: chapter may be draft, public book detail lists only published chapters).

---

## 10. Approval

| Role | Decision |
| --- | --- |
| Product Owner | ☐ Approved |
| Engineering | ☐ Approved |
