# Amara + Zeann Store Management System — UI/UX Specification

## 1. Purpose and Scope

This document governs the user experience and interaction behavior of the internal business-management application used by Amara and Zeann staff and admin users.

- Behavior belongs here: how the system acts and feels from the user's perspective.
- Business requirements come from `docs/REQUIREMENTS.md`. Where this file and `docs/REQUIREMENTS.md` disagree on required behavior, `docs/REQUIREMENTS.md` governs.
- Business and product context comes from `docs/PROJECT.md`.
- Visual design values belong to the applicable design documentation when such documentation is introduced.
- Technical implementation (schemas, contracts, architecture, authentication technology, hosting) belongs to the technical documentation.

This system is not a public marketing website; no public marketing experience is defined here.

## 2. General UX Principles

1. **Clear over clever.** Plain, operational language and predictable patterns.
2. **Fast data entry.** Frequent workflows (sale, payment, receiving) minimize taps and typing.
3. **Simple workflows.** One straightforward path per task; no unnecessary steps or wizards.
4. **Mobile-first usability.** Small screens carry the full essential workflows, not a reduced version.
5. **Minimal unnecessary interaction.** Prefer readable content and direct actions over widgets and decorative complexity.
6. **Consistent patterns.** Navigation, actions, forms, dialogs, and feedback behave identically everywhere.
7. **Clear system feedback.** Every meaningful action produces timely, understandable feedback.
8. **Accessible by default.** Accessibility behavior is a baseline, not an enhancement.
9. **Safe handling of business data.** Confirmations, validation, and duplicate-submission protection guard sales, payments, stock, and approvals.
10. **Obvious store context.** The user always knows whether they are acting as Amara or Zeann.
11. **Clear shared-vs-store-specific context.** Shared customers and credit are visibly shared; sales and inventory are visibly store-specific.
12. **Prevention of accidental duplicate submissions.** Saving, payment recording, and receiving guard against double-taps and repeated submits.
13. **Understandable non-technical language.** Labels, messages, and flows suit non-technical staff.

## 3. Target Users

### 3.1 Staff

Staff are users assigned to either Amara or Zeann who record and manage day-to-day operational data. No demographic profiles or personas are defined.

Their experience emphasizes:

- Quick mobile data entry.
- Clear indication of their store context.
- Sales recording.
- Customer selection and creation.
- Credit/payment workflows.
- Inventory and receiving.
- Product submission for approval.

No additional staff permissions are defined here.

### 3.2 Admin

Admin users are responsible for business-wide oversight across both stores.

Their experience emphasizes:

- Both stores at once.
- Shared customer and credit information.
- Dashboard summaries.
- Inventory visibility.
- Payment and credit visibility.
- Product approval.
- Exports and printing.

No additional admin modules are defined here.

## 4. UX Goals and Operational Journey

The internal operational journey, kept behavioral rather than technical:

1. **Enter** — the user enters the application under their individual account.
2. **Orient** — the user understands their current user and store context (Amara or Zeann).
3. **Customer** — the user selects an existing customer or adds a new one when needed; selection is optional for sales.
4. **Sale** — the user records items and quantities, then cash or charge information.
5. **Charge handling** — for charge sales, the user selects payment terms and sees the automatically calculated due date.
6. **Delivery** — the user records delivery details (fee, rider, vehicle) when applicable, then reviews and saves.
7. **Inventory reflection** — after a successful sale save, the store's inventory reflects the deduction.
8. **Credit/payment** — the user records or reviews credit and payment information, including partial payments until fully paid.
9. **Cross-store payment** — a payment against shared credit may be recorded through either store while origin-store and payment-store context stay visible.
10. **Review** — the user reviews operational summaries; admin reviews dashboards and reports, including export and printing.

## 5. Information Architecture

Principal application areas, derived only from confirmed requirements:

- **Dashboard.** Business summaries for oversight.
- **Sales.** Store-specific sale recording and history.
- **Customers.** Shared customer records.
- **Credit / Collection.** Shared credit, balances, status, and history.
- **Inventory.** Store-specific stock visibility.
- **Receiving Stock.** Store-specific stock receipts.
- **Products.** Product records including pending-approval states.
- **Users/Staff.** Confirmed store-assignment administration.
- **Reports / Export / Printing.** Agreed summaries with export and printing.

Additional application areas require corresponding requirements before being introduced.

## 6. Global Navigation

- Mobile navigation exposes the major operational areas with the same destinations as larger screens.
- Larger-screen navigation presents the same areas without hiding workflow state.
- The active area is always indicated.
- Current store context (Amara or Zeann) is always visible.
- Navigation provides a clear path back to the previous or current context (for example, from a sale back to sales history, from a payment back to the credit record).
- Navigation never hides important in-progress workflow state; an interrupted sale, payment, or receiving entry is recoverable or explicitly confirmed before being discarded.

No pixel sizes, breakpoints, colors, typography, or component dimensions are defined here.

## 7. Key Area UX

### 7.1 Sales

- **Sequence.** Optional customer selection or creation → item selection and quantity → payment type (cash or charge; terms selection and automatic due date for charge) → delivery details when applicable → review → save → success or failure feedback.
- **Requirements.** Customer selection stays optional (REQ-CUST-002); payment type is cash or charge (REQ-SALE-003); delivery supports fee, rider, and vehicle (REQ-SALE-004); store-specific sales stay distinguishable (REQ-SALE-005).
- **Constraints.** A successful save triggers the confirmed stock deduction behavior (REQ-INV-002). No additional sale fields and no editing or cancellation rules are defined here.

### 7.2 Customers

- **Behavior.** Find and select an existing customer, or add a new customer during the sale flow or from the customer area.
- **Shared context.** The customer record is visibly shared across both stores, never presented as a store-specific record.
- **Constraints.** Exact customer fields are Confirmation Required and are never defined here.

### 7.3 Credit / Collection

- **Behavior.** View outstanding credit with its origin store; record a payment (full or partial) identifying the payment store; see the updated remaining balance and status; review the preserved shared payment history.
- **Cross-store payment.** The sequence makes the origin store and the payment store explicit at both recording and review time, with one traceable shared history (REQ-CRED-005 through REQ-CRED-007, REQ-PAY-001, REQ-PAY-002).
- **Constraints.** Exact payment-term options, calculation rules beyond the selected-terms workflow, and edge-case handling are Confirmation Required.

### 7.4 Inventory

- **Behavior.** Inventory is shown per store with the current store context always visible.
- **Requirements.** Automatic stock deduction occurs after a successful sale save (REQ-INV-002) and is reflected in the displayed stock.
- **Constraints.** No stock adjustment workflows beyond the confirmed behavior are defined here.

### 7.5 Receiving Stock

- **Behavior.** Record a receipt around store, item, quantity, supplier, and purchase/cost price (REQ-RCV-001), then confirm success or report failure with entered data preserved where practical.
- **Constraints.** No additional receiving fields are defined here.

### 7.6 Products

- **Behavior.** Staff create or submit a product; it enters a visible pending-approval state; an admin reviews it; it becomes active only after admin approval (REQ-PROD-001 through REQ-PROD-003).
- **Constraints.** Rejection, editing, or resubmission rules are not defined here, since they are not confirmed in `docs/REQUIREMENTS.md`.

### 7.7 Dashboard / Reports

- **Behavior.** Admin users consume daily sales by store, overall daily sales, outstanding credit, payments, current stock, and received stock (REQ-DASH-001 through REQ-DASH-006); Excel export and printing are available from the summaries (REQ-REP-001, REQ-REP-002).
- **Constraints.** "Other useful summaries" stay flexible within agreed scope (REQ-DASH-007); exact report columns and formats are Confirmation Required and are never defined here.

### 7.8 Users / Staff

- **Behavior.** Staff accounts reflect the confirmed store assignment (REQ-USER-001, REQ-USER-002); admin oversight covers the overall business (REQ-USER-003).
- **Constraints.** No detailed role or permission management beyond the confirmed rules is defined here.

## 8. Action Hierarchy

Labels describe the actual outcome. Primary actions include:

- Save sale.
- Record payment.
- Receive stock.
- Add customer.
- Add product.
- Approve product, where applicable.

Destructive or consequential actions use explicit confirming language. No visual styling is defined here.

## 9. Responsive UX

Mobile is the primary experience.

- Full essential workflows (sale, payment, receiving, approval, review) are usable on mobile.
- Content reflows naturally; core workflows never require horizontal scrolling.
- Touch interaction is practical; forms are readable; tables and lists remain usable on smaller screens.
- Important information (store context, balances, statuses, feedback) is never hidden solely because of screen size.
- Admin functionality remains usable on smaller screens where applicable.

No breakpoints or pixel dimensions are defined here.

## 10. Accessibility UX

- Semantic structure with logical headings.
- Labels associated with controls; accessible names for interactive elements.
- Keyboard operation where applicable, with visible focus.
- Meaningful, accessible feedback including error states communicated in text, not by color alone.
- Dialogs that can be operated and dismissed accessibly.
- Reduced-motion support where motion exists.
- Status and state information (balances, approval states, save outcomes) exposed meaningfully.

No formal accessibility compliance is claimed unless actually evaluated.

## 11. Motion and Animation UX

- Motion supports feedback and orientation only; decorative animation is not required.
- Motion never delays essential workflows and never hides critical information.
- Reduced-motion preferences are respected.
- Exact animation values belong in the design or technical documentation, not here.

## 12. Loading, Empty, and Error UX

- Loading indicators appear only where asynchronous behavior genuinely exists; no artificial loading states for already-rendered content.
- Saving a sale, recording a payment, receiving stock, product approval, and dashboard/report loading each resolve into clear success or failure feedback.
- Success is shown only after actual successful completion; failure never appears as success.
- Empty states (no customers, products, credit records, or stock) use plain, non-technical language and point to the next valid action.
- Validation failures and network/service failures use plain language, preserve entered information where practical, and never expose implementation details.

## 13. Admin UX

- **Flow.** Enter the application → navigate to administrative areas → review business information → approve products → review dashboards → inspect credit/payment information → inspect inventory/receiving information → export or print reports.
- **Safety rules.** Clear save and cancel behavior; validation feedback; success and failure feedback; confirmation for destructive actions if such actions are later confirmed; protection against duplicate submissions; preservation of recoverable edits; clear distinction between editable and read-only information.
- **Constraints.** No modules or destructive operations beyond the confirmed requirements are defined here.

## 14. Content and Trust UX

- Use clear operational terminology with consistent names for Amara, Zeann, customer, sale, credit, payment, inventory, receiving, and product states (including pending approval).
- Never display fabricated business information; never fabricate customer, payment, or product data.
- Do not expose unnecessary internal technical details to staff.
- Always communicate the relevant store context for store-specific actions and shared-context indicators for shared records.

## 15. Performance UX

- Prioritize quick access to frequent workflows (sale, payment, receiving).
- Minimize unnecessary interactions and client-side complexity.
- Keep forms responsive; provide feedback when operations take time without blocking the user unnecessarily.
- Prevent layout instability where practical.

No numeric performance targets are defined here.

## 16. Error Recovery

- Error messages are understandable and use plain, non-technical language.
- Every error provides a useful path back to a valid application area.
- Entered data is preserved where practical after recoverable failures.
- No technical details are exposed to staff.
- Recovery options fit the failed action (for example, retry a save, return to the sale or payment record, or revisit the dashboard).

No dedicated error pages are defined unless requirements later call for them.

## 17. Confirmed vs Content-Dependent UX

### Confirmed behavior

Established by `docs/REQUIREMENTS.md` and accommodated throughout this document:

- Shared customers; separate sales and inventory; shared credit/collection.
- Cross-store payments with traceable origin-store and payment-store history.
- Sales workflow (optional customer, items/quantity, cash or charge, delivery details when applicable).
- Automatic due-date calculation from selected terms; partial payments until fully paid.
- Automatic stock deduction on successful sale save.
- Receiving around store, item, quantity, supplier, and purchase/cost price.
- Product approval before activation; store-assigned staff accounts.
- Admin reporting (daily sales by store, overall daily sales, outstanding credit, payments, current stock, received stock, Excel export, printing).

### Content and behavior requiring confirmation

Refer to the confirmation checklist in `docs/REQUIREMENTS.md` rather than duplicating it. This UX accommodates confirmed content whatever its shape and never invents exact fields, payment-term options, validation rules, detailed permissions, report formats, or edge-case workflows.

## 18. UX Non-Goals

Mirroring the confirmed project scope, this UX excludes:

- Public marketing or conversion experiences.
- Unnecessarily complex wizards.
- Enterprise-grade workflows not required by the core scope.
- Excessive animation.
- Advanced filtering or search systems not required.
- Unrelated accounting, CRM, payroll, or HR experiences.
- Unconfirmed third-party integrations.
- Unnecessary duplicate data-entry workflows.

## 19. Design-System Boundary

This document does NOT define colors, typography values, spacing tokens, radii, shadows, dimensions, breakpoints, component visual variants, or animation timing values. Behavior belongs here; visual language belongs in the appropriate design documentation if and when such documentation is introduced.

## 20. Related Documentation

- `README.md` — repository orientation
- `AGENTS.md` — AI-agent operating rules
- `docs/PROJECT.md` — product and business context
- `docs/REQUIREMENTS.md` — functional and business requirements (authoritative for required behavior)
- `docs/TECH-STACK.md` — technology decisions
- `docs/ARCHITECTURE.md` — architecture
- `docs/UI-UX.md` — experience requirements (this file)
- `docs/DATA-MODEL.md` — data structure
- `docs/API.md` — contracts
- `docs/SECURITY.md` — security
- `docs/TESTING.md` — verification strategy
- `docs/DEVELOPMENT.md` — development workflow
- `docs/DEPLOYMENT.md` — deployment procedures
- `docs/DECISIONS.md` — material decisions
