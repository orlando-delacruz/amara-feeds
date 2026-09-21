# ZAF ONE — Decision Records

## 1. Purpose and Scope

This file preserves important architectural, technical, and implementation decisions for ZAF ONE: what was decided, why, alternatives, consequences, related documents, and lifecycle status. It supports scope discipline, simplicity, maintainability, and avoidance of unnecessary infrastructure appropriate to the ₱10,000 core-first project. Each record explains the choice, rationale, trade-offs, alternatives, consequences, related documents, and lifecycle status. This file is never a requirements document, implementation guide, or business-content source.

## 2. Documented Choice vs Recorded Decision vs Implemented Behavior

- A **documented choice** is a direction stated in an owning document (e.g. a technology in `docs/TECH-STACK.md`, a boundary in `docs/ARCHITECTURE.md`). Most documented choices never need a record here.
- A **recorded decision** is an entry in the register (§8) with an explicit lifecycle status.
- **Implemented behavior** is what the repository actually does; the repository governs actual behavior.

Consequences: selection without an entry is not a decision here; an accepted decision does not prove implementation; AI-generated code or suggestions are never decisions until they pass the lifecycle.

## 3. Ownership and Authority

| Concern | Owner |
| --- | --- |
| Agent-wide rules | `AGENTS.md` |
| Business context | `docs/PROJECT.md` |
| Requirements | `docs/REQUIREMENTS.md` |
| UI/UX behavior | `docs/UI-UX.md` |
| Technology | `docs/TECH-STACK.md` |
| Architecture | `docs/ARCHITECTURE.md` |
| Data concepts | `docs/DATA-MODEL.md` |
| API/data-access boundary | `docs/API.md` |
| Security | `docs/SECURITY.md` |
| Testing/verification | `docs/TESTING.md` |
| Development workflow | `docs/DEVELOPMENT.md` |
| Deployment | `docs/DEPLOYMENT.md` |
| Material decisions | `docs/DECISIONS.md` (this file) |

Rules: this file never overrides requirements, business context, or security expectations — conflicts resolve against the hierarchy in `docs/DEVELOPMENT.md`; a record explains or applies owning documents, never weakens or bypasses them; business facts, implementation facts, and decisions are not interchangeable; owning-document content changes belong in that document, with the decision behind the change recorded here.

## 4. When a Decision Must Be Recorded

Record when a choice materially affects architecture, technology selection or exclusion, data or integration boundaries, security approach, project-wide conventions (only where no owning document already governs), project-wide testing or tooling strategy (only where ungoverned), deployment or infrastructure direction, meaningful trade-offs, or choices likely to be revisited.

Practical test: if a future developer would reasonably ask "Why is it this way?" and the answer would otherwise be lost, consider recording the decision.

## 5. When a Decision Must NOT Be Recorded

Do not record trivial implementation details, temporary local choices, ordinary pattern-following implementation, routine content or data entry through established workflows, or choices fully governed by a requirement with no meaningful trade-off.

Test: no new trade-off, no boundary change, not plausibly questioned later — does not belong here. This file must not become an implementation diary.

## 6. Decision Lifecycle and Record Format

Each record carries exactly one status:

- **Proposed** — under evaluation, not approved; must not be implemented as accepted.
- **Accepted** — approved and active; implementation conforms.
- **Superseded** — replaced by a newer record; retained for history with a Superseded-by reference.
- **Rejected** — evaluated, not adopted; retained so it is not re-proposed without new evidence.
- **Revisit Required** — flagged for re-evaluation with a known trigger.

Allowed transitions: Proposed → Accepted, Proposed → Rejected, Accepted → Superseded, Accepted → Revisit Required, Revisit Required → Proposed (re-evaluation), Revisit Required → Accepted. Rejected and Superseded records are never edited into new outcomes — changes are new records.

Record format (omit inapplicable fields, never rename fields):

- **ID:** per Section 7.
- **Title:** short descriptive name.
- **Status:** one lifecycle status.
- **Date:** date the status was last set (project-local date; no time/timezone machinery).
- **Context:** problem, requirement, or constraint making the decision necessary (cite requirement IDs and sections).
- **Decision:** what was chosen, stated plainly.
- **Alternatives considered:** what else was evaluated and why not (one or two sentences each, proportional).
- **Rationale:** why this choice best serves the requirements within the agreed constraint.
- **Consequences:** scope, maintenance, follow-up work, constraints on future choices.
- **Related documents:** owning files and sections affected.
- **Supersedes / Superseded by:** ID links where applicable.
- **Open questions or follow-up:** unresolved items, confirmation needs, revisit triggers — never written as if decided.

## 7. IDs, Proposals, AI Rules, and Hierarchy

ID convention: sequential identifiers (`DEC-001`, `DEC-002`, …) in register order, defined as an implementation decision of this file; IDs never reused or renumbered; superseding decisions get new IDs; references use ID plus title.

Proposal and approval rules: proposals start Proposed with context, alternatives, and open questions; evidence gathered proportionally (implementation, owning docs, client confirmation for business facts, verification results — never manufactured); conflicts with higher-authority documents named and resolved before approval; business-fact decisions require client confirmation first (otherwise Proposed/Revisit Required); deferral is explicit; acceptance only when complete enough to act on without guessing.

AI-assisted rules: inspect docs and implementation first; distinguish facts, proposals, assumptions, decisions; never treat generated output as approved; never silently change an Accepted decision; identify conflicts before implementing; record important decisions; report unresolved as unresolved.

Hierarchy: a record here cannot authorize requirement violations, security weakening, invented business facts, or silent overrides; resolve the underlying issue in its owning document first, then record the consequent decision. Priority order follows `AGENTS.md`.

## 8. Current Decision Register

No formal decision records existed before Phase 0. The following records were created during implementation Phases 0–2. Documented choices in owning documents (e.g. the selected stack in `docs/TECH-STACK.md`) are not retroactively entries here; only material implementation decisions that introduce or change direction are recorded.

| ID | Title | Status | Date |
| --- | --- | --- | --- |
| DEC-001 | Frontend tooling and verification execution | Accepted | 2026-09-10 |
| DEC-002 | SPA routing with React Router | Accepted | 2026-09-10 |
| DEC-003 | Visual language baseline and design tokens | Accepted | 2026-09-10 |
| DEC-004 | Mock service seam, in-memory datastore, and money representation | Accepted | 2026-09-10 |
| DEC-005 | Mock session, role gating, and shared async data hooks | Accepted | 2026-09-10 |
| DEC-006 | Report summaries with browser print; Excel export deferred | Accepted | 2026-09-10 |
| DEC-007 | Sign-in entry brand and two-store treatment | Superseded by DEC-028 | 2026-09-10 |
| DEC-008 | App-like shell, shared UI primitives, and responsive record lists | Superseded by DEC-028 | 2026-09-10 |
| DEC-009 | Operations-board dashboard and app-wide visual rhythm | Accepted | 2026-09-10 |
| DEC-010 | Tight responsive scale and flat grouped dashboard | Accepted | 2026-09-10 |
| DEC-011 | More page, centered tabs, dashboard value hierarchy | Accepted | 2026-09-10 |
| DEC-012 | Production login form with localStorage credentials | Accepted | 2026-09-13 |
| DEC-013 | Creator attribution on records (no edit/delete) | Accepted | 2026-09-13 |
| DEC-014 | Staff management page (add/edit/disable) | Accepted | 2026-09-13 |
| DEC-015 | Per-store riders and vehicles management | Accepted | 2026-09-13 |
| DEC-016 | Required rider/vehicle on receiving | Accepted | 2026-09-13 |
| DEC-017 | Per rider/vehicle expense tracking with net | Accepted | 2026-09-13 |
| DEC-019 | Identity redesign: painted delivery-vehicle signage | Superseded by DEC-029 (palette only) | 2026-09-13 |
| DEC-020 | Report PDF export with jsPDF | Superseded by DEC-024 | 2026-09-14 |
| DEC-021 | Add-to-cart split of the sale entry flow | Accepted | 2026-09-14 |
| DEC-022 | Shopee-style catalog, automatic pricing, floating basket | Accepted | 2026-09-14 |
| DEC-023 | Sale checkout additions and manual quantity input | Accepted | 2026-09-14 |
| DEC-024 | Admin-only reports with Excel export | Accepted | 2026-09-14 |
| DEC-025 | Staff dashboard trim, history unread badge, admin customer add | Accepted | 2026-09-14 |
| DEC-026 | Report date range and History store filter | Accepted | 2026-09-14 |
| DEC-027 | Rider and vehicle full CRUD with reference guard | Accepted | 2026-09-14 |
| DEC-028 | Rename brand and project to ZAF ONE | Accepted | 2026-09-14 |
| DEC-029 | Adopt official logo and recolor theme to the logo palette | Accepted | 2026-09-14 |
| DEC-030 | Per-store logo and color theme following the store context | Accepted | 2026-09-15 |
| DEC-031 | Fixed sign-in theme and combined admin theme | Accepted | 2026-09-15 |
| DEC-032 | Manual stock edit and delete with sales-history guard | Accepted | 2026-09-20 |
| DEC-033 | Sign-in brand copy: Zeann & Amara Feeds Supply tagline | Accepted | 2026-09-20 |
| DEC-034 | Phase 3 gate deferral and assumption adoption for database work | Accepted | 2026-09-20 |
| DEC-035 | Supabase-direct integration: profiles-based authz and service swap | Accepted | 2026-09-20 |
| DEC-036 | Staff management RPC fixes and admin update semantics | Accepted | 2026-09-21 |
| DEC-037 | Catalog lists only sellable items; pending-seed parity | Accepted | 2026-09-21 |
| DEC-038 | SweetAlert2 feedback system + logout confirmation | Accepted | 2026-09-21 |
| DEC-039 | Hosted production wipe to owner-only clean slate | Accepted | 2026-09-21 |
| DEC-040 | Admin store switch relocated to the More page | Accepted | 2026-09-21 |
| DEC-041 | Admin default store context is All stores | Accepted | 2026-09-21 |
| DEC-042 | Production owner login uses an email handle | Accepted | 2026-09-21 |
| DEC-043 | Installable PWA with post-login install tutorial | Accepted | 2026-09-21 |
| DEC-044 | Admin paint follows the store context | Accepted | 2026-09-21 |
| DEC-045 | Charge-sale down payments ride the payment flow | Accepted | 2026-09-21 |
| DEC-046 | Dashboard, sales, and checkout UX refinements | Accepted | 2026-09-21 |
| DEC-047 | Security hardening from the loophole audit (migration 00007) | Accepted | 2026-09-21 |
| DEC-048 | Existing credit encoding, approved inventory lock, per-store admin selection (migration 00008) | Accepted | 2026-09-21 |
| DEC-049 | Credit details, price editing, sale deletion, customer edit/delete, My Account (migration 00009) | Accepted | 2026-09-21 |

### DEC-001 — Frontend tooling and verification execution

- **ID:** DEC-001
- **Title:** Frontend tooling and verification execution
- **Status:** Accepted
- **Date:** 2026-09-10
- **Context:** `ROADMAP.md` Phase 0 requires settling tooling execution (commands, CI intent, coverage stance). `docs/TECH-STACK.md` selected npm, Vite, TypeScript, Styled Components, and Vitest + React Testing Library, but left execution detail as Implementation Decision Required (`docs/TESTING.md` §11).
- **Decision:** Host the single application at the repository root and manage it with npm. Commands: `dev`, `build`, `preview`, `typecheck`, `lint`, `format`, `format:check`, `test`, `test:run`. Lint with ESLint flat config plus `typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`, reconciled with Prettier through `eslint-config-prettier`; format with Prettier (single quotes, no semicolons, trailing commas, 100 columns). Verify UI with Vitest + React Testing Library under jsdom using a shared provider-aware render helper. No CI pipeline and no coverage threshold in Phase 0.
- **Alternatives considered:** The current Vite template defaults to oxlint — rejected as a less established React/TypeScript rule ecosystem than ESLint for this codebase. No lint/format tooling — rejected because `ROADMAP.md` names lint hygiene in Phase 0. CI from day one — deferred; no demonstrated need at this scope and the budget favors core delivery. Coverage thresholds — rejected; `docs/TESTING.md` §10 governs by risk-based gates, not numeric coverage.
- **Rationale:** Reuses the selected stack without adding services or infrastructure; local scripts give immediate, reviewable hygiene while leaving CI and coverage to a deliberate later decision.
- **Consequences:** Contributors run the documented scripts. CI and any coverage policy remain open and must be decided and recorded before being relied upon. Pre-existing documentation keeps its committed Markdown style; Prettier ignores `*.md` except `docs/DESIGN-SYSTEM.md`, which was authored under the new tooling.
- **Related documents:** `docs/TECH-STACK.md` §§1–3, `docs/TESTING.md` §11, `ROADMAP.md` §§3, 8.
- **Supersedes / Superseded by:** none.
- **Open questions or follow-up:** CI adoption and the Playwright E2E trigger remain open; revisit at Phases 5–8.

### DEC-002 — SPA routing with React Router

- **ID:** DEC-002
- **Title:** SPA routing with React Router
- **Status:** Accepted
- **Date:** 2026-09-10
- **Context:** `ROADMAP.md` Phase 0 scope includes routing and application structure, but `docs/TECH-STACK.md` listed no router, so selecting one adds a technology and requires an owning-document update plus this record.
- **Decision:** Adopt `react-router-dom` v7 as the client-side router. Use `BrowserRouter` with declarative nested `Routes`; the staff and admin shells are layout routes, and area pages are route components.
- **Alternatives considered:** TanStack Router — type-safe but more capability than the core scope needs; a hand-rolled router — unnecessary maintenance; no router — fails the Phase 0 routing scope.
- **Rationale:** The smallest established solution consistent with a client-rendered SPA and the confirmed information architecture (`docs/UI-UX.md` §5), with no server-side routing.
- **Consequences:** Static hosting must rewrite unknown paths to `index.html` (SPA fallback) at deployment; to be verified in Phase 8. Adds one runtime dependency.
- **Related documents:** `docs/TECH-STACK.md` §§2–3, `docs/ARCHITECTURE.md` §7, `docs/DEPLOYMENT.md`.
- **Supersedes / Superseded by:** none.
- **Open questions or follow-up:** Confirm the Vercel SPA-fallback configuration during deployment.

### DEC-003 — Visual language baseline and design tokens

- **ID:** DEC-003
- **Title:** Visual language baseline and design tokens
- **Status:** Accepted
- **Date:** 2026-09-10
- **Context:** `docs/UI-UX.md` §19 defers all visual values (color, typography, spacing, breakpoints) to design documentation "if and when such documentation is introduced." None existed, yet Phase 0 shells must render real values without inventing them ad hoc.
- **Decision:** Introduce `docs/DESIGN-SYSTEM.md` as the authoritative visual-language source and implement matching tokens in `src/theme` (color, typography, spacing, radii, shadows, breakpoints, motion, focus). Components consume values only through the styled-components theme. Use a system font stack; pair store identity colors with the store name in text; support `prefers-reduced-motion`.
- **Alternatives considered:** In-code tokens only — rejected; creates undocumented visual conventions. A third-party component library and theme — rejected; adds a dependency and a visual opinion beyond the core scope.
- **Rationale:** Keeps visual values documented, accessible by default, and consistent with `docs/UI-UX.md` behavior and the Styled Components choice in `docs/TECH-STACK.md`.
- **Consequences:** `docs/DESIGN-SYSTEM.md` and `src/theme/tokens.ts` must stay in sync; new visual values require a documented need and an update to that file. Adds `docs/DESIGN-SYSTEM.md` to the source-of-truth set.
- **Related documents:** `docs/DESIGN-SYSTEM.md`, `docs/UI-UX.md` §19, `docs/TECH-STACK.md` §3 (Styling), `docs/REQUIREMENTS.md` REQ-ACC-001–004.
- **Supersedes / Superseded by:** none.
- **Open questions or follow-up:** Brand artwork, logo, and any marketing palette remain Confirmation Required.

### DEC-004 — Mock service seam, in-memory datastore, and money representation

- **ID:** DEC-004
- **Title:** Mock service seam, in-memory datastore, and money representation
- **Status:** Accepted
- **Date:** 2026-09-10
- **Context:** `ROADMAP.md` Phase 1 requires a centralized mock data layer behind a single service/data-access seam so the frontend can behave realistically and later swap to Supabase without UI rewrites. It also requires the smallest shapes and that convenience attributes be flagged. Representation choices here affect every future service, UI workflow, and the Phase 4 schema reference.
- **Decision:** Provide framework-agnostic async services under `src/services/` (one per confirmed domain) over a single in-memory mock datastore (`src/services/mocks/`), with shared types in `src/domain/`. Confirmed invariants are enforced in memory: sale save deducts the selling store's stock, charge sales create a shared obligation at the origin store, payments update balance/status with payment-store attribution, receiving increases one store's stock, and products stay `pending` until approved. Monetary amounts are integer minor units (centavos) via a `Money` number, formatted only at the UI edge. Store context is passed explicitly to services; no artificial latency; no new runtime dependencies; convenience attributes are flagged with `/** assumed: ... */` and terms remain opaque.
- **Alternatives considered:** Per-feature services co-located with future UI — rejected; weakens the centralized mock seam and the bounded mock→real swap. Decimal peso numbers — rejected; risks floating-point drift in balances and totals. A React data layer (e.g. React Query) — rejected; global client-state frameworks are prohibited by `docs/ARCHITECTURE.md` §3.7 and were not selected. Simulated network latency — rejected; `docs/UI-UX.md` §12 forbids artificial loading states.
- **Rationale:** Gives Phase 2 a working, testable domain to build against and Phase 4 an executable reference, while keeping the Phase 6 replacement bounded to service implementations behind stable signatures.
- **Consequences:** Phase 6 replaces service implementations without UI contract changes. UI and features must import services, never `src/services/mocks/*` (enforced by an ESLint `no-restricted-imports` guardrail). Integer money requires consistent formatting at the UI edge. In-memory state resets on reload, which is acceptable for a mock.
- **Related documents:** `docs/ARCHITECTURE.md` §§5–6, `docs/DATA-MODEL.md` §§4–5, `docs/API.md` §5, `docs/UI-UX.md` §12, `ROADMAP.md` §3 (Phase 1), `docs/TECH-STACK.md`.
- **Supersedes / Superseded by:** none.
- **Open questions or follow-up:** Exact fields, payment-term options/calculation rules, validation rules, permissions, and report formats remain Confirmation Required; the `resolveDueDate` helper is the single placeholder for term math. Role-based authorization is not enforced by the mock (frontend checks are never a security boundary per `docs/SECURITY.md`).

### DEC-005 — Mock session, role gating, and shared async data hooks

- **ID:** DEC-005
- **Title:** Mock session, role gating, and shared async data hooks
- **Status:** Accepted
- **Date:** 2026-09-10
- **Context:** Phase 2 scope includes the "store-context/auth experience," but authentication detail is Confirmation Required and no real auth exists (`docs/SECURITY.md` §2). The Phase 1 services are async, so every workflow needs consistent loading, error, empty, and submission behavior (`docs/UI-UX.md` §12), and the temporary Phase 0 store switcher must be replaced.
- **Decision:** Add a mock session (`SessionProvider`/`useSession`) with a seeded-account sign-in picker over `userService` and route guards (`RequireAuth`/`RequireRole`). The store context derives from the signed-in user: staff are locked to their assigned store; admins are business-wide and can switch the store context for store-specific views. Add two shared async hooks, `useAsyncData` (loading/error/reload) and `useMutation` (pending/double-submit guard/error), as the standard data-fetching convention. This is UI gating only and is never a security boundary.
- **Alternatives considered:** Defer any sign-in UI until real Supabase Auth — rejected; Phase 2 names the auth/store-context experience and the mock seam makes it cheap to exercise before Phase 3 validation. Keep the unguarded staff/admin shell toggle — rejected; it would not exercise role-based behavior. Per-page ad-hoc state instead of shared hooks — rejected; would duplicate loading/error/submission handling across every workflow.
- **Rationale:** Exercises role and store behavior early so Phase 3 walkthroughs and Phase 4 authorization design build on observed behavior, while keeping the mock→real swap bounded to replacing the session provider and service implementations.
- **Consequences:** The session is in-memory and resets on reload. Real authentication and authorization replace the mock in Phases 4–5. `useAsyncData`/`useMutation` are the conventions feature pages should follow. Follow-up: the header store `<select>` was removed; admin store switching moved to a shared `StoreControl` (segmented Amara/Zeann) on store-scoped pages (sales, inventory, receiving, credit payment). Admin switching capability unchanged; the header shows the current store badge only. Follow-up: the mock session persists in localStorage so a reload keeps the user signed in; explicit `initialUser={null}` starts signed out (used by tests).
- **Related documents:** `ROADMAP.md` §3 (Phase 2), `docs/UI-UX.md` §§4, 12, `docs/SECURITY.md` §§2–3, `docs/ARCHITECTURE.md` §9.
- **Supersedes / Superseded by:** none.
- **Open questions or follow-up:** Authentication flow detail (session handling, provisioning, recovery) remains Confirmation Required.

### DEC-006 — Report summaries with browser print; Excel export deferred

- **ID:** DEC-006
- **Title:** Report summaries with browser print; Excel export deferred
- **Status:** Accepted
- **Date:** 2026-09-10
- **Context:** REQ-REP-001/002 require Excel export and printing of the agreed summaries, but exact report columns and formats are Confirmation Required (REQ-REP-003) and the export library is undecided (`docs/TECH-STACK.md` §7). The `ROADMAP.md` confirmation matrix defers export UI and formats while allowing summary views.
- **Decision:** Phase 2 ships the agreed summary views with a date selector and a print-friendly layout (browser `window.print()` plus print CSS hiding app chrome). Excel export UI and the export library are deferred until report formats are confirmed.
- **Alternatives considered:** Add an Excel export library now — rejected; report formats are unconfirmed and a dependency would be premature. Defer printing as well — rejected; printing is unblocked by formats and is cheap to provide now.
- **Rationale:** Satisfies the confirmed printing requirement and gives Phase 3 a concrete summary surface to review, without inventing report formats or adding an unconfirmed dependency.
- **Consequences:** Export is added later behind the same summary components; the print CSS lives in `src/theme/GlobalStyle.ts`; the export library selection is re-opened when formats are confirmed.
- **Related documents:** `docs/REQUIREMENTS.md` REQ-REP-001–003, `docs/TECH-STACK.md` §7, `ROADMAP.md` §6.
- **Supersedes / Superseded by:** none.
- **Open questions or follow-up:** Exact report columns, formats, and the export library remain Confirmation Required.

### DEC-007 — Sign-in entry brand and two-store treatment

- **ID:** DEC-007
- **Title:** Sign-in entry brand and two-store treatment
- **Status:** Accepted
- **Date:** 2026-09-10
- **Context:** The mock sign-in page was a generic centered card with no product brand or store identity, and its copy exposed implementation detail ("seeded account"). The on-screen product brand "Amara Feeds" was confirmed as the entry-screen brand; the two operating stores remain Amara and Zeann (`docs/PROJECT.md` §10). Logo artwork remains Confirmation Required.
- **Decision:** The sign-in header uses the text wordmark "Amara Feeds" with the operational line "Store management for Amara and Zeann." plus a decorative two-store split motif built only from the existing store solid tokens, always paired with store names in text. Account rows show a store-tinted initials avatar, the display name (parenthetical role hints stay in data, never on screen, including the app header), and a derived badge: `StoreBadge` with "Staff" for store-assigned staff, an "Admin" badge with "Both stores" for admins. The brand panel is full-bleed on mobile and a two-panel card on desktop, using existing surface/neutral tokens only. No mock/demo notice is shown on screen. Seed account names are kept unchanged. No new design tokens, no new dependencies, no invented logo.
- **Alternatives considered:** Reuse the `AZ` favicon monogram as the in-app mark — rejected; the confirmed "Amara Feeds" text direction was chosen instead. A bolder redesign introducing new tokens — deferred; the token-compliant treatment satisfies the need without a design-system change.
- **Rationale:** Makes the entry screen recognizably the product's front door and makes store context obvious at account choice (UI-UX §2.10), while staying inside the confirmed visual language and the sign-in-only scope.
- **Consequences:** The `TopBar` wordmark ("Amara + Zeann") and the document title are intentionally unchanged; aligning them to "Amara Feeds" app-wide is a follow-up, not part of this change.
- **Related documents:** `docs/PROJECT.md` §10, `docs/DESIGN-SYSTEM.md` §§3.4, 8, `docs/UI-UX.md` §§2, 14.
- **Supersedes / Superseded by:** Superseded by DEC-028.
- **Open questions or follow-up:** App-wide brand alignment (TopBar, document title) remains open.

### DEC-008 — App-like shell, shared UI primitives, and responsive record lists

- **ID:** DEC-008
- **Title:** App-like shell, shared UI primitives, and responsive record lists
- **Status:** Accepted
- **Date:** 2026-09-10
- **Context:** Every feature page rolled its own cards, section titles, and loading/error/empty branches; lists were desktop tables with horizontal scroll on phones; the mobile nav was a scrollable text bar with 8–9 items and no safe-area handling; user-visible copy leaked internal status ("under confirmation", "not part of this version", raw ISO dates, `Unknown` fallbacks).
- **Decision:** Mobile-first app shell — fixed 5-tab bar (4 primary destinations + a More sheet reusing `Dialog`) with inline-SVG icon + label pairs, side rail on desktop, safe-area insets, and tokenized chrome dimensions (`layout.headerHeight/tabBarHeight/contentMaxWidth`, `shadow.lg`, `font.size.display`, tabular numerals). Shared primitives behind small interfaces: `Card`, `StatCard`, `Section`, `AsyncBoundary`, `RecordList` (card list on mobile, `DataTable` on tablet+), `BackLink`, `useMediaQuery`, `NavIcon`. All pages consume them; no page-local card/section/branch copies remain. Production copy throughout: no confirmation/phase language, formatted dates, "No customer" / "Not available" / "Not listed" fallbacks. Brand aligned app-wide to "Amara Feeds" (TopBar, document title, sign-in), closing the DEC-007 follow-up.
- **Alternatives considered:** Per-page styling fixes — rejected; preserves the duplication that caused the generic look. A third-party component or icon library — rejected; unneeded dependency for the core scope. Dark mode and webfonts — deferred; system stack and light theme stay.
- **Rationale:** One shared visual system gives the premium app feel and makes future changes local: fix once in the primitive, fixed on every page. The More sheet keeps all confirmed destinations reachable without overloading the tab bar, consistent with `docs/UI-UX.md` §6.
- **Consequences:** `docs/DESIGN-SYSTEM.md` §§4–6 record the new tokens and tab-bar rules; `src/theme/tokens.ts` implements them. Page tests asserting old copy or table-only structure were updated with the reskin.
- **Related documents:** `docs/DESIGN-SYSTEM.md` §§4–6, `docs/UI-UX.md` §§6, 9–10, 12, `docs/ARCHITECTURE.md` §6.
- **Supersedes / Superseded by:** Superseded by DEC-028.
- **Open questions or follow-up:** None; dark mode and webfonts stay deferred.

### DEC-009 — Operations-board dashboard and app-wide visual rhythm

- **ID:** DEC-009
- **Title:** Operations-board dashboard and app-wide visual rhythm
- **Status:** Accepted
- **Date:** 2026-09-10
- **Context:** After DEC-008 every surface used the same card treatment, so the admin dashboard read as a flat wall of identical cards with key totals buried below a table; filters were full labeled fields; list rows were not tappable; loading was a centered spinner. The two-store identity — the product's one distinctive asset — appeared only in badges.
- **Decision:** Dashboard-first visual rhythm with one point of view: a "Today" hero (overall daily sales + per-store split tinted with the existing store pairs), secondary stat cards, then list sections. Shared upgrades behind small interfaces: `StatCard` gains `tone`/`icon`/`emphasis`; new `SegmentedControl`, `FilterBar`, `ListRow`, `Skeleton` family; compact `PageHeader`; `AsyncBoundary` accepts a skeleton node. Dashboard and Reports share the new `useBusinessSummaries` data seam but compose different layouts. New tokens are limited to `radius.xl`, `font.size.hero`, and `color.surface.subtle`; system font stack, light theme, and existing palette stay.
- **Alternatives considered:** A third-party chart/component library — rejected; unneeded for agreed summaries. Dark mode and webfonts — deferred again. Per-page styling — rejected; preserves the duplication DEC-008 removed.
- **Rationale:** Emphasis hierarchy (hero → stats → lists) makes the dashboard glanceable on a phone while every page reuses the same primitives, so the premium feel is systemic, not per-page decoration.
- **Consequences:** `docs/DESIGN-SYSTEM.md` §§3–5 record the new tokens; page tests asserting old structure were updated with the change.
- **Related documents:** `docs/DESIGN-SYSTEM.md` §§3–5, `docs/UI-UX.md` §§2, 9–10, 12.
- **Supersedes / Superseded by:** none.
- **Open questions or follow-up:** None.

### DEC-010 — Tight responsive scale and flat grouped dashboard

- **ID:** DEC-010
- **Title:** Tight responsive scale and flat grouped dashboard
- **Status:** Accepted
- **Date:** 2026-09-10
- **Context:** The DEC-009 system read airy and generic on phones: headings and stat values oversized for 320px widths, the fixed header and segmented filter could overflow horizontally, stat grids stayed two-column at every width, and dashboard sections nested cards inside cards.
- **Decision:** Tighten the scale without breaking accessibility: body stays 16px; headings and meta shrink (`hero` 30, `display` 26, `2xl` 22, `xl` 19, `lg` 17, `sm` 13, `xs` 11); line-heights go `tight` 1.15 / `base` 1.4; new `tracking` tokens; new `phoneWide` 430px breakpoint; header truncates and hides the section tag on phones; segmented filters scroll horizontally; stat grids collapse via `auto-fit minmax(9rem, 1fr)`; dashboard and reports use flat grouped lists (`Section`/`RecordList` `flush`/`grouped` variants) with a brand-tinted hero. System font, light theme, palette unchanged.
- **Alternatives considered:** Ultra-compact body text — rejected; breaks the 16px readability floor. A webfont — deferred again. Per-page fixes — rejected; systemic tokens fix every page at once.
- **Rationale:** Density comes from the scale, not from ad-hoc overrides, so every current and future page inherits the tight rhythm while 44px targets and contrast stay intact.
- **Consequences:** `docs/DESIGN-SYSTEM.md` §§2, 4, 6 record the scale; page tests asserting old structure were updated.
- **Related documents:** `docs/DESIGN-SYSTEM.md` §§2, 4–6, `docs/UI-UX.md` §§9–10.
- **Supersedes / Superseded by:** none.
- **Open questions or follow-up:** None.

### DEC-011 — More page, centered tabs, dashboard value hierarchy

- **ID:** DEC-011
- **Title:** More page, centered tabs, dashboard value hierarchy
- **Status:** Accepted
- **Date:** 2026-09-10
- **Context:** The mobile tab bar stretched edge-to-edge with no centering; the More overflow opened a dialog instead of a real destination; the admin dashboard hero (30px) and store cards (26px) read at near-equal weight, and saturated store borders competed with the brand hero.
- **Decision:** Tab items share equal width capped at 6.5rem and sit centered. Overflow destinations move to a full More page (`/more`, `/admin/more`) built from role-filtered nav items as an app-like grouped link list with short descriptions; the MoreSheet dialog is deleted. `StatCard` swaps `emphasis` for an explicit `valueScale` (`hero` 30 / `large` 26 / `medium` 22); only the brand tone keeps the accent border, store identity lives in tinted chips and names; dashboard groups content into "Daily sales by store" and "Credit & payments" flush sections under the hero.
- **Alternatives considered:** Keep the More dialog — rejected; a real destination has natural focus order and no trap. Fixed-width tabs — rejected; capped flexible tabs adapt to all phone widths.
- **Rationale:** Centered tabs read intentional; a More page keeps every destination a first-class, keyboard-friendly route; the 30/22/19 value steps plus section grouping make the dashboard glanceable.
- **Consequences:** `docs/DESIGN-SYSTEM.md` §6 records the tab-bar and More-page rules; `MoreSheet.tsx` removed; tests added for the More page.
- **Related documents:** `docs/DESIGN-SYSTEM.md` §6, `docs/UI-UX.md` §§5–6, 9–10.
- **Supersedes / Superseded by:** none.
- **Open questions or follow-up:** None.

### DEC-012 — Production login form with localStorage credentials

- **ID:** DEC-012
- **Title:** Production login form with localStorage credentials
- **Status:** Accepted
- **Date:** 2026-09-13
- **Context:** The mock sign-in was an account picker listing seeded users, which is not production-like. The user asked for a real login form (username + password) backed for now by localStorage, with real Supabase Auth still replacing it in a later phase (`docs/SECURITY.md` §2, DEC-005 follow-up).
- **Decision:** Replace the account picker with a login form (username + password fields with autocomplete, single Sign-in submit, plain-language error on invalid or disabled accounts, `useMutation` double-submit guard). Credentials are stored only in the in-memory mock database with seeded demo accounts (`alice`/`alice123`, `ben`/`ben123`, `owner`/`admin123`); `signIn` validates against the mock. The persisted session strips the password before writing to localStorage.
- **Alternatives considered:** Keeping the picker — rejected; not production-like. Persisting the password with the session — rejected; mock-hygiene rule keeps credentials out of storage.
- **Rationale:** Gives a real sign-in experience now without building auth, consistent with the mock-seam approach; the Supabase Auth swap in Phase 6 stays bounded to replacing `signIn` and the session provider.
- **Consequences:** Demo credentials are mock-only and documented off-screen (README); the session stored in localStorage never includes the password; real authentication replaces this in Phases 4–6.
- **Related documents:** `docs/SECURITY.md` §§2, 6, `docs/UI-UX.md` §§2, 14, `docs/TECH-STACK.md` §3, `ROADMAP.md` §3 (Phases 2, 6).
- **Supersedes / Superseded by:** none.
- **Open questions or follow-up:** Authentication flow detail (session handling, provisioning, recovery) remains Confirmation Required.

### DEC-013 — Creator attribution on records (no edit/delete)

- **ID:** DEC-013
- **Title:** Creator attribution on records (no edit/delete)
- **Status:** Accepted
- **Date:** 2026-09-13
- **Context:** The user requires that each staff member has their own records and cannot modify another staff member's input. Today no edit/delete exists anywhere (edit/cancel/reversal are Confirmation Required), so the confirmed behavior is attribution now, with enforcement deferred.
- **Decision:** Add `recordedByUserId` to sales, payments, and receiving records (and `createdByUserId` to customers, consistent with products), set from the signed-in session on every create, validated against a known active account by the services. Lists and details display "Recorded by"/"Added by". No edit/delete is added; any future edit/delete must be restricted to the creator and is Confirmation Required.
- **Alternatives considered:** Adding edit/delete for own records now — rejected; touches sale/stock/credit invariants that remain unconfirmed. Hiding other staff's records entirely — rejected; staff still see their store's overall sales for dashboards and reporting.
- **Rationale:** Establishes per-staff ownership and traceability immediately at the mock seam, cheaply, without inventing unconfirmed editing behavior.
- **Consequences:** Create services now require `recordedByUserId`; seeded records are backfilled; the mock enforces the recorder exists and is active (frontend checks are never a security boundary).
- **Related documents:** `docs/DATA-MODEL.md` §8, `docs/API.md` §5, `ROADMAP.md` §6, `docs/REQUIREMENTS.md` §11.
- **Supersedes / Superseded by:** none.
- **Open questions or follow-up:** Edit/cancel/reversal behavior and its creator checks remain Confirmation Required.

### DEC-014 — Staff management page (add/edit/disable)

- **ID:** DEC-014
- **Title:** Staff management page (add/edit/disable)
- **Status:** Accepted
- **Date:** 2026-09-13
- **Context:** `docs/UI-UX.md` §7.8 and REQ-USER-001–003 require store-assigned staff accounts, but `/admin/users` was a placeholder. The user asked for a super-admin page to add staff and to manage store assignment and account status.
- **Decision:** Build `StaffListPage` at `/admin/users` (admin only): list staff with name, username, assigned-store badge, and Active/Disabled status; `AddStaffDialog` (name, username, password, assigned store); `EditStaffDialog` (rename, change username, reassign store, reset password); disable/enable toggle with confirmation. Staff only — no admin-account creation.
- **Alternatives considered:** Creating admin accounts too — rejected by the user's choice; the seeded admin stays the single super admin. Edit/disable deferred — rejected; the user explicitly chose add + edit/disable.
- **Rationale:** Gives the admin full control of store assignment and account lifecycle in the mock, matching the confirmed store-assignment rule.
- **Consequences:** `createUser` requires a store for staff and unique usernames; disabled accounts are rejected at sign-in; the admin nav "Users" entry now points to a real page.
- **Related documents:** `docs/REQUIREMENTS.md` §11, `docs/UI-UX.md` §7.8, `docs/DATA-MODEL.md` §4.11.
- **Supersedes / Superseded by:** none.
- **Open questions or follow-up:** Detailed permission differences remain Confirmation Required (REQ-USER-004).

### DEC-015 — Per-store riders and vehicles management

- **ID:** DEC-015
- **Title:** Per-store riders and vehicles management
- **Status:** Accepted
- **Date:** 2026-09-13
- **Context:** Delivery details today are free-text rider/vehicle strings on the sale form. The user asked for pages to see and manage the delivery people and the vehicle types used, managed by both staff and admin.
- **Decision:** Add per-store `Rider` and `Vehicle` entities managed from new `RidersPage`/`VehiclesPage` (staff → their store only; admin → both stores via the store control). Pages list, add, and activate/deactivate entries. The sale form's rider and vehicle fields become dropdowns over the active riders/vehicles of the current store; inactive entries are hidden from the sale form.
- **Alternatives considered:** Shared (business-wide) rider/vehicle lists — rejected; delivery is per-store operational context. Free-text kept with reference lists only — rejected; the user chose both staff and admin manage, which implies per-store selection on the sale form.
- **Rationale:** Makes delivery attribution consistent and traceable per store while keeping the change bounded to the mock seam and the existing store-context pattern.
- **Consequences:** New domain concepts, services, and nav entries ("Riders", "Vehicles") under the More destination for both roles; `DeliveryInfo` references `riderId`/`vehicleId`; exact rider/vehicle fields remain Confirmation Required.
- **Related documents:** `docs/DATA-MODEL.md` §4, `docs/UI-UX.md` §7.1, `docs/REQUIREMENTS.md` §5 (REQ-SALE-004), `docs/API.md` §5.
- **Supersedes / Superseded by:** none.
- **Open questions or follow-up:** None beyond the Confirmation Required rider/vehicle field detail.

### DEC-016 — Required rider/vehicle on receiving

- **ID:** DEC-016
- **Title:** Required rider/vehicle on receiving
- **Status:** Accepted
- **Date:** 2026-09-13
- **Context:** The client confirmed that the rider who delivers stock to the store is distinct from the rider who delivers sales to customers. Receiving records need to trace which rider and vehicle brought the stock, for expense attribution.
- **Decision:** Receiving records require both `riderId` and `vehicleId` (required fields, not optional). The service validates that the selected rider and vehicle belong to the same store and are active; seed receiving records are backfilled with matching rider/vehicle references.
- **Alternatives considered:** Optional rider/vehicle on receiving — rejected; the client emphasized traceability for every stock delivery. Separate rider lists for receiving vs sales delivery — rejected; both use the same per-store rider/vehicle managed lists.
- **Rationale:** Ensures every stock receipt is traceable to a specific rider and vehicle, enabling accurate per-rider/vehicle expense tracking and net computation.
- **Consequences:** `ReceivingRecord` and `NewReceivingInput` gain required `riderId`/`vehicleId`; receiving service validates existence, store match, and active state; seed data backfilled; receiving form gains two required Selects; history shows rider/vehicle columns.
- **Related documents:** `docs/DATA-MODEL.md` §4.9, §4.13, §4.14, `docs/UI-UX.md` §7.5, `docs/REQUIREMENTS.md` REQ-RCV-002, `docs/API.md`.
- **Supersedes / Superseded by:** none.
- **Open questions or follow-up:** None.

### DEC-017 — Per rider/vehicle expense tracking with net

- **ID:** DEC-017
- **Title:** Per rider/vehicle expense tracking with net
- **Status:** Accepted
- **Date:** 2026-09-13
- **Context:** The client explained that riders and vehicles incur expenses (fuel, repairs) which are deducted from their sales. This requires recording expenses and computing a per-rider/vehicle net figure.
- **Decision:** Add a store-scoped `Expense` entity (fuel/repair type, amount, optional note, rider and/or vehicle reference) with a new `ExpensesPage` (staff own store, admin both stores). A `getDeliveryNetSummary` service computes per-rider and per-vehicle net = delivered-sales value (sum of that store's sales whose delivery references the rider/vehicle) minus their recorded expenses. The net summary and expense history appear on the Expenses page.
- **Alternatives considered:** Store-level net (expenses reduce total store sales) — rejected; client said "their sales" per rider/vehicle. Per-delivery expenses (attached to each sale) — rejected; expenses are rider/vehicle-level, not per-delivery.
- **Rationale:** Matches the client's per-rider/vehicle expense model; keeps the change bounded to a new page and service function without touching existing dashboards or reports.
- **Consequences:** New `Expense` domain concept and `expenseService`; `ExpenseType` enum (fuel, repair) is Assumed pending exact values; sales-delivery rider/vehicle stays optional (untagged sales excluded from net); Expenses page added to nav for both roles; new routes `/expenses` and `/admin/expenses`.
- **Related documents:** `docs/DATA-MODEL.md` §4.15, `docs/UI-UX.md` §7.11, `docs/REQUIREMENTS.md` REQ-EXP-001–003, `docs/API.md`.
- **Supersedes / Superseded by:** none.
- **Open questions or follow-up:** Expense type enum exact values remain Confirmation Required; net appears on Expenses page only (dashboard totals unchanged).

### DEC-018 — Visual refinement: evergreen brand, warm neutrals, Plus Jakarta Sans

- **ID:** DEC-018
- **Title:** Visual refinement: evergreen brand, warm neutrals, Plus Jakarta Sans
- **Status:** Superseded
- **Date:** 2026-09-13
- **Context:** The UI was the generic "SaaS-card kit" (cool Tailwind-gray neutrals, flat blue primary, system stack typography). It lacked a distinctive visual identity tied to the feeds/agriculture business. The project needed a visual refinement pass to ground the design in its subject without changing functionality.
- **Decision:** Replace the primary brand color from blue (#2563eb) to evergreen green (brand.600 #157347, brand.700 #0e5c38) with a subtle gradient for primary actions. Replace the cool gray neutral ramp with warm sand neutrals (page #faf9f6, subtle #f4f2ec, border #e9e5db, etc.). Adopt Plus Jakarta Sans as the primary typeface (loaded via Google Fonts, weights 400–700) for a distinctive, warm, modern feel. Add a layered shadow system (sm, md, lg, raised) for depth. Restyle all ~30 UI primitives and 3 bespoke pages (SignInPage, AdminDashboardPage, StaffDashboardPage) to reflect the new palette. Store identity colors (Amara violet, Zeann amber) unchanged.
- **Alternatives considered:** Self-hosting the webfont woff2 files (rejected for now due to implementation complexity; Google Fonts CDN is acceptable for an internal tool on Vercel). Keeping blue primary (rejected; doesn't reflect the business). Switching to a serif/display font for headings (rejected; the single body+heading family keeps things cohesive on small screens).
- **Rationale:** The evergreen green directly reflects the feeds/agriculture identity. Warm sand neutrals create a warmer, more inviting feel than cool gray. Plus Jakarta Sans is distinctive, friendly, and highly legible on mobile. The layered shadow system improves depth perception over flat borders.
- **Consequences:** `src/theme/tokens.ts` updated with new color, font, shadow, and radius tokens. All UI primitives restyled (CSS-only changes, no prop/API changes). `index.html` adds Google Fonts preconnect and stylesheet links. `docs/DESIGN-SYSTEM.md` §2–§8 updated to match new tokens. Tests unaffected (CSS-only changes, no structural HTML/text changes).
- **Related documents:** `docs/DESIGN-SYSTEM.md` (authoritative visual language, kept in sync), `src/theme/tokens.ts` (implementation), `index.html` (font loading).
- **Supersedes / Superseded by:** superseded by DEC-019 (identity redesign: painted delivery-vehicle signage).
- **Open questions or follow-up:** None. Self-hosting font files remains an option if Google Fonts CDN is undesirable later.

### DEC-019 — Identity redesign: painted delivery-vehicle signage

- **ID:** DEC-019
- **Title:** Identity redesign: painted delivery-vehicle signage
- **Status:** Accepted
- **Date:** 2026-09-13
- **Context:** The owner reopened the visual identity for redesign (recorded in PRODUCT.md, 2026-09-13); the incumbent evergreen-green/warm-sand/Plus Jakarta Sans identity was no longer binding. The dashboards (and the app they set the tone for) read as the generic neutral-card SaaS kit: same-size white cards, a blue/green flat primary, and no connection to the business's physical world. The target surface brief (`.impeccable/surfaces/dashboard.md`) pinned the replacement world and its seed key.
- **Decision:** Replace the visual world with **painted delivery-vehicle signage** ("The Depot Route Board"), seeded `f161c156` / assigned `f35ee7f3`: saturated flat enamel plates with hard edges and no gradients on a warm workshop-wall ground; route-board capitals (Barlow Condensed) for plates and headers; Barlow for body; tabular numerals for every figure; a persistent now-mark on today's date; every zone labeled by its literal name; named balance states (healthy / attention / critical) for credit and stock. Implemented first on the staff and admin dashboards (route board header, enamel hero plate, hollow stencil plates, admin depot board with two store columns), with the tokens (deep depot-enamel brand, Amara violet / Zeann rust store enamels, warm wall ground, small radii, `paint` shadow) landing in `src/theme/tokens.ts` so the rest of the app follows the same world.
- **Alternatives considered:** Keeping and polishing the incumbent evergreen identity — rejected; the identity was explicitly reopened and the incumbent read as category-default. The six challenger forms dealt by the concept roll (seven-segment instrument family, arcade phosphor, labanotation, console void, iridescent cloud, tensegrity column) — each fused and weighed against the painted-vehicle world on audience identification and product clarity; all declined (a seven-segment mask cannot carry forms/credit history; the others do not belong to a store worker's world), with two disciplines raised into the chosen world: leader-line captions on plates (tensegrity donation) and "absence is drawn" — empty data stays visible as hollow stencil plates (seven-segment donation).
- **Rationale:** The painted delivery fleet is the audience's own world — store staff read route boards, livery, and painted plate work every day, so a store's day reads the way a route board does: one big figure, two store columns, a persistent now. Store identity becomes unmistakable (each store is an enamel color), and the world is honest to the feeds/agriculture business (deep depot-enamel green-black) without the category's neutral-card grid.
- **Consequences:** `src/theme/tokens.ts`, `index.html` (Barlow + Barlow Condensed fonts), `src/components/ui/StatCard.tsx` (enamel plate / stencil plate / paper tag), the two dashboard pages and their new `RouteBoard`/`BalanceState` primitives updated; `DESIGN.md` and `.impeccable/design.json` written from the built world; `docs/DESIGN-SYSTEM.md` rewritten to match. DEC-018 is superseded. Rest of app surfaces inherit the world through the shared tokens/primitives; a full per-surface pass (sign-in, lists, forms, nav chrome) is follow-up, not part of this record. Balance-state thresholds for stock (0 empty / 1–2 low / ≥3 stocked) and credit (0 healthy / >0 attention) are assumed UI choices, not confirmed business rules.
- **Related documents:** `DESIGN.md`, `.impeccable/design.json`, `docs/DESIGN-SYSTEM.md`, `.impeccable/surfaces/dashboard.md`, `src/theme/tokens.ts`, `src/components/ui/StatCard.tsx`, `src/features/dashboard/`.
- **Supersedes:** DEC-018 (visual refinement: evergreen brand, warm neutrals, Plus Jakarta Sans).
- **Superseded by:** DEC-029 (color palette only — the painted-signage motif, typography, and structure remain).
- **Open questions or follow-up:** Brand artwork and a logo remain Confirmation Required; stock balance-state thresholds remain assumed; app-wide surface rollout of the new primitives is follow-up.

### DEC-020 — Report PDF export with jsPDF

- **ID:** DEC-020
- **Title:** Report PDF export with jsPDF
- **Status:** Accepted
- **Date:** 2026-09-14
- **Context:** The Reports page shipped a "Print" button using `window.print()` (DEC-006) because report formats were unconfirmed and no export library was selected. The user asked to replace Print with an **Export PDF** button that downloads a real PDF, which requires selecting a PDF library (a technology addition). The agreed report summaries (REQ-REP-001) and their columns are already implemented in the summaries seam (`useBusinessSummaries`).
- **Decision:** Add `jspdf` and `jspdf-autotable` as runtime dependencies and build the PDF **data-driven** from the same summaries the page shows (`src/lib/exportReportPdf.ts`): a pure `buildReportPdf` builder (A4, brand/document header, per-store daily sales table, summary figures, current stock, received stock) plus an `exportReportPdf` that downloads `amara-feeds-report-<date>-<scope>.pdf`. The Reports page lifts `useBusinessSummaries` so the button has the data; staff reports stay scoped to their store.
- **Alternatives considered:** `html2canvas` + `jsPDF` DOM capture — rejected; rasterizes text (blurry, large files) and captures viewport-dependent layout, so `RecordList`'s mobile cards vs. desktop tables would make the PDF inconsistent. Browser print renamed to "Export PDF" — rejected by the user, who wanted a direct `.pdf` download. `pdfmake` — rejected; heavier setup (embedded fonts) and more than needed for tabular summaries.
- **Rationale:** A data-driven vector PDF is deterministic and identical on mobile and desktop, keeps text crisp, reuses the existing summary data and `formatPeso`/`formatDate` helpers, and is unit-testable without a DOM canvas.
- **Consequences:** Two runtime dependencies added (`jspdf`, `jspdf-autotable`); the Reports page no longer uses `window.print()` (the global `@media print` rules remain but are now unused by this page); `print` icon replaced by a `download` icon; summary layout for staff drops the redundant store column on stock/received tables; unit tests cover the builder and filename. Report columns/formats remain Confirmation Required; Excel export stays deferred per DEC-006.
- **Related documents:** `docs/TECH-STACK.md` §7, `docs/REQUIREMENTS.md` REQ-REP-001, `docs/DECISIONS.md` DEC-006, `src/features/reports/`, `src/lib/exportReportPdf.ts`.
- **Supersedes / Superseded by:** none.
- **Open questions or follow-up:** Exact report columns and formats remain Confirmation Required; the export library choice is revisited if formats change materially.

### DEC-021 — Add-to-cart split of the sale entry flow

- **ID:** DEC-021
- **Title:** Add-to-cart split of the sale entry flow
- **Status:** Accepted
- **Date:** 2026-09-14
- **Context:** The sale entry form (`/sales/new`) collected multiple item cards plus customer, payment, delivery, and review on one page. The user asked for an "Add to Cart" workflow: enter one item, press "Add to Cart" (renamed from "Add Item"), land on a Cart page, and be able to add another new item from there.
- **Decision:** Split sale entry into two pages. `/sales/new` becomes a single-item form (item, quantity, unit price) whose "Add to Cart" button validates the line, adds it to an in-memory cart, and navigates to a new Cart page (`/sales/cart`, `/admin/sales/cart`). The Cart page lists the accumulated items (duplicate products merge quantities; the most-recent unit price wins), offers a "New item" button back to `/sales/new`, and hosts the checkout (customer, payment with due-date preview, delivery, review, "Save sale"). The cart lives in a `CartProvider` React context added to `AppProviders` (in-memory, cleared on successful save); the sale saves at the store active on the Cart page, matching the prior behavior of reading the store at save time.
- **Alternatives considered:** Keeping the single-page multi-line form — rejected; the user explicitly asked for the cart flow. Router state passed between the two pages — rejected; lost on refresh and awkward to pass back and forth. localStorage-persisted cart — rejected; session-only in-memory state is consistent with the mock data layer.
- **Rationale:** One-item-at-a-time entry matches how staff actually compose a sale, the two-page split keeps each step small on phones, and a context provider follows the existing `SessionProvider`/`StoreProvider` pattern so `renderWithProviders` covers it in tests.
- **Consequences:** New `CartProvider`/`useCart`/`CartContext` (seedable via `initialLines` for tests); `NewSalePage` rewritten to single-item entry; new `SaleCartPage` for cart + checkout; two new routes; `NewSalePage.test.tsx` rewritten and `SaleCartPage.test.tsx` added. The cart is not store-bound; cancel from the Cart page returns to the sales list without clearing.
- **Related documents:** `docs/UI-UX.md` §7.1, `docs/REQUIREMENTS.md` §5, `src/features/sales/`, `src/app/router.tsx`.
- **Supersedes / Superseded by:** none.
- **Open questions or follow-up:** Editing a line's quantity directly on the Cart page is not included; cart content is cleared only on a successful save.

### DEC-022 — Shopee-style catalog, automatic pricing, floating basket

- **ID:** DEC-022
- **Title:** Shopee-style catalog, automatic pricing, floating basket
- **Status:** Accepted
- **Date:** 2026-09-14
- **Context:** DEC-021's sale entry was a single-item form with a manually entered unit price. The user asked to make sale entry a Shopee-like product catalog (all products, one "Add to cart" button per item with quantity selection), a floating basket in the bottom-right that opens the cart/checkout page (which also holds customer details, delivery, and the rest of the checkout), and an automatic unit price with no manual price input. Products previously had no price anywhere; seed sales showed per-store prices (Rice 25kg ₱1,150 Amara vs ₱1,200 Zeann), so a single global price would be wrong.
- **Decision:** `/sales/new` becomes a responsive catalog grid of all active products, each card showing its automatic price, a quantity stepper (default 1), and an "Add to cart" button. Adding to the cart keeps the user on the catalog and increments a floating basket badge. The floating basket (`BasketFab`) is a fixed bottom-right button (above the mobile tab bar) shown only on the catalog page; clicking it opens the existing cart/checkout page (`/sales/cart`). The automatic unit price is derived per store from the selling price of that product's **most recent receiving record** at the current store (`listStorePrices` in `receivingService`); products never received at the store render "No price" with a disabled button. The receiving selling-price field — previously reference-only — now feeds sale pricing.
- **Alternatives considered:** Single product-level price — rejected; seed data shows per-store pricing. Per-store price stored on stock — rejected; stock has no management UI and receiving already captures the selling price. Navigating to the cart after each add — rejected; the floating basket makes stay-on-catalog the natural flow.
- **Rationale:** Staff compose a sale by picking items from what is in their store, and the receiving "Add stock" flow already records the selling price, so pricing automatically follows the most recent stock-in record. A catalog grid plus a persistent basket matches the mobile shopping pattern staff already know.
- **Consequences:** `NewSalePage` rewritten as the catalog; new `BasketFab` and a `cart` icon; new `listStorePrices` service; seed receiving records now carry selling prices plus minimal records so every active product has a price at both stores; `NewSalePage`/`SaleCartPage` tests rewritten; `receivingService` tests extended. Prices resolve at the store active on the catalog page and are captured on the cart line at add time.
- **Related documents:** `docs/UI-UX.md` §7.1, `docs/DATA-MODEL.md` §4.9, `docs/REQUIREMENTS.md` §5, `src/features/sales/`, `src/services/receivingService.ts`.
- **Supersedes / Superseded by:** none.
- **Open questions or follow-up:** Catalog search/filter is not included; quantity is not capped by stock (insufficient-stock behavior remains Confirmation Required).

### DEC-023 — Sale checkout additions and manual quantity input

- **ID:** DEC-023
- **Title:** Sale checkout additions and manual quantity input
- **Status:** Accepted
- **Date:** 2026-09-14
- **Context:** The cart/checkout page (`/sales/cart`) captured customer, payment type, terms, delivery, and rider/vehicle but not the business sale date, the mode of payment, or a discount — all of which the business records on paper sales. The catalog page's quantity stepper was replaced by a manual quantity field so staff can type exact quantities instead of tapping +/− repeatedly.
- **Decision:** The sale carries an explicit `saleDate` (defaults to today, backdateable via the checkout Date picker; credit due dates derive from it instead of `createdAt`) plus an assumed `paymentMethod` selected from `PAYMENT_METHOD_PRESETS` (Cash, GCash, Maya, Bank Transfer, Check, Other with a free-text field) and an assumed `discountMinor` applied once to the whole sale (`total = items + delivery fee − discount`). The service validates the date format, rejects blank payment methods and discounts above the sale amount, and stays the single mutation point. The catalog quantity stepper becomes a number input (`TextField`) with per-product string state validated before add-to-cart.
- **Alternatives considered:** Reusing `createdAt` as the sale date — rejected; backdated sales must not shift audit timestamps. A fixed payment-method list only — rejected; the business uses ad-hoc channels, so "Other" keeps the list extensible. Keeping the stepper — rejected; typing exact quantities is faster for bag-count sales.
- **Rationale:** These fields match the paper flow the staff already follow, keep the service seam as the only writer, and keep derived credit due dates business-date driven.
- **Consequences:** `Sale`/`NewSaleInput` gain `saleDate`, `paymentMethod`, `discountMinor`; `saleService` validates and computes the new totals; `creditService` due-date helpers accept an optional `fromDate`; `dashboardService` filters switch from `createdAt` to `saleDate`; seed sales carry the new fields; checkout and catalog pages and tests updated.
- **Related documents:** `docs/DATA-MODEL.md` §4.9, `docs/UI-UX.md` §7.1, `docs/REQUIREMENTS.md` §5, `src/domain/sale.ts`, `src/services/saleService.ts`.
- **Supersedes / Superseded by:** none.
- **Open questions or follow-up:** Exact payment-method vocabulary and discount policy remain Confirmation Required.

### DEC-024 — Admin-only reports with Excel export

- **ID:** DEC-024
- **Title:** Admin-only reports with Excel export
- **Status:** Accepted
- **Date:** 2026-09-14
- **Context:** The user asked to (1) restrict the Reports page to admins, (2) replace the PDF export (DEC-020) with an Excel export, and (3) remove the staff Reports route and nav entry. Excel export was previously deferred (DEC-006) pending confirmed formats.
- **Decision:** Reports is admin-only: the staff route, nav item, and the reports test that scoped staff are removed (staff reaching `/admin/reports` is redirected by the role guard). The Reports page exports an `.xlsx` of the day's sale lines with columns Date, Location, Customer, Item, Quantity, Price, Amount, Type, Delivery Fee, Discount, Net, Rider, Vehicle via `write-excel-file/browser`. `src/lib/exportReportExcel.ts` is a pure builder plus a lazy-imported writer; `src/features/reports/reportRows.ts` expands each sale into one row per line (per-sale delivery fee, discount, and net on the first line only). `jspdf` and `jspdf-autotable` are removed from `package.json`.
- **Alternatives considered:** Keeping staff reports — rejected; the user wants reports admin-only. Client-side CSV export — rejected; the user asked for Excel, and `write-excel-file` is already the agreed direction in `docs/TECH-STACK.md` §7.
- **Rationale:** Reports are a management/administrative surface, and a real `.xlsx` is directly usable in the business's spreadsheet workflow; the lazy import keeps the library out of the initial bundle.
- **Consequences:** `DEC-020` marked Superseded; `write-excel-file@4` replaces the PDF libraries; staff Reports removed from `navItems.ts` and `router.tsx`; `ReportsPage` exports sale-line detail rather than summary tables; `exportReportPdf.*` deleted; tests updated (`reportsRows` covered, `ReportsPage` export button and staff-redirect covered).
- **Related documents:** `docs/TECH-STACK.md` §7, `docs/REQUIREMENTS.md` §13, `docs/DECISIONS.md` DEC-006, DEC-020, `src/features/reports/`.
- **Supersedes / Superseded by:** Supersedes DEC-020.
- **Open questions or follow-up:** Report columns/formats remain Confirmation Required; the export intentionally mirrors the implemented sale-line data.

### DEC-025 — Staff dashboard trim, history unread badge, admin customer add

- **ID:** DEC-025
- **Title:** Staff dashboard trim, history unread badge, admin customer add
- **Status:** Accepted
- **Date:** 2026-09-14
- **Context:** The user asked to (1) remove the monthly sales card from the staff dashboard, (2) show an unread indicator on the History destination, and (3) let admins add customers from the customer list.
- **Decision:** The staff dashboard keeps its Today, stock, outstanding credit, and weekly sales cards and drops the monthly card. History gets an unread badge driven by `src/features/history/historySeen.ts` (localStorage last-seen timestamp) and `useHistoryUnread.ts` (polls `listAuditEventsForUser`), rendered on the desktop side-nav History link and the mobile More-page History row; opening History marks events seen. The customer list is a shared page where admins (previously `canAdd={false}`) now see the add-customer action.
- **Alternatives considered:** Server-side read receipts — rejected; the mock data layer is frontend-only, so localStorage is the honest equivalent. Badge on the mobile tab bar too — rejected; History is not a primary tab, so the More page carries the indicator there.
- **Rationale:** These are small, confirmed UX refinements that reuse the existing nav, session, and audit seams without new infrastructure.
- **Consequences:** `StaffDashboardPage` drops the monthly card and its `getMonthlySalesByStore` dependency; `useHistoryUnread` runs on the app shell (30s poll); `AuditTrailPage` writes the last-seen timestamp on mount; `MorePage`/`SideNav` render the badge; the customer list admin add action is restored; tests updated.
- **Related documents:** `docs/UI-UX.md` §7.7, `docs/ARCHITECTURE.md` §6, `src/features/history/`, `src/features/dashboard/`.
- **Supersedes / Superseded by:** none.
- **Open questions or follow-up:** None.

### DEC-026 — Report date range and History store filter

- **ID:** DEC-026
- **Title:** Report date range and History store filter
- **Status:** Accepted
- **Date:** 2026-09-14
- **Context:** The Reports page filtered on a single date, but the business reviews sales over a span (for example a week or a remittance cut-off). The History page listed actions across both stores without a way to narrow to one store. The Excel export's header cells were also rendering black text on the green fill because the cell style used the wrong key.
- **Decision:** The Reports page selects a **From/To** date range (both default to today; the pickers cross-constrain so From ≤ To) and all summaries, the sale-line export, and the export filename cover that range. New range queries back this (`getSalesByStoreInRange`, `getOverallSalesInRange`, plus range-aware `getPaymentsSummary`/`getReceivedStock`), surfaced through a Reports-only `useReportSummaries` seam so the dashboard's single-date `useBusinessSummaries` is untouched. `listSales` gains an additive `{ from?, to? }` filter alongside the existing exact `date` filter. The History page adds an **admin-only** Store filter (All stores / Amara / Zeann); when a specific store is selected, only events carrying that `storeId` are shown, so business-wide events (product submissions/approvals) appear under All stores. The Excel header text color is corrected to `textColor` (the `write-excel-file` cell style key; `color` is ignored).
- **Alternatives considered:** Extending the range to the dashboards — deferred; the dashboards keep their Today/Weekly/Monthly views (user-confirmed scope: Reports only). Replacing the single-date `getDailySalesByStore`/`getOverallDailySales` with range versions — rejected; it would ripple into the dashboards and their tests for no benefit, so range queries were added alongside. Showing the store filter to staff — rejected; staff history is already scoped to their own actions and connected decisions, and store-less approval events would make a store filter misleading.
- **Rationale:** A range matches how the business actually reviews sales; the additive service functions and Reports-only seam keep the change isolated from the dashboards; the admin-only store filter is meaningful only where both stores are visible.
- **Consequences:** `ReportsPage`/`SummarySections` take `from`/`to`; new `useReportSummaries`; `reportRows`/`exportReportExcel` take `from`/`to` with a range filename; `listSales` accepts `from`/`to`; `auditService` filters accept `storeId`; `AuditTrailPage` renders the admin store control; tests extended, and the pre-existing AuditTrailPage duplicate-text test bug was fixed.
- **Related documents:** `docs/UI-UX.md` §7.7, `docs/REQUIREMENTS.md` §13, `docs/DECISIONS.md` DEC-024, DEC-025, `src/features/reports/`, `src/features/history/`, `src/lib/exportReportExcel.ts`.
- **Supersedes / Superseded by:** none.
- **Open questions or follow-up:** Report columns/formats remain Confirmation Required.

### DEC-027 — Rider and vehicle full CRUD with reference guard

- **ID:** DEC-027
- **Title:** Rider and vehicle full CRUD with reference guard
- **Status:** Accepted
- **Date:** 2026-09-14
- **Context:** The riders and vehicles pages supported create, list, and activate/deactivate, but not rename or delete. The user asked for full CRUD (frontend-only for now).
- **Decision:** Add `updateRider`/`updateVehicle` (rename + active toggle; `setRiderActive`/`setVehicleActive` delegate to them) and `deleteRider`/`deleteVehicle`. Deletion hard-removes the record only when it is unreferenced; a rider/vehicle referenced by any sale (`delivery.riderId/vehicleId`), receiving, or expense is refused with a `conflict` error telling the user to deactivate it instead, so historical attribution stays intact. The pages gain an Edit dialog (rename) and a confirmed Delete action alongside the existing status toggle; success and failure notices reuse the page Alert pattern.
- **Alternatives considered:** Soft-delete only — rejected; the user asked for delete, and deactivation already covers the soft path. Unconditional hard delete — rejected; it would orphan sale/receiving/expense references and corrupt history attribution, which data integrity rules forbid. Cascade-delete references — rejected; deleting business history is not implied by managing the rider/vehicle list.
- **Rationale:** Real CRUD as requested, with the smallest guard that keeps historical records valid and surfaces the reason to the user.
- **Consequences:** `UpdateRiderInput`/`UpdateVehicleInput` added to the domain; `deleteRider`/`deleteVehicle` return the removed record; new `EditRiderDialog`/`EditVehicleDialog`; riders/vehicles pages gain Edit/Delete actions and a confirm dialog; service and page tests extended.
- **Related documents:** `docs/UI-UX.md` §7.10, `docs/REQUIREMENTS.md` §9a (REQ-DELIV-004), `docs/DATA-MODEL.md` §4.13–4.14, `src/features/delivery/`, `src/services/riderService.ts`, `src/services/vehicleService.ts`.
- **Supersedes / Superseded by:** none.
- **Open questions or follow-up:** Exact rider/vehicle fields remain Confirmation Required.

### DEC-028 — Rename brand and project to ZAF ONE

- **ID:** DEC-028
- **Title:** Rename brand and project to ZAF ONE
- **Status:** Accepted
- **Date:** 2026-09-14
- **Context:** The on-screen product brand was "Amara Feeds" (DEC-007, confirmed 2026-09-10) and the project name was "Amara + Zeann Store Management System". The user asked to rename the project and system to **ZAF ONE**; the two operating stores remain Amara and Zeann.
- **Decision:** The brand and project are renamed to **ZAF ONE**. On-screen brand text (`TopBar` wordmark, sign-in title, document `<title>`) becomes "ZAF ONE". The npm package name becomes `zaf-one`; the Excel export filename prefix becomes `zaf-one-report-*`; the localStorage keys become `zaf-one.session.v1` and `zaf-one:history:last-seen`. Project/product/brand references in `docs/PROJECT.md`, `README.md`, `AGENTS.md`, all doc titles, `PRODUCT.md`, `DESIGN.md`, and `.impeccable/design.json` are updated. Store names **Amara** and **Zeann**, the `amara-feeds` folder name, and the historical DEC bodies are left intact.
- **Alternatives considered:** Keeping "Amara Feeds" — rejected; the user explicitly renamed the product. Renaming the repository folder too — out of scope for code changes and would break tooling paths without benefit.
- **Rationale:** Matches the user's requested product identity while keeping the two-store operating model unchanged and avoiding churn to non-identifying internals.
- **Consequences:** DEC-007 and DEC-008 (which established and aligned "Amara Feeds" app-wide) are marked Superseded by DEC-028. Existing localStorage session/history keys are invalidated (acceptable for the frontend-only mock). Brand-asserting tests updated.
- **Related documents:** `docs/PROJECT.md` §10, `docs/DECISIONS.md` DEC-007, DEC-008, `README.md`, `AGENTS.md`, `src/components/navigation/TopBar.tsx`, `src/features/session/SignInPage.tsx`, `package.json`.
- **Supersedes / Superseded by:** Supersedes DEC-007 and DEC-008.
- **Open questions or follow-up:** Logo artwork remains Confirmation Required; the `amara-feeds` repository folder name is unchanged.

### DEC-029 — Adopt official logo and recolor theme to the logo palette

- **ID:** DEC-029
- **Title:** Adopt official logo and recolor theme to the logo palette
- **Status:** Accepted
- **Date:** 2026-09-14
- **Context:** The business provided the official logo (`logo-clear.png`, a circular badge reading "Aquatic Feeds / Zeann Feeds Supply" with three fish, a net, and bubbles). Its palette — cyan `#4ed1f9`, mid blue `#0184b2`, navy `#013c68`, slate `#515b74`, light slate `#929eb6`, pale green `#dae4c2`, light gray `#cdcdcd`, white `#ffffff` — is to become the system color theme. The incumbent theme (DEC-019) was warm depot-enamel green with Amara violet and Zeann rust.
- **Decision:** Use the logo as the visual mark — the full badge on the sign-in page, and a derived simplified mark (`logo-mark.svg`, navy circle + cyan fish) at the 28px header and as the favicon. Recolor the token theme to the logo palette: brand navy `#013c68`/`#002b4c`, cyan tints, cool neutrals/surfaces, `text.muted` darkened to `#6b7590` and `store.amara.solid` darkened to `#016a91` for WCAG AA. Semantic status colors are kept (the palette has no red/amber). The painted-signage motif, typography, and structure from DEC-019 remain; only the palette changes.
- **Alternatives considered:** Using the full badge at every size — rejected; its small arc text is illegible at the 60px header and 32px favicon, so a derived simplified mark covers those sizes. Recoloring statuses into the palette — rejected; no red/amber exists, and semantic status colors keep errors and states meaningful and contrast-safe.
- **Rationale:** The logo is now the confirmed identity; its palette makes the app visually consistent with the brand while the design-system structure and accessibility requirements stay intact.
- **Consequences:** `src/theme/tokens.ts` recolored (colors + cool shadows); hardcoded warm shadows in `BottomNav`, `Button`, `FilterBar` updated; `TopBar`/`SignInPage` render the logo marks; `index.html` theme-color updated; `public/favicon.svg` replaced; `exportReportExcel` header fill becomes the navy; `docs/DESIGN-SYSTEM.md`, `DESIGN.md`, `.impeccable/design.json`, `docs/PROJECT.md` §10, `PRODUCT.md`, and `README.md` synced; DEC-019 marked Superseded (palette only). The derived `logo-mark.svg` is a placeholder simplification and may be replaced by the business.
- **Related documents:** `docs/DESIGN-SYSTEM.md` §§1, 2, 3, 5, `docs/PROJECT.md` §10, `DESIGN.md`, `.impeccable/design.json`, `docs/DECISIONS.md` DEC-019, `src/theme/tokens.ts`, `src/assets/`, `public/favicon.svg`.
- **Supersedes / Superseded by:** Supersedes DEC-019's color palette (motif, typography, and structure remain).
- **Open questions or follow-up:** The simplified small mark is derived and replaceable; the full badge's "Aquatic Feeds / Zeann Feeds Supply" text and the product name ZAF ONE remain reconciled in `docs/PROJECT.md` §10.

### DEC-030 — Per-store logo and color theme following the store context

- **ID:** DEC-030
- **Title:** Per-store logo and color theme following the store context
- **Status:** Accepted
- **Date:** 2026-09-15
- **Context:** The client supplied a separate Amara logo (`amara-logo-clear.png`, "Amara's Feeds Supply" badge) with its own palette (bronze `#aa885a`, tan `#cfb18b`, peach `#fcd4c8`, sage `#dae4c2`, slate `#515b74`, light slate `#929eb6`, gray `#cdcdcd`, white `#ffffff`) and asked that the app show the appropriate logo and color theme per store. The DEC-029 theme was Zeann-only (marine navy). Staff are locked to their assigned store and admins switch the store context (`StoreProvider`), but `ThemeProvider` sat above the store context with a single static theme.
- **Decision:** Ship two full themes with one shared shape (`src/theme/storeThemes.ts`): `zeannTheme` is the unchanged DEC-029 navy; `amaraTheme` remaps only `brand.*`, `text.primary`, `focus.*`, and the Amara `store.*` wash to the Amara palette. Surfaces and semantic status colors stay shared. A new `StoreThemeProvider` sits inside `StoreProvider` and themes the whole app from the active store (staff assignment, admin switch). `TopBar` shows the active store's full badge scaled to 28px (`src/store/storeBranding.ts`); the signed-out sign-in panel shows both badges side by side on a neutral slate panel; favicon and `theme-color` swap per store via effect. `Theme` becomes an explicit widened interface in `src/theme/tokens.ts` so both themes satisfy one type.
- **Alternatives considered:** Logo + accents only under a neutral ZAF ONE shell — rejected; the client chose a full per-store recolor. Separate per-component store props instead of a theme swap — rejected; all ~56 `brand.*` usages recolor automatically through the theme with no component rewrites.
- **Rationale:** Store context already drives data and badges; driving the theme from the same context keeps one source of truth and satisfies the client's per-store branding with the smallest maintainable change.
- **Consequences:** `src/app/providers.tsx` composes `Session > Store > StoreTheme > Cart`; white text on Amara bronze `#aa885a` is only 3.3:1, so interactive/text-on-brand roles use derived `#7e6240` (5.7:1) and body text `#4a3f2e` (10.3:1) for WCAG AA; admin "All stores" views wear the selected store's paint while store columns/badges still label each store in text; the 2.4 MB Zeann PNG now loads on every page via the header — image optimization remains follow-up.
- **Related documents:** `docs/DESIGN-SYSTEM.md` §3, `docs/PROJECT.md` §10, `docs/UI-UX.md` §§2, 6, `src/theme/storeThemes.ts`, `src/theme/StoreThemeProvider.tsx`, `src/store/storeBranding.ts`.
- **Supersedes / Superseded by:** none (extends DEC-029, which remains the Zeann palette source).
- **Open questions or follow-up:** Exact Amara wash roles (peach/sage) are assumed pending client confirmation; header-size simplified marks per store remain an option; report Excel/print headers stay static.

### DEC-031 — Fixed sign-in theme and combined admin theme

- **ID:** DEC-031
- **Title:** Fixed sign-in theme and combined admin theme
- **Status:** Accepted
- **Date:** 2026-09-15
- **Context:** DEC-030 themed the whole app from the store context. The client then required that (a) the sign-in page never change color when the admin switches the store filter, and (b) switching the Amara/Zeann filter on the admin site never re-theme the admin site — instead the admin theme combines both stores' colors. Root cause: one global `StoreThemeProvider` themed every route, and the signed-out store fallback retains the admin's last switch.
- **Decision:** Scope themes per area (`src/theme/storeThemes.ts` gains two fixed themes, one shared `Theme` shape). Staff routes keep the per-store theme via `StoreThemeProvider` in `StaffLayout`. `AdminLayout` uses a fixed combined theme — navy shell (`brand.600/700` navy) with bronze accents (focus ring `#aa885a`, brand-plate detailing `brand.tint #cfb18b`, plus the Amara bronze identity elements) — and shows both store logos in the header (`TopBar brand="dual"`). `SignInPage` self-wraps in a fixed neutral slate theme (`brand.600 #515b74`, 6.8:1 with white). The Amara/Zeann filter keeps driving data, badges, and store columns only. Favicon/`theme-color` sync is per area (`src/theme/browserChrome.ts`): per-store for staff, navy mark for admin, default for sign-in.
- **Alternatives considered:** One neutral shell for admin with store colors only on badges — rejected; the client chose navy shell with bronze accents. Route-keyed single theme provider — rejected; layout wrapping is smaller and matches the existing Staff/AdminLayout split.
- **Rationale:** Each audience gets a stable identity: staff see their store, admin sees the combined business, sign-in belongs to neither. No component rewrites — nested `ThemeProvider`s override the static base.
- **Consequences:** `providers.tsx` renders a static base theme; `GlobalStyle` renders at base plus once per staff tree (identical rules, staff values win). Layout tests pin the behavior (filter switch keeps navy; sign-in keeps slate across `initialStore`).
- **Related documents:** `docs/DESIGN-SYSTEM.md` §3, `src/theme/storeThemes.ts`, `src/theme/browserChrome.ts`, `src/app/layouts/`.
- **Supersedes / Superseded by:** none (narrows DEC-030's "whole app follows store" to the staff area).
- **Open questions or follow-up:** Exact bronze accent slots beyond focus/tint remain assumed; image optimization still follow-up.

### DEC-032 — Manual stock edit and delete with sales-history guard

- **ID:** DEC-032
- **Title:** Manual stock edit and delete with sales-history guard
- **Status:** Accepted
- **Date:** 2026-09-20
- **Context:** Stock is fully derived (receiving adds, sales deduct), so staff and admin had no correction path for physical-count mismatches (damage, found stock, data-entry fixes). The current-stock row is a `StockLevel` (store + product + quantity), not an item record — the approved scope is quantities, not product records.
- **Decision:** `inventoryService` gains `updateStock` (absolute integer quantity ≥ 0; creates the row when absent) and `deleteStock` (removes the row; refused with `conflict` when the product has any sale at that store — set quantity to 0 instead, mirroring the DEC-027 vehicle delete guard). Inventory rows gain Edit/Delete actions; edit opens a dialog, delete uses `ConfirmDialog`. Both write audit events (`stock.updated` with from→to detail, `stock.deleted`) into the session audit log per the DEC-013 attribution pattern. Scope stays store-aware: staff act on their own store, admins on the store filter they selected.
- **Alternatives considered:** Product-record edit/delete — different surface, not requested; adjustment deltas instead of absolute set — rejected, staff think in shelf counts and a delta dialog costs more.
- **Rationale:** Physical counts diverge from derived stock; a manual correction with a visible trail is the smallest trustworthy fix. The sales guard keeps derived sale history coherent; deleted rows only exist when nothing sold at that store.
- **Consequences:** `AuditTrailPage` renders the two new actions via `AUDIT_ACTION_LABELS`; history gains adjustment visibility. Mock-only: enforcement moves to the real data layer in Phase 5.
- **Related documents:** `docs/DATA-MODEL.md` §§4.10–4.11, `src/services/inventoryService.ts`, `src/features/inventory/`.

### DEC-033 — Sign-in brand copy: Zeann & Amara Feeds Supply tagline

- **ID:** DEC-033
- **Title:** Sign-in brand copy: Zeann & Amara Feeds Supply tagline
- **Status:** Accepted
- **Date:** 2026-09-20
- **Context:** Client copy request for the sign-in brand panel.
- **Decision:** Sign-in brand panel reads: title "ZAF ONE", subtitle "Zeann & Amara Feeds Supply", caption "One System • One Team • One Goal", both store logos unchanged above.
- **Related documents:** `src/features/session/SignInPage.tsx`.

### DEC-034 — Phase 3 gate deferral and assumption adoption for database work

- **ID:** DEC-034
- **Title:** Phase 3 gate deferral and assumption adoption for database work
- **Status:** Accepted
- **Date:** 2026-09-20
- **Context:** `ROADMAP.md` Gate 3 requires the Phase 3 frontend workflow validation walkthrough to complete before any database work. The client proceeded to database/backend work directly, and Phase 5 requires final-or-explicitly-assumed fields and rules before migrations are written.
- **Decision:** The Phase 3 validation gate is explicitly deferred, not silently skipped — recorded here so the requirement stays visible and the walkthrough can still run before Phase 7 (real-system validation). The mock implementation's behavior is adopted as the recorded Assumed baseline for the database, each item flagged Assumed with a revisit trigger: payment-term options + offset math (7/15/30 days), insufficient-stock refusal, no sale edit/cancel/reversal, product submit→pending→approve with unique active names, stock adjust/delete guard (DEC-032), expense type enum fuel/repair, dev-only credentials (`alice123`/`ben123`/`admin123`), and the fabricated email convention `username@zafone.local` for username login. Real changes to any of these arrive as later requirements; the database enforces the assumed baseline now.
- **Consequences:** `supabase/migrations/00001–00004` encode the baseline; `docs/DATA-MODEL.md` and `docs/API.md` were updated to reflect the enforced rules and to keep the Confirmation Required matrix honest.
- **Related documents:** `ROADMAP.md` §§3 (Phase 3/4), 6; `docs/DATA-MODEL.md` §11.

### DEC-035 — Supabase-direct integration: profiles-based authz and service swap

- **ID:** DEC-035
- **Title:** Supabase-direct integration: profiles-based authz and service swap
- **Status:** Accepted
- **Date:** 2026-09-20
- **Context:** Phase 6 re-points the service layer from mocks to Supabase holding the frontend contract stable. Authorization data (role, store assignment) must be server-enforced without JWT staleness or user-falsification risk.
- **Decision:** Role/store live in a `profiles` table keyed to `auth.users` (`id = auth.uid()`), never in user-editable `user_metadata`. RLS policies read `(select public.current_profile())` — a `SECURITY DEFINER` helper that only returns the caller's own row, wrapped in `(select …)` for a single init-plan evaluation. All mutations run through `SECURITY DEFINER` functions in `public` (PostgREST RPC requires an exposed schema) with in-body `auth.uid()` scope checks and `authenticated`-only execute grants; `anon`/`PUBLIC` execute revoked. The frontend uses supabase-js behind the existing service seam, with a mock fallback when `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are absent so tests and preview run without a backend. Login resolves a username to `username@zafone.local` (Assumed, DEC-034) then authenticates via Supabase Auth.
- **Alternatives considered:** role/store in JWT `app_metadata` — rejected; needs Admin API to set and lags token refresh. Non-exposed `app` schema for functions — rejected; PostgREST RPC only exposes schemas in `api.schemas`, so functions stayed in `public` with strict grants.
- **Rationale:** `profiles` gives admin UI staff-management a table to write, keeps the RLS pattern uniform (`(select auth.uid())` join), and lets RLS scope reads while functions enforce atomic writes.
- **Consequences:** `@supabase/supabase-js` added (pinned, lockfile committed); `src/services/supabaseClient.ts`; services dual-mode (supabase + mock fallback); `SessionProvider` restores the real Auth session on reload. Mocks remain for unit tests only; zero mock imports on business paths is the Phase 6 exit criterion (ROADMAP Gate 5).
- **Related documents:** `docs/SECURITY.md` §§2–4, `docs/API.md`, `src/services/`.

### DEC-036 — Staff management RPC fixes and admin update semantics

- **ID:** DEC-036
- **Title:** Staff management RPC fixes and admin update semantics
- **Status:** Accepted
- **Date:** 2026-09-21
- **Context:** Hosted testing surfaced three integration defects: `record_sale` rejected the client's `p_lines` (a JSON string for a `jsonb` param — PostgREST delivered a scalar, `jsonb_array_length` failed with 22023); `create_staff` raised `gen_salt(unknown) does not exist` (42883) because the function's `search_path = public` excluded the `extensions` schema where pgcrypto lives; and staff list/edit silently read the mock (`listUsers`/`updateUser` had no supabase branch), so staff management operated on fake data while everything else was real. Frontend-only `profiles` RLS also could not express admin edits of other accounts (own-row updates only) nor password resets (`auth.users`).
- **Decision:** Migration 00005: `create_staff` gets `set search_path = public, extensions`; new admin-only `update_staff` (name, username→ synced auth email convention, store reassignment, enable/disable, optional password reset with revocation of the user's sessions and refresh tokens — Assumed, revisit trigger: session-revocation policy) implemented as `SECURITY DEFINER` with in-body admin checks. Services gain the missing supabase branches (`listUsers`, `getUser`, `updateUser` → `update_staff`, `getDeliveryNetSummary`). `serviceErrorFromSupabase` never surfaces raw SQLSTATEs — `P0001` business copy passes through classified by message; every other SQLSTATE collapses to a generic message with the detail logged. `p_lines` is passed as a real array (postgrest-js serializes JSON arrays to `jsonb` arrays; stringified values arrive as scalars). Password inputs gain a show/hide toggle in the shared `TextField`.
- **Related documents:** `docs/SECURITY.md` §§5, 8, `src/services/`, `supabase/migrations/20260921022901_00005_staff_fixes.sql`.

### DEC-037 — Catalog lists only sellable items; pending-seed parity

- **ID:** DEC-037
- **Title:** Catalog lists only sellable items; pending-seed parity
- **Status:** Accepted
- **Date:** 2026-09-21
- **Context:** Hosted testing showed an approved pending product appearing in the sale catalog while absent from inventory. Verified against the hosted data: the seeded demo item (Cooking Oil 1L) was created pending with no receiving record and no stock, so approval made it catalog-visible (decoupled from stock) but inventory-invisible. Root questions decided with the client: (1) approval behavior — keep as-is, approval only activates the product and stock comes from receiving; (2) catalog behavior — the sale catalog should list only sellable items (product priced at the current store, i.e. actually received there); (3) seed parity — the demo pending item must behave like a real staff receipt.
- **Decision:** `NewSalePage` filters the product list to items present in `listStorePrices(store)` (products with no price, therefore no stock, at the current store never render — no "No price" disabled card). The seed gains a receiving record + stock row for the pending demo item (DB `00006`, mock `seed.ts`) so approval-flow demos read correctly: stock exists before approval; approval makes it sellable in both catalog and inventory. Existing unstocked active products (e.g. prod-3 driven live by verification) resolve automatically once the receiving row exists — no manual data surgery.
- **Related documents:** `src/features/sales/NewSalePage.tsx`, `src/services/mocks/seed.ts`, `supabase/migrations/20260921031853_00006_pending_seed_parity.sql`, `docs/DATA-MODEL.md` §§4.3, 4.8.

### DEC-038 — SweetAlert2 feedback system + logout confirmation

- **ID:** DEC-038
- **Title:** SweetAlert2 feedback system + logout confirmation
- **Status:** Accepted
- **Date:** 2026-09-21
- **Context:** The client requested SweetAlert2 for all action feedback and a confirmation before sign-out. Decisions: (Q1) success and failure both render as modal popups; (Q2) SweetAlert2 confirm modals replace the in-app `ConfirmDialog` everywhere; (Q3) page-level loading/empty/error states and inline client-side field validation stay as before.
- **Decision:** `sweetalert2` is the adopted runtime dependency (`docs/TECH-STACK.md` §2). A thin wrapper `src/lib/swal.ts` exposes `confirmAction` (boolean; destructive confirmations render the danger/deny button), `notifySuccess`/`notifyError`/`notifyInfo` modals, and busy helpers. Brand alignment happens through GlobalStyle `swal2-*` overrides (navy confirm, danger deny, theme fonts/radii); buttons stay SweetAlert2-native for focus/ARIA. Every success `setNotice` inline banner and every mutation error `Alert` is replaced by the popup; every replaced confirmation (stock/rider/vehicle delete, approve/reject, staff enable/disable, sign-out on MorePage + TopBar) runs through `confirmAction`. Sign-out now asks first on both locales. The `ConfirmDialog` component was removed (fully unused).
- **Known limitation recorded:** a wrong-password sign-in logs `POST /auth/v1/token?grant_type=password 400` in the browser console — that is DevTools' automatic network log for the expected failed auth request, not an app error, and cannot be suppressed from app code; the popup now surfaces the failure instead of an inline alert.
- **Testing:** Vitest runs against a deterministic double (`src/test/swalMock.ts`) — `fire()` resolves confirmed and records its options; tests assert popups via `__awaitSwal(title)` instead of rendered-text queries. The real library is never rendered under jsdom.
- **Related documents:** `docs/TECH-STACK.md` §2, `src/lib/swal.ts`, `src/test/swalMock.ts`.

### DEC-039 — Hosted production wipe to owner-only clean slate

- **ID:** DEC-039
- **Title:** Hosted production wipe to owner-only clean slate
- **Status:** Accepted
- **Date:** 2026-09-21
- **Context:** The hosted project carried only development/verification data: seed demo rows (DEC-034) and staff/test accounts created while exercising the app (`alice`, `ben`, plus a client-created `orlando`). The client confirmed wiping everything except the admin/owner so live use starts from a clean slate, under the already-confirmed shared-credit model (DEC-034; no model change).
- **Decision:** One-time FK-safe wipe of the linked hosted database, executed via SQL (not a migration — migrations reapply on `db reset`): all business tables emptied (`payments`, `credit_obligations`, `sale_lines`, `sales`, `receiving_records`, `stock_levels`, `expenses`, `riders`, `vehicles`, `products`, `customers`, `audit_events`) in one transaction, and non-owner auth users deleted — cascading their `profiles`, `auth.identities`, sessions, and refresh tokens. Kept: `owner@zafone.local` + `owner` admin profile, and the reference rows `stores` (amara, zeann) and `payment_terms` (7/15/30 days). The script is preserved under `supabase/cleanup/wipe-business-data.sql` for audit and could be re-run if demo re-seeding is ever needed first; local dev keeps the `00004` seed parity data so development and tests stay usable.
- **Alternatives considered:** a migration — rejected; a `db reset`-rerunnable deletion would also strip dev-parity seed data from every future environment. A `db pull`-style deep reset — overkill for a pure data wipe.
- **Consequences:** The hosted app is owner-only with empty business data. Product catalog is empty by design: new items enter through Receiving → "Add new item" (staff submit, admin approve). Staff accounts are re-created via the admin UI (`create_staff`).
- **Related documents:** `supabase/cleanup/wipe-business-data.sql`, `docs/DATA-MODEL.md` §9, `docs/DEVELOPMENT.md` §12.

### DEC-040 — Admin store switch relocated to the More page

- **ID:** DEC-040
- **Title:** Admin store switch relocated to the More page
- **Status:** Accepted
- **Date:** 2026-09-21
- **Context:** The admin's Amara/Zeann switch (`StoreControl`) rendered directly under each admin page's header (credit detail, inventory, receiving, riders, vehicles, expenses), reading as per-page chrome the client wants out of that position. Removing it entirely would strip the admin's ability to view each store's separate data; the client chose a single central switch.
- **Decision:** `StoreControl` is removed from all six page tops. The admin sets the store context once from the **More page** ("Store context" section, admin-only); every admin page and the header badge follow that context. Staff still see no switch (locked to their assigned store) — the relocated control renders for admins only. Behavior and scoping are otherwise unchanged.
- **Related documents:** `src/features/more/MorePage.tsx`, `src/features/shared/StoreControl.tsx`.

### DEC-041 — Default admin store context is all-stores

- **ID:** DEC-041
- **Title:** Default admin store context is all stores
- **Status:** Accepted
- **Date:** 2026-09-21
- **Context:** After DEC-040 relocated the admin switch to the More page, the default context was still one store (Amara). The client wants admins to see both stores combined by default.
- **Decision:** The admin store context supports the value `all` (both stores combined, the default) in addition to Amara and Zeann. Read surfaces show combined data with a Store column while `all` is active; write flows that must target one store (sale checkout, receiving record, payment) are disabled with a pointing hint until a concrete store is chosen. Staff remain locked to their assigned store. The header store badge is hidden while `all` is active (the dual-logos banner already communicates the business-wide view).
- **Related documents:** `src/store/`, `src/features/shared/StoreControl.tsx`.

### DEC-042 — Production owner login uses an email handle

- **ID:** DEC-042
- **Title:** Production owner login uses an email handle
- **Status:** Accepted
- **Date:** 2026-09-21
- **Context:** The client supplied the production owner credential as an email-shaped username. Login was resolved through the `username@zafone.local` convention, so an email handle broken the mapping. The username field must accept an email-shaped handle, and the hosted owner account (email, password, username) had to be rotated.
- **Decision:** `usernameEmail` treats an input containing `@` as a full email used as-is; bare usernames keep the `@zafone.local` convention. The hosted owner account was updated in one transaction (email handle + rotated password + matching `auth.identities` identity data + profile username) with existing sessions/refresh tokens revoked (the DEC-036 password-reset semantics). Dev seed and tests keep the fake dev credentials so no production password is committed; the credential SQL was run from a scratch file that was never checked in.
- **Related documents:** `src/services/supabaseClient.ts`, `docs/SECURITY.md` §6.

### DEC-043 — Installable PWA with post-login install tutorial

- **ID:** DEC-043
- **Title:** Installable PWA with post-login install tutorial
- **Status:** Accepted
- **Date:** 2026-09-21
- **Context:** The client requested the mobile-primary app become installable as a PWA, with a tutorial modal after login explaining how to install on Android or iOS. The app is Supabase-direct — all business data is remote — so offline read/write and data caching were never in scope; only installability, a standalone app shell, and discoverable install guidance were requested.
- **Decision:** `vite-plugin-pwa` (Workbox `generateSW`) is adopted: web manifest (standalone display, brand navy theme), precached app shell with `navigateFallback` to `index.html`, and Google-Fonts-only runtime caching. **Supabase API traffic is never cached** — business data stays network-authoritative; a small in-app offline banner (online/offline listeners) makes the missing network explicit instead of endless loading states. Updates are prompt-style: a new deploy asks via a themed confirm popup before the installed app reloads. The install tutorial is a **custom in-app modal** (shared `Dialog` component, not SweetAlert2 — DEC-038 governs action feedback, this is multi-step instructional content): Android shows Chrome menu steps plus the native `beforeinstallprompt` "Install now" shortcut when captured; iOS shows the Safari Share → Add to Home Screen steps (no programmatic prompt exists). Trigger policy: the modal auto-opens once per device on the signed-out→signed-in transition (any close without installing stores a `localStorage` dismissal flag; a session restore on a not-yet-dismissed device may re-show until answered). A "Get the app" entry on the More page re-opens the tutorial on demand on mobile browsers (hidden when standalone/installed). Desktop browsers are excluded from both trigger and entry. Icons (`pwa-192/512`, maskable variants, `apple-touch-icon`) are generated once by `scripts/generate-pwa-icons.mjs` (sharp used ad hoc, not a committed dependency).
- **Consequences:** `vite-plugin-pwa` added as a devDependency; `sw.js` + `manifest.webmanifest` in every build; `docs/TECH-STACK.md` records the selection. Service workers only run over HTTPS — Vercel satisfies this. Read-only offline data and offline read-write with sync remain out of scope; revisit only on an explicit client request.
- **Related documents:** `docs/TECH-STACK.md` §2/§3, `docs/DEPLOYMENT.md` §10, `src/features/pwa/`, `vite.config.ts`, `scripts/generate-pwa-icons.mjs`.

### DEC-044 — Admin paint follows the store context

- **ID:** DEC-044
- **Title:** Admin paint follows the store context
- **Status:** Accepted
- **Date:** 2026-09-21
- **Context:** The client asked for the admin dashboard to wear the Amara brown theme when Amara is the store context and the Zeann blue theme when Zeann is. This supersedes the DEC-031 rule that the admin shell keeps a fixed combined theme ("the filter changes data, never paint") whenever a concrete store is selected.
- **Decision:** The whole admin shell (buttons, header, nav) wears the selected store's theme via the shared `StoreThemeProvider`, which now accepts an all-stores fallback: a concrete store context applies that store's brand theme and browser chrome (Amara brown, Zeann blue); the "All stores" default keeps the fixed navy combined theme. The header still never renders a single-store badge (DEC-041 unchanged).
- **Related documents:** `src/theme/StoreThemeProvider.tsx`, `src/app/layouts/AdminLayout.tsx`, `docs/UI-UX.md` §9.1.

### DEC-045 — Charge-sale down payments ride the payment flow

- **ID:** DEC-045
- **Title:** Charge-sale down payments ride the payment flow
- **Status:** Accepted
- **Date:** 2026-09-21
- **Context:** The client asked that charge sales not require a mode of payment (the customer buys on credit), then raised the case where a customer hands over an initial/down payment at the sale. A down payment is semantically a payment against the credit obligation, and the existing payment model already supports partial payments with method and store attribution.
- **Decision:** Charge sales store no mode of payment. The cart gains an optional "Down payment (₱)" field for charge sales; when a down payment greater than zero is entered, the Mode of payment appears (required — something is being paid now). On save, the sale is recorded first (no payment method stored), then the down payment is recorded through the existing `record_payment` flow against the obligation created for that sale (found by sale id) — a proper payment-history entry with a reduced balance. No schema change. Failure handling is honest: if the payment step fails after the sale succeeds, an error popup says the sale was recorded and directs to the credit page to retry; the sale is never rolled back or lost.
- **Consequences:** Two sequential writes (sale, then payment) are not one transaction — the retry path covers the gap. Client-side validation mirrors the server (down payment ≥ 0, ≤ net total; method required when a down payment is taken).
- **Related documents:** `src/features/sales/SaleCartPage.tsx`, `src/services/paymentService.ts`, `docs/DATA-MODEL.md` (no change).

### DEC-046 — Dashboard, sales, and checkout UX refinements

- **ID:** DEC-046
- **Title:** Dashboard, sales, and checkout UX refinements
- **Status:** Accepted
- **Date:** 2026-09-21
- **Context:** Client refinement requests after live use: dashboard stock lists grow unbounded; admins must visit More just to switch stores on sales pages; the sale catalog hides how much stock is on hand; adding a customer from the cart gives no completion feedback.
- **Decision:** (1) The admin dashboard's Current stock and Received stock lists preview at most five rows, each with a "View all" button navigating to Inventory and Receiving respectively (both respect the active store context). (2) The admin-only `StoreControl` quick switch also renders on the admin sales list and the New Sale catalog — More remains the central switch (DEC-040 context), sales surfaces gain a shortcut. (3) Sale-catalog product cards show the on-hand quantity for the selling store ("On hand: N"; a priced product with no stock row shows 0). Display only — oversell is still refused atomically by the database. (4) Adding a customer from the cart closes the dialog, selects the new customer, and confirms with the "Customer added." popup — after OK the user is back on the cart.
- **Related documents:** `src/features/dashboard/AdminDashboardPage.tsx`, `src/features/sales/SaleListPage.tsx`, `src/features/sales/NewSalePage.tsx`, `src/features/sales/SaleCartPage.tsx`.

### DEC-047 — Security hardening from the loophole audit (migration 00007)

- **ID:** DEC-047
- **Title:** Security hardening from the loophole audit (migration 00007)
- **Status:** Accepted
- **Date:** 2026-09-21
- **Context:** A full-system loophole audit (frontend, database, RPC layer, services, business logic) found: any authenticated user could escalate to admin by updating their own `profiles` row (RLS checked only `id = auth.uid()`, not columns); concurrent `record_payment` calls could overpay a credit (read-validate-write without a lock or predicate); disabled accounts kept full data access (no policy checked `active`, approve/reject skipped the active-caller check, disabling did not revoke sessions); `record_sale` accepted delivery riders/vehicles from the wrong store and accepted arbitrary client unit prices although the automatic-price rule (docs/UI-UX.md "no manual price entry") is confirmed; raw unique-violation messages leaked database internals; staff management and vehicle creation left no audit trail; the adopted unique-active-name baseline (DEC-034) was unenforced.
- **Decision:** Migration `00007` (local-verified via the full Gate-4 proof suite, 16/16): (C1) drop `profiles update own` — all profile mutations go through admin-only functions; (C2) `record_payment` decrements with a guarded atomic `UPDATE` (`balance_minor >= amount` re-checked under the row lock); (H1) every data policy requires an active caller profile (profiles policies unchanged so disabled accounts remain detectable and re-enableable), approve/reject run `assert_active_caller`, disabling revokes live sessions; (H2) `record_sale` validates delivery rider/vehicle as active at the selling store; (M1) `record_sale` derives unit prices server-side from the product's most recent priced receiving record at the store and returns the authoritative lines — the client no longer sends prices, and zero-amount charge sales are refused (they would create an unpayable outstanding credit); (M6) submit/approve enforce unique active product names; (M3) `create_staff`/`update_staff`/`create_vehicle` write audit events, and audit rows carry the actor's role via a trigger (`actor_role` column). Client side: unique-violation errors map to plain-language conflict copy, sign-in distinguishes a failed profile read from a disabled account, the audit page falls back to "Admin" for unresolvable actor names, and the mock sale path mirrors server price derivation.
- **Rationale:** Each fix closes a server-side boundary, not a UI symptom; the confirmed automatic-price rule and the DEC-034 assumed baseline become enforced instead of aspirational. The trigger-based actor-role denormalization avoids rewriting every audit-writing function and stays correct for future ones.
- **Consequences:** The hosted project needs `supabase db push` (blocked this session by an expired access token — run `npx supabase login` then push; Phase-8 deploy checklist item). Weak-password floor (4 chars), last-admin self-disable guard, and detect* repo housekeeping remain flagged for the client / cleanup, not silently changed. `docs/SECURITY.md` §3/§4/§5 and `docs/API.md` §5/§10 updated to reflect enforced behavior.
- **Related documents:** `supabase/migrations/20260921090000_00007_security_hardening.sql`, `supabase/proofs/gate4.sql`, `src/services/saleService.ts`, `src/services/userService.ts`, `src/services/auditService.ts`, `docs/SECURITY.md`, `docs/API.md`.

### DEC-048 — Existing credit encoding, approved inventory lock, per-store admin selection (migration 00008)

- **ID:** DEC-048
- **Title:** Existing credit encoding, approved inventory lock, per-store admin selection (migration 00008)
- **Status:** Accepted
- **Date:** 2026-09-21
- **Context:** Client change requests while the business is live on the system (real stock rows and data exist; all schema changes had to be additive and backward compatible). (1) Customers carry credit balances from before the system existed and the admin needs a way to encode them — without any stock effect, since inventory must move only through real sales. (2) Once inventory has been approved by the admin, store staff should no longer edit it; only the admin should. (3) The combined "All stores" option should disappear from the admin's store selection (named surfaces: Sales, Receiving Stocks, and the More-page control), with Zeann as the default store.
- **Decision:** Migration `00008`, local-verified through the extended Gate-4 proof suite (18/18) plus `db advisors`/`db lint`. (1) `credit_obligations.terms_id` becomes nullable; new admin-only RPC `create_existing_credit(customer, store, amount, due_date)` inserts a balance-only obligation — no sale, no terms, no stock or receiving effect — with a `credit.imported` audit event; payments against it ride the unchanged `record_payment` flow. Encoded credits are immutable (payments only), matching sale-created credits. (2) `stock_levels.admin_approved` (default false — existing live rows start unapproved, preserving DEC-032 behavior until an admin approves); new admin-only RPC `approve_stock` (idempotent, `stock.approved` audit event); `adjust_stock`/`delete_stock` refuse staff calls on approved rows ("Approved inventory can only be changed by an admin.") while admin calls and receiving into approved rows remain allowed. UI: "Approve" action for admins, "Approved"/"Admin-managed" indicators, staff lose Edit/Delete on approved rows. (3) `StoreControl` offers only Amara and Zeann on every surface (More included); the admin store context defaults to Zeann (`DEFAULT_ADMIN_STORE`), superseding the DEC-041 "All stores" default. This amends DEC-032 (staff manual stock edits now stop at admin-approved rows) and supersedes DEC-041 (default) and DEC-044's All-stores navy paint (unreachable); the remaining `allMode` code paths stay in place as dead-but-harmless pending a future cleanup. The History page's "All stores" audit filter is a data filter, not a store context, and is unchanged.
- **Alternatives considered:** Receiving-batch approval — rejected: one stock row can combine approved and unapproved receipts, so a row-level lock is the only clean boundary. Removing staff manual stock editing entirely — rejected: contradicts the confirmed DEC-032 correction path for unapproved stock. Page-local store state for Sales/Receiving — rejected: breaks the single global context the cart, paint (DEC-044), and receiving forms are built on.
- **Rationale:** Each change is enforced at the data layer (RPC role/flag checks), not in the UI; additive schema keeps the client's live data untouched; encoding credit without a sale makes the no-stock-effect guarantee structural.
- **Consequences:** Hosted rollout needs `npx supabase login` + `supabase db push` (00007 and 00008 together) and a frontend deploy; until then the hosted RPCs behave per 00006. `docs/DATA-MODEL.md` §§4.6/4.8, `docs/API.md` §5, and `docs/UI-UX.md` §§7.3/7.4/store paint updated.
- **Related documents:** `supabase/migrations/20260921120000_00008_client_change_requests.sql`, `supabase/proofs/gate4.sql`, `src/services/creditService.ts`, `src/services/inventoryService.ts`, `src/features/credit/ExistingCreditDialog.tsx`, `src/features/inventory/InventoryPage.tsx`, `src/features/shared/StoreControl.tsx`, `src/store/StoreProvider.tsx`, `docs/DATA-MODEL.md`, `docs/API.md`, `docs/UI-UX.md`.

### DEC-049 — Credit details, price editing, sale deletion, customer edit/delete, My Account (migration 00009)

- **ID:** DEC-049
- **Title:** Credit details, price editing, sale deletion, customer edit/delete, My Account (migration 00009)
- **Status:** Accepted
- **Date:** 2026-09-21
- **Context:** Client revisions while live: (1) encoded existing credits need complete transaction details like sales (customer, date, items the customer received, quantity, price, total, partial payment, balance) — still with zero inventory effect; (2) inventory quantity and price must be editable where permitted (price currently was not editable — no per-store editable price existed); (3) admins need to delete mistaken sales with correct handling of stock, credit, and payments; (4) customers need editing and safe deletion; (5) the admin needs to change their own username and password from a dedicated "My Account" page.
- **Decision:** Migration `00009`, verified by the extended Gate-4 proof suite (22/22) plus `db advisors`/`db lint`. (1) `sales.is_legacy` (default false): `record_existing_credit` (admin-only) creates a legacy sales row whose sale lines carry the item details with admin-supplied historical prices, an admin-set due date with no terms, and an optional initial partial payment through the guarded payment logic — stock is never touched, and every sales list, dashboard, and report filters `is_legacy = false` so encoded credits appear only under Credit; the credit detail page shows the items for all credits. Supersedes the balance-only encoding of DEC-048. (2) `stock_levels.price_minor` (nullable) is the store's current selling price: receiving maintains it, sale pricing (server + catalog display) reads it first and falls back to the latest priced receiving record (live rows unaffected); `adjust_stock` gains an optional price parameter behind the DEC-048 approval lock. (3) `delete_sale` (admin-only) refuses sales whose credit has recorded payments, restores stock per line inside the transaction, and removes the unpaid credit with a `sale.deleted` audit event; legacy rows are not deletable from Sales. (4) `update_customer` (any active user) and `delete_customer` (refused when sales or credit references exist) with `customer.updated`/`customer.deleted` audit events. (5) `update_own_account` verifies the current password for any change, syncs the auth identity on username change, keeps the current session alive, writes `account.updated`; the admin-only My Account page (`/admin/account`, linked from More) hosts the forms and warns that the username change alters the sign-in handle.
- **Alternatives considered:** Free-text item names on encoded credits — rejected: duplicates the sale-lines model; new products can be submitted first. Editable past receiving records — rejected: falsifies purchase history; the stock-row price is the live, editable surface. Staff sale deletion — rejected: financial records stay admin-corrected. Allowing encoded legacy "sales" into summaries — rejected: would inflate revenue.
- **Rationale:** All four changes are enforced at the data layer with the house RPC pattern; the no-stock-effect guarantee for encoding is structural (the RPC never touches stock), and payment-protected history makes sale deletion safe by construction.
- **Consequences:** Delete-sale skips stock restore if a stock row were missing (structurally impossible via the DEC-032 guard; noted edge). Mock audit parity skips `account.updated`/`credit.imported` (server-written). Hosted rollout needs `supabase db push` (00007–00009) plus a frontend deploy in one maintenance window. Weak-password floor (4) and staff self-service account edits remain flagged for the client. `docs/DATA-MODEL.md` §§4.2/4.4/4.6/4.8, `docs/API.md` §5, `docs/UI-UX.md` §§7.1–7.4/store paint updated.
- **Related documents:** `supabase/migrations/20260921150000_00009_client_revisions.sql`, `supabase/proofs/gate4.sql`, `src/services/creditService.ts`, `src/services/saleService.ts`, `src/services/customerService.ts`, `src/services/userService.ts`, `src/features/account/MyAccountPage.tsx`, `docs/DATA-MODEL.md`, `docs/API.md`, `docs/UI-UX.md`.

- **Technology:** adoptions and changes link to `docs/TECH-STACK.md`; conditional items stay conditional until activated by confirmation, documented here when activated.
- **Architecture:** changes recorded here and linked to `docs/ARCHITECTURE.md`; no schemas, endpoints, or components defined.
- **Security:** approaches linked to `docs/SECURITY.md`; rules never weakened; no invented detail; trade-offs state constraint, mitigation, and residual follow-up.
- **Data/API:** boundary changes linked to `docs/DATA-MODEL.md` and `docs/API.md`; conditional features require confirmation first; no invented contracts.
- **Testing/development:** unestablished tooling stays undecided until recorded here with rationale, then reflected in the owning file; no invented tooling in implementation or reports.
- **Deployment:** direction recorded at decision level; procedures belong in `docs/DEPLOYMENT.md`.

No new technical choices are created in this section.

## 10. Superseding, Evidence, and Unresolved Decisions

Never silently rewrite history — mark the old record Superseded with a Superseded-by reference, create a new record with rationale and Supersedes reference, explain the cause, update owning files (history here, current truth there); rejections follow the same discipline. Prefer evidence (implementation, owning docs, client confirmation, verification results, documented constraints); reports distinguish verified outcomes from assumptions; unconfirmed items stay labeled; reference material stays Reference-Only. Unresolved choices stay Proposed/Revisit Required with the revisit trigger stated; dependent implementation waits or proceeds only on the smallest explicitly reported assumption, which never changes the record's status.

## 11. Scope Exclusions and Reference Boundary

This file never becomes a requirements document, business-context document, implementation guide, deployment manual, testing plan, business-content source, or venue for speculative architecture (unconfirmed ideas stay Proposed/Revisit Required with triggers). Consistent with project-wide exclusions, records here introduce no excluded platform scope unless explicitly rescoped: no advanced accounting, CRM, payroll/HR, payment gateways, unrelated integrations, advanced inventory systems, or complex analytics. No legacy or reference material is defined for this project; if any arises (defined in `docs/PROJECT.md`), it is Reference-Only — never a decision or requirement — citable only as labeled background with carryover marked Confirmation Required.

## 12. Related Documentation

- `README.md` — repository orientation
- `AGENTS.md` — AI-agent operating rules
- `docs/PROJECT.md` — product and business context
- `docs/REQUIREMENTS.md` — functional and business requirements
- `docs/TECH-STACK.md` — technology decisions
- `docs/ARCHITECTURE.md` — architecture
- `docs/UI-UX.md` — experience requirements
- `docs/DATA-MODEL.md` — data concepts and boundaries
- `docs/API.md` — operation behavior and integration boundaries
- `docs/SECURITY.md` — security requirements and constraints
- `docs/TESTING.md` — verification strategy
- `docs/DEVELOPMENT.md` — development workflow (hierarchy owner for conflict resolution)
- `docs/DEPLOYMENT.md` — deployment procedures
- `docs/DECISIONS.md` — material decisions (this file)
