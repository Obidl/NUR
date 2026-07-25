# NUR — Curriculum Domain

**Status:** Activated for v1.x (product owner request 2026-07-25)  
**Last updated:** 2026-07-25  
**Depends on:** `PRD.md`, `PRODUCT.md`, `CONTENT_RULES.md`  
**Decision:** Curriculum is **in scope** for v1.x — implement Phase 11 tasks. Paths publish only when lesson targets are real published content.

---

## 1. Purpose

Curriculum turns NUR’s library into **guided learning paths**: ordered sequences of Qur’an readings, podcast episodes, book chapters, and research articles that form a coherent study journey.

It does **not** replace scholars. It organizes already-approved content.

---

## 2. Why deferred

v1 already includes four hard domains (Qur’an, podcasts, books, research) plus auth, library, and admin.  
Curriculum adds:

- another content graph
- progress across mixed entity types
- editorial sequencing burden
- UX complexity on home/discover

Ship the continuum first; add paths when real editorial capacity exists.

---

## 3. Product definition (when activated)

### 3.1 Entities

| Entity | Meaning |
| --- | --- |
| `LearningPath` | Named curriculum (e.g., “Namoz asoslari”) |
| `Module` | Section inside a path |
| `Lesson` | Single step linking to an existing NUR entity |
| `PathProgress` | Per-user position/completion on a path |

### 3.2 Lesson targets (links only)

A lesson points to one of:

- Qur’an range (`surahNumber` + ayah from/to)  
- Podcast episode  
- Book chapter  
- Research article  

Lessons must **not** embed new unverified religious text. They reference published/verified sources only.

---

## 4. Content rules for curriculum

| ID | Rule |
| --- | --- |
| CU-01 | Paths publish only if every lesson target is published/available |
| CU-02 | Path descriptions follow research humility tone — no fake guarantees |
| CU-03 | No AI-generated fiqh sequences presented as authoritative madhhab curricula without human editorial ownership |
| CU-04 | Authors/editors of a path must be named |
| CU-05 | Soft-delete and status workflow same as other editorial content |

---

## 5. Draft data model (future)

```ts
LearningPath {
  title, slug, summary, coverUrl?, language
  authors: string[]
  status: ContentStatus
  moduleIds or embedded modules
  rights: RightsInfo
  createdBy, updatedBy, publishedAt
  deletedAt?
}

Module {
  pathId, title, order, summary?
}

Lesson {
  moduleId, title, order
  targetType: 'quran_range' | 'podcast_episode' | 'book_chapter' | 'research_article'
  targetRef: { ... }  // typed per targetType
  estimatedMinutes?: number
}

PathProgress {
  userId, pathId
  currentLessonId?
  completedLessonIds: ObjectId[]
  updatedAt
}
```

Indexes: unique slugs; `{ userId, pathId }` unique for progress.

---

## 6. API sketch (future)

```text
GET  /api/v1/curriculum/paths
GET  /api/v1/curriculum/paths/:slug
GET  /api/v1/curriculum/progress
PUT  /api/v1/curriculum/progress
ADMIN /api/v1/admin/curriculum/...
```

Public GETs: published only.

---

## 7. UX sketch (future)

- Catalog of paths (list rows, not card spam)
- Path detail: modules + lessons with continue CTA
- Lesson completes → next lesson
- Home may show one “Continue path” only if curriculum is launched and user has progress

Do not put curriculum widgets on v1 home before the domain ships.

---

## 8. Activation criteria

Pull curriculum into active scope only when all are true:

1. Product owner explicitly approves  
2. At least one real path with real published targets is ready  
3. `TASKS.md` Phase 11 tasks scheduled  
4. Docs (`DATABASE.md`, `API.md`, UI) updated in a version bump  

---

## 9. Non-goals

- Certificates / gamified piety scores  
- Mandatory paths to use Qur’an features  
- Crowdsourced unverified curricula  
- Auto-generated “complete Islam in 7 days” funnels  

---

## 10. Approval

| Role | Decision |
| --- | --- |
| Product Owner | ☐ Keep deferred / ☑ Activate for v1.x / ☐ Activate for v2 |
