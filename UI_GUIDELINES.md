# NUR — UI Guidelines

**Status:** Draft v1.0.0  
**Last updated:** 2026-07-25  
**Depends on:** `PRODUCT.md`, `PRD.md`, `DESIGN_SYSTEM.md`  
**Stack UI:** React, Tailwind CSS, Framer Motion, Lucide React, React Router

---

## 1. Purpose

This document defines how NUR **looks, flows, and behaves** in the interface.  
Tokens, type scales, and color values live in `DESIGN_SYSTEM.md` (**Quiet Light**, contrast-first). This file owns **composition, UX patterns, and do/don’t rules**.

**Readability:** never place gold or pale text on light surfaces; body/meta use near-black / `#54514A`.

---

## 2. Product UI North Star

NUR’s interface is a **spiritual utility**, not a dashboard and not a content marketplace.

Every screen should feel:

- Calm
- Clear
- Continuous (progress-aware)
- Trust-visible
- Brand-present

---

## 3. Composition Rules (Hard)

### 3.1 One composition per first viewport

The first viewport must read as **one composition**, not a control panel of widgets.

Forbidden on first viewport:

- Stat strips
- Schedule snippets
- Address blocks
- Promo clusters
- “This week” callouts
- Multiple competing text blocks
- Card grids competing with the hero

### 3.2 Brand first

On branded/entry surfaces:

- **NUR** is a hero-level signal
- No headline may overpower the brand wordmark/name
- Brand test: remove the nav — if the screen could belong to another product, branding is too weak

### 3.3 Hero budget (landing / home entry)

Usually only:

1. Brand (NUR)
2. One headline
3. One short supporting sentence
4. One CTA group
5. One dominant atmospheric visual plane (full-bleed)

### 3.4 Full-bleed atmosphere

Entry surfaces use an edge-to-edge visual plane (gradient atmosphere, soft light, textured depth).  
Do **not** use inset hero images, side-panel heroes, rounded media cards, tiled collages, or floating image blocks as the primary hero device.

### 3.5 No hero overlays

Do not place detached labels, floating badges, promo stickers, info chips, or callout boxes on top of hero media.

### 3.6 Cards policy

**Default: no cards.**

Cards are allowed only when they are the container for a **user interaction** (e.g., tappable series row that needs a hit target grouping, admin form panels, empty/error surfaces).  
If removing border/shadow/background/radius does not hurt interaction or understanding, it should not be a card.

Never use cards in the hero. Prefer `.nur-list` / `.nur-list-row` for catalogs.

**Calm craft:** avoid nested card-in-card. One surface per interactive job; lists inside a page shell without wrapping every row in its own card.

### 3.7 One job per section

Each section: one purpose, one headline, usually one short supporting sentence.

---

## 4. Information Architecture → UI Mapping

| Route idea | Primary job | UI notes |
| --- | --- | --- |
| Home | Continue | Brand + continue CTA; not a dashboard |
| Qur’an list | Choose surah | Dense but readable list; search |
| Qur’an reader | Read/listen | Typography-first; chrome recedes |
| Podcasts | Choose series | Cover + scholar visible; trust near title |
| Player | Listen | Persistent, minimal, scrubber clear |
| Books | Choose / read | Catalog then chapter reader calmness |
| Research | Find / read | Sources visible near/within article |
| Library | Resume personal state | Grouped continue/favorites/bookmarks |
| Auth | Enter | Quiet, short forms, no clutter |
| Admin | Publish | Utility density OK; still no fake polish theater |

---

## 5. Core UX Patterns

### 5.1 Continue pattern

Wherever possible, surface **one primary continue action**:

- Continue Qur’an (surah + ayah)
- Continue podcast (episode + timestamp)
- Continue book (chapter)

Home prioritizes continue over discovery.

### 5.2 Trust near content

Show attribution close to the content:

- Reciter name near audio controls
- Translator credit near translation lines
- Scholar/host near podcast title
- `sources[]` on research article (not buried in a distant footer-only pattern)

### 5.3 Reader chrome

In Qur’an and book readers:

- Chrome (nav, settings) is secondary
- Text is primary
- Settings (font size, theme) available without leaving the page
- Avoid sticky stacks of competing bars

### 5.4 Player

- Global or route-level player may persist while browsing podcasts
- Controls: play/pause, seek, back-to-episode
- Speed control is P1
- Do not autoplay-trap users across episodes by default

### 5.5 Empty states

Empty states must:

- Explain why it’s empty
- Offer one next action
- Never fill with fake content cards

### 5.6 Loading states

Prefer skeleton treatments that match final layout rhythm.  
No jokey loading copy about religion.

### 5.7 Errors

Calm, actionable, non-blaming.  
Example tone: “Ulanib bo‘lmadi. Qayta urinib ko‘ring.”

---

## 6. Navigation

### 6.1 Mobile

Primary destinations in a simple bottom or top nav (choose one system and keep it):

- Home
- Qur’an
- Podcasts
- Books
- Library (or More → Research/Profile)

Do not exceed cognitive load with 7 equally weighted tabs.

### 6.2 Desktop

Persistent side or top nav with the same destinations; content column remains readable (measure width for readers).

### 6.3 Admin

Separated visual density and route prefix (`/admin`). Do not style admin like marketing pages.

---

## 7. Motion Guidelines

Use Framer Motion for **presence and hierarchy**, not decoration spam.

### Required intentional motions (ship ≥2–3)

1. **Home enter** — brand/light atmosphere eases in
2. **Reader open** — content fades/slides gently into reading mode
3. **Player appear** — player surface rises when audio starts

### Rules

- Respect `prefers-reduced-motion` (hard cut or opacity-only)
- Durations short (≈150–350ms) for UI; slightly longer only for brand entry
- No continuous infinite attention-harvest animations
- No bounce/spring gimmicks on sacred reading surfaces

---

## 8. Iconography

- Use **Lucide React** only (unless design system later adds a custom set)
- Icon-only controls require `aria-label`
- Default stroke consistency per `DESIGN_SYSTEM.md`
- Do not use emoji as UI icons

---

## 9. Typography Behavior

- UI language (Uzbek) is LTR
- Qur’anic Arabic is RTL and must not inherit broken LTR punctuation layout
- Translation under ayah is visually secondary to Arabic
- Reader measures: avoid ultra-wide lines; comfortable line length for books/research
- Brand word **NUR** uses display treatment from design system

Details: `DESIGN_SYSTEM.md`.

---

## 10. Accessibility

| Rule | Requirement |
| --- | --- |
| Contrast | WCAG AA for text/icons |
| Keyboard | All primary flows operable |
| Focus | Visible focus rings |
| Labels | Inputs and icon buttons labeled |
| Media | Audio has identifiable title/reciter in accessible name |
| Motion | Reduced-motion safe |
| Hit targets | Comfortable on mobile (≥44px where practical) |

---

## 11. Responsive Rules

- Mobile-first
- Reader/player usable on small screens without horizontal chaos
- Tables avoided in reader UIs
- Nav collapses cleanly; do not hide critical continue actions behind obscure menus on home

Breakpoints follow Tailwind defaults unless design system overrides.

---

## 12. Auth UI

- Short forms: email, password, display name
- Inline validation after submit or on blur (pick one; be consistent)
- No social clutter in v1
- After login → land on Home continue state

---

## 13. Admin UI Guidelines

- Dense, utilitarian, trustworthy
- Status chips for `draft` / `in_review` / `published` / `archived`
- Publish CTA disabled until required fields valid (sources, rights, etc.)
- Never provide a “fill demo Islamic content” button

---

## 14. Explicit Don’ts (Anti-patterns)

| Don’t | Why |
| --- | --- |
| Purple SaaS gradient look | Generic AI default; not NUR |
| Cream page + terracotta serif cliché | Generic AI default; not NUR |
| Newspaper broadsheet dense columns | Wrong product metaphor |
| Dashboard home with 8 widgets | Breaks one-composition rule |
| Card grid hero | Breaks cards/hero rules |
| Streak shame / gamified piety scores | Against product ethics |
| Fake avatars / fake scholars | Against CONTENT_RULES |
| Dark-mode-only identity | Theme is preference, not the brand |
| Glow neon spirituality | Tacky; breaks calm |

---

## 15. Screen Checklist (Before Marking UI Done)

- [ ] One job is obvious in <3 seconds
- [ ] Brand/trust/progress rules respected
- [ ] No decorative cards
- [ ] Attribution visible where needed
- [ ] Empty/loading/error states real
- [ ] Motion respects reduced-motion
- [ ] Mobile + desktop pass
- [ ] No placeholder/fake content

---

## 16. Approval

| Role | Decision |
| --- | --- |
| Product Owner | ☐ Approved |
| Design | ☐ Approved |
