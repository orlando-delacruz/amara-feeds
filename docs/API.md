# Amara + Zeann Store Management System — API and Integration Contracts

## 1. Purpose and Scope

This file defines the application-to-data-platform responsibilities and boundaries: which operations the application performs, which enforcement belongs to the server/data layer, request/response principles, validation, errors, admin operations, and integration responsibilities — at the conceptual level.

It explicitly does NOT define endpoint URLs, HTTP methods, payload schemas, field names, limits, table definitions, RLS policies, SQL functions, credentials, IDs, configuration values, or copy. Those belong to implementation, with contracts detail in this file's successors, data concepts in `docs/DATA-MODEL.md`, and policy detail in `docs/SECURITY.md`.

The selected architecture (see `docs/TECH-STACK.md`, `docs/ARCHITECTURE.md`) uses the application with Supabase directly; no custom REST API layer exists. This document therefore describes the application-to-Supabase data-access boundary, not a conventional endpoint catalog. No custom backend is invented here.

## 2. Terminology

- **Operation:** an authenticated application action against the data platform (e.g. record a sale, record a payment, receive stock, submit or approve a product, retrieve a summary).
- **Store context:** the Amara-or-Zeann scope traveling with the staff user's session.
- **Shared record:** customer identity, credit obligations, and payment history usable across both stores.
- **Store-specific record:** sales, inventory, and receiving records belonging to one store.
- **Privileged operation:** product approval and business-wide review, reserved for admin authorization.
- **Caller:** authenticated staff (store-scoped) or authenticated admin (business-wide). There is no public/anonymous operational caller.

Status labels follow `TEMPLATE-GUIDE.md`: Confirmed, Conditional, Confirmation Required, Reference-Only.

## 3. Authority Boundaries

| Concern | Owner |
| --- | --- |
| What the system must do | `docs/REQUIREMENTS.md` |
| Architecture and data flows | `docs/ARCHITECTURE.md` |
| Concepts and data boundaries | `docs/DATA-MODEL.md` |
| **Operation behavior, request/response principles, validation, integration boundaries** | **This file** |
| Auth behavior, authorization, secret handling | `docs/SECURITY.md` |
| Verification strategy | `docs/TESTING.md` |
| Deployment procedures | `docs/DEPLOYMENT.md` |

## 4. API Principles

1. One data-access boundary: the application reaches data only through the authenticated Supabase boundary; no second backend exists.
2. Server/data-layer validation and enforcement are authoritative; client-side checks never substitute for them.
3. Client-side validation is usability only — fast, plain-language feedback before an operation is attempted.
4. Concepts before contracts — operation responsibilities are specified here; wire formats and exact structures are deferred until confirmed.
5. Smallest useful surface — only operations the agreed core scope needs.
6. Shared stays shared and store-specific stays store-specific across every operation; no operation duplicates shared records per store.

## 5. Request Contract (Conceptual Level)

Candidate operation groups, described conceptually — never field names or schema keys:

- **Customer operations:** find or select an existing shared customer; add a new shared customer during a sale or from the customer area. Customer selection is optional for sales.
- **Sale operations:** record a store-specific sale with optional customer, purchased items and quantities, cash-or-charge payment type, and delivery details when applicable.
- **Credit operations:** raise a shared credit obligation from a charge sale under selected payment terms with an automatically calculated due date.
- **Payment operations:** record full or partial payments against shared credit through either store, preserving the payment store within the shared history.
- **Inventory operations:** read store-specific stock; stock changes only through sale deduction and receiving operations, never direct edits.
- **Receiving operations:** record store-specific receipts with store, item, quantity, supplier, and purchase/cost price.
- **Product operations:** staff submit products (entering pending state); admin approves products into active state.
- **Staff/user operations:** individual store-assigned identities; admin business-wide oversight.
- **Dashboard/report operations:** retrieve daily sales by store, overall daily sales, outstanding credit, payments, current stock, and received stock; export and printing derive from the same permitted summaries.

Final operation sets, required-vs-optional inputs, and option lists are Confirmation Required. Collection rules: no extra personal-data kinds without justification.

## 6. Response Behavior

- Success is reported only when the operation — including its data-layer effects (stock deduction, balance update, approval transition) — actually succeeded; never false success.
- Validation failure returns plain-language, input-identifying feedback with the operation not persisted.
- Unauthorized or forbidden operations are denied without revealing the existence or content of unpermitted records.
- Missing records resolve into plain feedback with a path back to a valid area, not technical detail.
- Network failure offers retry guidance with entered input preserved where practical.
- Database/service failure resolves into explicit failure with next-step guidance and no exposed internals.
- Exact shapes, codes, and copy are implementation detail and belong downstream.

## 7. Duplicate-Submission and State Behavior

- Saving a sale, recording a payment, receiving stock, and approving a product guard against accidental repeated submission (repeat triggers disabled while an operation is in progress; exactly one outcome per attempt).
- Entered input is preserved on recoverable failures.
- No idempotency mechanisms, retry windows, or rate limits are invented here; those are Confirmation Required and belong to implementation plus `docs/SECURITY.md`.

## 8. Third-Party Service Boundaries

No confirmed third-party functional integration exists. The only platform boundaries are:

- **Supabase platform:** owns identity, structured data access, and database-side integrity/enforcement execution; the application owns presentation and input. Schemas, policies, and functions are deferred to implementation, `docs/DATA-MODEL.md`, and `docs/SECURITY.md`.
- **Vercel hosting:** owns static delivery of the built client; no runtime behavior crosses this boundary.
- **GitHub:** owns versioning and review; nothing runtime crosses this boundary.

No payment gateways, email/SMS services, analytics, external CRM, or notification platforms are selected; none is documented here.

## 9. Admin Operations

Authenticated, authorized admin operations within confirmed scope: access protected management functions; review and manage confirmed business data across both stores; approve pending products into active state; oversee credit/payment and inventory/receiving information; access dashboard summaries with export and printing. Server-side enforcement applies to every admin operation; admin scope never becomes enterprise machinery. Exact operations, structures, and permission detail are Confirmation Required; policy detail belongs in `docs/SECURITY.md`.

## 10. Data-Platform Interaction Boundaries

- **Structured application data:** all reads and writes pass through authenticated, authorized, validated data-platform operations; anonymous callers never reach operational data.
- **Authentication foundation:** individual staff and admin identity via Supabase Auth; session/store-context handling deferred to `docs/SECURITY.md` and implementation.
- **Database-side integrity/enforcement:** atomic sale-with-deduction, payment-with-balance-update, approval-gated activation, and store-scoped access execute at the data layer where appropriate; exact mechanisms (transactions, functions, policies, triggers) are implementation detail, not defined here.
- **File storage:** no managed file/media storage is confirmed; none is defined here.

## 11. Error Handling and Failure Boundaries

- Every visible failure resolves into clear non-technical feedback with next-step guidance; user-facing messages and server-side diagnostics are strictly separated.
- Business-rule failures (e.g. an operation that would violate store scope, approval gating, or credit consistency) are denied as failures, never persisted as successes.
- Failed sales, payments, inventory updates, receiving, and approval operations never misleadingly appear successful.
- Entered data is preserved where practical after recoverable failures.
- No database errors, credentials, secrets, or implementation internals are exposed to users. Visual treatment belongs in `docs/UI-UX.md`; policy detail in `docs/SECURITY.md`.

## 12. Validation Principles

- All input is validated; the server/data layer enforces, the client assists with fast feedback.
- Invalid operations are never persisted as successful.
- Business-critical consistency (store scope, approval gating, shared-credit integrity, atomic stock/balance effects) is enforced beyond the UI.
- Approval is never replaced by validation: a valid product submission still enters pending state until admin approval.
- Validation invents no unsupported rules — no field formats, numeric limits, payment methods, term options, stock thresholds, or rate limits are defined here.
- Errors are communicated in text associated with the relevant input, with focus management per `docs/UI-UX.md`.

## 13. Security Boundaries

High-level boundaries only; detail belongs in `docs/SECURITY.md`:

- No secrets in client source or the repository.
- All operations are authenticated; anonymous users are never treated as staff.
- Staff operations are associated with their assigned store; admin access spans the required business-wide scope.
- Authorization is enforced at the backend/data boundary, never by the frontend alone.
- Sensitive data is not unnecessarily exposed; internal diagnostics are never returned to users.
- Environment-specific secrets remain outside source control.

## 14. Confirmation Required Matrix

| # | Item | Status | Notes |
| --- | --- | --- | --- |
| 1 | Exact operation inputs and required/optional designation | **Confirmation Required** | Concepts only; no names or formats defined here. |
| 2 | Exact payment-term options and payment calculations | **Confirmation Required** | Selected-terms workflow confirmed; options and rules unconfirmed. |
| 3 | Per-input validation rules | **Confirmation Required** | Principles only. |
| 4 | Sale editing, cancellation, and reversal behavior | **Confirmation Required** | Affects sale, stock, and credit operations. |
| 5 | Inventory failure and insufficient-stock behavior | **Confirmation Required** | No thresholds or rules assumed. |
| 6 | Duplicate customer handling | **Confirmation Required** | One-shared-record principle confirmed; handling unconfirmed. |
| 7 | Product rejection, editing, and resubmission behavior | **Confirmation Required** | Only pending-to-approved is confirmed. |
| 8 | Exact report/export behavior (columns, formats) | **Confirmation Required** | Summaries confirmed; exact behavior unconfirmed. |
| 9 | Detailed permissions | **Confirmation Required** | Only store assignment and product approval confirmed. |
| 10 | Exact data-access implementation structure | **Confirmation Required** | Boundary defined here; mechanisms deferred. |
| 11 | Abuse controls beyond basic duplicate-submission prevention | **Confirmation Required** | Behavior confirmed; numeric controls not established. |

## 15. Explicit Exclusions

Unless explicitly rescoped, this surface does NOT include: public submission operations; public content operations; reservation/booking operations; CRM, payroll/HR, or accounting-system operations; payment gateway integrations; unnecessary automation services; a second backend/API infrastructure; or enterprise integration machinery. Authority: `docs/PROJECT.md` §13 and `docs/REQUIREMENTS.md` §18.

## 16. Related Documentation

- `README.md` — repository orientation
- `AGENTS.md` — AI-agent operating rules
- `docs/PROJECT.md` — product and business context
- `docs/REQUIREMENTS.md` — functional and business requirements
- `docs/TECH-STACK.md` — technology decisions
- `docs/ARCHITECTURE.md` — architecture
- `docs/UI-UX.md` — experience requirements
- `docs/DATA-MODEL.md` — data concepts and boundaries
- `docs/API.md` — operation behavior and integration boundaries (this file)
- `docs/SECURITY.md` — security
- `docs/TESTING.md` — verification strategy
- `docs/DEVELOPMENT.md` — development workflow
- `docs/DEPLOYMENT.md` — deployment procedures
- `docs/DECISIONS.md` — material decisions
