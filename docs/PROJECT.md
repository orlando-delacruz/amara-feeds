# ZAF ONE — Project Context

## 1. Project Overview

- **Project name:** ZAF ONE
- **Project type:** business management web application
- **Business type:** Amara and Zeann — a two-store business
- **Primary purpose:** help the business manage shared customers, per-store sales and inventory, and shared credit/collection

## 2. Business Context

- The business operates two stores: Amara and Zeann.
- Staff primarily use the system on mobile phones; admin users manage the overall business.
- Customers are shared between both stores through one shared customer record, not separate records per store.
- Sales are separate per store, including daily sales/remittance tracked separately per store.
- Inventory/stock is separate per store.
- Credit/collection is shared across both stores: a customer may incur credit at one store and pay through the other store, with origin-store and payment-store history remaining traceable.

No additional business details (industry, location, products, service area, business history) are confirmed beyond the above.

## 3. Project Goals

### Staff-facing goals

- Record sales quickly and accurately, including customer, items/quantity, payment type, and delivery details where applicable.
- Track customers and credit accurately across both stores.
- Keep cross-store payments and credit history visible and traceable.
- Track store-level inventory accurately.
- Support a mobile-friendly staff workflow.

### Business/admin goals

- Review useful business summaries and reporting (daily sales by store, overall daily sales, outstanding credit, payments, stock, received stock).
- Maintain accurate customer, credit, inventory, and sales records.
- Provide a maintainable core system that can be rescoped explicitly if extended later.

This project does not promise revenue increases, guaranteed efficiency gains, rankings, or other outcomes that cannot be guaranteed.

## 4. Project Scope

### Main Application Surface

- Sales recording: customer (optional; attach existing or add new), items/quantity, payment type (cash or charge), delivery details (fee, rider, vehicle) when applicable.
- Customers: shared customer records across Amara and Zeann.
- Credit/collection: charge transactions with selected payment terms and automatically calculated due dates; partial payments until fully paid; shared collection with cross-store payments and traceable origin/payment-store history.
- Inventory: per-store stock, automatically deducted when a sale is saved.
- Receiving: per-store stock receipts recording store, item, quantity, supplier, and purchase/cost price.
- Products: staff can add products/items; newly added products require admin approval before becoming active.
- Users: individual staff accounts, each assigned to a store.
- Admin/management: admin dashboard with useful business summaries, Excel export, and printing, within agreed scope.

### Admin / Management

- Admin users manage the overall business, including product approvals and review of sales, customers, credit, payments, stock, received stock, and reports.

### Deployment

- Production deployment is a high-level project boundary. Hosting/platform details are not confirmed in this document.

## 5. Target Customers

This section describes the people served by the system, not external website visitors.

- Store staff/users operating Amara or Zeann.
- Admin/business management users.

Demographics and personas are undefined.

## 6. Customer Journey

This is an internal business-management workflow, not a public marketing funnel.

1. **Sign in** — staff enters the system under an individual store-assigned account.
2. **Customer** — staff records or selects a customer when applicable; customer selection is optional.
3. **Sale** — staff records items/quantity and payment/charge information, plus delivery details when applicable.
4. **Update** — inventory and credit/collection records are updated according to the business rules, including automatic stock deduction on saved sales.
5. **Payment** — payments against shared customer credit may be recorded through either store while preserving origin/payment-store history.
6. **Review** — admin reviews summaries, stock, credit, payments, and reports, including Excel export and printing where applicable.

## 7. Offerings

The confirmed business context does not specify actual merchandise categories, so this document does not define a product/service catalog. The following are system-managed business areas, not the business's actual product offerings:

### Sales

- Per-store sales recording and daily sales/remittance tracking.

### Customers

- Shared customer records across both stores.

### Credit / Collection

- Shared credit/collection with terms-based due dates, partial payments, cross-store payments, and traceable history.

### Inventory / Receiving

- Per-store stock tracking with automatic deduction on sale and structured receiving records.

### Products

- Product/item records with staff creation and admin approval before activation.

### Administration / Reporting

- Business summaries, Excel export, and printing within agreed scope.

Detailed item names, pricing, descriptions, and availability are not confirmed by this document and must not be invented.

## 8. Pricing and Policies

- The ₱10,000 figure is the initial/core project budget constraint, not a customer-facing business price.
- Actual store product pricing, credit terms beyond the confirmed selected-terms workflow, and other business policies require confirmation before implementation/publication and must not be invented.

## 9. Content Strategy

The system uses accurate, operationally useful labels and information for sales, customers, credit/collection, inventory, receiving, products, and reporting. Invented product details, pricing, policies, customer records, testimonials, and business claims are not permitted.

## 10. Brand Context

- Product/brand name: **ZAF ONE** (renamed from "Amara Feeds" 2026-09-14; the two operating stores remain Amara and Zeann).
- Official logo: provided by the business (`src/assets/logo-clear.png`); the badge reads "Aquatic Feeds / Zeann Feeds Supply" and its palette drives the app theme. The product name remains ZAF ONE.
- Confirmed store/business names: **Amara** and **Zeann**.
- No previous brand, logo artwork, brand history, or other identity information is confirmed beyond the provided logo.

## 11. Legal and Privacy Context

- Legal/privacy requirements must reflect actual implemented functionality and client-approved policies.
- No specific legal policies or legal obligations are defined in this document. Implementation detail belongs in `docs/SECURITY.md`.

## 12. Project Constraints

- Initial/core project budget: ₱10,000.
- Target completion: September 30, 2026.
- Core-first delivery of the agreed business-management workflow.
- Avoid scope creep and over-engineering.
- Maintain the agreed distinction between shared and store-specific data/workflows.
- Additional capabilities require explicit rescoping. The budget defines the agreed initial/core scope, not a hard technical limitation on every future enhancement.

## 13. Out of Scope

The following are currently outside the agreed core scope and subject to explicit rescoping:

- Advanced reporting beyond the agreed useful summaries.
- Advanced inventory management beyond the confirmed receiving/stock workflow.
- Unrelated business-management modules.
- Integrations, payment gateways, and third-party services not explicitly confirmed.
- Advanced accounting, CRM, payroll, HR, or similar systems.
- Guarantees of business outcomes.

## 14. Known Information vs. Information Requiring Confirmation

### Known / established direction

- Two stores: Amara and Zeann.
- Shared customers with one shared customer record.
- Separate sales, including daily sales/remittance per store.
- Separate inventory per store.
- Shared credit/collection with cross-store payments and traceable history.
- Confirmed sales workflow (customer optional; items/quantity; cash or charge; delivery details when applicable).
- Confirmed credit/payment behavior (selected terms with automatic due-date calculation; partial payments until fully paid).
- Confirmed inventory/receiving behavior (automatic deduction on sale; receiving records store, item, quantity, supplier, purchase/cost price).
- Product approval (staff can add; admin approval required before activation).
- Individual staff accounts assigned to a store.
- Admin reporting (daily sales by store, overall daily sales, outstanding credit, payments, current stock, received stock, Excel export, printing, other useful summaries within agreed scope).
- Budget (₱10,000) and target date (September 30, 2026).
- Technology direction decided in `docs/TECH-STACK.md` (React + Vite + TypeScript, Supabase platform with PostgreSQL/Auth/Row Level Security, Vercel hosting, GitHub source control).

### Requires confirmation before publication or implementation

- Exact product catalog.
- Exact pricing/product data.
- Detailed policies not explicitly confirmed.
- Exact permission detail beyond store assignment and product approval.
- Exact report/export formats.
- Exact validation rules and edge-case behavior not listed above.
- Other business rules not listed above.

Unknowns are not requirements until explicitly confirmed.

## 15. Related Documentation

- `README.md` — repository orientation
- `AGENTS.md` — AI-agent operating rules
- `docs/PROJECT.md` — product and business context (this file)
- `docs/REQUIREMENTS.md` — functional and business requirements
- `docs/TECH-STACK.md` — technology decisions
- `docs/ARCHITECTURE.md` — architecture
- `docs/UI-UX.md` — experience requirements
- `docs/DATA-MODEL.md` — data structure
- `docs/API.md` — contracts
- `docs/SECURITY.md` — security
- `docs/TESTING.md` — verification strategy
- `docs/DEVELOPMENT.md` — development workflow
- `docs/DEPLOYMENT.md` — deployment procedures
- `docs/DECISIONS.md` — material decisions
