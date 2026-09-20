# ZAF ONE

A business management web application for the Amara and Zeann two-store business, primarily used by staff on mobile devices.

## Overview

- **Business:** Amara and Zeann — a two-store business.
- **Audience:** store staff and admin users managing the business and reporting.
- **Purpose:** support day-to-day operations across shared customers, per-store sales and inventory, and shared credit/collection.
- **Scope:** the initial/core version only — detail belongs in `docs/PROJECT.md` and `docs/REQUIREMENTS.md`.

## Repository Documentation

| Document | Purpose |
| --- | --- |
| `docs/PROJECT.md` | Business and product context |
| `docs/REQUIREMENTS.md` | Functional and business requirements |
| `docs/TECH-STACK.md` | Technology choices |
| `docs/ARCHITECTURE.md` | Architecture and code organization |
| `docs/UI-UX.md` | Behavior and experience |
| `docs/DESIGN-SYSTEM.md` | Visual language and design tokens |
| `docs/DATA-MODEL.md` | Data concepts and relationships |
| `docs/API.md` | Endpoint and integration contracts |
| `docs/SECURITY.md` | Security requirements |
| `docs/TESTING.md` | Verification strategy |
| `docs/DEVELOPMENT.md` | Development workflow |
| `docs/DEPLOYMENT.md` | Deployment procedures |
| `docs/DECISIONS.md` | Material decisions |
| `ROADMAP.md` | Implementation sequence and phase dependencies |

Operating rules for working in this repository live in `AGENTS.md`. Documentation conventions live in `TEMPLATE-GUIDE.md`.

## Technology Direction

Selected stack (authority: `docs/TECH-STACK.md`): React + Vite + TypeScript with Styled Components; Supabase platform (PostgreSQL, Auth, Row Level Security); Vercel hosting; GitHub source control; Vitest + React Testing Library, with Playwright for critical paths only if budget and schedule permit.

## Key Constraints

- Initial/core version budget of ₱10,000 — avoid scope creep and over-engineering.
- Target completion date of September 30, 2026.
- Scope is limited to the agreed core version defined in `docs/PROJECT.md` and `docs/REQUIREMENTS.md`; inclusion of any specific feature is determined there.

## Status

Implementation status is determined from the actual repository, not from this file.

- **Phase 0 (Frontend Foundation) — complete:** React + Vite + TypeScript scaffold at the repository root, Styled Components theming with design tokens, React Router with staff and admin shells, reusable UI foundations, and build/type/lint/format/test tooling.
- **Phase 1 (Centralized Mock Data Layer) — complete:** framework-agnostic async services over a centralized in-memory mock domain model, with confirmed invariants (sale→stock, charge→credit, payment→balance, receiving→stock, product approval) enforced in memory and covered by tests.
- **Phase 2 (Frontend Business Workflows) — complete:** mock sign-in with role-gated staff/admin shells and store context; customers (list/search/add); products with submit→pending→approve; per-store inventory and receiving; the full sales flow (cash/charge, terms with due-date preview, delivery); shared credit with cross-store payment recording; staff/admin dashboards and printable report summaries. All workflows consume services (never raw mocks) with loading, empty, error, and success states.
- **Frontend additions (2026-09-13) — complete:** production login form (username + password) with localStorage-backed mock credentials (`alice`/`alice123`, `ben`/`ben123`, `owner`/`admin123`); per-record creator attribution (sales, payments, receiving) with "Recorded by" shown; admin staff management (add, edit, disable/enable, store reassignment); per-store riders and vehicles pages (staff own store, admin both stores) with sale-form dropdowns; staff reports scoped to the assigned store only; required rider/vehicle on receiving stock; per-rider/vehicle expense tracking (fuel/repair) with net summary (delivered-sales minus expenses) on a dedicated Expenses page.
- **Frontend additions (2026-09-14) — complete:** receiving "Add stock" modal (item, quantity, supplier, cost, selling price) with Pending/List items tab filter and mobile pending cards; reports page "Export PDF" button (jsPDF + jspdf-autotable, data-driven A4 document, DEC-020) replacing browser print, with responsive polish on the summaries; sale entry redesigned as a Shopee-style product catalog with per-product quantity + "Add to cart" (automatic per-store pricing from the latest receiving record), a floating basket with an item-count badge that opens the cart/checkout page (customer, delivery, payment, review), and quantity-merging in the cart (DEC-021, DEC-022).
- **Frontend additions (2026-09-14, second batch) — complete:** checkout captures the sale date (backdatable; drives credit due dates), the mode of payment (Cash/GCash/Maya/Bank Transfer/Check/Other), and an optional discount (net = items + fee − discount) (DEC-023); catalog quantity becomes a manual number input; the staff dashboard drops its monthly sales card; Reports is admin-only with an Excel export of the sale lines (`write-excel-file`, superseding the PDF export, DEC-024) over a selectable From/To date range, with white header text on the green fill; History shows an unread badge (side nav + More page) until opened and an admin-only store filter; admins can add customers from the customer list (DEC-025, DEC-026); riders and vehicles pages now support full CRUD — add, edit (rename), activate/deactivate, and confirmed delete, with delete refused for entries still used by sales/receiving/expenses (DEC-027).
- **Frontend additions (2026-09-14, third batch) — complete:** the new-sale catalog gains a search filter and alphabetical item ordering; customers capture an optional address (add-customer form, customer list, and the cart's selected-customer display); Reports adds a "Sales by mode of payment" breakdown and the Excel export adds a Mode of Payment column; the brand and project are renamed to **ZAF ONE** (TopBar, sign-in, page title, package name, storage keys, export filename, docs; DEC-028 superseding DEC-007/008).
- **Frontend additions (2026-09-14, fourth batch) — complete:** the official logo is adopted (full badge on sign-in; a derived simplified mark in the header and favicon) and the whole theme is recolored to the logo's marine palette (navy/cyan/slate; semantic status colors and the painted-signage motif kept; DEC-029 superseding DEC-019's palette).
- **Frontend additions (2026-09-20) — complete:** sign-in brand panel copy ("ZAF ONE / Zeann & Amara Feeds Supply / One System • One Team • One Goal"); stock rows on the inventory page gained manual edit (absolute quantity) and delete for the selected store, with delete refused for products having sales at that store (quantity-to-0 instead) and both actions recorded as audit events (DEC-032, DEC-033).
- **No Supabase or database exists yet.** Authentication is a localStorage-backed mock login; real auth, authorization, and persistence are Phase 4+.
- **Next:** Phase 3 (frontend workflow validation gate). Database work (Phase 4+) is gated behind it.

`typecheck`, `lint`, `format:check`, `test:run`, and `build` pass except four pre-existing failures (DatePicker ×3, SaleListPage ×1) and one pre-existing lint error (`DatePicker.tsx` `react-hooks/set-state-in-effect`), all confirmed on a pristine `develop`. Features described in the documentation reflect intended scope, not confirmed completion. Implementation follows `ROADMAP.md`.
