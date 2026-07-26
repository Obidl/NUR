# NUR — Design System

**Status:** Draft v1.0.0  
**Last updated:** 2026-07-25  
**Depends on:** `PRODUCT.md`, `UI_GUIDELINES.md`  
**Implementation:** CSS variables + Tailwind theme extension

---

## 1. Visual Direction

### Name: **Lamp on Ink**

NUR’s look is **quiet light against deep ink** — like a lamp opening a page at night.

| Attribute | Choice |
| --- | --- |
| Mood | Contemplative, precise, warm-light / cool-ink |
| Atmosphere | Soft radial light, subtle grain, layered depth — not flat fills |
| Accent | Muted amber lamp-light for brand/CTA emphasis |
| Interaction | Cool stone-teal for links/focus (not purple) |
| Sacred text | Deep ink + careful gold *only* as optional Qur’an ornament, used sparingly |

### Explicitly rejected looks

1. Purple-on-white / purple→indigo SaaS gradients  
2. Warm cream paper + terracotta + default serif startup look  
3. Broadsheet newspaper: hairline rules, zero radius, dense columns  
4. Neon glow “Islamic futurism”  
5. Generic flat white Material clone  

---

## 2. Design Tokens (CSS Variables)

Implement in `:root` and `[data-theme='dark']` (or class `.dark`).

### 2.1 Color — Light theme

```css
:root {
  /* Atmosphere */
  --nur-bg: #f3f6f8;           /* cool stone wash */
  --nur-bg-elevated: #ffffff;
  --nur-bg-sunken: #e8eef2;
  --nur-ink: #121820;          /* primary text */
  --nur-ink-muted: #5b6775;    /* secondary text */
  --nur-ink-faint: #9aa6b2;

  /* Brand / lamp */
  --nur-lamp: #c58b2d;         /* muted amber */
  --nur-lamp-soft: #f0dfc0;
  --nur-lamp-ink: #3a2a10;     /* text on lamp fills */

  /* Interactive */
  --nur-accent: #1f6f78;       /* stone-teal */
  --nur-accent-soft: #d5ecee;
  --nur-focus: #1f6f78;

  /* Lines / states */
  --nur-line: #d5dde4;
  --nur-line-strong: #b7c2cc;

  /* Feedback */
  --nur-success: #2f6d4f;
  --nur-warning: #9a6b16;
  --nur-danger: #9b3d3d;

  /* Qur’an surface */
  --nur-quran-bg: #f7f1e8;     /* slight warmth for reading only */
  --nur-quran-ink: #101820;
  --nur-quran-ornament: #b8923a;

  /* Overlay */
  --nur-overlay: rgba(12, 18, 28, 0.48);
}
```

### 2.2 Color — Dark theme

```css
[data-theme='dark'] {
  --nur-bg: #0c1218;
  --nur-bg-elevated: #141c24;
  --nur-bg-sunken: #090e13;
  --nur-ink: #e8eef4;
  --nur-ink-muted: #9aa6b2;
  --nur-ink-faint: #6d7a86;

  --nur-lamp: #d7a34a;
  --nur-lamp-soft: #3a2f1c;
  --nur-lamp-ink: #1a140a;

  --nur-accent: #5fb4bc;
  --nur-accent-soft: #163036;
  --nur-focus: #5fb4bc;

  --nur-line: #24303a;
  --nur-line-strong: #334250;

  --nur-success: #6fbf93;
  --nur-warning: #e0b35a;
  --nur-danger: #e08787;

  --nur-quran-bg: #121820;
  --nur-quran-ink: #eef3f7;
  --nur-quran-ornament: #d7a34a;

  --nur-overlay: rgba(0, 0, 0, 0.64);
}
```

### 2.3 Color usage rules

| Token | Use |
| --- | --- |
| `--nur-lamp` | Primary CTA, brand accents, key highlights |
| `--nur-accent` | Links, focus rings, selection, interactive secondary |
| `--nur-quran-*` | Qur’an reader surface only |
| Danger/warning | System feedback only — not decoration |

Do not build the whole product in gold. Lamp-light is **signal**, not wallpaper.

---

## 3. Atmosphere (Background System)

Flat single-color full-app backgrounds are insufficient for branded entry surfaces.

### 3.1 Home / entry atmosphere

Layer:

1. Base `--nur-bg`
2. Soft radial gradient (lamp light) from upper area
3. Optional subtle noise/grain at 3–6% opacity
4. Content above atmosphere with clear contrast

Example concept:

```css
.nur-atmosphere {
  background:
    radial-gradient(1200px 600px at 50% -10%, var(--nur-lamp-soft), transparent 70%),
    radial-gradient(900px 500px at 100% 0%, var(--nur-accent-soft), transparent 60%),
    var(--nur-bg);
}
```

### 3.2 Reader surfaces

Qur’an/book readers may use calmer, less atmospheric backgrounds for long reading comfort (`--nur-quran-bg` / elevated paper equivalents).

---

## 4. Typography

### 4.1 Font families (binding recommendations)

Avoid Inter, Roboto, Arial, system-ui as the brand voice.

| Role | Font | Notes |
| --- | --- | --- |
| Brand / display | **Sora** | Geometric, modern, calm; for NUR wordmark & display |
| UI / body | **Manrope** | Readable UI labels, forms, lists |
| Long-form reading (books/research) | **Source Serif 4** | Article/chapter body |
| Qur’an Arabic | **Amiri** | Traditional Naskh-style, RTL capable |
| Mono (admin/debug) | **IBM Plex Mono** | Rare use |

Load via self-host or approved CDN; ensure Latin + Arabic subsets as needed.

### 4.2 Type scale

| Token | Size / line-height | Use |
| --- | --- | --- |
| `display` | 48/56 (mobile 36/44) | Brand NUR, rare heroes |
| `h1` | 32/40 | Screen titles |
| `h2` | 24/32 | Section titles |
| `h3` | 20/28 | Subsections |
| `body` | 16/26 | Default UI |
| `body-lg` | 18/30 | Article intro |
| `reading` | 18/32 or 20/34 | Book/research body |
| `quran` | user-adjustable 22–40 | Ayah Arabic |
| `meta` | 13/18 | Credits, timestamps |
| `label` | 12/16 uppercase sparingly | Forms — prefer sentence case |

### 4.3 Qur’an typography rules

- Arabic uses `Amiri`, RTL
- Translation under ayah uses UI/reading font at smaller size and muted color
- Ayah number marker must be readable but not dominate
- User font-size preference adjusts `--quran-font-size`

### 4.4 Brand lettering

The word **NUR**:

- Uses display font
- Tracking slightly open
- Never all-lowercase logo in UI chrome if wordmark standard is uppercase/small-caps — pick one and keep it: recommended **NUR** uppercase for logo lockup

---

## 5. Spacing & Layout

| Token | Value |
| --- | --- |
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 24px |
| `--space-6` | 32px |
| `--space-7` | 48px |
| `--space-8` | 64px |

### Craft density (calm UI)

Prefer **Linear/Notion-quality air**: more title→content gap, quieter ledes, softer list dividers. Do not pack competing headlines in one viewport.

- Page title → body: at least `--space-5` / `--space-6`
- Section gaps on Home/catalogs: prefer `--space-6`–`--space-7` over stacking tight card stacks
- Body line-height ≈ 1.65–1.75 for UI copy; reading surfaces higher

### Lamp restraint

Lamp amber is a **CTA / progress signal**, not fill for large surfaces. Soft lamp tokens (`--nur-lamp-soft`, `--nur-lamp-glow`) stay low-saturation so yellow does not fatigue. Prefer teal (`--nur-accent`) for links and focus rings.

### Layout

- Page horizontal padding: 16px mobile, 24–32px desktop
- Reader max width: ≈ 42–40rem for books/research; Qur’an may be slightly narrower
- Home first viewport: full viewport height composition preferred

Radius scale (modest; not pill-obsessed):

| Token | Value | Use |
| --- | --- | --- |
| `--radius-s` | 8px | Inputs, small controls |
| `--radius-m` | 12px | Interactive containers when needed |
| `--radius-l` | 16px | Surfaces / lists |
| `--radius-xl` | 20px | Rare large sheets |
| `--radius-full` | 9999px | **Avoid** except true circular icon buttons |

Shadows: prefer `--shadow-xs` / `--shadow-sm`. Reserve `--shadow-md` for players and modals only. No multi-layer neon shadows.

---

## 6. Components (System-level)

### 6.1 Button

| Variant | Look |
| --- | --- |
| `primary` | Lamp fill (`--nur-lamp`) + lamp-ink text |
| `secondary` | Elevated surface + line + ink text |
| `ghost` | Transparent + ink |
| `danger` | Danger fill for destructive admin only |

Rules:

- One primary CTA per section
- Min height ≈ 44px on mobile primary actions
- No glossy gradients on buttons

### 6.2 Input

- Clear label above field
- Line color `--nur-line`; focus uses `--nur-focus` ring
- Error text in `--nur-danger`

### 6.3 List rows (preferred over cards)

Surah list, episode list, book list: **rows** with typography + optional leading cover thumbnail.

Cover thumbnails are media, not “card chrome.”

### 6.4 Player surface

- Elevated dark-friendly surface
- Title + scholar/reciter meta
- Progress scrubber with large touch target
- Lucide icons: play, pause, x, etc.

### 6.5 Source block (research)

Distinct but quiet block listing sources — not a loud callout sticker.

---

## 7. Icons

- Library: **Lucide React**
- Default size: 20px UI; 24px primary controls
- Stroke width: 1.75–2
- Color inherits text/icon token
- Align to pixel grid; don’t mix icon libraries

---

## 8. Motion Tokens

```css
:root {
  --motion-fast: 150ms;
  --motion-mid: 250ms;
  --motion-slow: 400ms;
  --ease-standard: cubic-bezier(0.22, 1, 0.36, 1);
}
```

Framer Motion defaults should reference these durations.  
If `prefers-reduced-motion: reduce` → disable positional movement; allow instant state change / opacity ≤150ms.

Intentional motions listed in `UI_GUIDELINES.md` §7.

---

## 9. Tailwind Integration

Extend Tailwind theme:

```ts
// illustrative
theme: {
  extend: {
    colors: {
      nur: {
        bg: 'var(--nur-bg)',
        elevated: 'var(--nur-bg-elevated)',
        ink: 'var(--nur-ink)',
        muted: 'var(--nur-ink-muted)',
        lamp: 'var(--nur-lamp)',
        accent: 'var(--nur-accent)',
        line: 'var(--nur-line)',
        quran: 'var(--nur-quran-bg)',
      }
    },
    fontFamily: {
      display: ['Sora', 'sans-serif'],
      sans: ['Manrope', 'sans-serif'],
      reading: ['"Source Serif 4"', 'serif'],
      quran: ['Amiri', 'serif'],
      mono: ['"IBM Plex Mono"', 'monospace'],
    }
  }
}
```

---

## 10. Imagery

| Type | Rule |
| --- | --- |
| Podcast/book covers | Real licensed art; consistent aspect (e.g. 1:1 podcast, 3:4 book) |
| Home atmosphere | Abstract light/ink — may be CSS-only |
| Decorative stock “mosque neon” | Avoid clichés and low-quality stock |
| Avatars | Optional; never fake scholars |

Real visual anchors for catalog surfaces are covers of real content. Entry brand surface may be atmospheric light without photography.

---

## 11. Dark Mode

- User preference in profile + system default
- Qur’an reader can follow global theme or a local override later (P1)
- Do not make “dark mode aesthetic” the only brand identity; light theme must also feel like NUR

---

## 12. Accessibility Tokens

- Focus ring: 2px `var(--nur-focus)` offset 2px
- Text contrast AA minimum on all pairings used in UI
- Do not place muted text on sunken surfaces without checking contrast

---

## 13. Asset Checklist for Engineering

- [ ] CSS variables file (`tokens.css`)
- [ ] Tailwind theme mapping
- [ ] Font loading strategy (no FOUT disaster on Arabic)
- [ ] Atmosphere utility class for home/entry
- [ ] Button/input base components in `shared/components`
- [ ] Reduced-motion media query wired to Framer Motion

---

## 14. Approval

| Role | Decision |
| --- | --- |
| Product Owner | ☐ Approved |
| Design | ☐ Approved |
