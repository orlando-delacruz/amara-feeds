# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Store staff** (Amara or Zeann): non-technical workers who operate the system on mobile phones throughout the day. Their job is fast, accurate data entry — recording sales, receiving stock, managing customers, and collecting on credit.
- **Admin / business owner**: oversees both stores from the same system, reviewing summaries, approving products, managing staff accounts, and exporting/printing reports.

## Product Purpose

A two-store business management system that lets Amara and Zeann share one customer and credit record while keeping per-store sales and inventory separate. It records sales quickly and accurately on mobile, tracks shared credit/collection with traceable cross-store payments, deducts stock automatically on sale, and gives the owner business-wide daily summaries and reporting.

## Positioning

One shared record for customers and credit across two physically separate stores, with per-store sales, stock, and remittance kept distinct and every cross-store payment traceable — so the owner and staff never lose which store a transaction belongs to.

## Operating Context

- Staff use the app on mobile phones on the store floor; the full sales, payment, and receiving workflows must be usable on small screens.
- Staff always operate in a clear store context (Amara or Zeann); shared records are visibly shared.
- The owner reviews daily sales by store, overall daily sales, outstanding credit, payments, current stock, and received stock from the dashboard and reports, including Excel export and printing.
- Accounts are per-staff, store-assigned; disabled accounts cannot sign in.
- Core budget is ₱10,000 with a target completion of September 30, 2026; the core scope is defined in `docs/PROJECT.md`.

## Capabilities and Constraints

- Sales: customer optional, items/quantity, cash or charge (terms select with automatic due date), delivery details (fee, rider, vehicle) when applicable.
- Customers: one shared record across both stores.
- Credit/collection: charge transactions, partial payments until fully paid, cross-store payments with traceable origin/payment-store history.
- Inventory: per-store stock, automatically deducted on a saved sale; receiving records store, item, quantity, supplier, purchase/cost price, and delivery rider/vehicle.
- Products: staff can add; admin approval required before activation.
- Users: store-assigned staff accounts; admin can add/edit/disable.
- Admin: business-wide dashboards, product approval, exports, printing.
- No marketing or public-facing surfaces. No fabricated product, pricing, policy, or business data is to be displayed.
- Exact product catalog, pricing, detailed policies, and some edge-case rules are Confirmation Required and must not be invented.

## Brand Commitments

- Product/brand name: **Amara Feeds** (confirmed on-screen brand).
- Operating store names: **Amara** and **Zeann**.
- Visual identity was explicitly reopened for redesign by the owner (2026-09-13); the previous evergreen-green/warm-sand identity is no longer binding. No logo artwork exists.

## Evidence on Hand

- Repository implementation (`src/`) is the incumbent visual and behavioral authority.
- `docs/PROJECT.md`, `docs/REQUIREMENTS.md`, `docs/UI-UX.md`, `docs/DESIGN-SYSTEM.md` capture confirmed product and behavior truth.
- No real customer, product, or business data beyond seeded mock fixtures; nothing may be fabricated as fact.

## Product Principles

1. Fast, one-path data entry on mobile for frequent workflows (sale, payment, receiving).
2. Store context (Amara vs Zeann) and shared-vs-store-specific status are always visible.
3. Business data is handled safely: confirmations, validation, and duplicate-submission protection guard every save.
4. Clear, plain, non-technical language and feedback throughout.
5. Stay within the agreed core scope and budget; no invented requirements or business content.

## Accessibility & Inclusion

- WCAG AA text contrast as a baseline; text never conveyed by color alone.
- Keyboard operation and visible focus; reduced-motion support where motion exists.
- Touch targets at least 44px in the touch dimension.