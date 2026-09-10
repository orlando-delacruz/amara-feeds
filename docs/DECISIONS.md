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

No formal decision records have been created yet. Documented choices in owning documents (e.g. the selected stack in `docs/TECH-STACK.md`) are not retroactively entries here. Future records are appended in ID order with status and date kept current.

| ID | Title | Status | Date |
| --- | --- | --- | --- |
| — | (no records yet) | — | — |

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
