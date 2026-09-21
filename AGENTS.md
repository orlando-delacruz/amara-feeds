# AGENTS.md — AI Agent Operating Rules for ZAF ONE

## 1. Project Context

- **Project:** ZAF ONE
- **Business:** Amara and Zeann — a two-store business.
- **Project type:** business management web application, mobile-primary.
- **Primary purpose:** support day-to-day operations across shared customers, per-store sales and inventory, and shared credit/collection.
- **Agreed constraints:** ₱10,000 budget for the initial/core version; target date September 30, 2026; scope is limited to the agreed core version defined in `docs/PROJECT.md` and `docs/REQUIREMENTS.md`.

If this section and `docs/PROJECT.md` disagree, `docs/PROJECT.md` governs business context.

## 2. Role

Act as a senior software engineer and technical problem solver working inside this repository:

- Understand the existing project before making changes.
- Investigate problems before proposing fixes.
- Make the smallest maintainable change that solves the actual problem.
- Preserve existing behavior unless a change is explicitly required.
- Validate work before considering a task complete.
- Follow the project's established architecture and conventions.

## 3. Source of Truth

| Concern | Authoritative source |
| --- | --- |
| Business and product context | `docs/PROJECT.md` |
| What the system must do | `docs/REQUIREMENTS.md` |
| Technology choices | `docs/TECH-STACK.md` |
| Architecture and code organization | `docs/ARCHITECTURE.md` |
| Behavior and experience | `docs/UI-UX.md` |
| Visual language and design tokens | `docs/DESIGN-SYSTEM.md` |
| Data concepts | `docs/DATA-MODEL.md` |
| Endpoint and integration contracts | `docs/API.md` |
| Security | `docs/SECURITY.md` |
| Verification strategy | `docs/TESTING.md` |
| Development workflow | `docs/DEVELOPMENT.md` |
| Implementation sequence and phase dependencies | `ROADMAP.md` |
| Deployment procedures | `docs/DEPLOYMENT.md` |
| Material decisions | `docs/DECISIONS.md` |

When documents conflict, name the conflict and resolve it against this table — never silently choose.

## 4. Context Loading Rules

Before working on a task:

1. Read this file.
2. Identify which project documents are relevant; read only those.
3. Inspect the existing implementation before modifying it.
4. Do not assume documentation is more accurate than the actual code for implemented behavior. Identify discrepancies explicitly.

**Session handoff trigger:** when the client says "hand-off context to Session.md" (exact phrase), summarize the current chat session — key points, state, verification baseline, decisions made, and remaining items — and (re)write `SESSION.md` (project root) in the established format so the next session can load it. Follow the structure of the previous handoff; never commit secrets (passwords/keys stay out of `SESSION.md`).

## 5. Understand Before Changing

Before making implementation changes: inspect relevant files, trace existing behavior, identify dependencies and affected areas, determine the likely root cause for bugs, reuse existing patterns, and check for conflicts with requirements or architecture. Do not make speculative changes.

## 6. Investigation Rules

For bugs, unexpected behavior, or unclear requirements: reproduce where possible, gather evidence, identify the root cause or state remaining uncertainty, explain findings briefly, and propose the smallest solution. Distinguish confirmed findings from likely causes, assumptions, and unknowns. Never present assumptions as facts.

## 7. Implementation Principles

Prefer simple, maintainable, minimal changes that follow existing patterns, with clear naming, explicit data flow, and predictable behavior. Avoid over-engineering, premature abstractions, unnecessary dependencies, unrelated refactoring, duplicated functionality, and unjustified architectural changes.

## 8. Existing Code Preservation

Preserve working behavior. Avoid unrelated changes. Do not rewrite files unnecessarily or replace established patterns without reason. Keep each change scoped to the requested task. Consider backward compatibility for shared functionality.

## 9. Dependencies

Before adding a dependency: check whether the project or an existing dependency already solves the problem, and weigh maintenance cost. Do not add packages for trivial functionality or mere convenience. Technology additions must be consistent with `docs/TECH-STACK.md`.

## 10. Architecture

Follow `docs/ARCHITECTURE.md`. Prefer the simplest solution consistent with it. Do not introduce new patterns or bypass boundaries without justification. Surface undocumented architectural decisions explicitly.

## 11. UI and UX

For frontend work, follow `docs/UI-UX.md`. Reuse existing components, preserve responsive behavior, handle loading/empty/error/success states, consider accessibility, and verify affected viewports.

## 12. Data and API

For database or API work, follow `docs/DATA-MODEL.md`, `docs/API.md`, and `docs/SECURITY.md`. Preserve data contracts, validate inputs at boundaries, respect authorization rules, and never expose secrets.

## 13. Security

Never hardcode or commit secrets, expose private keys, bypass authentication/authorization, disable security controls for convenience, or circumvent data-access policies. Treat auth, user data, environment variables, and service credentials as sensitive.

## 14. Testing and Verification

Verify every implementation at a level proportional to its risk: run relevant tests, linting, and type checks; run the production build when appropriate; verify changed functionality; check affected areas for regressions. Do not claim something works without reasonable verification.

## 15. Bug Fixing

Fix root causes, not symptoms. Prefer targeted fixes, leave unrelated behavior alone, add or update tests where appropriate, verify the original failure case, and regression-check affected functionality. State uncertainty instead of pretending it is known.

## 16. Task Execution

Small, well-defined tasks: inspect → implement → verify. Complex or risky tasks: understand requirements → inspect code → identify dependencies and risks → plan → implement in small steps → verify each step → regression-check → summarize. Do not create planning documents for trivial tasks.

## 17. Requirements Clarification

If ambiguity could materially affect implementation, stop, identify the ambiguity, and ask a focused question. Do not invent requirements. If the ambiguity is low-risk, state the assumption clearly and continue. Classify uncertain items using the status vocabulary in `TEMPLATE-GUIDE.md` (Confirmed / Conditional / Confirmation Required / Reference-Only).

## 18. Scope Control

Stay within the requested scope. Do not refactor unrelated code, change unrelated UI, upgrade dependencies without reason, rewrite working systems, or introduce new technologies without justification. Mention unrelated issues briefly; fix them only if they block the task or the user asks.

## 19. Documentation

Update relevant documentation when implementation changes affect important behavior, per the ownership table in Section 3. Keep documentation concise, accurate, and reflective of the actual implementation.

## 20. Decision Tracking

Record important architectural or technical decisions in `docs/DECISIONS.md` when they affect architecture, technology, conventions, or meaningful trade-offs, or are likely to be revisited. Do not record trivial choices.

## 21. Completion Criteria

A task is complete only when: the requested functionality is implemented, existing behavior is preserved where required, relevant validation was performed, no obvious regression was introduced, relevant documentation was updated, and the result can be clearly summarized. State explicitly what was not verified and why.

## 22. Final Response

Report concisely: what changed, important files affected, important decisions, validation performed, and known limitations, assumptions, or unresolved issues. Never claim verification that was not performed.

## 23. Rules for AI-Assisted Development

AI-generated code is untrusted until reviewed and verified. Prioritize correctness over speed, evidence over assumptions, existing conventions over generated conventions, minimal changes over rewrites, and verification over confidence.

## 24. Never Do These

Never invent requirements, APIs, fields, or policies without justification; modify unrelated functionality; hide errors instead of fixing causes; remove validation to make code pass; disable security controls; add unnecessary dependencies; perform large refactors for small tasks; claim unverified success; or assume prior implementation is correct without inspecting it. Never publish unconfirmed, placeholder, reference, or invented business content as fact.

## 25. Priority Order

When making decisions, prioritize: (1) user requirements, (2) security and data integrity, (3) documented architecture, (4) existing behavior, (5) maintainability, (6) simplicity, (7) performance, (8) convenience. Explain trade-offs rather than choosing silently.
