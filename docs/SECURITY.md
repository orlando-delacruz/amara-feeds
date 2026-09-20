# ZAF ONE — Security Requirements and Constraints

## 1. Purpose, Principles, and Status Labels

This file is the authoritative source for security requirements, principles, boundaries, and confirmation status. Status labels follow `TEMPLATE-GUIDE.md`: Confirmed, Conditional, Confirmation Required, Reference-Only.

1. **Practical and proportionate security.** Controls match the agreed core scope — no unnecessary infrastructure or complexity beyond the ₱10,000 core-first project.
2. **Deny by default for privileged operations.** Anonymous users have no operational capability; privileged operations require authenticated, authorized, server-enforced access.
3. **Server-side enforcement.** Client-side checks are usability only, never security boundaries.
4. **Least exposure.** Collect only confirmed data, expose only permitted data, return only limited non-technical errors, log only what is appropriate.
5. **Secrets stay out of source and out of the browser.** No secrets in code, history, bundles, logs, errors, or responses.
6. **Fail safely.** Failures never report false success, never expose internals, and preserve entered data where practical.
7. **Conditional stays conditional.** Unconfirmed controls exist only on explicit confirmation.

## 2. Authentication

- **Status:** Confirmed foundation — Supabase Auth provides individual staff and admin identity (REQ-USER-001, REQ-USER-003). Implemented (DEC-035): username login resolves to a `username@zafone.local` email convention (Assumed) and authenticates against Supabase Auth; role and store assignment come from the `profiles` table.
- Anonymous users reach no operational surface; every operation requires an authenticated identity.
- No custom identity system is built; changing the foundation requires a recorded decision in `docs/DECISIONS.md`.
- Authentication flow detail (session handling, provisioning, recovery, timeouts) is Confirmation Required — nothing is invented here.

## 3. Authorization

- Staff have access according to their assigned store (REQ-USER-002); store-specific sales and inventory remain appropriately restricted to their store context.
- Admin can oversee both stores, including approvals, dashboards, reports, and business-wide review (REQ-USER-003).
- Customers are shared across Amara and Zeann; shared customer records are visible across stores per the user's permissions, never duplicated per store.
- Credit/collection is shared across stores; cross-store payments are permitted while remaining traceable to both the credit-origin store and the payment store.
- Enforcement is server-side at the data layer (Row Level Security boundary per `docs/TECH-STACK.md`); hiding controls or filtering data in the frontend is not an authorization boundary.
- No roles or permission detail beyond the confirmed store assignment and product approval is defined here — the exact permission model is Confirmation Required.

## 4. Data-Access Principles

- Row Level Security is an important enforcement boundary for store assignment and admin-wide access; frontend filtering is never relied on for security. Implemented (DEC-035): RLS is enabled on every exposed table; policies read the caller's `profiles` row via a `SECURITY DEFINER` helper (`current_profile`, only ever the caller's own row) wrapped in `(select …)` for single evaluation; mutations run through `SECURITY DEFINER` functions with in-body `auth.uid()` scope checks and `authenticated`-only execute grants.
- Every write is authenticated, authorized, and validated at the data layer.
- Shared records (customers, credit, payment history) are readable across stores per permissions with origin/payment-store attribution intact; store-specific records (sales, inventory, receiving) are scoped to their store.
- Principles only — no SQL policies, table names, grants, or database rules are defined here.

## 5. Business Integrity

Security considerations for confirmed operations, enforced beyond the UI:

- **Sales:** recorded within the staff user's store context; a sale belongs to one store.
- **Automatic stock deduction:** a successful sale save deducts the selling store's stock atomically; partial writes (sale without deduction) are never valid outcomes.
- **Receiving stock:** store-specific receipts with store, item, quantity, supplier, and purchase/cost price; stock increases only through confirmed receiving and sale flows.
- **Credit creation:** charge sales create shared obligations with originating store and selected-terms due date; terms options beyond the confirmed workflow are Confirmation Required.
- **Partial payments:** supported until the credit is fully paid, with balance and status updated on every payment.
- **Cross-store payments:** permitted through either store; origin store, payment store, history, balance, and status are all preserved and traceable.
- **Product approval:** staff submissions enter pending state and become active only through admin approval; approval is never bypassed or replaced by validation.
- **Staff accounts/store assignment:** individual accounts bound to one store determine operational context; assignment changes are privileged operations.

Exact enforcement mechanisms are implementation detail; policy detail beyond these principles belongs downstream of this file.

## 6. Secrets and Environment Configuration

- No secrets in source code, history, bundles, logs, errors, or responses; no privileged credentials in frontend code.
- Production secrets use environment-appropriate configuration; procedures belong in `docs/DEPLOYMENT.md`.
- No credentials or environment variable names are documented here.
- Secrets are never hardcoded, committed, or exposed.

## 7. Input and Content Security

- All user input is treated as untrusted and validated at the appropriate boundary with clear non-technical messages.
- Server/data-layer validation is authoritative; client validation assists usability only.
- Stored business content is treated as data and rendered safely; injection and unsafe rendering are prevented.
- Error messages stay non-technical and never expose implementation detail.
- No libraries, allowlists, or field-specific validation rules are invented here; exact rules remain Confirmation Required.

## 8. Admin Security

- Authentication precedes all admin access; every admin operation carries operation-level server-side authorization.
- Protected privileged operations include product approval, staff/user management, store assignment, and business-wide review, export, and reporting.
- Confirmed destructive actions, if any are later confirmed, require explicit confirmation; unpublished/pending content (e.g. unapproved products) is protected from operational use.
- Privileged data is never exposed beyond permitted scope; no enterprise permission machinery is introduced without rescoping.

## 9. Privacy and Personal Data

- Customer and business information is protected and exposed only to permitted users.
- Collection is limited to confirmed requirements; exact fields remain Confirmation Required.
- No legal or regulatory compliance is claimed; no retention periods or privacy policies are invented here.
- Legal and privacy wording requires client approval and must reflect actual implemented functionality.

## 10. Logging and Diagnostics

- Diagnostics are server-side only where appropriate; secrets are never logged.
- Unnecessary personal or business data exposure in logs is avoided.
- User-facing errors stay non-technical; technical detail never reaches users.
- No logging platform, destination, format, or retention is invented here — logging policy is Confirmation Required.

## 11. Frontend and Browser Security

- No secrets in browser code; the browser holds no privileged capability of its own.
- Form and error behavior follows the accessible patterns in `docs/UI-UX.md`.
- Any browser-security policy adoption is Confirmation Required and must not break rendering, forms, or accessibility if adopted.

## 12. Deployment Security Environment

- The hosting platform serves production with secure environment handling; production procedures belong in `docs/DEPLOYMENT.md`.
- Secure transport is required for the deployed application; no secrets in source control.
- Verification expectations are owned by deployment checks.

## 13. Third-Party Service Boundaries

Only services actually selected in `docs/TECH-STACK.md` and `docs/ARCHITECTURE.md`. Provider entries are boundaries, not guarantees.

| Service | Application responsibility | Provider boundary (not a guarantee) |
| --- | --- | --- |
| Supabase platform (auth, data, enforcement) | Authenticated, authorized, validated operations only; no trust in client state | Operates identity, data access, and enforcement execution |
| Vercel hosting | Ships a client containing no secrets | Operates static delivery of the built client |
| GitHub source control | Keeps secrets out of code and history | Operates versioning and review workflow |

No payment, notification, analytics, or other third-party service is selected; none carries security responsibilities here.

## 14. Incident and Failure Principles

- Reject unauthorized operations rather than bypassing controls.
- Never report success when the operation failed; partial writes are failures, not successes.
- Never expose internal errors, diagnostics, or secrets to users.
- Preserve user-entered data where practical after recoverable failures.
- Protect privileged and business content consistently across all surfaces on failure.

## 15. Confirmation Required Matrix

| # | Item | Status | Notes |
| --- | --- | --- | --- |
| 1 | Authentication flow detail (session, provisioning, recovery, timeouts) | **Confirmation Required** | Foundation confirmed; detail not established. |
| 2 | Exact role and permission model | **Confirmation Required** | Only store assignment and product approval confirmed. |
| 3 | Data-access policies | **Assumed baseline implemented** | RLS boundary confirmed; policies implemented per DEC-035 (store scope, shared reads, admin-wide, no `auth.role()`). Exact rule changes Confirmation Required. |
| 4 | Per-input validation and security controls | **Confirmation Required** | Principles only. |
| 5 | Exact customer, product, payment, and receiving fields | **Confirmation Required** | No extra personal data without justification. |
| 6 | Retention behavior | **Confirmation Required** | No periods defined. |
| 7 | Storage access model | **Confirmation Required** | No managed file storage confirmed. |
| 8 | Logging policy | **Confirmation Required** | Server-side-only principle confirmed. |
| 9 | Browser-security policy | **Confirmation Required** | Must not break rendering, forms, or accessibility if adopted. |
| 10 | Legal and privacy wording | **Confirmation Required** | Client-approved; reflects actual behavior. |

## 16. Explicit Security Exclusions

Unless explicitly rescoped, the security model does NOT include: custom authentication systems, enterprise permission systems, a second backend or duplicate enforcement layer, payment-provider security scope, notification/email security scope, spam/abuse protection infrastructure, CRM, accounting, payroll/HR security scope, analytics instrumentation, or invented compliance certifications. Authority: `docs/PROJECT.md` §13 and `docs/REQUIREMENTS.md` §18.

## 17. Related Documentation

- `README.md` — repository orientation
- `AGENTS.md` — AI-agent operating rules
- `docs/PROJECT.md` — product and business context
- `docs/REQUIREMENTS.md` — functional and business requirements
- `docs/TECH-STACK.md` — technology decisions
- `docs/ARCHITECTURE.md` — architecture
- `docs/UI-UX.md` — experience requirements
- `docs/DATA-MODEL.md` — data concepts and boundaries
- `docs/API.md` — operation behavior and integration boundaries
- `docs/SECURITY.md` — security requirements and constraints (this file)
- `docs/TESTING.md` — verification strategy
- `docs/DEVELOPMENT.md` — development workflow
- `docs/DEPLOYMENT.md` — deployment procedures
- `docs/DECISIONS.md` — material decisions
