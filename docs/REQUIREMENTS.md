# ZAF ONE — Requirements

## 1. Requirements Overview

This file defines what the system must do from a product and user perspective. It converts `docs/PROJECT.md` context into clear, testable requirements. Technical implementation (schemas, contracts, architecture, design rules, test plans, workflows, deployment, security detail) belongs in the owning documents.

Relationship to other documents:

- `AGENTS.md` governs how work is performed.
- `README.md` orients readers to the repository.
- `docs/PROJECT.md` is authoritative for product/business context. Where this file and `docs/PROJECT.md` disagree on business context, `docs/PROJECT.md` governs. Where implementation and documentation disagree, the implementation governs actual behavior and the discrepancy must be resolved explicitly.

Core constraints: initial/core project budget of ₱10,000; target completion September 30, 2026; core-first delivery without scope creep or unnecessary complexity.

## 2. Requirement Priority

- **Must** — required for the agreed scope. The project is incomplete without it.
- **Should** — important but secondary.
- **Could** — useful only if it adds no risk, cost, or complexity.
- **Confirmation Required** — cannot be finalized, published, or treated as production behavior without explicit confirmation.

## 3. Store Context Requirements

- REQ-STORE-001 (**Must**): The system MUST support exactly two stores: Amara and Zeann.
- REQ-STORE-002 (**Must**): Store-specific records (sales, inventory) MUST remain distinguishable by store for tracking and daily sales/remittance reporting.
- REQ-STORE-003 (**Must**): Shared records (customers, credit/collection) MUST remain usable across both stores while preserving store-origin information where the business rules require it.

## 4. Customer Requirements

- REQ-CUST-001 (**Must**): The system MUST maintain one shared customer record per customer, accessible across Amara and Zeann according to the user's permissions.
- REQ-CUST-002 (**Must**): Customer selection MUST be optional for every sale.
- REQ-CUST-003 (**Must**): During a sale, staff MUST be able to select an existing customer or add a new customer.
- REQ-CUST-004 (**Must**): Adding a customer MUST record their name and MAY record a contact and an address; the customer list and the sale's selected customer display the address.

## 5. Sales Requirements

- REQ-SALE-001 (**Must**): Sales MUST be recorded as separate per store.
- REQ-SALE-002 (**Must**): A sale MUST support the workflow: select/add customer if applicable → add items and quantities → select payment type (cash or charge) → record delivery details when applicable.
- REQ-SALE-003 (**Must**): Payment type MUST be either cash or charge.
- REQ-SALE-004 (**Must**): Delivery information MUST support delivery fee, rider, and vehicle when applicable.
- REQ-SALE-005 (**Must**): Store-specific sales MUST remain distinguishable for daily sales/remittance reporting.
- REQ-SALE-006 (**Must**): A sale MUST record its business date (defaults to today; backdating allowed) independent of when it was created, and credit due dates MUST derive from that business date.
- REQ-SALE-007 (**Must**): A sale MUST record the mode of payment (assumed presets: Cash, GCash, Maya, Bank Transfer, Check, or a free-text Other) and MAY record a one-time discount; the net total MUST be items + delivery fee − discount.

Acceptance: given sales recorded at Amara and Zeann on the same day, daily sales/remittance can be reported separately per store.

## 6. Credit / Collection Requirements

- REQ-CRED-001 (**Must**): Credit/collection MUST be shared across Amara and Zeann.
- REQ-CRED-002 (**Must**): Charge transactions MUST use selected payment terms.
- REQ-CRED-003 (**Must**): The due date MUST be calculated automatically from the selected terms.
- REQ-CRED-004 (**Must**): Partial payments MUST be supported; payments continue until the credit is fully paid.
- REQ-CRED-005 (**Must**): A customer MAY incur credit at one store and make payment through the other store.
- REQ-CRED-006 (**Must**): Each credit MUST preserve customer, credit origin store, payment store(s), payment history, remaining balance, and payment/credit status.
- REQ-CRED-007 (**Must**): Cross-store credit/payment history MUST be visible as one traceable history.

Acceptance: given a customer has outstanding credit originating from Amara, a permitted user at Zeann can record a payment and the shared balance/history reflects that payment and identifies Zeann as the payment store.

## 7. Payment Requirements

- REQ-PAY-001 (**Must**): Payments against shared customer credit MUST be recordable through either store by a permitted user.
- REQ-PAY-002 (**Must**): Each recorded payment MUST preserve the payment store and remain part of the shared credit history with an updated remaining balance and status.

## 8. Inventory Requirements

- REQ-INV-001 (**Must**): Inventory MUST be tracked separately per store.
- REQ-INV-002 (**Must**): Stock MUST be automatically deducted from the selling store when a sale is successfully saved.

Acceptance: given a sale is successfully saved, the relevant store's inventory decreases according to the quantities sold.

## 9. Receiving Stock Requirements

- REQ-RCV-001 (**Must**): Receiving stock MUST record store, item, quantity, supplier, and purchase/cost price.
- REQ-RCV-002 (**Must**): Receiving stock MUST record the delivery rider and vehicle that brought the stock to the store; both are required before saving a receipt.

## 9a. Delivery (Riders and Vehicles) Requirements

- REQ-DELIV-001 (**Must**): The system MUST maintain a list of delivery riders per store; staff manage their own store's riders and admin manages both stores.
- REQ-DELIV-002 (**Must**): The system MUST maintain a list of vehicle types per store; staff manage their own store's vehicles and admin manages both stores.
- REQ-DELIV-003 (**Must**): Delivery on a sale MUST be recorded by selecting from the current store's active riders and vehicle types; inactive entries MUST NOT be selectable.
- REQ-DELIV-004 (**Must**): Riders and vehicle types MUST support full create, read, update (rename and activate/deactivate), and delete. A rider or vehicle referenced by any sale, receiving, or expense record MUST NOT be deletable; it MUST be deactivated instead so history stays intact.

## 9b. Expense Tracking Requirements

- REQ-EXP-001 (**Must**): The system MUST record fuel and repair expenses per rider or vehicle, scoped to a store.
- REQ-EXP-002 (**Must**): The system MUST compute a per-rider and per-vehicle net figure: delivered-sales value minus their recorded expenses.
- REQ-EXP-003 (**Must**): Staff MUST record expenses for their own store only; admin MAY record expenses for either store.

## 10. Product and Approval Requirements

- REQ-PROD-001 (**Must**): Staff MUST be able to add products/items.
- REQ-PROD-002 (**Must**): Staff-created products MUST NOT become active immediately.
- REQ-PROD-003 (**Must**): Admin approval MUST be required before a newly added product becomes active.

Acceptance: given a staff member creates a product, it remains inactive until approved by an admin.

## 11. Staff and User Access Requirements

- REQ-USER-001 (**Must**): Staff MUST have individual accounts.
- REQ-USER-002 (**Must**): Each staff account MUST be assigned to a store.
- REQ-USER-003 (**Must**): Admin users MUST be able to manage the overall business, including at minimum product approvals and review of sales, customers, credit, payments, stock, received stock, and reports.
- REQ-USER-004 (**Confirmation Required**): Permission differences between admin and staff beyond the confirmed store assignment and product approval require explicit confirmation.
- REQ-USER-005 (**Must**): Each operational record (sale, payment, receiving) MUST carry the staff member who recorded it, and a staff member MUST NOT modify another staff member's records. (Attribution is implemented now; edit/delete creator enforcement is Confirmation Required until editing is added.)
- REQ-USER-006 (**Must**): A staff member MUST only see the overall sales of the store to which they are assigned, and MUST NOT see the sales of the other store.
- REQ-USER-007 (**Must**): Admin users MUST be able to add staff accounts (name, username, password, assigned store), change a staff member's store assignment or credentials, and disable/enable an account. Disabled accounts MUST NOT be able to sign in.

## 11. Staff and User Access Requirements

- REQ-AUTH-001 (**Must**): Staff and admin MUST sign in with a username and password through a login form; credentials for the current mock implementation are stored locally (localStorage-backed mock) and are replaced by Supabase Auth in a later phase.

## 12. Admin Dashboard Requirements

- REQ-DASH-001 (**Must**): The admin dashboard MUST provide daily sales by store.
- REQ-DASH-002 (**Must**): The admin dashboard MUST provide overall daily sales.
- REQ-DASH-003 (**Must**): The admin dashboard MUST provide outstanding credit.
- REQ-DASH-004 (**Must**): The admin dashboard MUST provide payments.
- REQ-DASH-005 (**Must**): The admin dashboard MUST provide current stock.
- REQ-DASH-006 (**Must**): The admin dashboard MUST provide received stock.
- REQ-DASH-007 (**Could**): The admin dashboard MAY provide other useful summaries only where appropriate and within agreed scope.

## 13. Reporting / Excel Export / Printing Requirements

- REQ-REP-001 (**Must**): The system MUST support Excel export of the agreed business summaries.
- REQ-REP-002 (**Must**): The system MUST support printing of the agreed business summaries.
- REQ-REP-003 (**Confirmation Required**): Exact report columns and formats require explicit confirmation.
- REQ-REP-004 (**Must**): Reports MUST be admin-only; staff MUST NOT access the reports surface or see it in navigation. Reports MUST support selecting a From/To date range, MUST show a "Sales by mode of payment" breakdown, and the Excel export MUST cover that range's sale lines (date, location, customer, item, quantity, price, amount, type, mode of payment, delivery fee, discount, net, rider, vehicle).

## 14. Responsive and Accessibility Requirements

- REQ-ACC-001 (**Must**): The system MUST be usable on mobile viewports without loss of essential function, since staff primarily use mobile phones.
- REQ-ACC-002 (**Must**): Interactive elements MUST be keyboard-usable with visible focus.
- REQ-ACC-003 (**Must**): Form fields MUST have associated labels.
- REQ-ACC-004 (**Must**): Errors MUST be communicated in text, not by color alone.

## 15. Security and Privacy Requirements

- REQ-SEC-001 (**Must**): The system MUST restrict customer, sales, credit, inventory, and reporting data according to the user's permissions. Detail belongs in `docs/SECURITY.md`.
- REQ-SEC-002 (**Must**): Inputs MUST be validated at system boundaries. Detail belongs in `docs/SECURITY.md`.
- REQ-SEC-003 (**Must**): Legal/privacy content MUST reflect actual implemented functionality and client-approved policies. No retention periods or legal policies are invented here.

## 16. Error, Loading, and Empty States

- REQ-STATE-001 (**Must**): The system MUST show clear feedback for loading, validation errors, submission states, failures, and empty content. Failure MUST never present as success.

## 17. Non-Functional Requirements Summary

- Maintainability: keep the core system simple and maintainable within the ₱10,000 core scope.
- Performance: support efficient day-to-day recording and review without unnecessary complexity.
- Security: protect customer, credit, and business data per `docs/SECURITY.md`.
- Accessibility/responsiveness: mobile-primary staff workflow usable across viewports.
- Usability: predictable saves and clear feedback for sales, payments, receiving, and approvals.
- Reliability: sales, inventory, and credit records stay consistent with the confirmed business rules.

## 18. Out of Scope

Consistent with `docs/PROJECT.md`. The following are outside the agreed core scope unless explicitly added later:

- REQ-OOS-001: Advanced accounting.
- REQ-OOS-002: Payroll/HR.
- REQ-OOS-003: Standalone CRM beyond the confirmed shared-customer and credit behavior.
- REQ-OOS-004: Payment gateways and online payments.
- REQ-OOS-005: Unrelated third-party integrations.
- REQ-OOS-006: Advanced inventory systems beyond the confirmed receiving/stock workflow.
- REQ-OOS-007: Complex analytics beyond the agreed useful summaries.
- REQ-OOS-008: Unrelated business modules.
- REQ-OOS-009: Guarantees of business outcomes.

## 19. Requirements Requiring Confirmation

- [ ] Exact payment-term options and due-date calculation rules beyond the confirmed selected-terms workflow.
- [ ] Exact required customer fields and product fields.
- [ ] Exact validation rules.
- [ ] Exact permission differences between admin and staff beyond the confirmed store assignment and product approval.
- [ ] Exact report columns and formats.
- [ ] Exact handling of edge cases such as cancelled/edited sales, insufficient stock, duplicate customers, or reversed payments.
- [ ] Other business rules not listed as confirmed above.

## 20. Traceability to Project Context

| Requirement group (this file) | Source section(s) in `docs/PROJECT.md` |
| --- | --- |
| Store context | §2 Business Context |
| Customers | §2, §4 Main Application Surface, §6 |
| Sales | §4 Main Application Surface, §6, §7 |
| Credit / Collection | §2, §4 Main Application Surface, §6, §7 |
| Payments | §2, §4 Main Application Surface, §6 |
| Inventory | §2, §4 Main Application Surface, §7 |
| Receiving stock | §4 Main Application Surface, §7 |
| Products and approval | §4 Main Application Surface, §7 |
| Staff and user access | §2, §4, §6 |
| Admin dashboard | §4, §7 |
| Reporting / export / printing | §4, §6, §7 |
| Responsive and accessibility | §2, §3 |
| Security and privacy | §11 |
| Error, loading, empty states | §3, §4 |
| Out of scope | §13 |
| Confirmation items | §8, §14 |

## 21. Acceptance Criteria for This Document

1. Requirements are understandable by business and technical readers.
2. Requirements are testable (observable behavior with explicit priorities).
3. Confirmed direction is separated from assumptions and unconfirmed items.
4. No unsupported business claims are introduced.
5. Shared versus store-specific behavior is explicit throughout.
6. Out-of-scope functionality is listed consistently with `docs/PROJECT.md`.
7. Admin requirements define product behavior without inventing modules, models, or fields.
8. Requirements align with the agreed budget/scope constraint (₱10,000 core scope, September 30, 2026 target).
9. No technical architecture is duplicated unnecessarily here.
