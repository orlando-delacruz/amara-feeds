# Amara + Zeann Store Management System — Design System

## 1. Purpose and Status

This file is the authoritative source for **visual language**: color, typography, spacing,
radii, shadows, breakpoints, motion, and focus treatment. Behavior belongs in `docs/UI-UX.md`;
these values express that behavior visually.

Introduced in Phase 0 (frontend foundation) because `docs/UI-UX.md` §19 defers all visual
values to design documentation "if and when such documentation is introduced", and Phase 0
shells must render real values. The matching implementation is `src/theme/` (tokens,
`ThemeProvider`, global styles). Values here and in `src/theme/tokens.ts` must stay in sync.

Status labels follow `TEMPLATE-GUIDE.md`. All values below are **Confirmed** for the
foundation; any future brand artwork, logo, or marketing palette remains
**Confirmation Required** and must not be invented.

## 2. Principles

1. **Mobile first.** Base styles target small phones, including 320px widths with no
   horizontal scrolling; `phoneWide` (≥430px), `tablet` (≥640px) and `desktop`
   (≥1024px) enhance layout only. Core workflows never require horizontal scrolling.
   Fixed chrome truncates or hides secondary items rather than overflowing.
2. **Text, not color alone.** Statuses, store context, and errors are always conveyed in
   words. Color is reinforcement only (`docs/REQUIREMENTS.md` REQ-ACC-004).
3. **Visible store context.** Amara and Zeann each have an identity color pair, always
   rendered with the store name as text.
4. **Accessible contrast.** Text/background pairs target WCAG AA (4.5:1 for body text).
   Solid store colors are accents; readable text uses the paired dark-on-tint combination.
5. **Calm motion.** Motion supports feedback only; `prefers-reduced-motion` disables it.
6. **Touch-first targets.** Interactive elements are at least 44px in the touch dimension.
7. **Warm market identity.** The evergreen brand green reflects the feeds/agriculture
   business. Warm sand neutrals create an inviting feel. The design is trustworthy,
   practical, and a little premium — not cold or clinical.

## 3. Color

### 3.1 Neutrals and text (warm sand ramp)

| Token         | Value     | Use                                     |
| ------------- | --------- | --------------------------------------- |
| `neutral.50`  | `#faf9f6` | Page background (warm paper)            |
| `neutral.100` | `#f4f2ec` | Subtle fills                            |
| `neutral.200` | `#e9e5db` | Default borders                         |
| `neutral.300` | `#d8d2c4` | Strong borders                          |
| `neutral.400` | `#a8a293` | Placeholder text only (never body text) |
| `neutral.500` | `#7a756a` | Muted text                              |
| `neutral.600` | `#5b574e` | Secondary text                          |
| `neutral.700` | `#4a463f` | —                                       |
| `neutral.800` | `#322f2a` | —                                       |
| `neutral.900` | `#211f1a` | Primary text                            |
| `white`       | `#ffffff` | Cards, inverse text                     |

### 3.2 Brand (primary actions, links, focus — evergreen green)

| Token            | Value                                       |
| ---------------- | ------------------------------------------- |
| `brand.50`       | `#ecf7f0`                                   |
| `brand.100`      | `#d7edde`                                   |
| `brand.600`      | `#157347`                                   |
| `brand.700`      | `#0e5c38`                                   |
| `brand.gradient` | `linear-gradient(135deg, #1f7a4d, #2e9d63)` |

White text on `brand.600`/`brand.700` meets AA (≈5.8:1). The gradient is used for
primary buttons, hero surfaces, and the sign-in brand panel.

### 3.3 Status pairs (background / border / text — always used together with words)

| Status  | Background | Border    | Text      |
| ------- | ---------- | --------- | --------- |
| Success | `#ecfdf5`  | `#a7f3d0` | `#065f46` |
| Warning | `#fffbeb`  | `#fde68a` | `#92400e` |
| Danger  | `#fef2f2`  | `#fecaca` | `#991b1b` |
| Info    | `#ecf7f0`  | `#d7edde` | `#0e5c38` |

Info uses the brand.50/brand.100 palette instead of blue, keeping the brand identity
consistent.

### 3.4 Store identity pairs

| Store | Background | Border    | Text      | Solid accent |
| ----- | ---------- | --------- | --------- | ------------ |
| Amara | `#ede9fe`  | `#c4b5fd` | `#5b21b6` | `#7c3aed`    |
| Zeann | `#ffedd5`  | `#fed7aa` | `#9a3412` | `#c2410c`    |

The solid accent is decorative only (badge dots, active-nav markers). The store name is
always shown as text next to it.

### 3.5 Surfaces and overlays

| Token             | Value                                                                            |
| ----------------- | -------------------------------------------------------------------------------- |
| `surface.page`    | `#faf9f6` (warm paper)                                                           |
| `surface.subtle`  | `#f4f2ec` (filter bars, icon chips, skeleton base)                               |
| `surface.card`    | `#ffffff`                                                                        |
| `surface.overlay` | `rgba(33, 31, 26, 0.5)` (backdrop blur on dialogs)                               |
| `focus.ring`      | `#157347` (2px outline, 2px offset, soft glow, always visible on keyboard focus) |

## 4. Typography

- **Family (Plus Jakarta Sans):** `"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`. Loaded via Google Fonts with `display=swap`.
- **Sizes:** `xs` 11px · `sm` 13px · `md` 16px (base, never smaller for body) · `lg` 18px · `xl` 20px · `2xl` 24px · `display` 28px (stat values) · `hero` 32px (dashboard hero number only).
- **Weights:** `regular` 400 · `medium` 500 · `semibold` 600 · `bold` 700.
- **Tracking:** `tight` -0.02em (headings) · `normal` 0 (body) · `wide` 0.06em (micro labels).
- **Line heights:** `tight` 1.15 (headings) · `base` 1.5 (body).
- Form labels use `sm` semibold; body text is never smaller than `sm` except captions (`xs`).
- Numeric values (money, quantities, counts) use `font-variant-numeric: tabular-nums` so figures align.
- Headings use `text-wrap: balance` to avoid widows.

## 5. Spacing, Radii, Shadows

- **Spacing (4px base):** `0` 0 · `xs` 4px · `sm` 8px · `md` 12px · `lg` 16px · `xl` 24px ·
  `2xl` 32px · `xxxl` 48px.
- **Radii:** `sm` 6px · `md` 10px · `lg` 14px · `xl` 20px (hero surfaces, dialog panels) · `full` 9999px.
- **Shadows (layered, warm-toned):**
  - `sm` (resting cards, tables, subtle containers) — subtle elevation
  - `md` (dialogs, elevated nav, hero surfaces) — moderate elevation
  - `lg` (sheets, prominent surfaces, sign-in shell) — strong elevation
  - `raised` (hover-lift interactive cards) — dynamic hover state
- Dialogs also dim the page with `surface.overlay` + `backdrop-filter: blur(4px)`.
- Focus ring uses `box-shadow` glow (0 0 0 3px rgba(21, 115, 71, 0.12)) for visual emphasis.
- **Layout:** `layout.headerHeight` 60px · `layout.tabBarHeight` 64px ·
  `layout.contentMaxWidth` 72rem. Header and tab-bar dimensions are tokens, never hardcoded offsets.

## 6. Breakpoints and Layout

| Token         | Value    | Layout effect                                                                                           |
| ------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| base (mobile) | < 430px  | Fixed tab bar (max 5 destinations + More sheet); single column; lists render as cards; chrome truncates |
| `phoneWide`   | ≥ 430px  | Relaxed phone layout; pairs and rows breathe                                                            |
| `tablet`      | ≥ 640px  | Wider forms and lists; same destinations as mobile                                                      |
| `desktop`     | ≥ 1024px | Side navigation replaces the tab bar; content max-width                                                 |

Navigation destinations are identical on all viewports (`docs/UI-UX.md` §6). Overflow destinations live on the More page (`/more`, `/admin/more`); it adds no new destinations.
Fixed chrome respects device safe areas (`env(safe-area-inset-*)`) and the tab bar uses icon + label pairs (inline SVG, `currentColor`, decorative and hidden from assistive tech). Tab items share equal width capped at 6.5rem so the five tabs sit centered.

Active tab treatment: tinted pill background (`brand.50`) + brand-colored icon + semibold label, replacing the old color-only indicator. The brand dot mark in the header (violet/amber pair) provides a subtle visual anchor.

## 7. Motion

- Durations: `fast` 120ms · `base` 200ms. Easing: ease-out.
- Motion is limited to feedback (press states, dialog entry, loading indicators, hover lift, focus glow).
- Skeleton loading uses a shimmer sweep (gradient animation) instead of pulse for a more polished feel.
- `@media (prefers-reduced-motion: reduce)` disables transitions and animation globally.

## 8. Usage Rules for Implementation

1. Consume values only through the styled-components theme (`src/theme/tokens.ts`); no
   hard-coded colors, spacing, or breakpoints in components.
2. Store context (`StoreBadge`, headers) always pairs the identity color with the store
   name in text.
3. Errors and statuses always include text; `Alert`/`ErrorState` use the §3.3 pairs.
4. Focus indicators must remain visible; never remove outlines without a replacement.
5. New visual values require a documented need and an update to this file — never ad-hoc
   hex codes in components.
6. The brand gradient (`brand.gradient`) is reserved for hero surfaces, primary buttons,
   and the sign-in brand panel. Do not overuse.
7. Shadows use the layered warm-toned system; do not hardcode `box-shadow` values outside
   the token system.

## 9. Related Documentation

- `docs/UI-UX.md` — behavior and experience (authoritative for behavior)
- `docs/REQUIREMENTS.md` — accessibility requirements (REQ-ACC-001–004)
- `docs/TECH-STACK.md` — Styled Components selection
- `docs/DECISIONS.md` — DEC-018 (visual refinement decision record)
- `src/theme/` — token implementation
