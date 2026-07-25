# NUR — Content Rules

**Status:** Draft v1.0.0  
**Last updated:** 2026-07-25  
**Depends on:** `PRD.md`, `PRODUCT.md`  
**Priority:** These rules override marketing urgency and growth experiments.

---

## 1. Purpose

This document defines what may appear in NUR, how religious content is attributed, and what AI assistants / engineers / editors must never invent.

Domains covered:

1. Islamic research (general authenticity)
2. Qur’an
3. Podcasts
4. Books
5. Product copy & UI claims

---

## 2. Global Rules (All Domains)

### 2.1 Hard bans

| ID | Rule |
| --- | --- |
| G-01 | Do not invent Qur’anic text, translations, hadith, or scholarly opinions. |
| G-02 | Do not present AI-generated religious rulings as fatwa or authoritative law. |
| G-03 | Do not publish content without required attribution fields. |
| G-04 | Do not scrape copyrighted Islamic media and rehost without license/permission. |
| G-05 | Do not silently alter published religious text “for clarity.” |
| G-06 | Do not use fake authors, fake scholars, or placeholder scholar names in production. |
| G-07 | Unpublished content must never appear on public endpoints or public UI. |
| G-08 | If authenticity is uncertain → keep `draft` / `in_review`; do not publish. |

### 2.2 Attribution minimum (editorial content)

Every podcast series, book, and research article must store:

- Title
- Primary author / scholar / host (named person or verified institution)
- Language
- Source / reference notes (see domain rules)
- `status` workflow field
- `createdBy`, `updatedBy`, `publishedAt` (when published)

### 2.3 Status workflow

```text
draft → in_review → published → archived
```

| Status | Public visibility |
| --- | --- |
| `draft` | No |
| `in_review` | No |
| `published` | Yes |
| `archived` | No (unless explicit historical access is later approved) |

### 2.4 Soft delete

Prefer `deletedAt` soft delete. Hard delete only for legal takedown or corruption, with audit note.

### 2.5 Humility clause

NUR is a distribution and study aid. It is **not** a mufti, **not** a replacement for qualified local scholarship, and **not** a court of Islamic law.

UI must not claim otherwise.

---

## 3. Islamic Research Rules

### 3.1 Definition

A **research article** is a curated explanation of an Islamic topic with transparent sources, written or approved by authorized editors.

### 3.2 Required fields before `published`

| Field | Required | Notes |
| --- | --- | --- |
| `title` | Yes | Clear, non-clickbait |
| `slug` | Yes | Stable URL key |
| `summary` | Yes | 1–3 sentences |
| `body` | Yes | Sanitized rich text / Markdown |
| `category` | Yes | Controlled vocabulary |
| `tags` | Optional | Normalized tags |
| `authors[]` | Yes | At least one |
| `sources[]` | Yes | At least one valid source object |
| `reviewer` | Recommended | Especially for sensitive topics |
| `language` | Yes | e.g. `uz` |
| `status` | Yes | Must be `published` for public |

### 3.3 Source object shape

Each `sources[]` item must include:

| Field | Required |
| --- | --- |
| `title` | Yes |
| `type` | Yes (`book` \| `article` \| `scholar` \| `quran` \| `hadith_collection` \| `other`) |
| `citation` | Yes (human-readable citation) |
| `url` | Optional (only if real and stable) |
| `notes` | Optional |

### 3.4 Research bans

| ID | Rule |
| --- | --- |
| R-01 | Cannot publish with empty `sources[]`. |
| R-02 | Cannot use “AI said” / “ChatGPT” as a source. |
| R-03 | Cannot label content `fatwa` unless a real authorized fatwa document is attached and policy explicitly allows (default: **do not use fatwa label in v1**). |
| R-04 | Sensitive topics (aqidah disputes, takfir, politics, medical rulings) require `in_review` and human approval. |
| R-05 | Do not assert “all scholars agree” unless citation proves a scoped claim. |
| R-06 | Hadith citations must include collection + identifiable reference where claimed; if grade is stated, attribute the grading authority. |
| R-07 | Body HTML must be sanitized; no inline scripts. |

### 3.5 Research tone

- Educational, cautious, sourced.
- Prefer “according to [source]…” over absolute proclamations.
- Distinguish Qur’an, hadith, scholarly opinion, and cultural practice.

---

## 4. Qur’an Rules

### 4.1 Sacred text integrity

| ID | Rule |
| --- | --- |
| Q-01 | Arabic Qur’an text must come from a **verified digital mushaf dataset** with documented provenance. |
| Q-02 | Engineers/editors must not manually “fix” ayah text in casual admin UI. |
| Q-03 | Do not generate Qur’anic Arabic with AI for production display. |
| Q-04 | Ayah order and numbering must follow the chosen standard mushaf convention consistently. |
| Q-05 | Display Arabic RTL with a Qur’an-capable typeface. |

### 4.2 Translations

| ID | Rule |
| --- | --- |
| Q-06 | Each translation line must credit translator / translation product. |
| Q-07 | Only licensed or explicitly permitted translations may be shipped. |
| Q-08 | Translation is not the Qur’an; UI should not present translation as Arabic replacement. |
| Q-09 | Do not AI-translate ayahs for production without scholarly review workflow (default: **forbidden** in v1). |

### 4.3 Audio / recitation

| ID | Rule |
| --- | --- |
| Q-10 | Reciter name is mandatory for any playable audio. |
| Q-11 | Audio must have license/permission status recorded (`licenseStatus`). |
| Q-12 | Do not use randomly ripped YouTube audio without rights. |
| Q-13 | Surah/ayah audio alignment must not invent missing ayahs. |

### 4.4 Features that must not corrupt text

- Font size, theme, and line height may change presentation.
- Search may highlight matches but must not rewrite text.
- Bookmarks store references (surah + ayah), not modified text copies as source of truth.

### 4.5 Qur’an admin policy

| Role | May do |
| --- | --- |
| `user` | Read, listen, bookmark, save progress |
| `editor` | Manage non-text metadata only if explicitly allowed (e.g., featured flag) — **not** ayah text |
| `admin` | Dataset import/replace via controlled migration scripts with checksum/provenance notes |

---

## 5. Podcast Rules

### 5.1 Required series fields

| Field | Required |
| --- | --- |
| `title` | Yes |
| `slug` | Yes |
| `description` | Yes |
| `hostOrScholar` | Yes |
| `coverUrl` | Yes (real asset) |
| `language` | Yes |
| `status` | Yes |
| `topics[]` | Recommended |

### 5.2 Required episode fields

| Field | Required |
| --- | --- |
| `title` | Yes |
| `slug` | Yes |
| `seriesId` | Yes |
| `description` / show notes | Yes |
| `audioUrl` | Yes (reachable, permitted) |
| `durationSeconds` | Yes |
| `episodeNumber` | Recommended |
| `status` | Yes |
| `publishedAt` | Yes when published |

### 5.3 Podcast bans

| ID | Rule |
| --- | --- |
| P-01 | No fake episode lists for demos in production. |
| P-02 | No publish without `audioUrl` and `hostOrScholar`. |
| P-03 | Show notes must not invent quotations of Qur’an/hadith; if quoted, cite. |
| P-04 | Do not auto-generate scholar biographies that may be false; use verified bios only. |
| P-05 | Explicit music entertainment podcasts outside Islamic educational scope are out of product positioning (keep catalog coherent). |

### 5.4 Playback ethics

- Progress tracking is for user continuity, not addictive streaks theater.
- Avoid dark-pattern autoplay chains that trap users; autoplay next episode is optional and user-controllable (P1 policy).

---

## 6. Book Rules

### 6.1 Required book fields

| Field | Required |
| --- | --- |
| `title` | Yes |
| `slug` | Yes |
| `authors[]` | Yes |
| `description` | Yes |
| `language` | Yes |
| `coverUrl` | Yes |
| `status` | Yes |
| `categories[]` | Yes |
| `sourceRights` | Yes (`licenseStatus`, notes) |

### 6.2 Chapter content

| ID | Rule |
| --- | --- |
| B-01 | Chapter body must be sanitized; no scripts. |
| B-02 | Do not OCR-dump unlicensed PDFs into production. |
| B-03 | Preserve author wording; editorial notes must be visually distinct if added. |
| B-04 | If a book is a translation, credit original author + translator. |
| B-05 | PDF support (Multer/storage) is optional later; v1 prefers structured chapters. |

### 6.3 Book bans

| ID | Rule |
| --- | --- |
| B-06 | No lorem ipsum chapters in production. |
| B-07 | No anonymized “Unknown Scholar” unless historically accurate and labeled. |
| B-08 | No publishing books still in `draft` via alternate API paths. |

---

## 7. Media Rights Rules

For every audio file, cover image, translation, and book text:

| Field | Meaning |
| --- | --- |
| `licenseStatus` | `owned` \| `licensed` \| `permission_granted` \| `public_domain` \| `unknown` |
| `licenseNotes` | Human-readable evidence pointer |

**`unknown` cannot be published.**

---

## 8. Product Copy Rules (UI / Marketing)

| ID | Rule |
| --- | --- |
| C-01 | Do not claim “complete Islamic knowledge” or “all authentic hadith.” |
| C-02 | Do not promise salvation, guaranteed barakah metrics, or gamified piety scores. |
| C-03 | Prefer precise CTAs: “Davom etish”, “O‘qish”, “Tinglash.” |
| C-04 | Error messages stay calm and useful; no blame. |
| C-05 | Empty states tell users what to do next; no fake cards. |

---

## 9. AI Assistant Rules (Content Domain)

When Cursor / Claude / other agents help with NUR:

1. Never fabricate Qur’an ayahs, translations, or hadith grades.
2. Never invent scholar quotes or citations.
3. If a sample is needed in docs, mark it clearly as `EXAMPLE — NOT FOR PRODUCTION`.
4. Prefer wiring empty verified datasets over fake content.
5. If asked to “just fill Islamic content,” refuse and request real sources.
6. Religious uncertainty → ask the product owner; do not guess.

---

## 10. Editorial Checklist (Pre-Publish)

### Research

- [ ] Sources ≥ 1 and complete
- [ ] No fatwa labeling (v1)
- [ ] Sensitive topic reviewed
- [ ] Sanitized body
- [ ] Author named

### Qur’an-related metadata (non-text)

- [ ] Reciter credited
- [ ] Translation credited
- [ ] License not `unknown`

### Podcast episode

- [ ] Audio URL works
- [ ] Duration set
- [ ] Host/scholar set
- [ ] Show notes non-fabricated

### Book

- [ ] Authors + rights set
- [ ] Chapters real
- [ ] Translator credited if applicable

---

## 11. Takedown & Correction

1. Archive or unpublish immediately on credible rights/authenticity complaint.
2. Record reason in editorial notes / audit fields.
3. Corrections to research should bump `updatedAt` and optionally store changelog note.
4. Qur’an dataset errors → controlled re-import, never silent patch in random documents.

---

## 12. Conflicts

If growth, design, or engineering convenience conflicts with this file, **CONTENT_RULES wins**.

If this file conflicts with secular law (copyright), **law wins**, then update this file.

---

## 13. Approval

| Role | Decision |
| --- | --- |
| Product Owner | ☐ Approved |
| Content authority (if designated) | ☐ Approved |
