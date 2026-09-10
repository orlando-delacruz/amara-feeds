# Business Context Documentation Template System — Guide

## 1. What This Is

This directory is a reusable documentation template system for client projects that combine a **business/marketing concern** (what the business offers, who it serves, what content is confirmed) with a **software implementation concern** (how an AI coding agent or developer builds, verifies, and deploys the system).

Copy the template files into a new project, fill in the bracketed placeholders, delete what does not apply, and the result is the project's living context documentation.

> Guidance: this guide is read first by both humans and AI agents. It defines shared conventions. Individual templates reference this guide instead of restating conventions.

## 2. File Inventory

| Template file | Purpose | Status |
| --- | --- | --- |
| `TEMPLATE-GUIDE.md` (this file) | How the system works; conventions; fill order; source-of-truth map | Required reading, not copied as project content |
| `AGENTS.md` | Operating rules for the AI coding agent: principles, scope control, priorities, never-do list | Core — always include |
| `README.md` | Repository orientation: what the repo is, where things live, constraints, doc index | Core — always include |
| `docs/PROJECT.md` | Business and product context: purpose, goals, audience, offerings, scope, brand, service area, confirmation status | Core — always include |
| `docs/REQUIREMENTS.md` | Testable functional and non-functional requirements with priorities and a confirmation checklist | Core — always include |
| `docs/TECH-STACK.md` | Selected technologies, what each is for, what is conditional, what is excluded | Conditional — include when the project selects technologies |
| `docs/ARCHITECTURE.md` | How components fit together, data flows, layers, boundaries, non-goals | Conditional — include when the project has a software architecture |
| `docs/UI-UX.md` | Behavior and experience requirements (journeys, navigation, forms, states, accessibility, responsive) | Conditional — include when the project has user-facing UI |
| `docs/DESIGN-SYSTEM.md` | Visual language: tokens, components, variants, states, motion, responsive rules | Conditional — include when the project has custom UI styling |
| `docs/DATA-MODEL.md` | Data concepts, relationships, public-vs-private boundaries, confirmation status | Conditional — include when the project stores or manages data |
| `docs/API.md` | Endpoint and integration contracts: flows, request/response principles, validation, errors | Conditional — include when the project has server endpoints or third-party integrations |
| `docs/SECURITY.md` | Security requirements: auth, authorization, secrets, input handling, privacy | Conditional — include when the project handles users, data, or integrations (recommended for almost all software projects) |
| `docs/TESTING.md` | Verification strategy: what is verified, at what level, quality gates, reporting | Conditional — include when verification beyond ad-hoc checks is needed |
| `docs/DEVELOPMENT.md` | Development workflow: context loading, inspection, planning, review, definition of done | Core — always include for AI-assisted projects |
| `docs/DEPLOYMENT.md` | Deployment and production procedures: environments, config, verification, handoff | Conditional — include when the project is deployed to production |
| `docs/DECISIONS.md` | Decision records: what was decided, why, alternatives, consequences, lifecycle | Core for non-trivial projects; optional for very small static sites |

## 3. Required vs Conditional

**Core (start every project with these):** `AGENTS.md`, `README.md`, `docs/PROJECT.md`, `docs/REQUIREMENTS.md`, `docs/DEVELOPMENT.md`, `docs/DECISIONS.md`.

**Conditional (add when the project needs them):**

- User-facing pages or app → add `docs/UI-UX.md`, and `docs/DESIGN-SYSTEM.md` if visual consistency matters.
- A chosen technology set → add `docs/TECH-STACK.md` and `docs/ARCHITECTURE.md`.
- Stored content, user accounts, uploads, or records → add `docs/DATA-MODEL.md`.
- Server-side behavior or external services → add `docs/API.md`.
- Authentication, personal data, payments, or admin access → add `docs/SECURITY.md`.
- Formal verification expectations → add `docs/TESTING.md`.
- Hosted production environment → add `docs/DEPLOYMENT.md`.

> Guidance: do not create conditional templates "just in case." Each file must earn its place. A simple static site may need only the core files plus `DEPLOYMENT.md`.

## 4. Recommended Filling Order

Fill templates in dependency order so earlier decisions feed later ones:

```text
AGENTS.md + README.md (operating rules, orientation)
   ↓
docs/PROJECT.md (business context)
   ↓
docs/REQUIREMENTS.md (what the system must do)
   ↓
docs/UI-UX.md (behavior) → docs/DESIGN-SYSTEM.md (visual language)
   ↓
docs/TECH-STACK.md (technology choices)
   ↓
docs/ARCHITECTURE.md (composition and flows)
   ↓
docs/DATA-MODEL.md (concepts) → docs/API.md (contracts) → docs/SECURITY.md (constraints)
   ↓
docs/TESTING.md (verification) → docs/DEVELOPMENT.md (workflow)
   ↓
docs/DEPLOYMENT.md (production)
   ↓
docs/DECISIONS.md (ongoing, appended as choices are made)
```

> Guidance: `docs/DECISIONS.md` is never "filled in" up front. It starts empty and gains records as material choices are made.

## 5. How the Templates Relate (Single Source of Truth)

Each fact has exactly one authoritative home. Other files reference it; they do not restate it.

| Concern | Authoritative file |
| --- | --- |
| How work is performed, agent behavior, scope control | `AGENTS.md` (+ `docs/DEVELOPMENT.md` for workflow detail) |
| Repository orientation | `README.md` |
| Business context, goals, audience, offerings, scope, brand | `docs/PROJECT.md` |
| What the system must do (testable requirements) | `docs/REQUIREMENTS.md` |
| Technology selection and exclusions | `docs/TECH-STACK.md` |
| Component composition, layers, data flows | `docs/ARCHITECTURE.md` |
| Behavior and experience | `docs/UI-UX.md` |
| Visual language and reusable styling | `docs/DESIGN-SYSTEM.md` |
| Data concepts, relationships, boundaries | `docs/DATA-MODEL.md` |
| Endpoint behavior, validation principles, integration boundaries | `docs/API.md` |
| Security expectations | `docs/SECURITY.md` |
| Verification strategy | `docs/TESTING.md` |
| Production procedures | `docs/DEPLOYMENT.md` |
| Material choices and their rationale | `docs/DECISIONS.md` |

Cross-cutting rules:

- **Out of scope** is owned once in `docs/PROJECT.md` (business scope) and expressed as requirements in `docs/REQUIREMENTS.md`. All other templates reference those sections; they do not maintain their own competing scope lists.
- **Reference/legacy material** (content carried over from a previous website, brand, or document set) is defined once in `docs/PROJECT.md` with a status of Reference-Only. Other templates reference that definition.
- **Client-confirmation checklist** is owned once in `docs/REQUIREMENTS.md`. Other templates reference it.
- **Technology decisions** are owned once in `docs/TECH-STACK.md`. Other templates name technologies only to describe their own concern (e.g. data flows), never to select or re-decide them.

## 6. Shared Status Vocabulary

Use these labels consistently. Do not invent parallel labels.

- **Confirmed** — established by project documentation or explicit client confirmation. May be relied on.
- **Conditional** — exists only if a separately confirmed requirement activates it. Never implemented by default.
- **Confirmation Required** — cannot be finalized, published, or treated as production behavior without explicit confirmation.
- **Reference-Only** — originates from legacy/previous material. Historical context only; never current project data.
- **Implementation Decision Required** — tooling, command, or convention detail not yet established. Must be decided and recorded, never invented silently.

Requirement priorities (used in `docs/REQUIREMENTS.md`):

- **Must** — required for the agreed scope. The project is incomplete without it.
- **Should** — important but secondary.
- **Could** — useful only if it adds no risk, cost, or complexity.
- **Confirmation Required** — as defined above.

## 7. Placeholder Conventions

- Prefer descriptive placeholders: `[BUSINESS_NAME]`, not `[NAME]`.
- Common placeholders: `[BUSINESS_NAME]`, `[CLIENT_NAME]`, `[PROJECT_NAME]`, `[INDUSTRY]`, `[PRODUCT_OR_SERVICE]`, `[TARGET_AUDIENCE]`, `[PRIMARY_GOAL]`, `[SERVICE_AREA]`, `[PROJECT_BUDGET]`, `[PRIMARY_SEARCH_INTENT]`, `[CONTACT_DETAIL]`, `[REVIEW_PLATFORM_URL]`, `[ANALYTICS_SERVICE]`.
- In technology templates, prefer table rows with bracketed cells (e.g. `[Technology]`, `[Role]`, `[Status]`) over inventing many technology-specific placeholder names.
- Remove every bracketed placeholder before publication, or explicitly mark the item Confirmation Required.

## 8. Guidance and Example Conventions

Each template uses two blockquote conventions:

- `> Guidance:` — an instruction to the person filling in the template. Delete guidance notes from finished project documentation, or keep them only where they help future maintainers.
- `> Example:` — an illustrative completion of a section. Examples are fictional and must never be mistaken for requirements. Clearly label them and replace them with real content.

## 9. How to Customize for a New Business/Client

1. Copy the core templates into the new repository (`AGENTS.md`, `README.md`, `docs/PROJECT.md`, `docs/REQUIREMENTS.md`, `docs/DEVELOPMENT.md`, `docs/DECISIONS.md`).
2. Add conditional templates the project actually needs (see Section 3).
3. Fill `docs/PROJECT.md` first: business identity, goals, audience, offerings, scope, brand rules, and what is Reference-Only.
4. Convert `docs/PROJECT.md` context into testable requirements in `docs/REQUIREMENTS.md`, including the confirmation checklist.
5. Fill the remaining templates in the order in Section 4, replacing placeholders with confirmed facts.
6. Mark everything unconfirmed as Confirmation Required. Never publish reference, placeholder, or invented content as business fact.
7. Record material choices in `docs/DECISIONS.md` as they are made.
8. Delete guidance notes and examples that are no longer needed.

## 10. Rules for Keeping Information in the Correct File

- Business facts (offerings, prices, policies, contact details, service area) live in `docs/PROJECT.md` and are required in `docs/REQUIREMENTS.md`. Nowhere else defines them.
- Behavior lives in `docs/UI-UX.md`. Visual values live in `docs/DESIGN-SYSTEM.md`. Neither defines the other's concern.
- Technology selection lives in `docs/TECH-STACK.md`. Data schemas and endpoint wire formats are never defined there.
- Database concepts live in `docs/DATA-MODEL.md`. Endpoint behavior lives in `docs/API.md`. Security policy lives in `docs/SECURITY.md`. Each defers to the others on their concerns.
- If a sentence could live in two files, put it in the authoritative file (Section 5) and reference it from the other.

## 11. Rules for Avoiding Duplicated or Conflicting Information

1. One home per fact (Section 5). Reference; do not restate.
2. When two sources disagree, name the conflict and resolve it against the authority table — never silently choose.
3. Where documentation and implementation disagree, the implementation governs actual behavior, and the discrepancy must be identified explicitly before changing anything.
4. Status labels (Section 6) travel with every uncertain statement so readers can tell confirmed facts from open questions.
5. Never copy legacy or reference content into a template as if it were confirmed. It stays Reference-Only until explicitly confirmed, and the confirmation is recorded.

## 12. What Not to Do

- Do not invent business requirements, prices, policies, contact details, testimonials, coverage areas, or legal terms.
- Do not assume an industry, country, technology stack, business model, feature set, payment provider, hosting provider, database, or marketing strategy. Express conditional needs conditionally.
- Do not create templates the project does not need.
- Do not turn guidance notes or examples into requirements.
- Do not duplicate the same list across files.
- Do not record trivial implementation choices in `docs/DECISIONS.md`.
