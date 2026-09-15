# ZAF ONE — Testing and Verification Strategy

## 1. Purpose and Scope

This file defines what must be verified, how, at what level, and what counts as done. Verification here means requirement verification: checking observable business behavior against `docs/REQUIREMENTS.md`. A passing build or rendered page is never proof that business behavior works.

Scope covers verification of authentication and authorization, staff/store access, shared customers, sales, credit/collection, partial payments, cross-store payments, inventory, receiving stock, product approval, admin dashboard, reports/export/printing, responsive mobile-first behavior, accessibility baseline, security boundaries, and deployment/production behavior. No public marketing or conversion workflows exist in this project and none are covered here.

Verification kinds: requirement verification (primary meaning of "testing"); automated testing where tooling is established in `docs/TECH-STACK.md`; manual verification (human inspection — significant weight for workflows, presentation, and boundary behavior); integration verification across architecture boundaries; browser/end-to-end verification of critical journeys where practical; production verification (procedures in `docs/DEPLOYMENT.md`).

## 2. Testing Principles

1. **Test requirements, not implementation assumptions.** Every check traces to an observable requirement.
2. **Verify critical business journeys first.** Sale-to-stock, charge-to-credit, payment-to-balance, cross-store payment, receiving, and product approval come before peripheral checks.
3. **Test security boundaries independently from UI behavior.** Client-side checks are usability; enforcement is verified separately.
4. **Prefer focused checks over excessive infrastructure.** Meaningful checks proportionate to the ₱10,000 core-first scope outweigh large trivial suites.
5. **Test failure states, not only success paths.** Failure must never present as success.
6. **Verify responsive and accessible behavior** as baseline expectations, mobile first.
7. **Verify integration boundaries without claiming provider guarantees.** Application-side behavior is verifiable; provider internals are not.
8. **Re-test affected behavior after changes** with risk-based regression, not blind trust.
9. **AI-generated code requires explicit verification.** A passing build or plausible appearance is not proof of correctness.
10. **Do not claim a feature works without evidence.** Reports separate implemented, verified, not verified, failed, blocked, assumed, and confirmation-required items.

## 3. Test Levels

- **Static/code-level verification** (type checks, build, linting where configured; source, dependency, and configuration review). Hygiene, never proof that a feature works.
- **Unit/component verification — conditional on meaningful logic** (sale/payment/receiving flows, balance and approval state transitions, validation logic, utilities). Selected tooling: Vitest + React Testing Library per `docs/TECH-STACK.md`. Not required for trivial presentational output.
- **Integration verification** (application-to-data-platform interactions: authenticated operations, server/data-layer validation and enforcement, atomic sale/stock and payment/balance updates, approval gating, protected admin operations).
- **Browser/end-to-end verification** (critical journeys in a real browser where practical). Tooling is Conditional per `docs/TECH-STACK.md`: Playwright for critical paths only if budget and schedule permit; scope recorded in `docs/DECISIONS.md` when triggered. CI, commands, and coverage targets are Implementation Decision Required.
- **Manual verification** (workflows, responsive behavior, accessibility interaction, usability, summaries and exports, production behavior).

## 4. Surface Verification

### 4.1 Authentication and Staff Access

- Authentication is required for all protected application areas; anonymous access reaches nothing operational.
- Staff access respects assigned-store boundaries (REQ-USER-002).
- Admin access follows the confirmed business-wide boundary (REQ-USER-003).
- Unauthorized access is rejected without revealing unpermitted records.
- Frontend hiding is never treated as proof of authorization; enforcement is verified at the data layer.

### 4.2 Sales

- Confirmed workflow: customer optional → items/quantity → payment type → delivery details when applicable → save (REQ-SALE-002).
- Cash sales and charge sales verified separately.
- Customer attachment and optional-customer (no-customer) sales verified separately.
- Correct store context on every recorded sale (REQ-SALE-001, REQ-SALE-005).
- Successful save behavior and failure behavior verified separately.
- Stock deduction after successful sale verified against the selling store's inventory (REQ-INV-002).
- No stock deduction after failed or duplicate-submission sale attempts.
- No exact validation rules invented beyond the confirmed workflow.

### 4.3 Customers

- Customer records are shared between Amara and Zeann; the same customer is reachable from either store (REQ-CUST-001).
- Existing customers can be selected; new customers can be added where allowed (REQ-CUST-003).
- Customer information is not incorrectly duplicated by store.
- Unauthorized users cannot modify or access restricted customer information.

### 4.4 Credit / Collection

High-priority verification area.

- Charge transactions create the expected outstanding credit with identifiable origin store (REQ-CRED-002, REQ-CRED-006).
- Selected payment terms determine the due date according to the confirmed business rule (REQ-CRED-003); exact term options and calculation rules beyond this remain Confirmation Required.
- Partial payments supported with correctly updated remaining balance (REQ-CRED-004).
- Fully paid credit reaches the correct completed state.
- Credit origin store and payment store remain identifiable on every record.
- Cross-store payments update the shared customer's outstanding credit correctly with one traceable history (REQ-CRED-005, REQ-CRED-007, REQ-PAY-001–002).
- Store-specific sales and shared credit behavior are never confused in verification.

### 4.5 Inventory

- Inventory is store-specific; Amara and Zeann stock never mix (REQ-INV-001).
- Successful sales automatically deduct the selling store's stock (REQ-INV-002).
- Failed or duplicate sale attempts do not deduct stock.
- Receiving stock increases the correct store's inventory with store context preserved (REQ-RCV-001).
- Unauthorized cross-store inventory changes are rejected.

### 4.6 Receiving Stock

- Confirmed information verified: store, item, quantity, supplier, purchase/cost price (REQ-RCV-001).
- Successful persistence and correct inventory impact verified.
- No additional required fields invented.

### 4.7 Products and Approval

- Staff can submit/add products where permitted (REQ-PROD-001).
- Newly added products do not become active before admin approval (REQ-PROD-002).
- Admin can approve products; approval activates the product (REQ-PROD-003).
- Unapproved products are never treated as active in sales, inventory, or summaries.
- Unauthorized users cannot perform approval actions.
- Rejection, editing, and resubmission behavior remain Confirmation Required unless established elsewhere.

### 4.8 Admin Dashboard and Reports

- Confirmed scope verified: daily sales by store, overall daily sales, outstanding credit, payments, current stock, received stock (REQ-DASH-001–006).
- Displayed summaries correspond to underlying application data.
- Excel export and printing produce the agreed summaries (REQ-REP-001–002).
- No report layouts, formulas, filters, or export schemas invented beyond what is established; exact formats remain Confirmation Required (REQ-REP-003).

## 5. Cross-Cutting Verification

- **Security** — maps directly to `docs/SECURITY.md`: authentication, authorization, store isolation, shared customer access, shared credit/collection access, cross-store payment integrity, server/data-layer enforcement, input validation, safe errors, privileged admin operations. Confirmation Required items get no invented test behavior.
- **Accessibility** — keyboard operation and visible focus where applicable, associated labels and accessible names, text-based form errors, operable and dismissible dialogs, navigation, practical touch interaction, reduced motion where motion exists, contrast outcomes, meaningful alternative text where applicable. No certification claims without evaluation.
- **Responsive** — mobile-primary staff experience first, then larger screens: navigation, forms, tables/lists, dashboard, dialogs, overflow behavior, data-entry workflows, admin screens. No exact breakpoints invented.
- **Performance** — qualitative and proportional: practical loading and interaction behavior for frequent workflows without unnecessary client complexity. No numeric targets invented.
- **States** — loading, validation, save, network failure, empty data, unauthorized access, failed operations, recovery, duplicate submission, partial failure where applicable. Plain-language messaging, no false success, no exposed diagnostics, useful recovery, preserved input where practical.
- **Data integrity** — high-priority area: persisted data matches the user's successful action; invalid and unauthorized operations rejected; sale and inventory state consistent; credit balances consistent after partial and full payments; cross-store payment history traceable; product approval state preserved; store-specific records associated with the correct store.
- **Third-party integrations** — only services actually selected: Supabase platform, Vercel hosting, GitHub. Application-side behavior is verifiable; provider internals cannot be guaranteed. No IDs, credentials, values, or provider guarantees invented.

## 6. Deployment / Production Verification

- Production build succeeds; secure transport active; correct domain serving the application.
- Authentication and protected application access behave as in lower environments.
- Critical business journeys (sale, payment, receiving, approval, dashboard review) verified against production behavior expectations.
- Database connectivity and environment configuration correct with no exposed secrets.
- Production error handling is non-technical with safe recovery.
- Procedures belong in `docs/DEPLOYMENT.md`; no deployment configuration invented here.

## 7. Regression Verification

Risk-based: after changes, re-test the changed feature, direct dependencies, shared components, related business journeys, and responsive behavior, security boundaries, and data integrity where affected. Deeper regression for authentication, authorization, credit/payment, inventory, shared customer data, product approval, shared data-access logic, and production configuration. Trivial content-only changes warrant affected checks plus a journey smoke pass, not a full suite.

## 8. AI-Assisted Verification

AI coding agents must: understand the intended requirement before testing; inspect the actual diff; compare changes against the relevant documentation; identify assumptions; verify security boundaries independently; run established automated checks where available (as hygiene only); manually inspect critical UI behavior; test important failure states; check for unintended changes; and report evidence rather than saying "implemented successfully." Tests asserting invented behavior are themselves defects.

## 9. Test Data and Environment Safety

- Minimal purpose-specific test data; no real customer or personal data where samples suffice.
- Never commit secrets or real credentials; no committed test credentials.
- No production data copied into tests without justification.
- Test data appropriate to the environment; real external delivery or integration paths used only deliberately and when required.
- No separate test-data platform invented.

## 10. Evidence, Reporting, and Quality Gates

Evidence per check: requirement reference, expected result, actual result, environment/context, pass/fail status, relevant failure details, affected files where useful, remaining limitations. Report categories: Implemented, Verified, Not verified, Failed, Blocked, Assumed, Confirmation Required.

Feature completion requires appropriate evidence for functional behavior, critical business journeys, validation plus server/data-layer enforcement, security boundaries, failure states, responsive behavior, relevant accessibility checks, and build/hygiene checks where applicable. No numeric coverage requirement unless explicitly established — risk-based gates govern instead.

## 11. Confirmation Required Matrix

| # | Item | Status | Notes |
| --- | --- | --- | --- |
| 1 | Test commands, CI/automation strategy, coverage/threshold policy | **Implementation Decision Required** | Tooling selected (Vitest + RTL; Conditional Playwright); execution detail not established. |
| 2 | Browser/E2E scope and adoption trigger | **Implementation Decision Required** | Conditional Playwright for critical paths; trigger recorded in `docs/DECISIONS.md` when made. |
| 3 | Exact validation rules | **Confirmation Required** | Only the confirmed workflows are testable. |
| 4 | Exact payment-term options and calculation behavior | **Confirmation Required** | Selected-terms workflow confirmed; options and rules unconfirmed. |
| 5 | Detailed role/permission behavior | **Confirmation Required** | Only store assignment and product approval confirmed. |
| 6 | Exact report/export formats | **Confirmation Required** | Summaries confirmed; formats unconfirmed. |
| 7 | Edge-case expectations (sale editing/cancellation, reversals, insufficient stock, duplicate customers, duplicate submissions, product rejection/resubmission) | **Confirmation Required** | No expected behavior invented for testing. |

## 12. Explicit Testing Exclusions

Verification does NOT automatically include: enterprise-scale testing infrastructure, formal penetration testing, security certifications, compliance testing for out-of-scope areas, accounting/ERP testing, CRM/HR/payroll testing, payment-gateway testing, reservation/booking testing, unconfirmed integrations, outcome guarantees, unnecessary CI/CD complexity, or tests for invented features. Authority: `docs/PROJECT.md` §13 and `docs/REQUIREMENTS.md` §18.

## 13. Related Documentation

- `AGENTS.md` — AI-agent operating rules
- `README.md` — repository orientation
- `docs/PROJECT.md` — product and business context
- `docs/REQUIREMENTS.md` — functional and business requirements (authoritative for required behavior)
- `docs/DEVELOPMENT.md` — development workflow
- `docs/TECH-STACK.md` — technology decisions (established test tooling)
- `docs/ARCHITECTURE.md` — architecture
- `docs/UI-UX.md` — experience requirements
- `docs/DATA-MODEL.md` — data concepts and boundaries
- `docs/API.md` — operation behavior and integration boundaries
- `docs/SECURITY.md` — security requirements and constraints
- `docs/DEPLOYMENT.md` — deployment procedures
- `docs/DECISIONS.md` — material decisions (E2E trigger recorded here when made)
