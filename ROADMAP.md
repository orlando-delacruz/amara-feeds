# Amara + Zeann Store Management System — Implementation Roadmap

## 1. Purpose

This document is the authoritative guide for **implementation sequence and phase dependencies**: what gets built in what order, what each phase depends on, where the validation gates are, how the project transitions from centralized mock data to the real database, and how it proceeds through hardening and deployment.

Other documentation remains authoritative for its subject matter and is not duplicated here: business context in `docs/PROJECT.md`, requirements in `docs/REQUIREMENTS.md`, behavior in `docs/UI-UX.md`, technology in `docs/TECH-STACK.md`, architecture in `docs/ARCHITECTURE.md`, data concepts in `docs/DATA-MODEL.md`, operation boundaries in `docs/API.md`, security in `docs/SECURITY.md`, verification in `docs/TESTING.md`, workflow in `docs/DEVELOPMENT.md`, deployment in `docs/DEPLOYMENT.md`, formal decisions in `docs/DECISIONS.md`, agent rules in `AGENTS.md`.

## 2. Implementation Methodology

```text
Documentation
      ↓
Frontend Foundation
      ↓
Centralized Mock Data
      ↓
Frontend Business Workflows
      ↓
Frontend Workflow Validation
      ↓
Database
      ↓
Backend/API/Data Operations
      ↓
Mock → Real Integration
      ↓
Real-System Validation
      ↓
Hardening + Deployment
```

This order is used because the dominant project risks are workflow and comprehension risks (shared-vs-store-specific mental model, cross-store payment traceability, approval gating, mobile data-entry usability), not infrastructure risks — the infrastructure is already decided (Supabase-direct, no custom server). Validating user experience and business workflows against centralized mock data surfaces defects while fixes are still cheap (a component edit, not a migration plus policy plus UI rewrite). The service-layer seam then makes the mock→Supabase swap a bounded operation, and integrity/authorization properties — which mocks cannot prove — are built and verified afterward at the real data layer.

## 3. Phase Roadmap

### Phase 0 — Frontend Foundation

- **Objective:** Application shell and tooling with zero business logic.
- **Scope:** React + Vite + TypeScript scaffold (npm); Styled Components; routing/application structure; responsive foundation; staff and admin shells with visible Amara/Zeann store context; reusable UI foundations (forms, feedback, dialogs, tables/lists, empty/error states); build/type/lint hygiene; tooling execution decisions (commands, CI intent, coverage stance).
- **Dependencies:** Finalized documentation only.
- **Relevant documentation:** `TECH-STACK.md` §§1–3, `UI-UX.md` §§5–6, 9–12, `ARCHITECTURE.md` §§3.1–3.2, 6–7, `DEVELOPMENT.md` §§5–8.
- **Confirmation Required items:** None blocking. Tooling execution detail is Implementation Decision Required — settle it here.
- **Validation:** Clean build/type/lint; shells render mobile-first with store context; no business data present.
- **Definition of Done:** Scaffold reviewed, tooling recorded, shells demonstrable, nothing invented.

### Phase 1 — Centralized Mock Data Layer

- **Objective:** A single service/data-access seam letting the frontend behave realistically now and swap to Supabase later without UI rewrites.
- **Scope:** One service per confirmed domain (customers, products, sales, credit/collection, payments, inventory, receiving, users/store context, dashboard/report data) backed by centralized mock datasets shaped per `DATA-MODEL.md`: shared customers and obligations usable cross-store; store-scoped sales, inventory, and receiving; origin/payment-store attribution; pending/active product states; store-assigned users and admin scope. UI components consume services only — no business data scattered in components.
- **Dependencies:** Phase 0.
- **Relevant documentation:** `DATA-MODEL.md` §§4–5, 8, `API.md` §5, `ARCHITECTURE.md` §§5–6, `UI-UX.md` §5.
- **Confirmation Required items:** Exact fields — use the smallest shape the confirmed rules require (identity, store refs, quantities, amounts, dates, states) and flag every convenience attribute as Assumed. Terms, validation detail, and formats stay opaque/undeﬁned.
- **Validation:** Every confirmed workflow is expressible through the services (Gate 2); components import services, never raw mock data; service coverage traced to requirement IDs.
- **Definition of Done:** Stable reviewed service contract; mock data demonstrably shared-vs-store-specific.

This mock domain model is intended to become the **working business-domain reference for the later database implementation**: it gives Phase 4 a concrete, validated picture of the concepts, relationships, states, and workflow behavior the database must support. It is **not** the final database schema — the real model is still derived and validated against `REQUIREMENTS.md`, `DATA-MODEL.md`, `ARCHITECTURE.md`, `SECURITY.md`, and the validated workflows.

### Phase 2 — Frontend Business Workflows

- **Objective:** Every confirmed workflow operable end-to-end against mocks, in business-dependency order.
- **Scope:** Store-context/auth experience → customers (select/add, optional per sale) → products + approval (submit → pending → approve → active) → inventory + receiving → sales (customer → items → cash/charge with terms → delivery → review → save) → credit + payments (obligations, partial payments, cross-store recording) → dashboard + reports/export views. Small vertical slices; each workflow complete with feedback and error/empty states before the next begins.
- **Dependencies:** Phase 1 contract; internal business-dependency order as listed.
- **Relevant documentation:** `REQUIREMENTS.md` §§4–13, `UI-UX.md` §§4, 7–8, 12–14, `DEVELOPMENT.md` §§6–7, 11.
- **Confirmation Required items:** Term options, validation rules, report formats, and all edge-case behaviors (edit/cancel/reversal, insufficient stock, duplicates, rejection/resubmission) — accommodated as absent/unconfirmed, never invented.
- **Validation:** Per-workflow operability with success, failure, and empty states; duplicate-submission guards; mobile-first checks.
- **Definition of Done:** All confirmed workflows demonstrable on mocks with evidence; assumption/gap list handed to Phase 3.

### Phase 3 — Frontend Workflow Validation (gate before database work)

- **Objective:** Break and fix workflows while fixes are cheap; produce the confirmation-question list that database design must respect.
- **Scope:** Structured walkthroughs of cross-store payments, sales with stock effects, shared-customer handling, approval gating, receiving, dashboard trust, and the staff/admin split; store-context clarity and shared-vs-specific confusion review; immediate rework and re-walkthrough.
- **Dependencies:** Phase 2.
- **Relevant documentation:** `UI-UX.md` §§2, 14–17, `TESTING.md` §§4–5 (mock-scoped checklists), `DEVELOPMENT.md` §12.
- **Confirmation Required items:** This phase surfaces confirmation questions — record them, do not answer them.
- **Validation:** Walkthrough records (expected vs observed, environment, pass/fail, findings); gate opens Phase 4 only on resolved or explicitly deferred findings. Mock success proves nothing about integrity or authorization.
- **Definition of Done:** Issue list empty or explicitly deferred; confirmation questions updated; written go-ahead for database design.

### Phase 4 — Database

- **Objective:** Real Supabase/PostgreSQL foundation for exactly the validated workflows.
- **Scope:** Schema, relationships, and constraints per `DATA-MODEL.md`; shared vs store-scoped separation with store attribution; pending/active and outstanding/settled states; RLS policies for store assignment and admin-wide access; versioned Supabase migrations. No frontend redesign unless a genuine data-model requirement forces it.
- **Dependencies:** Phase 3 gate; Phase 1 mock shapes as reference input, not schema.
- **Relevant documentation:** `DATA-MODEL.md` §§4–9, 11, `ARCHITECTURE.md` §§3.3–3.4, 4–5, `SECURITY.md` §§3–5, `API.md` §10, `REQUIREMENTS.md`, `SECURITY.md` confirmation matrices.
- **Confirmation Required items:** Exact fields must be finalized-or-explicitly-assumed before migrations are written; detailed permission extras, retention/deletion machinery, and unbuilt-behavior structures stay out.
- **Validation:** Migrations apply/revert cleanly; per-structure boundary review (shared readable cross-store with attribution; scoped records store-bound).
- **Definition of Done:** Reviewed migration set with RLS boundaries, traced to concepts; frontend untouched.

### Phase 5 — Backend/API/Data Operations

- **Objective:** The enforcement the mocks explicitly did not provide, behind the existing service abstraction.
- **Scope:** Atomic sale-with-deduction; payment-with-balance/status update; cross-store attribution; approval-gated activation; store-scoped and admin-wide authorization execution — as database transactions/functions plus RLS. No separate Node/Express backend (none selected or justified).
- **Dependencies:** Phase 4.
- **Relevant documentation:** `ARCHITECTURE.md` §§1, 3, 5, 9, `API.md` §§5, 10, 12, `SECURITY.md` §§3–5, 8, `TECH-STACK.md` §3.
- **Confirmation Required items:** Calculation rules beyond confirmed arithmetic; reversals/edits (not built); field-level validation detail as confirmed.
- **Validation:** UI-independent data-layer proof — successes produce all effects, failures produce none, unauthorized attempts denied without leaking record existence, approval bypass impossible.
- **Definition of Done:** Atomicity and authorization proven at the data layer with evidence.

### Phase 6 — Mock → Real Integration

- **Objective:** Re-point services from mocks to Supabase holding the frontend contract stable; fix mismatches openly.
- **Scope:** Service-by-service replacement in Phase 2 order; mismatch log reviewed per domain (frontend changes where validated UX rested on an Assumed shape; service adaptation for shape-only differences); mocks retired per domain, never left as parallel paths.
- **Dependencies:** Phases 2 (contract) and 5 (real operations).
- **Relevant documentation:** `API.md` §§5–7, 11, `ARCHITECTURE.md` §5, `DEVELOPMENT.md` §§6–7, 11.
- **Confirmation Required items:** Mismatches rooted in Assumed shapes escalate the underlying confirmation question instead of being hidden in adapters.
- **Validation:** Phase 2 demonstrations repeated unchanged against the real backend; mismatch log empty or explicitly justified.
- **Definition of Done:** Zero mock imports on business paths; validated workflows reproducible against Supabase.

### Phase 7 — Real-System Validation

- **Objective:** Prove confirmed lifecycles against the real database and backend.
- **Scope:** Full `TESTING.md` §§4–5 execution: cross-store partial-to-settled lifecycle, atomic sale/stock under failure, RLS negative testing, approval gating, shared-customer visibility, dashboard/report reconciliation, responsive/accessibility baseline, states and recovery.
- **Dependencies:** Phase 6.
- **Relevant documentation:** `TESTING.md` (whole), `SECURITY.md` (checklist), `DEVELOPMENT.md` §11.
- **Confirmation Required items:** Tested only as far as confirmed; remainder reported, never invented into expectations.
- **Validation:** Evidence per check in Implemented/Verified/Not verified/Failed/Blocked/Assumed/Confirmation Required categories.
- **Definition of Done:** All confirmed behaviors Verified with evidence; everything else explicitly categorized.

### Phase 8 — Hardening + Deployment

- **Objective:** Safe, verified, handed-over production system.
- **Scope:** Residual closures (logging/browser-security policy, legal wording); risk-based regression; production Supabase project with reviewed migrations and Auth/RLS verification; `DEPLOYMENT.md` smoke test; client handoff.
- **Dependencies:** Phase 7.
- **Relevant documentation:** `DEPLOYMENT.md` (whole), `TESTING.md` §§6–7, `SECURITY.md` §§6, 9–12, `DEVELOPMENT.md` §§14–16.
- **Confirmation Required items:** Launch approval, account ownership, production-data readiness — closed here, never assumed.
- **Validation:** Production smoke test passes; handoff checklist complete.
- **Definition of Done:** Live system verified and handed over with documented limitations.

## 4. Mock → Database Relationship

Intended layering through Phases 1–3:

```text
UI
 ↓
Service / Data Access Layer
 ↓
Centralized Mock Domain Model
```

After Phases 5–6:

```text
UI
 ↓
Service / Data Access Layer
 ↓
Real Data Operations
 ↓
Supabase / PostgreSQL
```

The mock domain model gives the frontend realistic representations of shared customers, store-specific sales, store-specific inventory, receiving, shared credit obligations, payment history with payment-store attribution, product approval states, users/store assignments, and dashboard/report data — derived from `DATA-MODEL.md` concepts and `REQUIREMENTS.md`, validated through Phase 3 walkthroughs. Phase 4 then designs the real database from that validated reference **plus** the authoritative documents (`REQUIREMENTS.md`, `DATA-MODEL.md`, `ARCHITECTURE.md`, `SECURITY.md`), adding what mocks deliberately lack: constraints, RLS policies, and atomic enforcement. Mock shapes inform but never dictate the schema. No exact fields or tables are invented here.

## 5. Validation Gates

- **Gate 1:** Frontend foundation works — scaffold builds, shells render mobile-first, tooling recorded. Opens Phase 1.
- **Gate 2:** Centralized mock layer can represent all confirmed workflows — service coverage traced to requirement IDs, no raw mock data in components. Opens Phase 2.
- **Gate 3:** Confirmed frontend workflows are usable and stable enough for database design — walkthrough findings resolved or explicitly deferred. **Opens Phase 4; no database work before this gate.**
- **Gate 4:** Database/data-layer integrity and authorization are proven — atomicity and RLS demonstrated UI-independently. Opens Phase 6.
- **Gate 5:** Real integration reproduces validated workflows — Phase 2 evidences repeat against Supabase with an empty/justified mismatch log. Opens Phase 7 exit and Phase 8.
- **Gate 6:** Production smoke testing and handoff succeed — live system verified with documented limitations.

No phase is complete merely because files were created. Completion requires its validation and Definition of Done.

## 6. Confirmation Required Items

Unresolved items are preserved as-is; nothing here answers them.

| Item | Mock frontend (Ph. 1–3) | Database (Ph. 4+) |
| --- | --- | --- |
| Exact customer/product/receiving fields | Deferrable — minimal Assumed shapes, flagged | Must finalize-or-assume explicitly before migrations |
| Payment-term options + calculation rules | Deferrable — opaque selections, no invented math | Must resolve before real charge/payment logic |
| Detailed validation rules | Deferrable — structural checks only | Enforceable only as confirmed |
| Detailed permission rules | Deferrable — build confirmed scoping only | Policies encode confirmed scoping only |
| Report/export formats (+ export library) | Deferrable — summary views; export UI waits | Unaffected; library follows formats |
| Edit/cancel/reversal; rejections/resubmissions; insufficient stock; duplicates | Deferrable — leave unbuilt and visibly absent | No structures for unbuilt behaviors |
| Auth flow detail; logging/browser-security policy; legal wording | Deferrable — defaults + principles | Close during hardening (Phase 8) |
| Tooling execution (commands, CI, coverage) — Implementation Decision Required | Must settle in Phase 0 | — |
| E2E scope/trigger (Conditional Playwright) | — | Adopt if budget/schedule permit (Ph. 5–7) |

## 7. Dependency Rules

- Do not implement the real database before the Phase 3 validation gate.
- Do not scatter mock data directly across UI components; UI consumes the service/data-access layer.
- Mock data models confirmed business concepts and relationships per `DATA-MODEL.md`.
- Do not treat mock behavior as proof of database integrity or authorization; those are Phase 5 properties proven in Gates 4–5.
- Critical integrity rules (atomic sale→stock, payment→balance, approval gating, store/admin scoping) are eventually enforced at the real data layer.
- Do not introduce Node/Express merely because this roadmap says "Backend/API" — Supabase-direct remains selected unless future evidence requires otherwise (recorded in `DECISIONS.md` if ever changed).
- Do not invent unresolved business requirements; do not allow scope creep; prefer the smallest maintainable implementation.
- Business dependencies still apply inside frontend stages: customers/products before sales; sales before credit/payments; everything before dashboard.

## 8. Implementation Decision Boundaries

Implementation may decide: file/component/service organization following repo patterns; command/CI/coverage execution detail; migration file sequencing; service function shapes within the confirmed contract; test placement per established tooling. These never become business requirements and are recorded where the workflow requires. Business confirmation is required for: fields, terms, validation rules, permissions, report formats, edge-case behaviors, and any scope change — implementation proceeds on explicit assumptions or waits, never on silent invention.

## 9. Current Project Status

- Documentation foundation completed (13 finalized documents plus this roadmap).
- **Phase 0 — Frontend Foundation: complete** (Vite + React + TypeScript scaffold, Styled Components theming, React Router with staff/admin shells, reusable UI foundations, tooling recorded in `docs/DECISIONS.md`).
- **Phase 1 — Centralized Mock Data Layer: complete** (framework-agnostic services over a centralized in-memory mock domain model, confirmed invariants enforced in memory, Gate 2 covered by tests).
- **Phase 2 — Frontend Business Workflows: complete** (mock sign-in with role-gated shells and store context; customers; products + approval; inventory + receiving; sales flow; credit + cross-store payments; dashboards and printable report summaries; per-workflow success/failure/empty states; decision records DEC-005 and DEC-006).
- `ROADMAP.md` (this file) is the implementation sequence.
- Next implementation task is Phase 3 — Frontend Workflow Validation (the gate before any database work).
- No database or Supabase implementation should begin yet — Phases 4+ are gated behind Phase 3.

## 10. First Implementation Task

**Phase 3 — Frontend Workflow Validation.** Structured walkthroughs of the confirmed workflows built in Phase 2 (cross-store payments, sales with stock effects, shared-customer handling, approval gating, receiving, dashboard trust, staff/admin split), producing the confirmation-question list the database design must respect. Database work (Phase 4) opens only after this gate. Do not begin migrations, schemas, or Supabase work during Phase 3.
