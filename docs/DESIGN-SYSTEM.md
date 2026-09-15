# ZAF ONE — Design System

## 1. Purpose and Status

This file is the authoritative source for **visual language**: color, typography, spacing,
radii, shadows, breakpoints, motion, and focus treatment. Behavior belongs in `docs/UI-UX.md`;
these values express that behavior visually. The implementation is `src/theme/` (tokens,
`ThemeProvider`, global styles) and `DESIGN.md` (portable design-system spec). Values here,
in `DESIGN.md`, and in `src/theme/tokens.ts` must stay in sync.

Status labels follow `TEMPLATE-GUIDE.md`. All values below are **Confirmed** for the
implemented system. The official logo (`logo-clear.png`, a circular badge reading "Aquatic
Feeds / Zeann Feeds Supply") is provided by the business and its palette is the source for
the brand colors in §3; the simplified small mark used at header/favicon sizes is a derived
placeholder and may be replaced by the business at any time.

## 2. Principles

1. **Mobile first.** Base styles target small phones, including 320px widths with no
   horizontal scrolling; `phoneWide` (≥430px), `tablet` (≥640px) and `desktop` (≥1024px)
   enhance layout only.
2. **Text, not color alone.** Statuses, store context, and errors are always conveyed in
   words. Color is reinforcement only (`docs/REQUIREMENTS.md` REQ-ACC-004).
3. **Visible store context.** Amara and Zeann each have an identity enamel color, always
   rendered with the store name as text.
4. **Accessible contrast.** Text/background pairs target WCAG AA (4.5:1 for body text);
   cream stencil ink on enamel plates meets AA.
5. **Painted delivery-vehicle signage.** The interface reads like a painted fleet: flat
   enamel plates with hard edges and no gradients on a cool workshop-wall ground; stencil
   route-board caps; a persistent now-mark; named balance states. The palette is the logo's
   marine blues and slates.
6. **Calm motion.** Motion is feedback plus one authored moment (plate stamp-in, now-pulse);
   `prefers-reduced-motion` disables it.
7. **Touch-first targets.** Interactive elements are at least 44px in the touch dimension.

## 3. Color

### 3.1 Ground and neutrals (cool workshop wall)

| Token             | Value                  | Use                                        |
| ----------------- | ---------------------- | ------------------------------------------ |
| `neutral.50`      | `#f7f9fb`              | Cool wall highlight                        |
| `neutral.100`     | `#eef2f5`              | Subtle fills                               |
| `neutral.200`     | `#dae0e6`              | Recessed fills                             |
| `neutral.300`     | `#cdcdcd`              | —                                          |
| `neutral.400`     | `#929eb6`              | Placeholder-adjacent, decorative dots      |
| `neutral.500`     | `#515b74`              | Slate ink                                  |
| `neutral.600`     | `#3a4256`              | —                                          |
| `neutral.700`     | `#2a3040`              | —                                          |
| `neutral.800`     | `#1a1f2b`              | Stencil outline paint, dark tag ink        |
| `neutral.900`     | `#0f131b`              | —                                          |
| `surface.page`    | `#f4f7fa`              | Page ground (cool workshop wall)           |
| `surface.subtle`  | `#eef2f5`              | Filter bars, icon chips, skeleton base     |
| `surface.card`    | `#ffffff`              | Unpainted paper boards, cards, list groups |
| `surface.overlay` | `rgba(1, 20, 40, 0.5)` | Dialog backdrop                            |
| `text.primary`    | `#013c68`              | Body text                                  |
| `text.secondary`  | `#515b74`              | Secondary text                             |
| `text.muted`      | `#6b7590`              | Muted text (AA on white)                   |
| `text.inverse`    | `#ffffff`              | Stencil white ink on painted plates        |
| `border.default`  | `#cdcdcd`              | Default hairline borders                   |
| `border.strong`   | `#929eb6`              | Strong borders                             |

### 3.2 Brand (marine enamel — navy, accent, focus)

| Token        | Value     |
| ------------ | --------- |
| `brand.50`   | `#eaf7fd` |
| `brand.100`  | `#d6effa` |
| `brand.600`  | `#013c68` |
| `brand.700`  | `#002b4c` |
| `brand.tint` | `#bee7f7` |

White stencil ink (`#ffffff`) on `brand.600`/`brand.700` meets AA. The marine enamel is the
deep navy of the logo's water; it carries route-board headers, the overall daily sales plate,
primary actions, and the focus ring. The logo's mid blue `#0184b2` and light cyan `#4ed1f9`
are the accent/focus tones. **No gradients** — paint is flat.

### 3.3 Status paints (chips — always used with words)

| Status    | Paint (chip fill) | Wash background | Border    |
| --------- | ----------------- | --------------- | --------- |
| Healthy   | `#1c5c33`         | `#e6efe3`       | `#c2d7bc` |
| Attention | `#8a4d06`         | `#fcf0dc`       | `#ecd29f` |
| Critical  | `#96290a`         | `#fbe7e0`       | `#efc3b4` |
| Info      | `#013c68`         | `#e6f2fa`       | `#b9dcf0` |

Semantic statuses stay out of the logo palette so success/warning/danger remain meaningful
and WCAG-contrast safe. Named balance states (healthy / attention / critical) are the
vocabulary for credit and stock on the dashboards (`src/features/dashboard/BalanceState.tsx`).

### 3.4 Store identity enamels

| Store | Background | Border    | Text      | Solid enamel |
| ----- | ---------- | --------- | --------- | ------------ |
| Amara | `#e6f3fa`  | `#b9dcf0` | `#013c68` | `#016a91`    |
| Zeann | `#eceff4`  | `#c3cad8` | `#3a4256` | `#515b74`    |

The solid enamel paints the store's hero plate (staff dashboard), store column headers
(admin depot board), badges, and active-nav markers. Amara uses the logo's mid blue darkened
to `#016a91` so white badge text meets AA; Zeann uses the logo's slate `#515b74`. The store
name is always shown as text next to it.

### 3.5 Focus treatment

| Token              | Value                                          |
| ------------------ | ---------------------------------------------- |
| `focus.ring`       | `#0184b2` (2px outline, 2px offset, soft glow) |
| `focus.glow`       | `rgba(1, 132, 178, 0.18)`                      |
| `focus.dangerGlow` | `rgba(150, 41, 10, 0.16)`                      |

## 4. Typography

- **Body (Barlow):** `"Barlow", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` — clean workmanlike grotesque for prose, lists, and forms.
- **Route caps (Barlow Condensed):** `"Barlow Condensed", "Barlow", ...` — hand-painted route-board capitals for plates, headers, labels, and figures. Loaded via Google Fonts with `display=swap`.
- **Sizes:** `xs` 11px · `sm` 13px · `md` 16px (base, never smaller for body) · `lg` 18px · `xl` 20px · `2xl` 24px · `display` 30px (stencil figures) · `hero` 44px (the single enamel figure).
- **Weights:** `regular` 400 · `medium` 500 · `semibold` 600 · `bold` 700 (Barlow Condensed loads up to 800).
- **Tracking:** `tight` -0.02em (figures, headings) · `normal` 0 (body) · `wide` 0.06em (stencil caps).
- **Line heights:** `tight` 1.06 (headings, figures) · `base` 1.5 (body).
- Numeric values (money, quantities, counts) use `font-variant-numeric: tabular-nums` so figures on a plate align.
- Headings use `text-wrap: balance`.

## 5. Spacing, Radii, Shadows

- **Spacing (4px base):** `0` 0 · `xs` 4px · `sm` 8px · `md` 12px · `lg` 16px · `xl` 24px · `xxl` 32px · `xxxl` 48px.
- **Radii (hard edges):** `sm` 2px · `md` 4px · `lg` 6px (plates, route boards, store columns) · `xl` 10px · `full` 9999px (now-dot, rivets). Radii stay small so plates read as cut metal, not softened cards.
- **Shadows (cool, layered):**
  - `paint` — enamel plates and route boards only (cool dark drop + 1px inner paint edge + faint top highlight).
  - `sm` (elevated surfaces such as dialogs) · `md` (dialogs, elevated surfaces) · `lg` (prominent surfaces) · `raised` (interactive hover lift).
  - **Unpainted paper boards sit flush on the wall** — a hairline border at rest, shadow only as a state response (the Flush Board Rule; no ghost cards).
- **Layout:** `layout.headerHeight` 60px · `layout.tabBarHeight` 64px · `layout.contentMaxWidth` 72rem. Chrome dimensions are tokens, never hardcoded offsets.

## 6. Breakpoints and Layout

| Token         | Value    | Layout effect                                                                                     |
| ------------- | -------- | ------------------------------------------------------------------------------------------------- |
| base (mobile) | < 430px  | Fixed tab bar (max 5 destinations + More); single column; lists render as cards; chrome truncates |
| `phoneWide`   | ≥ 430px  | Plate grids pair into two columns; store columns pair on the admin depot board                    |
| `tablet`      | ≥ 640px  | Wider forms and lists; lists render as data tables                                                |
| `desktop`     | ≥ 1024px | Side navigation replaces the tab bar; content max-width                                           |

Navigation destinations are identical on all viewports (`docs/UI-UX.md` §6). The dashboard
is a vertical board: route header, dominant plate, then a two-column plate grid. Fixed
chrome respects device safe areas (`env(safe-area-inset-*)`).

## 7. Motion

- Durations: `fast` 120ms · `base` 200ms. Easing: ease-out.
- **Authored moments (the two exceptions to feedback-only):**
  - The hero plate **stamps in** once on load (260ms `cubic-bezier(0.16, 1, 0.3, 1)`).
  - The route-board **now-mark pulses** on today's date (2s ease-in-out).
- Skeleton loading uses a shimmer sweep.
- `@media (prefers-reduced-motion: reduce)` disables transitions and animation globally.

## 8. Usage Rules for Implementation

1. Consume values only through the styled-components theme (`src/theme/tokens.ts`); no
   hard-coded colors, spacing, or breakpoints in components.
2. Store context (`StoreBadge`, route boards, store columns) always pairs the identity
   enamel with the store name in text.
3. Errors and statuses always include text; the named balance states are Healthy /
   Attention / Critical, never color alone.
4. Focus indicators must remain visible; never remove outlines without a replacement.
5. New visual values require a documented need and an update to this file, `DESIGN.md`,
   and `.impeccable/design.json` — never ad-hoc hex codes in components.
6. Paint is flat: **no gradients, no glass, no soft-fill panels.** Filled enamel plates
   always carry the 1px dark paint edge and the `paint` shadow.
7. Figures are set in tabular numerals; plate figures use the condensed route caps.
8. The saturated store enamels own plates and column headers only — never thin accents.
9. Elevation is declared once per surface: enamel plates cast the `paint` shadow; unpainted
   paper boards stay flush with a hairline border and no resting shadow.

## 9. Related Documentation

- `docs/UI-UX.md` — behavior and experience (authoritative for behavior)
- `docs/REQUIREMENTS.md` — accessibility requirements (REQ-ACC-001–004)
- `docs/TECH-STACK.md` — Styled Components selection
- `docs/DECISIONS.md` — DEC-019 (identity redesign decision record)
- `DESIGN.md` — portable design-system spec (token-bearing)
- `.impeccable/design.json` — design-system sidecar
- `src/theme/` — token implementation
