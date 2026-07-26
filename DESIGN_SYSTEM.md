# NUR — Design System

**Status:** Draft v1.1.0  
**Last updated:** 2026-07-26  
**Depends on:** `PRODUCT.md`, `UI_GUIDELINES.md`  
**Implementation:** CSS variables + Tailwind theme extension

---

## 1. Visual Direction

### Name: **Quiet Light (Sokin nur)**

NUR’s look is **warm cream quiet** — like soft dawn light in a library or mosque courtyard.

| Attribute | Choice |
| --- | --- |
| Mood | Calm, refined, luminous — never noisy or gamified |
| Atmosphere | Soft radial lamp/emerald wash at 3–8% opacity; optional geometric texture only at 3–6% |
| Primary CTA | Deep emerald `#1C3D34` |
| Signal / progress | Warm gold `#C9A227` |
| Sacred text surface | Cream-gold `#F7F0DD` |
| Body text | Warm charcoal `#2A2A28` (not pure black) |

### Typography

| Role | Font |
| --- | --- |
| Display / headings | **Fraunces** |
| UI / body | **Inter** |
| Long reading | **Fraunces** |
| Qur’an Arabic | **Amiri** (min ~28–32px mobile, line-height ≥ 2) |

### Explicitly rejected looks

1. Purple-on-white / purple→indigo SaaS gradients  
2. Harsh terracotta-as-brand (terracotta only for soft danger `#B5533C`)  
3. Broadsheet newspaper: hairline rules, zero radius, dense columns  
4. Neon glow “Islamic futurism” / gamified confetti  
5. Stock photo backgrounds of people or places  

---

## 2. Design Tokens (CSS Variables)

Implement in `:root` and `[data-theme='dark']`.

### 2.1 Color — Light theme

```css
:root {
  --nur-bg: #faf9f5;
  --nur-bg-elevated: #f2eee4;
  --nur-bg-sunken: #ebe6db;
  --nur-ink: #2a2a28;
  --nur-ink-muted: #6b685f;
  --nur-ink-faint: #9a968c;

  --nur-lamp: #c9a227;          /* gold signal */
  --nur-lamp-soft: #f3e8c4;
  --nur-lamp-ink: #3d3210;

  --nur-accent: #1c3d34;        /* emerald CTA */
  --nur-accent-soft: #d8e6e1;
  --nur-accent-ink: #faf9f5;
  --nur-focus: #1c3d34;

  --nur-line: #e7e3d8;
  --nur-danger: #b5533c;

  --nur-quran-bg: #f7f0dd;
}
```

Dark mode: bg `#14161A`, elevated `#1D2027`, gold `#D4B24C`, emerald `#2E5C4F`.

### Binding CSS var names

Existing code uses `--nur-lamp` (gold) and `--nur-accent` (emerald). Primary buttons use **accent/emerald**; progress rings and bookmarks use **lamp/gold**.

---

## 3. Spacing & Layout

| Token | Value |
| --- | --- |
| `--space-1`–`--space-8` | 4 → 64px (8px grid) |

Prefer airy Quiet Light spacing: page edges 20–24px mobile, 40–64px desktop.

| Radius | Value | Use |
| --- | --- | --- |
| `--radius-m` | 14px | Buttons |
| `--radius-l` / `--radius-xl` | 20–24px | Cards / lists |
| `--radius-pill` | 9999px | Chips, nav active pill |

Shadows: soft emerald-tinted — e.g. `0 8px 24px rgba(28,61,52,0.06)`.

Motion: 250–500ms ease-out; progress ~700ms; breath glow 4–6s. Honor `prefers-reduced-motion`.

---

## 4. Components

| Variant | Look |
| --- | --- |
| `primary` | Emerald fill + light text |
| `secondary` | Outline / transparent + line |
| `ghost` | Transparent |
| `danger` | Soft terracotta |

- Lists preferred for catalogs (`.nur-list` / `.nur-list-row`)
- Sacred Arabic in `.nur-sacred`
- Players docked; emerald play control

---

## 5. Navigation

- Desktop: top text nav; active = soft beige pill  
- Mobile tab bar: Bugun, Qur’on, Videolar, Yo‘llar, Ko‘proq  

---

*Stack, content safety, and FE/BE separation in `CLAUDE.md` / `ARCHITECTURE.md` remain binding. Quiet Light supersedes the prior “Lamp on Ink” visual draft.*
