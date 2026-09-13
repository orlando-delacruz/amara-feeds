# Phase 3 — Frontend Workflow Validation (Gate)

## 1. Purpose and Status

This file is the working record for Phase 3 (`ROADMAP.md`): structured walkthroughs of
the Phase 2 workflows, findings with dispositions, confirmation questions surfaced, and
the explicit Gate 3 verdict. Phase 4 (database) stays closed until the verdict below
reads **OPEN**.

- **Status:** IN PROGRESS — agent baseline complete, interactive pass pending.
- **Gate verdict:** PENDING.

## 2. Standing Caveats

1. Mock success proves nothing about data integrity or authorization. Every record in
   this file is a statement about frontend behavior only.
2. Mock domain data is in-memory and resets on page reload (the signed-in mock
   account itself persists across reloads). Scenarios that chain actions
   (marked CHAIN) must run without reloading, or repeat their setup steps.
3. The mock sign-in is UI gating only, never a security boundary (`docs/SECURITY.md`).

## 3. Environment and Driver Instructions

1. Run `npm run dev` and open the app in a real browser.
2. Use two viewports: mobile (~390px wide) and desktop (≥1024px).
3. Sign in with the seeded credentials: **alice / alice123 (Amara staff)**,
   **ben / ben123 (Zeann staff)**, **owner / admin123 (admin)**.
4. For each scenario below: follow the steps, compare against Expected, and report
   back Observed + Verdict (pass/fail) plus anything confusing, broken, or unclear.
5. Do not "work around" anything odd — report it verbatim.

Seed facts the scripts rely on (reset on every reload):

- Customers: Maria Santos, Juan Dela Cruz, Ana Reyes (shared across stores).
- Active products: Rice 25kg, Sugar 1kg, Instant Coffee. Pending: Cooking Oil 1L.
- Amara stock: Rice 20, Sugar 50, Coffee 30. Zeann stock: Rice 12, Sugar 40, Coffee 25.
- Riders: Jojo Ramos, Ramon Cruz (Amara); Paolo Lim (Zeann). Vehicles: Motorcycle,
  Tricycle (Amara); Motorcycle, Van (Zeann).
- Receiving records: recv-1 (Amara, Rice 25kg, rider-1/vehicle-1), recv-2 (Zeann, Sugar 1kg, rider-3/vehicle-3), recv-3 (Amara, Sugar 1kg, rider-2/vehicle-2).
- Expenses: exp-1 (Amara, rider-1 fuel ₱500.00), exp-2 (Amara, vehicle-2 repair ₱1,200.00), exp-3 (Zeann, rider-3+vehicle-3 fuel ₱350.00).
- Credits: cred-1 outstanding ₱195.00; cred-2 outstanding ₱200.00 with payments from
  **both** Zeann and Amara; cred-3 settled.
- Today's sales: two at Amara (total ₱2,395.00), one at Zeann (₱195.00).

## 4. Automated Baseline (agent, done)

`npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build` pass.
`npm run test:run`: **40 files, 151 tests, all passing.**

Automated coverage already includes: sign-in/redirects (login form), store scoping, staff
management (add/edit/disable), riders/vehicles per-store management, customer
list/search/add, product submit/approve gating, stock isolation, receiving (with required rider/vehicle), cash and
charge sales, rider/vehicle sale-form selects, due-date preview, charge validation,
partial-to-settled payments, overpayment/settled rejection, cross-store payment history,
record attribution, dashboard summaries, staff report store-scoping, reports rendering,
expense recording (fuel/repair per rider/vehicle), delivery net summary computation,
and double-submit guarding (`useMutation`).

## 5. Walkthrough Scripts

Template for each scenario — fill in during the interactive pass:

- **Observed:** (what the driver saw)
- **Verdict:** NOT RUN | PASS | FAIL
- **Findings:** (IDs from §6, if any)

### W1 — Sign-in, role gating, store context

- Requirements: REQ-USER-001–003, REQ-STORE-001/002, REQ-AUTH-001.
- Steps:
  1. Open `/` signed out. Expected: redirected to the sign-in login form.
  2. Try `alice` / wrong password. Expected: plain error, stays signed out.
  3. Sign in as `alice` / `alice123` (Amara staff). Expected: lands on the staff dashboard; header shows store badge "Amara"; **no** store switcher anywhere; user name shown.
  4. Manually visit `/admin`. Expected: bounced back to the staff area.
  5. Sign out, sign in as `owner` / `admin123`. Expected: lands on the admin dashboard; header shows a store badge only (no header switcher).
  6. As admin, open Inventory and switch the store to Zeann via the store control. Expected: badge reads "Zeann"; store-specific views follow the selection.
  7. Sign out. Expected: back at sign-in; protected routes redirect there again.
- Manual focus: is the current store always obvious? Is it clear the store control is admin-only? Are login errors understandable?

### W2 — Shared customers

- Requirements: REQ-CUST-001–003, REQ-STORE-003.
- Steps (Alice):
  1. Open Customers. Expected: Maria Santos, Juan Dela Cruz, Ana Reyes listed.
  2. Search "Ana". Expected: only Ana Reyes remains.
  3. Add customer "Pedro Penduko". Expected: success message; appears in the list.
  4. As Ben (Zeann), open Customers. Expected: Pedro Penduko visible — one shared record, nothing store-specific.
- Manual focus: does anything imply customers belong to a store?

### W3 — Product submit, approve, activate

- Requirements: REQ-PROD-001–003.
- Steps:
  1. As Alice, open Products. Expected: "Cooking Oil 1L" shows a Pending badge; others Active.
  2. Submit "Biscuits". Expected: success message; appears as Pending.
  3. As Owner, open Products → approvals. Expected: Biscuits listed; approve it; success message; pending list no longer shows it.
- Manual focus: is Pending vs Active unmistakable? (CHAIN: the approved Biscuits should be selectable as a sale item in W5.)

### W4 — Inventory and receiving

- Requirements: REQ-INV-001/002, REQ-RCV-001, REQ-RCV-002.
- Steps (CHAIN, no reload):
  1. As Alice, open Inventory. Expected: Rice 20, Sugar 50, Coffee 30 (Amara only).
  2. Open Receiving. Expected: prior Amara receipts listed with Rider and Vehicle columns.
  3. Record a receipt: Rice 25kg, quantity 5, any supplier, cost ₱1,100.00, select a rider, select a vehicle. Expected: success, receipt appears with rider/vehicle, Amara Rice becomes 25.
  4. Try to save without selecting a rider. Expected: validation error "Select the delivery rider."
  5. As Ben, open Inventory. Expected: Zeann figures unchanged (Rice 12).
  6. As Owner, review both stores via the store control on the Inventory and Receiving pages.
- Manual focus: is per-store separation obvious at all times? Are rider/vehicle selects clearly labeled?

### W5 — Cash sale with stock effect (CHAIN with W4)

- Requirements: REQ-SALE-001–005, REQ-CUST-002, REQ-INV-002.
- Steps (Alice, continuing the W4 session):
  1. Sales → New sale. Leave customer empty, add Rice 25kg × 2, cash, no delivery. Expected: review shows the total; save succeeds; lands on the sales list with the new sale.
  2. Reopen Inventory. Expected: Amara Rice is now 23 (25 − 2).
  3. Submit the form twice quickly (double-click Save). Expected: exactly one sale is created.
- Manual focus: is every step's order and the success state clear on a phone?

### W6 — Charge sale with terms and due date

- Requirements: REQ-SALE-002/003, REQ-CRED-002/003.
- Steps (Alice or Ben):
  1. New sale, pick Maria Santos, add an item, choose Charge, pick terms. Expected: a due date is shown **before** saving.
  2. Save. Expected: success; the Credit area shows a new outstanding obligation with the correct origin store, terms, due date, and balance.
  3. Try a charge sale with no customer. Expected: plain-language refusal, input preserved.
- Manual focus: is the due date visible before commit? Is the origin store shown afterwards?

### W7 — Partial payments to settled

- Requirements: REQ-CRED-004, REQ-PAY-001/002.
- Steps:
  1. Open cred-1 (₱195.00 outstanding). Record ₱50.00. Expected: balance ₱145.00, still Outstanding, history grows by one.
  2. Pay the remaining ₱145.00. Expected: balance ₱0.00, status Settled, further payment refused with a plain message.
  3. Try to overpay and to pay ₱0. Expected: plain-language refusals, nothing persisted.
- Manual focus: is every refusal understandable to non-technical staff?

### W8 — Cross-store payment (CHAIN)

- Requirements: REQ-CRED-005/007.
- Steps:
  1. As Ben (Zeann), open cred-2 (origin Amara, ₱200.00 outstanding). Record a ₱20.00 payment.
  2. Expected: balance drops, and the payment history shows the Amara origin **and** the Zeann payment store in one traceable history.
- Manual focus: can a reader tell which store originated the credit and which store took each payment?

### W9 — Dashboard trust (CHAIN after W5–W8, same session)

- Requirements: REQ-DASH-001–006.
- Steps:
  1. As Alice, open Dashboard. Expected: today's Amara sales reflect the W5 sale; outstanding credit reflects W7/W8 payments.
  2. As Owner, open the admin dashboard. Expected: per-store and overall daily sales, outstanding credit, payments, current stock, and received stock all reconcile with the actions just performed.
- Manual focus: do the numbers match what you just did, or is anything stale/missing?

### W10 — Reports and printing

- Requirements: REQ-REP-001/002 (print only; export deferred per DEC-006).
- Steps (Owner):
  1. Open Reports, change the date. Expected: all six summaries follow the selected date.
  2. Use Print. Expected: printout shows the summaries without app chrome (no header/nav), readable on paper.
- Manual focus: is anything cut off or unreadable in print?

### W11 — Failure, empty, and duplicate states

- Requirements: REQ-STATE-001.
- Steps: visit each area with no matching data (e.g., search with no match, filter Settled/Outstanding where empty); submit invalid forms (blank names, zero quantities); double-click every submit button.
- Expected: plain-language errors naming the problem, entered input preserved, empty states with a next action, exactly one record per submit, never false success.

### W12 — Mobile and accessibility spot-check

- Requirements: REQ-ACC-001–004.
- Steps (mobile viewport, keyboard where possible):
  1. Complete W5 entirely on the phone-sized viewport. Expected: no horizontal scrolling, all controls reachable and ≥ touch size.
  2. Tab through the sale form. Expected: visible focus everywhere, labels announced, errors in text (not color alone).
  3. Check statuses (Pending, Outstanding, Settled) and the store badge. Expected: meaning carried by words, not color alone.

### W13 — Staff management and delivery lists

- Requirements: REQ-USER-007, REQ-DELIV-001–003.
- Steps:
  1. As Owner, open Users. Expected: Alice (Amara), Ben (Zeann) listed Active.
  2. Add staff "Cora" (username `cora`, any password, assigned Zeann). Expected: appears; sign out and sign in as `cora` → lands on the Zeann staff area; Zeann store context only.
  3. As Owner, disable Ben. Expected: Ben shows Disabled; signing in as `ben` is refused with a plain message. Re-enable Ben.
  4. As Alice, open Riders and Vehicles. Expected: only Amara riders/vehicles (Jojo, Ramon; Motorcycle, Tricycle). Add "E-bike" vehicle; Zeann must not see it.
  5. As Owner, open Riders, switch to Zeann. Expected: Paolo Lim only.
  6. Record a sale with a rider and vehicle selected. Expected: saved; sale list shows the rider/vehicle and "Recorded by".
- Manual focus: is per-store delivery separation obvious? Is the recorded-by attribution clear on every record?

### W13 — Expenses (fuel/repair) and rider/vehicle net

- Requirements: REQ-EXP-001–003, REQ-RCV-002.
- Steps:
  1. As Alice, open Expenses. Expected: seeded Amara expenses listed (fuel for Jojo, repair for Tricycle); net summary shows Jojo's ₱500.00 expense and Tricycle's ₱1,200.00 expense.
  2. Record a fuel expense for Ramon Cruz: amount ₱750. Expected: success; expense appears in history; Ramon's net updates.
  3. Switch to Vehicles, record a repair for Motorcycle: amount ₱300. Expected: success; Motorcycle net updates.
  4. As Ben, open Expenses. Expected: only Zeann expenses (fuel for Paolo/Motorcycle). Amara expenses not visible.
  5. As Owner, switch store via the store control. Expected: both stores' expenses visible; net summaries update per store.
- Manual focus: is the net summary clear (delivered sales − expenses = net)? Is the store separation obvious?

## 6. Findings Log

Format: ID, severity (Blocker/Major/Minor), source scenario, description, disposition
(FIXED in Phase 3 / DEFERRED with rationale / CONFIRMATION QUESTION).

| ID | Severity | Scenario | Description | Disposition |
|---|---|---|---|---|
| F-001 | Minor | Baseline (automated) | `NewSalePage` cash-sale test flaked under full-suite parallel load: post-save navigation assertion used the default 1s `findBy` timeout. App behavior proven correct in isolation and on rerun; this was test timing, not product behavior. | FIXED in Phase 3: explicit 5s timeout on the two post-save navigation assertions. Suite green on rerun. |

## 7. Confirmation Questions Surfaced

New business-behavior questions discovered by walkthroughs go here (recorded, never
answered). Existing items live in `docs/REQUIREMENTS.md` §19.

| ID | Question | Source scenario | Status |
|---|---|---|---|
| — | (none yet) | — | — |

## 8. Gate 3 Verdict

- **Verdict:** PENDING — interactive pass (W1–W13) not yet performed.
- Phase 4 opens only when: every scenario above has a record; every finding is FIXED or
  explicitly DEFERRED with rationale; §7 is current; the verification suite is green
  after any rework.

## 9. Related Documentation

- `ROADMAP.md` (Phase 3 scope, gates) · `docs/REQUIREMENTS.md` (behavior, §19 checklist)
- `docs/UI-UX.md` §§2, 14–17 (principles, trust, recovery) · `docs/TESTING.md` §§4–5
  (mock-scoped checklists) · `docs/DEVELOPMENT.md` §12 (bug workflow)
- `docs/DECISIONS.md` DEC-005/DEC-006 (mock session, print scope)
