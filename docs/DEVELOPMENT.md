# Amara + Zeann Store Management System — Development Workflow

## 1. Purpose and Scope

This document governs how development work is performed, especially AI-assisted work: context loading, repository inspection, planning, implementation, AI-assisted code generation, code review, verification, bug investigation, scope control, dependency and environment handling, documentation updates, decision recording, source-control hygiene, definition of done, and reporting.

It defers each subject to its owning documentation: requirements to `docs/REQUIREMENTS.md`; business context to `docs/PROJECT.md`; behavior to `docs/UI-UX.md`; stack to `docs/TECH-STACK.md`; architecture to `docs/ARCHITECTURE.md`; data to `docs/DATA-MODEL.md`; operation boundaries to `docs/API.md`; security to `docs/SECURITY.md`; verification to `docs/TESTING.md`; deployment procedures to `docs/DEPLOYMENT.md`; decisions to `docs/DECISIONS.md`; agent-wide rules to `AGENTS.md`.

## 2. Development Principles

Priority order, per `AGENTS.md`: (1) required functionality, (2) security and data integrity, (3) documented architecture, (4) existing behavior, (5) maintainability, (6) simplicity, (7) performance, (8) convenience.

Working rules: smallest maintainable change; existing patterns before new patterns; correctness over speed; evidence over assumptions; verification over confidence; proportional scope; no unnecessary duplication; no over-engineering. AI-generated code is untrusted until reviewed and verified.

## 3. Source-of-Truth Hierarchy

| Concern | Authoritative source |
| --- | --- |
| Business context | `docs/PROJECT.md` |
| Requirements | `docs/REQUIREMENTS.md` |
| UI/UX behavior | `docs/UI-UX.md` |
| Technology | `docs/TECH-STACK.md` |
| Architecture | `docs/ARCHITECTURE.md` |
| Data concepts | `docs/DATA-MODEL.md` |
| API/data-access boundary | `docs/API.md` |
| Security | `docs/SECURITY.md` |
| Testing/verification | `docs/TESTING.md` |
| Development workflow | `docs/DEVELOPMENT.md` (this file) |
| Deployment | `docs/DEPLOYMENT.md` |
| Decisions | `docs/DECISIONS.md` |
| Agent-wide rules | `AGENTS.md` |

Rules: requirements govern required behavior; business context governs business questions; security governs security expectations; implementation governs actual behavior (discrepancies identified before changing anything). Conflicts are named and resolved against this hierarchy, never silently chosen.

## 4. Context Loading Before Implementation

1. Read `AGENTS.md`.
2. Read this file.
3. Identify the relevant task requirements and requirement IDs.
4. Read only the relevant supporting documents and cited sections.
5. Inspect the actual repository (§5).
6. Confirm implementation status before assuming anything is implemented.

| Task type | Read |
| --- | --- |
| Sales change | `REQUIREMENTS.md` §5, `UI-UX.md` §7.1, `DATA-MODEL.md` §4.4–4.5, `API.md` §5 |
| Credit/payment change | `REQUIREMENTS.md` §6–7, `UI-UX.md` §7.3, `DATA-MODEL.md` §4.6–4.7, `API.md` §5, `SECURITY.md` §3–5 |
| Inventory change | `REQUIREMENTS.md` §8, `UI-UX.md` §7.4, `DATA-MODEL.md` §4.8, `ARCHITECTURE.md` §1–3 |
| Receiving change | `REQUIREMENTS.md` §9, `UI-UX.md` §7.5, `DATA-MODEL.md` §4.9–4.10 |
| Product/approval change | `REQUIREMENTS.md` §10, `UI-UX.md` §7.6, `DATA-MODEL.md` §4.3, §4.12, `SECURITY.md` §5, §8 |
| Customer change | `REQUIREMENTS.md` §4, `UI-UX.md` §7.2, `DATA-MODEL.md` §4.2, `SECURITY.md` §3–4 |
| User/permission change | `REQUIREMENTS.md` §11, `UI-UX.md` §7.8, `SECURITY.md` §2–4, §8 |
| Dashboard/report change | `REQUIREMENTS.md` §12–13, `UI-UX.md` §7.7, `API.md` §5 |
| UI/UX change | `UI-UX.md` relevant section, `REQUIREMENTS.md` relevant group |
| Data/schema change | `DATA-MODEL.md`, `ARCHITECTURE.md` §3–4, `TECH-STACK.md` §3 (migrations) |
| Security-sensitive change | `SECURITY.md`, `ARCHITECTURE.md` §9, `API.md` §10–13 |
| Deployment change | `DEPLOYMENT.md`, `TECH-STACK.md` §3 (hosting), `TESTING.md` §6 |

## 5. Repository Inspection Before Changes

Before changing code: locate relevant files; trace affected flows end to end; identify shared logic and cross-cutting effects (shared customers/credit vs store-specific sales/inventory); reuse existing patterns; check documentation/code discrepancies; reproduce bugs before fixing where practical. Never treat a selected technology as proof the repository implements it. No speculative modifications.

## 6. AI-Assisted Development Workflow

Required loop for every AI-assisted change: **Understand → Load Context → Inspect → Plan → Implement → Review Diff → Verify → Regression Check → Report**.

For every change: state the requirement served; identify affected areas; make the smallest appropriate change; avoid unrelated refactoring; review the complete diff; identify assumptions and mark unresolved items appropriately; verify critical behavior; check regressions; report evidence and limitations. Passing a build is never sufficient proof of correctness. Tests asserting invented behavior are defects.

## 7. Code Generation and Review Expectations

Generated code must follow existing repository patterns; keep changes focused with clear data flow; preserve existing behavior unless the task explicitly changes it; never invent business rules, schemas, contracts, credentials, or configuration values; respect security boundaries independently of frontend behavior; handle failure states without false success.

Review must check the full diff, unrelated changes, scope creep, security, data integrity, error handling, responsive behavior, accessibility where relevant, and regression risk. Unverifiable checks are reported as not verified, never assumed.

## 8. Preservation, Scope Control, and Dependencies

One task produces one focused change; working behavior and backward compatibility for shared functionality are preserved; unrelated work is never bundled. Reuse existing solutions before introducing dependencies; weigh maintenance cost; no trivial or convenience-only packages; technologies excluded by project decisions require explicit rescoping plus a decision record. Secrets never belong in source code or committed files; no variable names or values invented here. No package-manager, branching, commit, or CI conventions invented — each is Implementation Decision Required until decided and recorded.

## 9. Adherence Summaries

- **PROJECT:** respect the two-store model, shared-vs-store-specific boundaries, and core scope; business questions resolve against `docs/PROJECT.md`.
- **REQUIREMENTS:** implement only confirmed requirements with cited IDs; Confirmation Required items stay unconfirmed.
- **UI-UX:** behavior and action hierarchy come from `docs/UI-UX.md`; no invented copy, fields, or workflows.
- **TECH-STACK:** reuse selected technologies; conditional items stay conditional until activated with a decision record.
- **ARCHITECTURE:** respect layer and enforcement boundaries; no second backend or unconfirmed machinery.
- **DATA-MODEL:** respect concept boundaries; no invented schemas, fields, or states.
- **API:** respect operation boundaries; no invented contracts or mechanisms.
- **SECURITY:** authorization and integrity enforced at the data layer; no weakened controls.
- **TESTING:** verify per the strategy with evidence; no invented tooling or thresholds.
- **DEPLOYMENT:** procedures belong to `docs/DEPLOYMENT.md`; development ends at verified, reviewable changes.
- **DECISIONS:** meaningful architecture, technology, convention, and trade-off choices recorded; trivial choices not recorded.

## 10. Local Development Expectations

Inspect the repository before giving or following setup instructions; confirm manifests, configuration, and layout first. No commands, package managers, hooks, CI, hosting CLIs, development services, or environment variable names invented — each is **Implementation Decision Required** until decided and recorded. Once tooling exists: use existing project commands; keep the working tree reviewable; keep generated artifacts and secrets out of source control; avoid unintended effects on real external services; never use real personal data as test fixtures unnecessarily.

## 11. Verification Workflow

Every implementation verified proportionally to risk: established automated checks where available (as hygiene, not proof); manual verification of changed behavior (or stated reason); failure states, not just happy paths; security boundaries checked independently; data integrity checked where relevant; responsive and accessibility checks where user-visible; risk-based regression per `docs/TESTING.md`; final diff reviewed for unrelated changes. Never claim something was tested if it was not actually tested.

## 12. Bug-Fixing and Investigation Workflow

**Reproduce → Gather Evidence → Trace Root Cause → Identify Scope → Implement Smallest Fix → Verify → Regression Check → Report.** Reports distinguish confirmed root cause from likely cause, assumption, and unknown. Fix causes, not symptoms; verify the original and adjacent cases. Never fix bugs by removing validation, disabling security, hiding errors, bypassing business rules, or adding unrelated unjustified workarounds.

## 13. Ambiguity, Discrepancy, and Confirmation Handling

Classification: Confirmed, Conditional, Confirmation Required, Reference-Only, Implementation Decision Required. For material ambiguity: inspect documents and code, identify the exact ambiguity, and ask for clarification when it affects business behavior, architecture, data, security, contracts, or content; make an explicit low-risk assumption only when appropriate. Never silently convert an assumption into a confirmed requirement. For documentation/code discrepancies: identify both sides, resolve toward the authoritative source per §3, and update affected documentation when required. Confirmation Required items are never finalized without confirmation.

## 14. Documentation, Decisions, and Source Control

Ownership: business requirement change → `docs/REQUIREMENTS.md`; business/context change → `docs/PROJECT.md`; UI behavior change → `docs/UI-UX.md`; technology decision → `docs/TECH-STACK.md` with record in `docs/DECISIONS.md`; architecture decision → `docs/ARCHITECTURE.md` with record in `docs/DECISIONS.md`; data-model change → `docs/DATA-MODEL.md`; API boundary change → `docs/API.md`; security change → `docs/SECURITY.md`; verification strategy → `docs/TESTING.md`; deployment procedure → `docs/DEPLOYMENT.md`. Proposals stay proposals until accepted.

Source control: review status and diff; keep changes focused to intended files; never commit secrets or sensitive fixtures; never invent branch/PR/CI conventions; never bypass verification or security controls to complete a change.

## 15. Definition of Done

A task is complete only when the requirement is understood and cited; relevant documentation was checked; the implementation contains only requested behavior; critical behavior was verified with evidence; appropriate failure states were checked; security boundaries were checked independently where relevant; data integrity was checked where relevant; responsive/accessibility behavior was checked where relevant; regression risk was considered; the full diff was reviewed; required documentation and decision records were updated; and assumptions, limitations, blocked items, and unverified items are reported.

**Implemented does not automatically mean Done.**

## 16. Reporting Requirements

Concise factual reports with categories: **Implemented**, **Verified** (with evidence: what was checked, environment/context, expected vs actual, pass/fail), **Not Verified** (with reason), **Failed** (with details), **Blocked** (blocker named), **Assumed** (explicit), **Confirmation Required**. Also report files changed, important decisions and basis, validation performed, limitations, assumptions, and remaining work. Never claim full testing from a successful build alone.

## 17. Explicit Development Exclusions

Unless explicitly rescoped with a decision record, development does NOT include: unconfirmed business functionality; unnecessary infrastructure; second backends; alternative providers without justification; enterprise permission machinery; unnecessary automation; formal certification work; out-of-scope accounting/CRM/payroll/HR functionality; features excluded in `docs/PROJECT.md` and `docs/REQUIREMENTS.md`; outcome guarantees; unrelated refactoring. Authority: `docs/PROJECT.md` §13 and `docs/REQUIREMENTS.md` §18.

## 18. Related Documentation

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
- `docs/DEVELOPMENT.md` — development workflow (this file)
- `docs/DEPLOYMENT.md` — deployment procedures
- `docs/DECISIONS.md` — material decisions
