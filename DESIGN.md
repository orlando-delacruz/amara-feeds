---
name: Amara Feeds — Store Management
description: Two-store business management rendered as painted delivery-vehicle signage.
colors:
  primary: "#1d3a2f"
  primary-deep: "#152b22"
  cream: "#f7f2e6"
  wall: "#f4f0e6"
  paper: "#fbf8f0"
  ink: "#26221a"
  ink-soft: "#57503f"
  line: "#ddd5c4"
  amara-violet: "#4a2b9e"
  zeann-rust: "#93340e"
  healthy: "#1c5c33"
  attention: "#8a4d06"
  critical: "#96290a"
  healthy-wash: "#e6efe3"
  healthy-line: "#c2d7bc"
  attention-wash: "#fcf0dc"
  attention-line: "#ecd29f"
  critical-wash: "#fbe7e0"
  critical-line: "#efc3b4"
  info-paint: "#174a38"
  info-wash: "#e8f0ec"
  info-line: "#c8dcd1"
  amara-wash: "#efe9fb"
  amara-line: "#cdc0ee"
  zeann-wash: "#fdefe2"
  zeann-line: "#f3cfae"
  paint-edge: "rgba(0, 0, 0, 0.28)"
  paint-edge-strong: "rgba(0, 0, 0, 0.3)"
typography:
  display:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "44px"
    fontWeight: 700
    lineHeight: 1.06
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.06
    letterSpacing: "0.06em"
  body:
    fontFamily: "Barlow, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
  label:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.06
    letterSpacing: "0.06em"
rounded:
  sm: "2px"
  md: "4px"
  lg: "6px"
  xl: "10px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
components:
  plate-hero:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.cream}"
    rounded: "{rounded.lg}"
    padding: "16px"
  plate-stencil:
    backgroundColor: "{colors.wall}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
  chip-status:
    backgroundColor: "{colors.healthy}"
    textColor: "{colors.cream}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
---

# Design System: Amara Feeds — Store Management

## Overview

**Creative North Star: "The Depot Route Board"**

Amara Feeds runs on painted vehicle signage. The interface is drawn the way a Philippine delivery fleet is painted: flat enamel plates on a warm workshop wall, stencil caps on the route board, and hard-edged color that tells you which store a number belongs to. A store's day reads the way a route board does — one big figure, two store columns, a persistent now. The staff dashboard is the driver's own route plate; the admin dashboard is the depot board both stores are pinned to.

**Key Characteristics:**
- Saturated enamel panels with hard edges and no gradients, on a warm wall ground.
- Route-board capitals (Barlow Condensed) for plates and headers; clean grotesque (Barlow) for body; tabular numerals for every figure.
- A persistent now-mark pulses on today's date; plates stamp in once on load.
- Every zone is labeled by its literal name; named balance states (healthy / attention / critical) carry credit and stock.
- Empty data stays visible as hollow stencil plates rather than disappearing.

The world refuses the neutral card grid and the hero-metric template: figures live on painted plates and store columns, not in same-size white cards.

## Colors

The palette is paint on a wall: one deep depot enamel carries chrome and the brand figure, the two stores are the saturated identity enamels, and statuses are enamel chips with words.

### Primary
- **Depot Enamel** (`#1d3a2f`): the brand figure and chrome. Route-board headers, the overall daily sales plate, primary actions, focus ring. Reads as deep green-black paint (feeds/agriculture truth kept in the enamel register).

### Secondary
- **Amara Violet** (`#4a2b9e`): Amara's enamel. The store's hero plate on the staff dashboard, store column headers, store identity accents.
- **Zeann Rust** (`#93340e`): Zeann's enamel. Zeann's hero plate, store column headers, store identity accents.

### Tertiary
- **Cream** (`#f7f2e6`): the stencil ink on every painted plate. White text on brand/store solids meets AA.

### Neutral
- **Workshop Wall** (`#f4f0e6`): the page ground; the wall the plates are mounted on.
- **Unpainted Paper** (`#fbf8f0`): cards, boards, and list groups between the plates.
- **Ink** (`#26221a`): primary body text.
- **Ink Soft** (`#57503f`): secondary text.
- **Line** (`#ddd5c4`): hairline dividers and board edges.

### Named Rules
**The Flat Paint Rule.** Enamel plates are flat — hard edges, no gradients, no soft-fill panels. The only depth is the plate's own drop shadow and a 1px dark paint edge.

**The Enamel Reserve Rule.** The saturated store enamels appear only as figures on plates and column headers — never as thin accents scattered over the wall.

## Typography

**Display Font:** Barlow Condensed (weights 500–800)
**Body Font:** Barlow (weights 400–700)

**Character:** Barlow Condensed reads as hand-painted route-board capitals — tall, compressed, and loud enough to read across a shop floor. Barlow body is a clean, workmanlike grotesque that lets the plates speak.

### Hierarchy
- **Hero** (Barlow Condensed 700, 44px, 1.06, -0.02em): the single enamel figure of the day — today's sales, overall daily sales.
- **Title / Route** (Barlow Condensed 600, 20px, 1.06, +0.06em, uppercase): page names on route boards and store columns.
- **Label** (Barlow Condensed 600, 13px, 1.06, +0.06em, uppercase): plate labels, zone names, now-mark.
- **Body** (Barlow 400, 16px, 1.5): prose, lists, forms.
- **Micro** (Barlow Condensed 600, 11px, uppercase): status chips and stencil captions.

### Named Rules
**The Tabular Plate Rule.** Every figure (money, quantity, count) uses tabular numerals so numbers on a plate align; figures are never set in proportional figures.

## Layout

Base is mobile-first from 320px. The dashboard is a vertical board: route header, dominant plate, then a two-column plate grid that pairs at ≥430px (`phoneWide`). The admin depot board stacks store columns to a single column below `phoneWide` and pairs them at ≥430px; full lists render as data tables at ≥640px (`tablet`). Fixed chrome (header 60px, tab bar 64px) is tokenized and never hardcoded; content max-width is 72rem.

## Elevation & Depth

Depth is the plate-on-wall: enamel plates carry a warm dark drop shadow (`shadow.paint`) plus a 1px inner dark paint edge and a faint top highlight, so they read as mounted painted metal. Unpainted paper boards sit flush on the wall with a hairline edge and no resting shadow; the layered warm shadows (`sm`/`md`/`lg`/`raised`) appear only as a response to state (hover, dialog, focus). Stencil plates cast no shadow — they are painted on the wall.

### Shadow Vocabulary
- **paint** (`0 6px 16px rgba(21,43,34,0.26), 0 2px 5px rgba(21,43,34,0.2)`): enamel plates and route boards only.
- **sm** (`0 1px 2px rgba(38,34,26,0.06), 0 2px 6px rgba(38,34,26,0.05)`): elevated surfaces such as dialogs.
- **raised** (`0 10px 22px rgba(38,34,26,0.16), 0 3px 8px rgba(38,34,26,0.08)`): interactive hover lift.

### Named Rules
**The Paint Edge Rule.** A filled enamel plate always carries the 1px dark inner edge; without it the plate floats like a card.

**The Flush Board Rule.** Unpainted paper boards rest flat on the wall — a hairline border at rest, shadow only as a state response. A 1px border under a resting shadow is the ghost card.

## Shapes

Hard edges rule: radii are deliberately small (`sm` 2px, `md` 4px, `lg` 6px, `xl` 10px) so plates read as cut metal, not softened cards. Full radius (`9999px`) is reserved for the pulsing now-dot and rivets. Route boards and store columns keep `lg` (6px); the route board carries a 3px flat livery stripe along its bottom edge (store enamel for staff, split Amara/Zeann for admin).

## Components

### Enamel Plates (`StatCard panel`)
- **Shape:** `lg` radius (6px), 1px dark paint edge, `shadow.paint`.
- **Label:** Barlow Condensed 600, uppercase, wide tracking, in the plate's tint.
- **Value:** hero/large/medium scale, cream, bold, tabular.
- **Caption:** cream tint, led by a 14px hairline leader tick (the tensegrity leader-line donation).
- **Tones:** `brand` (depot enamel), `amara`, `zeann` (store enamels), `neutral` (near-black iron).

### Stencil Plates (`StatCard outline`)
- **Shape:** transparent wall ground, 2px solid outline in the tone paint, no shadow.
- **Use:** the named secondary plates (outstanding credit, items in stock) that read as painted-on rather than mounted.
- **Caption:** same leader tick.

### Route Board (`RouteBoard`)
- **Shape:** depot-enamel plate with `shadow.paint`, paint edge, and a 3px bottom livery stripe.
- **Content:** page name as `h1` in condensed caps; store route line beneath it; a persistent now-mark — pulsing cream dot + "Today · DAY, Mon D".
- **State:** the dot pulses on a 2s ease loop; the hero plate stamps in once (260ms cubic-bezier(0.16,1,0.3,1)).

### Balance State Chips (`BalanceStateChip`)
- **Style:** filled enamel chip in the state's paint with cream micro-caps and a small rivet dot.
- **States:** Healthy (`#1c5c33`) · Attention (`#8a4d06`) · Critical (`#96290a`), always with words.

### Depot Board (admin)
- **Style:** two store columns on `unpainted paper`; each has an enamel header strip in the store's paint with the store name in cream caps and a sale count, then the day figure in condensed tabular numerals and a leader-lined "today" caption.

### Paper Tags (`StatCard` default)
- **Style:** `paper` background, `line` border, flat (no resting shadow), painted square marker dot, condensed-caps label.

### Boards & Lists
- **Style:** `paper` background, `line` border, `lg` radius, hairline row dividers, flat (no resting shadow), condensed-caps section titles with a painted square marker.

## Do's and Don'ts

### Do:
- **Do** set every figure in tabular numerals and let plates carry the day's one big number.
- **Do** keep store context in the frame — the store name always renders as text on its enamel.
- **Do** draw empty data as a hollow stencil plate so absence stays visible.
- **Do** pair every status chip and store color with its word.

### Don't:
- **Don't** use gradients, glass, or soft-fill panels — paint is flat and hard-edged.
- **Don't** scatter the store enamels as thin accents; the enamels own plates and headers only.
- **Don't** set plate figures in the body grotesque — painted numbers are condensed.
- **Don't** drop the paint edge or shadow from a filled plate (it stops reading as metal).
- **Don't** put a kicker above a heading — the heading carries its own weight.
- **Don't** float unpainted boards — a resting 1px border under a soft shadow is the ghost card; only enamel plates cast the paint shadow.