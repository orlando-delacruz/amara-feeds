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
- **Database + backend (2026-09-20) — Phase 4–6 foundation:** Supabase project initialized with imperative migrations (`supabase/migrations/00001–00004`): schema, RLS across all tables, atomic business functions (`record_sale`, `record_receiving`, `record_payment`, product approval, stock adjust/delete, rider/vehicle guarded delete, `create_staff`), and dev-parity seed with three Auth users (alice/ben/owner; passwords Assumed). Gate 4 SQL proofs (`supabase/proofs/gate4.sql`) pass: anon reaches nothing, store-scoped reads, shared cross-store reads, cross-store update denied, direct table writes denied, sale atomic + oversell refused, payment settles, approval gating, stock guard. `supabase db advisors` clean (DEC-034). Frontend: `@supabase/supabase-js` added; `src/services/supabaseClient.ts`; every service now runs against Supabase when `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are set, with the mock retained as a fallback for tests/preview; `SessionProvider` restores the real Auth session (DEC-035). Local stack: Docker + `npx supabase db start`/`db reset`.
- **Catalog/inventory consistency (2026-09-21, second batch) — complete:** sale catalog lists only sellable items (priced at the current store; an approved product with no received stock is hidden until a receipt arrives, DEC-037); the pending-seed demo item ("Cooking Oil 1L") gained a receiving record + stock like a real staff receipt (`00006` + mock seed), so approving it now shows up in both catalog and inventory. Approval behavior unchanged — approval activates the product; stock always comes from receiving.
- **Integration hardening (2026-09-21) — complete:** hosted-project bugs fixed — `record_sale` now passes `p_lines` as a JSON array (was a stringified scalar, 22023); `create_staff` resolves pgcrypto on hosted and creates the auth identity + identity row (`00005`); new admin-only `update_staff` (rename, username sync, store reassignment, enable/disable, password reset with session revocation) behind `updateUser`/staff pages; `listUsers`/`getUser`/`getDeliveryNetSummary` run on real profiles/net data (were silently mock); error mapping never surfaces raw SQLSTATE messages; password inputs have a show/hide toggle; sale catalog and checkout gained distinct loading/error states. All verified live against the hosted project (sale, create_staff → sign-in, update_staff → password reset + old-password rejection). DEC-036.
- **Feedback system upgrade (2026-09-21, third batch) — complete:** SweetAlert2 adopted for all action feedback (DEC-038): success/failure modals on every CRUD/transaction action (sign-in failure included), themed confirm modals replacing the removed in-app ConfirmDialog (stock/rider/vehicle delete, product approve/reject, staff enable/disable), and a sign-out confirmation on both the More page and the top bar. Page-level loading/empty/error states and inline field validation are unchanged. Tests use a deterministic SweetAlert2 double (`src/test/swalMock.ts`) instead of rendering popups under jsdom.
- **Hosted data wipe (2026-09-21) — complete:** the hosted project was wiped to an owner-only clean slate (DEC-039): all staff accounts and every business record removed via a one-time FK-safe SQL script (`supabase/cleanup/wipe-business-data.sql`; not a migration). Kept: the `owner` admin and the `stores`/`payment_terms` reference rows. Local dev keeps the `00004` seed parity data for tests.
- **Next:** link the hosted Supabase project (DEC-034 gate deferral: Phase 3 walkthrough can still run before Phase 7), Phase 7 real-system validation, then Phase 8 hardening + deployment.

`typecheck`, `lint`, `format:check`, `test:run`, and `build` pass except four pre-existing failures (DatePicker ×3, SaleListPage ×1) and one pre-existing lint error (`DatePicker.tsx` `react-hooks/set-state-in-effect`), all confirmed on a pristine `develop`. Features described in the documentation reflect intended scope, not confirmed completion. Implementation follows `ROADMAP.md`.
