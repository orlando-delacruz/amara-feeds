# Amara + Zeann Store Management System — Deployment Guide

## 1. Purpose

This file explains the deployment approach: deployment architecture, hosting and source-control responsibilities, environments, configuration and secrets, data and auth production concerns, production verification, rollback and failure handling, handoff, scope boundaries, and acceptance criteria. It describes intent and procedure; exact production configuration is established during implementation and verified at deployment time. Procedures here never override `docs/SECURITY.md`, and business behavior stays owned by `docs/REQUIREMENTS.md`.

## 2. Deployment Principles

1. Simplest architecture that satisfies the agreed requirements: static frontend on Vercel, managed backend on Supabase, source control on GitHub — no additional services without genuine need.
2. Production stays close to a verified build; no manual production changes where configuration belongs in source control or platform settings.
3. Secrets and credentials never enter source control or client-side source.
4. Schema, policy, and data changes receive extra care and review before production.
5. A deployment is not complete because the build succeeds; production verification and a smoke test complete it.
6. Proportional to the ₱10,000 core scope: no dedicated release platform, complex pipelines, or monitoring infrastructure without demonstrated need.

## 3. Deployment Architecture

```text
GitHub (source control)
   │
   ▼
Vercel (static frontend hosting, preview + production)
   │
   └── React application (staff + admin, store-aware)
            │
            ▼
     Supabase platform
            │
            ├── Supabase Auth (staff + admin identity)
            ├── PostgreSQL (shared + store-specific records, RLS enforcement)
            └── Supabase migrations (versioned schema changes)
```

## 4. Hosting and Source Control

- **Vercel** serves production and preview builds of the static frontend; it performs no business logic and holds no runtime secrets beyond its own platform configuration.
- **GitHub** owns versioning and review; production deploys from reviewed source, never from ad-hoc local state.
- **Supabase** owns the production backend project: database, authentication, and data-layer enforcement.
- Repository, branch, and deployment wiring are confirmed during implementation, never invented here.

## 5. Environments

- **Local development:** implementation, debugging, and integration checks against non-production Supabase resources; no production secrets, no real customer data unless explicitly justified.
- **Preview:** per-change review builds for functional verification before production.
- **Production:** the live internal application for Amara and Zeann staff and admin. Production credentials and secrets are never committed.

## 6. Environment Configuration

Configuration areas: Supabase project connection, application settings, and environment-appropriate secrets. Exact variable names and values are defined only when implementation establishes them. Secrets live outside source control via the appropriate environment mechanism with separate values per environment where needed; nothing sensitive is exposed client-side; public-by-design values are still reviewed before treatment as public. No credentials, URLs, or variable names are documented here.

## 7. Data, Auth, and Admin Deployment

- Production uses a dedicated Supabase project, never shared with development data.
- Schema and access-policy changes ship as reviewed Supabase migrations before the application code that depends on them.
- Supabase Auth configuration and Row Level Security enforcement are verified in production for store assignment and admin-wide access; frontend behavior alone never counts as verification.
- Admin access is administrative (authenticated and authorized); production business data is never casually replaced, deleted, or reset as a first response.
- Pre-launch review confirms no placeholder, development, or fabricated business content remains.

## 8. Accessibility and Performance Verification

Pre-release checks against the production build: keyboard navigation, visible focus, usable labeled controls, readability, responsive mobile-first behavior, accessible feedback states, practical loading behavior, minimal unnecessary client code, and layout stability. Meaningful improvements over premature optimization; no numeric targets.

## 9. Security Verification

Production checks: working authentication; blocked unauthorized access to store-scoped and admin operations; correct data-access configuration; no exposed or committed secrets; server-side validation effective; unsafe input never rendered as trusted output; error responses free of sensitive detail. `docs/SECURITY.md` remains authoritative.

## 10. Release Workflow, Checklists, and Smoke Test

Recommended sequence: implement → review → local verification → preview → functional verification (including failure states, responsive/accessibility checks, and security-boundary checks) → configuration review → production deployment → production smoke test → launch verification.

Pre-deployment checklist: application journeys (sale, payment, receiving, product approval, dashboard review) verified on preview; auth and authorization verified at the data layer; migrations reviewed; configuration and secrets verified present-but-unexposed; no placeholder content; accessibility and performance checks done.

Post-deployment smoke test against production: sign in as staff and admin; record a sale and confirm store context and stock effect; record a payment and confirm shared history; submit and approve a product; open dashboard summaries with export and printing; confirm mobile usability; review console/network output for errors. A failed smoke test blocks launch; success means operational and verified — never guaranteed business outcomes.

## 11. Post-Deployment Monitoring

Proportionally to project size, watch for failed sign-ins, failed or inconsistent sale/payment/stock operations, authorization errors, data errors, performance regressions, and hosting or Supabase platform issues — with no dedicated monitoring platform unless demonstrated need.

## 12. Rollback, Recovery, and Failure Considerations

- Restore a known-good version on blocking issues: revert the change, redeploy the known-good version, correct configuration.
- Data changes need extra care: application rollback does not reverse data changes; production data is never deleted or reset as a first response.
- Supabase platform issues: degrade gracefully where practical — no false success on failed operations, admin errors without exposed internals, enforcement never silently bypassed; platform outages never present the core surface as healthy when it is not.

## 13. Client Handoff and Ownership

Before handoff confirm the client holds needed access and information: admin access, Supabase project ownership, Vercel and GitHub access where agreed, usage documentation, and an issue-reporting process. Credentials are never stored in this file. The developer implements and verifies agreed configuration; the client owns client-controlled accounts and services. Exact ownership is confirmed, never assumed.

## 14. Scope Boundaries and Confirmation Items

Deployment covers making the agreed core project operational and excludes, unless separately agreed: ongoing administration, guaranteed outcomes, content production, complex monitoring infrastructure, custom DevOps, maintenance beyond arrangement, and excluded platform functionality. Deployment-time confirmation items — final projects, repositories, branches, environment values, Supabase configuration, account ownership, production data readiness, launch approval — are confirmed during implementation and deployment, never assumed.

## 15. Acceptance Criteria and Source-of-Truth Relationships

Deployment is ready when the production application loads and is responsive; sign-in and protected access work; sale, payment, receiving, approval, and dashboard journeys verify with correct store/shared behavior; data-access controls verify; exports and printing work; no blocking defects remain; and the smoke test passes.

This file governs deployment concerns only. Technology selection stays owned by `docs/TECH-STACK.md`; architecture by `docs/ARCHITECTURE.md`; security by `docs/SECURITY.md`; verification by `docs/TESTING.md`; workflow by `docs/DEVELOPMENT.md` (deployment changes follow understand → inspect → plan → implement → review → verify → regress → report); decisions with deployment impact are recorded in `docs/DECISIONS.md`.
