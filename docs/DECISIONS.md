# Amara + Zeann Store Management System — Decision Records

## 1. Purpose and Scope

This file preserves important architectural, technical, and implementation decisions for the Amara + Zeann Store Management System: what was decided, why, alternatives, consequences, related documents, and lifecycle status. It supports scope discipline, simplicity, maintainability, and avoidance of unnecessary infrastructure appropriate to the ₱10,000 core-first project. Each record explains the choice, rationale, trade-offs, alternatives, consequences, related documents, and lifecycle status. This file is never a requirements document, implementation guide, or business-content source.

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
| DEC-007 | Sign-in entry brand and two-store treatment | Accepted | 2026-09-10 |
| DEC-008 | App-like shell, shared UI primitives, and responsive record lists | Accepted | 2026-09-10 |

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
- **Consequences:** The session is in-memory and resets on reload. Real authentication and authorization replace the mock in Phases 4–5. `useAsyncData`/`useMutation` are the conventions feature pages should follow.
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
- **Supersedes / Superseded by:** none.
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
- **Supersedes / Superseded by:** none.
- **Open questions or follow-up:** None; dark mode and webfonts stay deferred.

## 9. Per-Area Handling

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
