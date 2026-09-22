# ZAF ONE — Data Model

## 1. Purpose and Scope

This file defines business data concepts, ownership boundaries, shared vs store-specific data, conceptual relationships, data categories, and unresolved data decisions. It fixes shared language before any schema.

It explicitly does NOT define tables, columns, primary/foreign keys, IDs, enums, database constraints, migrations, API payloads, endpoint schemas, authorization policies, credentials, or implementation-specific storage details. Those belong to `docs/DATA-MODEL.md` successors: schemas and migrations to the implementation, contracts to `docs/API.md`, policies to `docs/SECURITY.md`.

## 2. Data-Model Principles

1. **Concepts before schema.** Shared language and boundaries first; no tables or constraints before scope is confirmed.
2. **Reuse confirmed language.** Concept names follow `docs/PROJECT.md` and `docs/REQUIREMENTS.md`; no parallel terminology.
3. **Smallest useful model.** Cover only what the agreed core scope needs, sized to the ₱10,000 core budget.
4. **Shared stays shared.** Customer identity and credit/collection are never duplicated independently per store.
5. **Store-specific stays store-specific.** Sales, inventory, and receiving belong to one store each.
6. **Integrity at the data layer.** Atomic updates and access enforcement are data-layer responsibilities, deferred to implementation with policy detail in `docs/SECURITY.md`.
7. **Approval gates state.** Pending products are visibly not active; only admin approval activates them.
8. **Unconfirmed means unconfirmed.** Anything not established is marked Confirmation Required, never guessed.

## 3. Authority Boundaries

| Concern | Owner |
| --- | --- |
| What the system must do | `docs/REQUIREMENTS.md` |
| Selected technologies | `docs/TECH-STACK.md` |
| Architecture and data flows | `docs/ARCHITECTURE.md` |
| Behavior and experience | `docs/UI-UX.md` |
| **Concepts, relationships, and data boundaries** | **This file** |
| Endpoint contracts and validation detail | `docs/API.md` |
| Auth behavior, authorization, secret handling | `docs/SECURITY.md` |
| Material decisions | `docs/DECISIONS.md` |

## 4. Core Concepts

### 4.1 Store — Confirmed

- **Concept:** the two operating stores, Amara and Zeann, providing the store context for store-specific records.
- **Source:** REQ-STORE-001, REQ-STORE-002; `docs/PROJECT.md` §2.
- **Boundary:** exactly two stores; no further store attributes defined here.

### 4.2 Customer — Confirmed

- **Concept:** one shared customer identity usable across both stores, never duplicated per store. The implemented record carries name, an optional contact, and an optional address. Authorized users can edit incorrect details; deletion is refused for any customer referenced by sales or credit records, so no historical transaction can break (DEC-049).
- **Source:** REQ-CUST-001, REQ-STORE-003; `docs/PROJECT.md` §2; customer edit/delete per client request (DEC-049).
- **Boundary:** exact identity fields are Confirmation Required beyond the implemented name, contact, and address; no per-store customer copies exist in this model.

### 4.3 Product / Item — Confirmed

- **Concept:** a sellable, stockable, and receivable product/item record with an approval state.
- **Source:** REQ-PROD-001–003; `docs/PROJECT.md` §4.
- **Boundary:** exact product information is Confirmation Required; rejection/edit/resubmission behavior is unconfirmed.

### 4.4 Sale — Confirmed

- **Concept:** a store-specific completed sale recording customer (optional), purchased items with quantities, business sale date, payment type (cash or charge), mode of payment, an optional one-time discount, and delivery details when applicable. Net total = items + delivery fee − discount. Saved sales are corrected by admins only, bank-style (client revision, DEC-050): the admin Undo voids the sale — the record is kept for the audit trail and excluded everywhere — restores its deducted stock exactly once, and voids the linked credit and its payment rows; staff can never edit or delete a saved sale. Encoded legacy credit rows (`is_legacy`) are managed under Credit, not Sales.
- **Source:** REQ-SALE-001–007; `docs/PROJECT.md` §4; admin-only correction per client request (DEC-049, revised DEC-050).
- **Boundary:** the business sale date defaults to today, may be backdated, and drives credit due dates (independent of creation time); exact payment-method vocabulary and discount policy are Confirmation Required; sale editing and reversal (beyond deletion) are Confirmation Required; no additional sale attributes defined here.

### 4.5 Purchased items (sale lines) — Confirmed

- **Concept:** the items and quantities purchased within a sale. This is modeled as part of the sale concept, not as an independent entity, and does not by itself authorize a separate table.
- **Source:** REQ-SALE-002; `docs/PROJECT.md` §4.
- **Boundary:** exact line information is Confirmation Required.

### 4.6 Credit obligation — Confirmed

- **Concept:** a shared outstanding obligation arising from a charge sale, carrying the originating store, selected payment terms with an automatically calculated due date, remaining balance, and outstanding/settled state. Encoded existing balances (client change, DEC-049) carry complete transaction details: they are backed by a legacy sales row (`is_legacy`, excluded from sales lists, dashboards, and reports) whose sale lines record the item details — customer, date, item, quantity, price, total — plus an optional initial partial payment. Encoding never affects stock; the balance settles through the normal payment flow (partial payments, fully-paid status, remaining balance). Saved credits are corrected by admins only (DEC-050): the admin Undo voids the credit, its payments, and its underlying sale — records remain for the audit trail and are excluded everywhere — and restores stock only for charge-sale credits, never for encoded legacy credits.
- **Source:** REQ-CRED-001–004, REQ-CRED-006; `docs/PROJECT.md` §4; existing-credit encoding per client request (DEC-048, revised DEC-049).
- **Boundary:** exact term options, calculation rules, and status vocabulary beyond outstanding/settled are Confirmation Required.

### 4.7 Payment — Confirmed

- **Concept:** a full or partial payment against a shared credit obligation, recorded through either store, carrying the payment store and contributing to one traceable shared history with updated balance and status. Payments are staff-recorded; only admins can revert them — via the credit Undo, which voids the payment rows (kept for traceability, excluded from balances, history, and summaries) while restoring the credit's balance effect (DEC-050).
- **Source:** REQ-PAY-001–002, REQ-CRED-005–007; `docs/PROJECT.md` §2; payment reversion per client request (DEC-050).
- **Boundary:** exact payment information, methods, and direct reversal behavior beyond the admin credit undo are Confirmation Required.

### 4.8 Inventory / Stock — Confirmed

- **Concept:** the per-store quantity of a product/item held by Amara or Zeann, increased by receiving and decreased by successful sales; each row also carries the store's current selling price (falling back to the latest priced receiving record when unset) and an admin-approval state (client changes, DEC-048/DEC-049). Inventory correction is admin-only (client revision, DEC-050, superseding the DEC-032 staff carve-out): staff record receiving through the normal workflow but never manually edit or delete stock rows — quantity and price corrections are admin operations, and undoing a sale restores its deducted stock exactly once.
- **Source:** REQ-INV-001–002; `docs/PROJECT.md` §2; approved-inventory lock, price editing, and admin-only correction per client request (DEC-048, DEC-049, DEC-050).
- **Boundary:** exact stock calculations, negative-stock rules, adjustment workflows, and reversal behavior are Confirmation Required.

### 4.9 Receiving record — Confirmed

- **Concept:** a store-specific stock receipt recording store, item, quantity, supplier, purchase/cost price, and the delivery rider and vehicle that brought the stock to the store.
- **Source:** REQ-RCV-001, REQ-RCV-002; `docs/PROJECT.md` §4.
- **Boundary:** the rider and vehicle references link to the per-store rider/vehicle managed lists (§4.13, §4.14); both are required on every receiving record. The selling price captured on a receipt is the assumed per-store price source for the sale catalog: the most recent receipt's selling price at a store is that product's automatic sale price there (DEC-022; per-store pricing confirmed in seed behavior, field-level rules Confirmation Required).

### 4.10 Supplier — Confirmed

- **Concept:** the supplier named on a receiving record. This is modeled as a reference within the receiving concept, not as an independently managed entity, since no supplier-management requirement is confirmed.
- **Source:** REQ-RCV-001.
- **Boundary:** supplier directories, contact management, and supplier history beyond the receiving reference are unconfirmed.

### 4.11 User / Staff identity — Confirmed

- **Concept:** an individual authenticated identity assigned to one store, providing the operational store context; admin identities carry business-wide oversight.
- **Source:** REQ-USER-001–003; `docs/PROJECT.md` §2.
- **Boundary:** identities are an authentication concept, not business content; additional roles, permission matrices, hierarchies, and multi-store staff behavior are unconfirmed and belong to `docs/SECURITY.md` after confirmation.

### 4.12 Product approval state — Confirmed

- **Concept:** the lifecycle state of a staff-submitted product: pending after submission, active only after admin review and approval. Rejection is a soft terminal state (client revision, DEC-051): the record is kept (its receiving/stock history was never FK-deletable and stays intact) and disappears from the pending-approval list and the sale catalog via its status; a rejected product cannot be approved and is not resubmittable this round.
- **Source:** REQ-PROD-002–003; `docs/PROJECT.md` §4; soft rejection per client request (DEC-051).
- **Boundary:** product editing, resubmission, and the retention of rejected records are Confirmation Required.

### 4.13 Rider — Confirmed (user-confirmed addition)

- **Concept:** a delivery rider associated with one store, selectable on a sale's delivery details.
- **Source:** REQ-DELIV-001–004.
- **Boundary:** per-store (never shared); exact rider fields beyond name, store, and active state are Confirmation Required. A rider referenced by sales, receiving, or expenses is retained (delete is refused) so history stays intact.

### 4.14 Vehicle type — Confirmed (user-confirmed addition)

- **Concept:** a vehicle type (e.g. Motorcycle, Tricycle, Van) associated with one store, selectable on a sale's delivery details.
- **Source:** REQ-DELIV-001–004.
- **Boundary:** per-store (never shared); exact vehicle fields beyond label, store, and active state are Confirmation Required. A vehicle referenced by sales, receiving, or expenses is retained (delete is refused) so history stays intact.

### 4.15 Expense — Confirmed (user-confirmed addition)

- **Concept:** a store-specific fuel or repair cost recorded against a rider or vehicle (at least one required), used to compute per-rider/vehicle net (delivered-sales value minus expenses).
- **Source:** REQ-EXP-001–003; client confirmation (fuel/repair costs deducted from rider/vehicle sales).
- **Boundary:** per-store (never shared); expense type enum (fuel, repair) is Assumed pending exact values; net computation uses only delivery-tagged sales at the same store.

## 5. Conceptual Relationships

- A customer can have sales at either store; a sale belongs to one store.
- A sale contains one or more purchased product/item concepts.
- A customer may have an outstanding credit obligation originating from a store.
- A payment can be made at a store different from the credit-origin store and remains part of the same shared history.
- A store maintains its own inventory for products/items; a receiving record increases one store's stock for one product/item, and a successful sale decreases the selling store's stock.
- A staff identity operates within one assigned store's context; an admin identity oversees both stores.
- A staff-submitted product is pending until an admin approves it into the active state.
- A sale, payment, or receiving record carries the staff member who recorded it (record attribution); a customer and product carry an optional added-by reference.
- A store maintains its own riders and vehicle types, referenced by the sale's delivery details.

No foreign keys, cardinalities, junction tables, or database constraints are introduced here.

## 6. Field and Data-Type Categories

Only the KINDS of values the model may need — listing a category confirms no field:

- Names (stores, customers, products, suppliers, riders).
- Contact details (customer contact kinds only as confirmed later).
- Quantities (item quantities, stock quantities).
- Monetary amounts (prices, fees, balances, payments).
- Dates (sale dates, due dates, payment dates, receiving dates).
- Store references (origin store, payment store, selling/receiving store, staff assignment).
- Product information (identity and approval state; exact information Confirmation Required).
- Supplier information (receiving reference only).
- Payment information (partial/full payment references; exact information Confirmation Required).
- Status/state concepts (outstanding/settled credit, pending/active product).

Validation principles: inputs are validated at system boundaries with clear messages; client-side checks are usability only; staff-submitted products require admin approval that validation never replaces; no constraints invented here.

## 7. Identity, Status, and Lifecycle Concepts

Only where justified by the requirements:

- Authenticated staff identity with one assigned store; admin identity with business-wide oversight.
- Product pending/active approval state.
- Outstanding/settled credit state with remaining balance.
- Store association on every store-specific concept.

No additional lifecycle states are introduced.

## 8. Shared vs Store-Specific Data Boundaries

There is no public surface; all business data is restricted to authenticated, permitted users.

- **Shared:** customer identity; credit obligations with balances and statuses; payment history including origin store and payment store.
- **Store-specific:** sales and their purchased items; inventory/stock; receiving records; riders and vehicle types; staff store assignment and operational store context.
- Submitted data in transit is validated, minimal, and delivered to the confirmed destination; no extra personal-data kinds without justification. The model must never imply that customers or credit balances are duplicated independently per store.

## 9. Deletion, Retention, and Integrity Principles

- Financial and business history (sales, credit obligations, payments, receiving) is protected against accidental loss; deletion, if ever permitted, requires explicit confirmation and must preserve traceability of cross-store credit/payment activity.
- No cascade, versioning, audit, retention-period, or legal machinery is assumed; retention periods and legal obligations are not defined here.
- Integrity of atomic updates (sale with stock deduction, payment with balance update) is a data-layer responsibility; no mechanisms invented here.

## 10. Explicit Exclusions (Non-Concepts)

Unless explicitly rescoped, this model does NOT include: CRM entities, payroll/HR entities, accounting entities, reservation/booking entities, customer review entities, marketing/SEO content entities, enterprise organization structures, payment-provider integration entities, notification/email entities, analytics entities, automation/workflow machinery, or any second data layer. Authority: `docs/PROJECT.md` §13 and `docs/REQUIREMENTS.md` §18.

## 11. Confirmation Required Matrix

| # | Item | Status | Notes |
| --- | --- | --- | --- |
| 1 | Exact fields per concept (customer, product, sale, payment, receiving) | **Confirmation Required** | Mock shapes adopted as the Assumed DB baseline (DEC-034); real-field changes require confirmation. |
| 2 | Exact payment-term options and due-date calculations | **Assumed baseline adopted** | 7/15/30-day terms, due = sale date + offset, enforced in DB (DEC-034); options/rules still Confirmation Required. |
| 3 | Exact validation rules | **Assumed baseline adopted** | Enforced in DB functions (DEC-034); rule changes Confirmation Required. |
| 4 | Sale editing, cancellation, and reversal behavior | **Confirmation Required** | No edit/cancel/reversal built (mock + DB agree). |
| 5 | Insufficient-stock behavior | **Assumed baseline adopted** | DB refuses sales exceeding stock (DEC-034); change Confirmation Required. |
| 6 | Duplicate customer handling | **Confirmation Required** | One-shared-record principle confirmed; merge/dedup behavior unconfirmed. |
| 7 | Product rejection, editing, and resubmission behavior | **Confirmation Required** | Pending→approved and admin reject/delete built; edit/resubmission unconfirmed. |
| 8 | Inventory adjustment behavior beyond receiving and sale deduction | **Assumed baseline adopted** | Manual absolute-quantity adjust + sales-guarded delete (DEC-032/034); change Confirmation Required. |
| 9 | Payment reversal behavior | **Confirmation Required** | Partial-until-settled confirmed; reversals unconfirmed. |
| 10 | Report/export data requirements (columns, formats) | **Confirmation Required** | Summaries confirmed; exact data unconfirmed. |
| 11 | Detailed user permissions | **Confirmation Required** | Store assignment + product approval enforced in DB; richer model unconfirmed. |
| 12 | Retention and deletion behavior | **Confirmation Required** | No periods or rules defined. |

## 12. Related Documentation

- `README.md` — repository orientation
- `AGENTS.md` — AI-agent operating rules
- `docs/PROJECT.md` — product and business context
- `docs/REQUIREMENTS.md` — functional and business requirements
- `docs/TECH-STACK.md` — technology decisions
- `docs/ARCHITECTURE.md` — architecture
- `docs/UI-UX.md` — experience requirements
- `docs/DATA-MODEL.md` — data concepts and boundaries (this file)
- `docs/API.md` — contracts
- `docs/SECURITY.md` — security
- `docs/TESTING.md` — verification strategy
- `docs/DEVELOPMENT.md` — development workflow
- `docs/DEPLOYMENT.md` — deployment procedures
- `docs/DECISIONS.md` — material decisions
