# Amara + Zeann Store Management System — Architecture

Source context: `docs/PROJECT.md` (business context), `docs/REQUIREMENTS.md` (requirements), `docs/UI-UX.md` (experience behavior), `docs/TECH-STACK.md` (selected technologies), `AGENTS.md` (rules).

This file describes intended architecture, not a claim about what is implemented — implementation status comes from the repository. No schemas, contracts, component implementations, IDs, URLs, credentials, or environment values belong here.

## 1. Architecture Overview

Architectural philosophy:

- Client-rendered React application for the internal mobile-primary workflows; no server rendering.
- One managed backend boundary (Supabase) for data access, authentication, and the enforcement point for business rules; no custom server is maintained.
- PostgreSQL as the single data foundation for both shared and store-specific records.
- Security-sensitive access control and critical data integrity enforced at the data layer, never by frontend checks alone.
- Proportional scope: direct flows appropriate to the ₱10,000 core budget and September 30, 2026 target; no unnecessary services or abstractions.

Primary flows:

```text
Staff / Admin
   │
   ▼
React application (Vite + TypeScript)
   │
   ▼
Authentication / authorization boundary (Supabase Auth + Row Level Security)
   │
   ▼
Supabase backend platform
   │
   ▼
PostgreSQL data foundation (shared + store-specific records)
```

Critical write flow (designed, not yet implemented):

```text
Staff sale / payment / receiving / approval action
   │
   ▼
Client-side validation and feedback
   │
   ▼
Authenticated request within store context
   │
   ▼
Database transaction / function (atomic update)
   │
   ▼
Outcome: stored records + success/failure feedback to the user
```

## 2. Architectural Goals

- **Simplicity:** the smallest structure that supports the confirmed workflows; this means one frontend, one managed backend, and one database, and explicitly does not promise enterprise extensibility.
- **Correctness of business boundaries:** shared customers and credit stay shared, store-specific sales and inventory stay store-specific; this does not promise automatic handling of unconfirmed edge cases.
- **Data integrity:** sale, payment, stock, and approval updates complete atomically; this does not promise recovery behavior for edge cases still awaiting confirmation.
- **Secure access:** store-assigned staff and business-wide admin access enforced server-side; this does not define the detailed policy matrix, which belongs in `docs/SECURITY.md`.
- **Mobile-first usability:** architecture keeps the client light so essential workflows perform on phones; this makes no numeric performance guarantees.
- **Maintainability:** AI-assisted development stays productive through type safety, co-located code, versioned migrations, and reviewable changes; this does not promise zero future refactoring.
- **Accessibility:** structure supports the baseline behaviors in `docs/UI-UX.md`; this claims no formal compliance unless evaluated.

## 3. Architecture Principles

### 3.1 Client presentation approach

- The React application owns all staff and admin surfaces; every confirmed area works through the client, with full essential function on mobile viewports.

### 3.2 Interactivity boundaries

- Interactive behavior lives in the client (form flows, feedback, navigation state); it must never enforce authorization, fabricate business state, or present unconfirmed operations as successful.

### 3.3 Backend approach

- Supabase is the single server-side boundary for data access and rule enforcement; a second backend or custom server must not be added without a recorded decision in `docs/DECISIONS.md`.

### 3.4 Data foundation

- PostgreSQL via Supabase is the system of record; shared-vs-store-specific separation and atomic multi-record updates are data-layer responsibilities. Schemas and relationships are deferred to `docs/DATA-MODEL.md`; policies to `docs/SECURITY.md`.

### 3.5 Admin scope

- The admin surface exists for confirmed management responsibilities (approvals, dashboards, reports, business-wide review) and must never become an enterprise operations platform without rescoping.

### 3.6 Security boundaries

- Anonymous access reaches nothing operational; authenticated staff reach their permitted store-scoped and shared views; privileged operations are separated and enforced at the data layer. Detail is deferred to `docs/SECURITY.md`.

### 3.7 Avoid overengineering

- Prohibited for this scope unless a confirmed requirement justifies them: additional backends, caches, queues, event buses, SSR infrastructure, native shells, analytics pipelines, and global client-state frameworks.

## 4. System Context

### 4.1 Actors

- **Staff (Amara or Zeann):** record sales, manage customers, record and review credit/payments, manage inventory and receiving, and submit products for approval within their store assignment and shared-record permissions.
- **Admin:** oversee both stores, approve products, and review dashboards, credit/payment information, inventory, receiving, and reports.
- **Anonymous visitor:** no operational access; there is no public surface.

### 4.2 Application-owned components

- React staff/admin application (one codebase, store-aware views and admin views).
- Database transactions/functions for atomic business operations.
- Versioned Supabase migrations for schema evolution.
- Vitest + React Testing Library suites; conditional Playwright coverage for critical paths.

### 4.3 Data platform

- PostgreSQL via Supabase stores shared customer identity, shared credit/collection and cross-store payment history, store-specific sales, store-specific inventory and receiving, products with approval states, and store-assigned accounts. No tables, columns, or relationships are defined here.

### 4.4 External services

- **Hosting (Vercel):** static frontend hosting boundary; owns delivery of the built client, nothing operational.
- **Source control (GitHub):** collaboration boundary; owns versioning and review, nothing runtime.
- No functional third-party integrations (payments, notifications, analytics, email) exist in this architecture.

## 5. Layer Responsibilities

| Layer | Responsibility | Key technology |
| --- | --- | --- |
| Client presentation | Store-aware and admin workflows, input, validation feedback, navigation state | React + Vite + TypeScript + Styled Components |
| Authentication boundary | Individual staff/admin identity | Supabase Auth |
| Authorization boundary | Store assignment and admin-wide access enforcement | PostgreSQL Row Level Security |
| Data operations | Atomic sale/stock, payment/balance, receiving, and approval updates | PostgreSQL transactions / database functions |
| Data foundation | Shared and store-specific records as the system of record | PostgreSQL via Supabase |
| Delivery | Static hosting of the built client | Vercel |

Boundaries: the client never reaches data except through the authenticated, authorized boundary; anonymous actors never reach operational data; secrets never appear in client-side source.

## 6. Frontend Architecture

The client is organized around the confirmed application areas, each owning its views, input flows, and feedback behavior — Dashboard, Sales, Customers, Credit/Collection, Inventory, Receiving, Products, Users/Staff, and Reports/Export/Printing. Shared areas (customers, credit/collection) render cross-store context with visible origin/payment-store attribution; store-specific areas (sales, inventory, receiving) render within the current store context. No component names, file structures, routes, or implementation details are defined here.

## 7. Client Rendering Strategy

- The application is client-rendered; no server-side rendering exists.
- Data is retrieved per area within the authenticated user's permissions; shared records resolve across stores while store-specific records resolve within the current store context.
- Reports, exports, and printing derive from the same retrieved summaries the user is permitted to see; exact formats remain Confirmation Required.

## 8. Admin Architecture

Authentication → authorization → admin application → business operations → data platform. Admin users authenticate as individuals, receive business-wide authorization at the data layer, and operate the confirmed management responsibilities (product approvals, dashboard and report review, credit/payment and inventory/receiving inspection, export/printing) against the same data foundation as staff, with wider permitted scope. No additional admin modules are defined here.

## 9. Authentication and Authorization Boundary

- Anonymous vs authenticated: only authenticated users reach any operational surface; there is no public surface.
- Staff vs admin application access: both use the same client and identity system; permitted scope differs at the data layer, not by separate systems.
- Store context: the staff user's store assignment travels with the session and scopes store-specific reads and writes.
- Server/data-layer enforcement: Row Level Security and database transactions/functions are the enforcement boundary; client checks are convenience only.
- Separation of privileged operations: approvals and business-wide review are privileged operations gated at the data layer. No role hierarchy or policy matrix is invented here; those belong in `docs/SECURITY.md`.

## 10. Integration Boundaries

- **Vercel:** owns static delivery of the client; the application owns everything behavioral. No runtime secrets cross this boundary.
- **GitHub:** owns versioning and review workflow; nothing runtime crosses this boundary.
- **Supabase platform:** owns identity, data access, and enforcement execution; the client owns presentation and input. No custom backend sits between them.
- No payment, notification, analytics, or other third-party functional boundary exists.

## 11. Environment and Configuration Boundaries

- Environment-specific configuration and secrets stay outside source code.
- Client-side source never contains secrets.
- No environment variable names listed here unless already defined in the repository.
- Production configuration procedures belong in `docs/DEPLOYMENT.md`.

## 12. Error, Loading, and Failure Architecture

- Validation failures resolve at the client with plain feedback before any write is attempted; server-side validation remains authoritative.
- Authentication failures return the user to entry without exposing account detail.
- Authorization failures deny the operation without revealing the existence or content of unpermitted records.
- Network failures preserve entered data where practical and offer retry or safe return to context.
- Database/service failures during sale, payment, inventory, receiving, or approval operations resolve into explicit failure — never partial success presented as success.
- Empty data resolves into plain empty states with a next valid action, not errors.
- Unexpected application errors resolve into a recoverable state with a path back to a valid area. UX wording belongs in `docs/UI-UX.md`.

## 13. Performance and Scalability

- Keep the client light: no SSR, no extra services, minimal dependencies, forms and lists suited to phones.
- Retrieve data per area within permissions; avoid fetching unneeded stores, history, or summaries.
- Scalability for this project means reasonable growth of business records (customers, sales, payments, stock movements) within the current single-database architecture — not enterprise scale, and no caching, queues, or distributed machinery without a confirmed need. No numeric targets are set.

## 14. Non-Goals

- Custom backend services or a second server-side boundary.
- Server-side rendering or native mobile applications.
- Payment processing, notifications, analytics, or third-party functional integrations.
- Advanced inventory, accounting, CRM, payroll, or HR subsystems.
- Complex reporting or analytics beyond the agreed summaries, export, and printing.
- Caching layers, queues, event buses, or distributed architecture.
- Guarantees of business outcomes or enterprise-scale behavior.

Anything here requires a rescoped requirement plus a `docs/DECISIONS.md` entry to add.

## 15. Future / Conditional Decisions

- Playwright critical-path E2E — adopted only if budget and schedule permit; owned by `docs/TESTING.md`, recorded in `docs/DECISIONS.md` when triggered.
- Excel export library — selected only after report formats are confirmed (REQ-REP-003); owned by `docs/TECH-STACK.md`.
- Any new integration, service, or architectural layer — adopted only on a confirmed requirement; owned by the relevant document and recorded in `docs/DECISIONS.md`.

## 16. Related Documentation

- `README.md` — repository orientation
- `AGENTS.md` — AI-agent operating rules
- `docs/PROJECT.md` — product and business context
- `docs/REQUIREMENTS.md` — functional and business requirements (authoritative for required behavior)
- `docs/TECH-STACK.md` — technology decisions
- `docs/ARCHITECTURE.md` — architecture (this file)
- `docs/UI-UX.md` — experience requirements
- `docs/DATA-MODEL.md` — data structure
- `docs/API.md` — contracts
- `docs/SECURITY.md` — security
- `docs/TESTING.md` — verification strategy
- `docs/DEVELOPMENT.md` — development workflow
- `docs/DEPLOYMENT.md` — deployment procedures
- `docs/DECISIONS.md` — material decisions

Architecture boundaries: schemas belong in `docs/DATA-MODEL.md`; API contracts in `docs/API.md`; security policies in `docs/SECURITY.md`; testing strategy in `docs/TESTING.md`; deployment procedures in `docs/DEPLOYMENT.md`; technology selection in `docs/TECH-STACK.md`; business requirements remain authoritative in `docs/REQUIREMENTS.md`.
