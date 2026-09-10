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

1. **Mobile first.** Base styles target small phones; `tablet` (≥640px) and `desktop`
   (≥1024px) enhance layout only. Core workflows never require horizontal scrolling.
2. **Text, not color alone.** Statuses, store context, and errors are always conveyed in
   words. Color is reinforcement only (`docs/REQUIREMENTS.md` REQ-ACC-004).
3. **Visible store context.** Amara and Zeann each have an identity color pair, always
   rendered with the store name as text.
4. **Accessible contrast.** Text/background pairs target WCAG AA (4.5:1 for body text).
   Solid store colors are accents; readable text uses the paired dark-on-tint combination.
5. **Calm motion.** Motion supports feedback only; `prefers-reduced-motion` disables it.
6. **Touch-first targets.** Interactive elements are at least 44px in the touch dimension.

## 3. Color

### 3.1 Neutrals and text

| Token         | Value     | Use                                     |
| ------------- | --------- | --------------------------------------- |
| `neutral.50`  | `#f9fafb` | Page background                         |
| `neutral.100` | `#f3f4f6` | Subtle fills                            |
| `neutral.200` | `#e5e7eb` | Default borders                         |
| `neutral.300` | `#d1d5db` | Strong borders                          |
| `neutral.400` | `#9ca3af` | Placeholder text only (never body text) |
| `neutral.500` | `#6b7280` | Muted text                              |
| `neutral.600` | `#4b5563` | Secondary text                          |
| `neutral.700` | `#374151` | —                                       |
| `neutral.800` | `#1f2937` | —                                       |
| `neutral.900` | `#111827` | Primary text                            |
| `white`       | `#ffffff` | Cards, inverse text                     |

### 3.2 Brand (primary actions, links, focus)

| Token       | Value     |
| ----------- | --------- |
| `brand.50`  | `#eff6ff` |
| `brand.100` | `#dbeafe` |
| `brand.600` | `#2563eb` |
| `brand.700` | `#1d4ed8` |

White text on `brand.600`/`brand.700` meets AA.

### 3.3 Status pairs (background / border / text — always used together with words)

| Status  | Background | Border    | Text      |
| ------- | ---------- | --------- | --------- |
| Success | `#ecfdf5`  | `#a7f3d0` | `#065f46` |
| Warning | `#fffbeb`  | `#fde68a` | `#92400e` |
| Danger  | `#fef2f2`  | `#fecaca` | `#991b1b` |
| Info    | `#eff6ff`  | `#bfdbfe` | `#1e40af` |

### 3.4 Store identity pairs

| Store | Background | Border    | Text      | Solid accent |
| ----- | ---------- | --------- | --------- | ------------ |
| Amara | `#ede9fe`  | `#c4b5fd` | `#5b21b6` | `#7c3aed`    |
| Zeann | `#ffedd5`  | `#fed7aa` | `#9a3412` | `#c2410c`    |

The solid accent is decorative only (badges dots, active-nav markers). The store name is
always shown as text next to it.

### 3.5 Surfaces and overlays

| Token             | Value                                                                 |
| ----------------- | --------------------------------------------------------------------- |
| `surface.page`    | `#f9fafb`                                                             |
| `surface.card`    | `#ffffff`                                                             |
| `surface.overlay` | `rgba(17, 24, 39, 0.5)`                                               |
| `focus.ring`      | `#2563eb` (2px outline, 2px offset, always visible on keyboard focus) |

## 4. Typography

- **Family (system stack, no web-font dependency):**
  `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`.
- **Sizes:** `xs` 12px · `sm` 14px · `md` 16px (base) · `lg` 18px · `xl` 20px · `2xl` 24px · `display` 32px (stat values and brand wordmarks only).
- **Weights:** `regular` 400 · `medium` 500 · `semibold` 600 · `bold` 700.
- **Line heights:** `tight` 1.25 (headings) · `base` 1.5 (body).
- Form labels use `sm` semibold; body text is never smaller than `sm` except captions (`xs`).
- Numeric values (money, quantities, counts) use `font-variant-numeric: tabular-nums` so figures align.
- Headings use `text-wrap: balance` to avoid widows.

## 5. Spacing, Radii, Shadows

- **Spacing (4px base):** `0` 0 · `xs` 4px · `sm` 8px · `md` 12px · `lg` 16px · `xl` 24px ·
  `2xl` 32px · `3xl` 48px.
- **Radii:** `sm` 4px · `md` 8px · `lg` 12px · `full` 9999px.
- **Shadows:** `sm` (cards) · `md` (dialogs, elevated nav) · `lg` (sheets, prominent surfaces). Dialogs also dim the page with
  `surface.overlay`.
- **Layout:** `layout.headerHeight` 60px · `layout.tabBarHeight` 64px ·
  `layout.contentMaxWidth` 72rem. Header and tab-bar dimensions are tokens, never hardcoded offsets.

## 6. Breakpoints and Layout

| Token         | Value    | Layout effect                                                                         |
| ------------- | -------- | ------------------------------------------------------------------------------------- |
| base (mobile) | < 640px  | Fixed tab bar (max 5 destinations + More sheet); single column; lists render as cards |
| `tablet`      | ≥ 640px  | Wider forms and lists; same destinations as mobile                                    |
| `desktop`     | ≥ 1024px | Side navigation replaces the tab bar; content max-width                               |

Navigation destinations are identical on all viewports (`docs/UI-UX.md` §6). The More sheet groups overflow destinations; it adds no new destinations.
Fixed chrome respects device safe areas (`env(safe-area-inset-*)`) and the tab bar uses icon + label pairs (inline SVG, `currentColor`, decorative and hidden from assistive tech).

## 7. Motion

- Durations: `fast` 120ms · `base` 200ms. Easing: ease-out.
- Motion is limited to feedback (press states, dialog entry, loading indicators).
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

## 9. Related Documentation

- `docs/UI-UX.md` — behavior and experience (authoritative for behavior)
- `docs/REQUIREMENTS.md` — accessibility requirements (REQ-ACC-001–004)
- `docs/TECH-STACK.md` — Styled Components selection
- `src/theme/` — token implementation
