# NUR — Design System

**Status:** Draft v1.2.0  
**Last updated:** 2026-07-26  
**Depends on:** `PRODUCT.md`, `UI_GUIDELINES.md`  
**Implementation:** CSS variables + Tailwind theme extension

---

## 1. Visual Direction

### Name: **Quiet Light (Sokin nur)** — readability first

Minimal, calm, refined. **O‘qilishi oson** is the top priority. No gamified noise.

| Attribute | Choice |
| --- | --- |
| Page background | Cool off-white `#F7F7F5` |
| Cards | Pure white `#FFFFFF` |
| Body text | Near-black `#1F1E1B` on light only |
| Secondary text | Mid-dark gray `#54514A` (never pale gray) |
| Primary CTA | Deep emerald `#16342C` + **white** text |
| Signal (icons / progress only) | Dark gold `#A87C0E` |
| Sacred Arabic surface | Cream `#FBF6E8` + ink `#1F1E1B` |

### Contrast rule (binding)

Gold or light-colored **text** must never sit on a light background.

- Dark text + light surface, **or**
- White text + dark surface  

No in-between. WCAG AA body text ≥ **4.5:1**.

### Typography

| Role | Font | Notes |
| --- | --- | --- |
| Headings | **Fraunces** | Display / page titles |
| UI / body | **Inter** | Min 15–16px |
| Qur’an Arabic | **Amiri** | 28–32px+, line-height ≥ 2 |

### Explicitly rejected

1. Purple SaaS gradients  
2. Gold/amber as large body text on cream  
3. Pale gray (`#9aa…`) body/meta on white  
4. Stock photo backgrounds without solid text card/overlay  
5. Gamified confetti / neon  

---

## 2. Tokens (light)

```css
:root {
  --nur-bg: #f7f7f5;
  --nur-bg-elevated: #ffffff;
  --nur-bg-sunken: #ecece9;
  --nur-ink: #1f1e1b;
  --nur-ink-muted: #54514a;
  --nur-ink-faint: #54514a;

  --nur-lamp: #a87c0e;       /* icons, rings, dividers only */
  --nur-lamp-soft: #f5ecd4;
  --nur-lamp-ink: #ffffff;   /* text ON filled gold */

  --nur-accent: #16342c;
  --nur-accent-ink: #ffffff;
  --nur-focus: #16342c;

  --nur-line: #e4e2dc;
  --nur-danger: #a84832;

  --nur-quran-bg: #fbf6e8;
  --nur-quran-ink: #1f1e1b;
  --nur-quran-muted: #54514a;
}
```

`--nur-lamp` = gold signal. `--nur-accent` = emerald CTA. Primary buttons use **accent**.

Dark: bg `#14161A`, elevated `#1D2027`, muted text stays light enough for AA on dark surfaces.

---

## 3. Spacing, radius, motion

Cards/lists: `--radius-l` / `--radius-xl` (20–24px). Soft emerald-tinted shadows. Motion 250–500ms ease-out; honor `prefers-reduced-motion`.

---

## 4. Components

| Control | Look |
| --- | --- |
| Primary button | Emerald + white |
| Secondary | Outline, dark text |
| Section labels | Uppercase muted **ink** (not gold) |
| Progress ring stroke | Gold |
| Completed check fill | Gold + white glyph, or emerald fill |
| Sacred block | `.nur-sacred` cream + dark Arabic |

---

## 5. Navigation

Desktop: top text nav, active soft white/beige pill.  
Mobile: Bugun · Qur’on · Video · Yo‘llar · Ko‘proq — active emerald.

---

*Stack / content safety / FE–BE separation in `CLAUDE.md` and `ARCHITECTURE.md` remain binding.*
