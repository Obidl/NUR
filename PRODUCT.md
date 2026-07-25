# NUR — Product Vision

**Status:** Draft v1.0.0  
**Last updated:** 2026-07-25  
**Depends on:** `PRD.md`  
**Audience:** Product, design, engineering, content editors, AI assistants

---

## 1. One-Sentence Vision

NUR is the calm place Muslims open every day to continue the Qur’an, listen to trusted teachers, and study sourced Islamic knowledge — without noise.

**Ideal jamlangan model (UI + 15 kunlik yo‘l + kontent):** `IDEAL_PROJECT.md` — product owner tasdiqidan keyin Home “Bugungi yo‘l” shimoli.

---

## 2. Brand

### 2.1 Name

**NUR** — light. The product should feel like clarity after confusion: quiet, steady, illuminating.

### 2.2 Positioning

| NUR is | NUR is not |
| --- | --- |
| A spiritual utility | A social network |
| A curated library | An open content dump |
| A progress companion | An engagement farm |
| A trust-first Islamic product | A fatwa robot |
| App Store–grade craft | A weekend demo |

### 2.3 Brand pillars

1. **Light** — Readable, breathable UI; no visual shouting.
2. **Trust** — Every religious claim has a human-attributable source path.
3. **Continuity** — The product remembers where you left off.
4. **Adab** — Tone is respectful, humble, never sensational.

### 2.4 Brand test (mandatory)

If you remove the nav and the first viewport could belong to another brand, branding is too weak. The word **NUR** must be a hero-level signal on the first screen — not an eyebrow, not a tiny logo in the corner only.

---

## 3. Product Thesis

Muslims already have Qur’an apps, podcast apps, and article sites. What they lack is a **single trustworthy continuum**:

- Start ayah 12 of a surah → pause → resume later  
- Listen to episode 4 of a scholarly series → resume at 12:40  
- Read a book chapter → bookmark → return  
- Open a research article → see sources → decide with clarity  

NUR wins by being the **system of record for spiritual progress** plus a **curated, authenticated content layer**.

---

## 4. Target Market

### 4.1 Beachhead

- Uzbekistan (Uzbek UI first)
- Mobile-web users on mid-range phones
- Daily worshippers + knowledge seekers aged ~18–40

### 4.2 Expansion (later)

- Broader Turkic / global Muslim audiences
- Additional UI languages
- Native apps (only after web quality bar is proven)

### 4.3 Language strategy (v1)

| Layer | Language |
| --- | --- |
| Product UI | Uzbek |
| Qur’an text | Arabic (RTL) |
| Translation line | Uzbek (licensed) |
| Metadata (titles, descriptions) | Uzbek primarily; Arabic names preserved where relevant |

---

## 5. Value Proposition

### For end users

- One home for Qur’an + podcasts + books + research  
- Progress that does not disappear  
- Content you can trust because attribution is visible  
- A calm interface that respects worship and study  

### For editors / scholars (internal)

- Clear publish workflow  
- Source fields enforced before publish  
- No pressure to “go viral” at the cost of authenticity  

---

## 6. Product Experience Principles

1. **Open → Continue** — First useful action is resuming spiritual work.
2. **One job per screen** — Read, listen, or study; don’t compete with yourself.
3. **Trust near content** — Author, reciter, translator, sources appear where the content lives.
4. **Silence is a feature** — No infinite feeds, reaction storms, or dark-pattern nudges.
5. **Craft is ibadah-adjacent** — Performance, accessibility, and typography are part of respect.
6. **Honesty over completeness** — Better to ship fewer verified works than many unverified ones.

---

## 7. Core Product Surfaces

| Surface | Job to be done |
| --- | --- |
| Home | Orient + continue |
| Qur’an | Read / listen / bookmark / resume |
| Podcasts | Discover series + play + resume |
| Books | Catalog + chapter reading + resume |
| Research | Find sourced articles on topics |
| Library | Personal continuum (progress, favorites, bookmarks) |
| Profile | Identity + reading/listening preferences |
| Admin | Publish with gates (role-gated) |

Detailed requirements: `PRD.md` §7.

---

## 8. Content Philosophy

NUR content is **editorial**, not **crowdsourced**.

| Allowed | Not allowed (v1) |
| --- | --- |
| Verified Qur’an dataset | User-typed “approximate” Qur’an text |
| Licensed translations & recitations | Unattributed audio scrapes |
| Editor-approved podcasts/books | Open uploads from any user |
| Research with mandatory sources | AI fatwa / automated rulings presented as authoritative |
| Clear “under review” states | Publishing empty-source articles |

Full rules: `CONTENT_RULES.md`.

---

## 9. Differentiation

| Competitor pattern | NUR response |
| --- | --- |
| Qur’an-only apps | Add continuum across podcasts/books/research |
| YouTube Islamic noise | Curated catalog, no algorithmic outrage |
| Generic podcast apps | Islamic trust fields + progress + adab UI |
| Blog farms | Source-enforced research workflow |
| Heavy social Islamic apps | No social graph in v1 |

---

## 10. Success Definition

NUR is succeeding when:

1. Users return to **continue**, not only to browse.
2. Published research always has complete sources (100%).
3. Qur’an text/audio provenance is auditable.
4. The product feels calm on first open — brand-first, not dashboard-first.
5. Engineering can ship features without breaking FE/BE/DB separation.

North-star metric (product):

> Weekly users with ≥1 meaningful continue action (Qur’an position update, podcast progress, or book progress).

---

## 11. Monetization Stance (v1)

v1 is **not** built as a paywall product. Architecture must not block future subscriptions, but product copy and UX must not pretend payments exist until intentionally introduced.

No ads in reader/player surfaces in v1.

---

## 12. Ethical Boundaries

- Do not sensationalize religion for retention.
- Do not invent scholarly consensus.
- Do not present NUR as a replacement for qualified local scholarship.
- Do not ship “AI sheikh” features.
- When uncertain on religious content → withhold publish.

---

## 13. Roadmap Themes (Non-binding chronology)

| Phase | Theme |
| --- | --- |
| v1 | Auth, Qur’an, podcasts, books, research, library, minimal admin |
| v1.x | Search quality, multi-reciter, notes/highlights, password reset polish |
| v2 | Offline audio, deeper curriculum paths, i18n expansion |
| Later | Native apps, optional subscriptions |

Curriculum domain: see `CURRICULUM.md` — deferred as a first-class v1 surface unless explicitly pulled in.

---

## 14. Voice & Tone (Product Copy)

| Do | Don’t |
| --- | --- |
| Clear, humble, short | Hype, all-caps spiritual marketing |
| “Davom eting” / continue | “Crush your goals!!!” |
| Credit scholars | Vague “experts say” |
| Admit limits | Fake certainty |

UI microcopy rules will deepen in `CONTENT_RULES.md` and `UI_GUIDELINES.md`.

---

## 15. Relationship to Other Docs

| Doc | Relationship |
| --- | --- |
| `PRD.md` | Binding requirements; this file is vision/positioning |
| `ARCHITECTURE.md` | How the vision is technically delivered |
| `CONTENT_RULES.md` | What may be published and how |
| `DESIGN_SYSTEM.md` / `UI_GUIDELINES.md` | How NUR looks and behaves |
| `TASKS.md` | Build order |

---

## 16. Approval

| Role | Decision |
| --- | --- |
| Product Owner | ☐ Approved / ☐ Changes requested |

If vision conflicts with PRD requirements, **PRD wins** until both are revised together.
