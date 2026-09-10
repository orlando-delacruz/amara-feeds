# Amara + Zeann Store Management System — Technology Stack

Source context (authoritative for their concerns): `docs/PROJECT.md` (business context), `docs/REQUIREMENTS.md` (what the system must do), `docs/UI-UX.md` (experience behavior), `AGENTS.md` (rules and scope control).

Status labels (see `TEMPLATE-GUIDE.md`): **Selected** — confirmed direction. **Conditional** — used only if a confirmed requirement needs it. **Recommended** — preferred approach, subject to detail. **Not Selected** — intentionally avoided. **Requires Confirmation** — depends on business confirmation.

## 1. Technology Selection Principles

1. Prefer a managed backend over custom backend infrastructure; no server code is maintained unless a confirmed requirement demands it.
2. Enforce security-sensitive rules and critical data integrity server-side (database-level), never in frontend code alone.
3. Prefer type safety across the client to catch data-shape mistakes early in an AI-assisted workflow.
4. Keep client-side code and styling co-located with components; add libraries only where genuinely needed.
5. Reuse selected technologies before introducing new ones.
6. Avoid unnecessary dependencies, services, infrastructure, and abstractions.
7. Keep the scope proportional to the ₱10,000 initial/core budget and the September 30, 2026 target.

## 2. Stack Summary

| Area | Technology / Service | Status | Role |
| --- | --- | --- | --- |
| Frontend framework + build | React + Vite | Selected | Mobile-primary internal application UI and fast development builds |
| Language | TypeScript | Selected | Type-safe client code |
| Styling | Styled Components | Selected | Co-located component styles |
| Routing | React Router | Selected | Client-side navigation for the staff and admin surfaces (DEC-002) |
| Backend / platform | Supabase | Selected | Managed backend: data access, business-rule enforcement point, file/export support surface |
| Database | PostgreSQL via Supabase | Selected | System of record for shared and store-specific data |
| Authentication | Supabase Auth | Selected | Individual staff and admin accounts |
| Authorization / data protection | PostgreSQL Row Level Security | Selected | Server-side enforcement of store assignment and admin-wide access, where appropriate |
| Critical data operations | PostgreSQL transactions / database functions | Selected | Atomic sale-to-stock and payment-to-balance updates |
| Hosting / deployment | Vercel | Selected | Static frontend hosting with preview deployments |
| Source control | GitHub | Selected | Version control and collaboration |
| Package manager | npm | Selected | Dependency management |
| Database migrations | Supabase migrations | Selected | Versioned, reviewable schema changes |
| Component / unit testing | Vitest + React Testing Library | Selected | Verification of workflows and UI behavior |
| Critical end-to-end testing | Playwright | Conditional | Critical-path E2E (sale, payment, approval) only if budget and schedule permit |
| Excel export library | Undecided | Requires Confirmation | Selected only after report columns and formats are confirmed |
| Analytics | None | Not Selected | No confirmed requirement |
| Notifications / email | None | Not Selected | No confirmed requirement |

## 3. Per-Area Detail

### Frontend + build — Selected

- **What:** React with Vite.
- **For:** the mobile-primary staff and admin application (dashboard, sales, customers, credit/collection, inventory, receiving, products, reports).
- **Why:** component model fits the form-heavy operational workflows (REQ-SALE-002, REQ-DASH-001–006); Vite keeps builds fast for an AI-assisted workflow within the core budget and timeline.

### Language — Selected

- **What:** TypeScript.
- **For:** type-safe client code across sales, credit, inventory, and reporting flows.
- **Why:** catches data-shape mistakes early (shared vs store-specific records, balances, statuses) without added infrastructure; supports REQ-STATE-001 feedback and REQ-ACC-001 mobile reliability.

### Styling — Selected

- **What:** Styled Components.
- **For:** co-located component styles for the internal application.
- **Why:** keeps styling next to the components an AI coding agent generates, avoiding a separate styling architecture; behavior and responsive expectations come from `docs/UI-UX.md`, which this choice does not alter.

### Routing — Selected

- **What:** React Router.
- **For:** client-side navigation across the confirmed application areas for both staff and admin surfaces (`docs/UI-UX.md` §5–6).
- **Why:** the smallest established solution for a client-rendered SPA with no server routing; visual values for the routed shells come from `docs/DESIGN-SYSTEM.md`, and the selection is recorded in `docs/DECISIONS.md` (DEC-002).

### Backend / platform — Selected

- **What:** Supabase as the managed backend.
- **For:** data access and the enforcement point for business rules; no custom server is maintained.
- **Why:** eliminates custom backend infrastructure and operational overhead the ₱10,000 core scope cannot justify, while providing Postgres, Auth, and migration tooling in one platform.

### Database — Selected

- **What:** PostgreSQL via Supabase.
- **For:** the system of record for shared customers, store-specific sales and inventory, shared credit/collection with origin/payment-store history, receiving records, products with approval states, and store-assigned accounts.
- **Why:** relational integrity suits the confirmed rules directly — shared customers (REQ-CUST-001), store-specific sales/inventory (REQ-SALE-001, REQ-INV-001), shared credit with traceable history (REQ-CRED-006, REQ-CRED-007), and structured receiving (REQ-RCV-001).

### Authentication — Selected

- **What:** Supabase Auth.
- **For:** individual staff accounts and admin accounts (REQ-USER-001, REQ-USER-003).
- **Why:** managed accounts without building or operating an auth system; exact permission differences beyond store assignment and product approval remain Confirmation Required (REQ-USER-004).

### Authorization / data protection — Selected

- **What:** PostgreSQL Row Level Security, where appropriate.
- **For:** server-side enforcement of store assignment (REQ-USER-002) and admin-wide access (REQ-USER-003) over customers, sales, credit, inventory, and reports (REQ-SEC-001).
- **Why:** cross-store credit/payment visibility (REQ-CRED-007, REQ-PAY-001) and store-level data separation (REQ-STORE-002) are security-sensitive and must not rely on frontend code alone. Policy detail belongs in `docs/SECURITY.md`; schemas belong in `docs/DATA-MODEL.md`.

### Critical data operations — Selected

- **What:** PostgreSQL transactions / database functions.
- **For:** atomic updates such as sale save with automatic stock deduction (REQ-INV-002) and payment recording with balance/status updates (REQ-PAY-002).
- **Why:** partial writes (sale without deduction, payment without balance update) would violate confirmed business rules; atomicity is enforced at the database level, not in the client.

### Hosting / deployment — Selected

- **What:** Vercel.
- **For:** hosting the static frontend with preview deployments.
- **Why:** zero-operational-overhead hosting proportional to a scope with no confirmed custom server, integrations, or hosting requirements; procedures belong in `docs/DEPLOYMENT.md`.

### Source control — Selected

- **What:** GitHub.
- **For:** version control and collaboration.
- **Why:** standard reviewable workflow for AI-assisted development; decision records continue in `docs/DECISIONS.md`.

### Package manager — Selected

- **What:** npm.
- **For:** dependency management.
- **Why:** default tooling for the selected frontend stack; avoids an additional tooling decision.

### Database migrations — Selected

- **What:** Supabase migrations.
- **For:** versioned, reviewable schema changes.
- **Why:** keeps every data-structure change explicit and auditable, which matters for shared-vs-store-specific records and approval states.

### Component / unit testing — Selected

- **What:** Vitest + React Testing Library.
- **For:** verification of workflow and UI behavior (sale flow, payment recording, receiving, approval states, dashboard summaries).
- **Why:** matches the Vite + React stack with minimal setup; strategy detail belongs in `docs/TESTING.md`.

### Critical end-to-end testing — Conditional

- **What:** Playwright, for critical paths only.
- **For:** sale save with stock deduction, cross-store payment recording, and product approval — only if budget and schedule permit.
- **Why:** E2E is the only way to observe the confirmed acceptance behaviors end to end, but full E2E coverage would exceed the core scope; trigger and scope decisions are recorded in `docs/DECISIONS.md` when made.

## 4. Environment and Configuration Boundaries

- Secrets must not be hardcoded, committed, or exposed in client-side source.
- Sensitive configuration uses environment-appropriate configuration; nothing sensitive is committed.
- Store assignment, admin-wide access, approval gating, and balance integrity are enforced server-side (database level), never by frontend checks alone.
- No credentials, keys, IDs, or environment values appear in this file.

## 5. Technologies Not Selected

| Technology | Why not selected |
| --- | --- |
| Custom backend service | Supabase already provides data access, auth, and enforcement; no confirmed requirement justifies operating a separate server. |
| Server-side-rendering framework | The system is an internal operational app, not a content/discoverability surface; no confirmed requirement justifies server rendering. |
| Native mobile apps | The confirmed requirement is a mobile-primary web application (REQ-ACC-001); no confirmed requirement justifies native builds. |
| Payment gateways / online payments | Explicitly out of scope (REQ-OOS-004); payments are recorded collections, not processed transactions. |
| Analytics service | No confirmed requirement (out-of-scope complex analytics, REQ-OOS-007). |
| Notifications / email service | No confirmed requirement justifies the complexity. |
| Standalone CMS or admin framework | Admin needs are the confirmed dashboard, approvals, and reports; no confirmed requirement justifies a separate CMS. |
| Advanced inventory or accounting systems | Explicitly out of scope (REQ-OOS-001, REQ-OOS-006). |

## 6. Technical Constraints

1. The ₱10,000 initial/core budget and September 30, 2026 target require core-first delivery; the stack adds no service, dependency, or infrastructure beyond what the confirmed requirements need.
2. The stack must respect the confirmed scope: shared customers and credit, store-specific sales and inventory, partial and cross-store payments, automatic stock deduction, product approval, store-assigned staff, and admin reporting with Excel export and printing.
3. No versions are pinned here; versions come from the repository.
4. No implementation detail is invented here: no schemas, contracts, IDs, URLs, credentials, report formats, or validation rules.
5. No outcome guarantees beyond what `docs/REQUIREMENTS.md` states.

## 7. Conditional / Future Technology Decisions

1. Playwright E2E — adopted for critical paths only if budget and schedule permit; scoped and recorded in `docs/DECISIONS.md` when triggered.
2. Excel export library — selected only after report columns and formats are confirmed (REQ-REP-003); printing uses browser print with no additional technology.
3. Any integration, notification, analytics, or third-party service — adopted only if a confirmed requirement needs it; none authorizes scope expansion on its own, and each change is recorded in `docs/DECISIONS.md` when made.

## 8. Related Documentation

- `README.md` — repository orientation
- `AGENTS.md` — AI-agent operating rules
- `docs/PROJECT.md` — product and business context
- `docs/REQUIREMENTS.md` — functional and business requirements
- `docs/TECH-STACK.md` — technology decisions (this file)
- `docs/ARCHITECTURE.md` — architecture
- `docs/UI-UX.md` — experience requirements
- `docs/DATA-MODEL.md` — data structure
- `docs/API.md` — contracts
- `docs/SECURITY.md` — security
- `docs/TESTING.md` — verification strategy
- `docs/DEVELOPMENT.md` — development workflow
- `docs/DEPLOYMENT.md` — deployment procedures
- `docs/DECISIONS.md` — material decisions
