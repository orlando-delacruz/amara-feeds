# Amara + Zeann Store Management System

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
- **No Supabase or database exists yet.** Authentication is a localStorage-backed mock login; real auth, authorization, and persistence are Phase 4+.
- **Next:** Phase 3 (frontend workflow validation gate). Database work (Phase 4+) is gated behind it.

`typecheck`, `lint`, `format:check`, `test:run`, and `build` pass. Features described in the documentation reflect intended scope, not confirmed completion. Implementation follows `ROADMAP.md`.
