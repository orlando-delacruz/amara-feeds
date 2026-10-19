# SESSION.md — Session Context (for a new chat session)

This root-level file is the session handoff: a new chat session reads it first to orient on the project without re-explaining it. It is refreshed at the end of a session, or automatically whenever the client says **"hand-off context to Session.md"** (standing rule — see the note at the bottom and in `AGENTS.md`).

## 1. Objective

- **Project:** ZAF ONE — business management web app for the **Amara and Zeann** two-store business, mobile-primary.
- **Constraints:** ₱10,000 budget, target **September 30, 2026**, scope limited to the core version (`docs/PROJECT.md`, `docs/REQUIREMENTS.md`).
- **Where the project is now: Phases 4–6 built; five rounds of live client revisions implemented (security hardening, credit/inventory/sale/customer management, My Account, admin-only correction, product rejection, credit export, and on 2026-10-19 the editable item names + third expense type + an accessibility fix). The client is actively using hosted and inputting real data.** All code is committed and pushed to `origin/develop`; working tree clean at `14b3119`.

## 2. Live environment (key facts)

- **Supabase hosted project:** ref `fsfmecmmpaljwurfqsto`. Local migrations are `00001–00021` (the schema source of truth in `supabase/migrations/`).
- **Hosted migration state — RESOLVED.** Hosted is **fully in sync through `00021`**. This closes the long-standing "UNRESOLVED" note from earlier handoffs: `npx supabase migration list` now shows a matching `remote` version for every row. `00020` (office-supplies expense type) and `00021` (`update_product`) were pushed this session with `npx supabase db push --yes`, verified by dumping and reading the **remote** schema (widened `expenses_type_check`; `update_product` present, `SECURITY DEFINER`, `search_path public`, `REVOKE … FROM PUBLIC`, granted to `authenticated`). No backup was taken before that push — safe because both migrations are additive, but worth stating.
- The old access-token expiry was resolved: the client ran `npx supabase login` (hosted CLI access works again).
- **Frontend deploy status:** `14b3119` is on `origin/develop` and deployed; the client confirmed the live smoke test **passed** (office-supplies expense recorded, item renamed from Inventory → Edit stock, both visible in History). The DB push and the frontend deploy landed together.
- **`.env` (gitignored)** holds only `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`. Without them the app falls back to the in-memory mock.
- **Owner login (production):** an email-shaped handle (DEC-042); the address and password are held by the client and are deliberately **not** recorded in this repo file. Owner can change own username/password in **My Account** (`/admin/account`); a username change changes the login handle.
- The client **actively uses the app** — treat hosted data as live: additive migrations only, never wipe, rollbacks touch no data.
- PWA facts: SW only over HTTPS; **SW disabled in dev**; verify PWA behavior via `vite preview` or a deployed build. Update prompt now works correctly (see DEC-047-session fixes).

## 3. Work completed (2026-10-19, this session — all committed and pushed at `14b3119`)

### Knowledge-graph setup (no product behaviour change)
- **Graphify graph** built over the repo: **1,851 nodes · 5,975 edges · 158 communities · 6 hyperedges** in `graphify-out/` (now gitignored, regenerate with `graphify update .`).
- **Obsidian vault** knowledge area created at `C:\Users\SSD-ORLANDO\Documents\DevVault\01-Projects\ZAF-ONE\` — 11 curated notes (Project-Overview, Architecture, System-Flows, Business-Rules, Data-Model, API-Reference, Security-Notes, Testing-Guide, Known-Issues, Decisions, Development-Log) plus `Graphify-Export/` (2,009 generated notes, regenerated via `graphify export obsidian`, never hand-edited). Link-checked: 60 curated wikilinks, 0 broken; secret-sweep clean.
- **`WORKFLOW.md`** created at the repo root (it did not exist) — owns only the graph/knowledge workflow, does not override `AGENTS.md` or `docs/DEVELOPMENT.md`.
- The vault is a **reading aid, not a source of truth** — the repository governs behaviour. Folder is named `ZAF-ONE` (product), while the repo directory is still `amara-feeds`.

### DEC-068 — Editable item names + a third expense type (client request)
- **Editable inventory item name (migration `00021`):** an "Item name" field in the Edit stock dialog. `products.name` is the single name behind the inventory row, the sale catalog **and** reports, so a rename is **global and immediate** — there is no per-store item name. Admin-only, mirroring DEC-050's rule that all inventory correction is admin-only; active-name uniqueness mirrors `submit_product` (DEC-047 M6). The rename runs **before** the quantity/price write, so a rejected name leaves stock untouched. Audit: `product.renamed`.
- **Office Supplies / Others expense type (migration `00020`):** ONE new type (`office_supplies_other`) beside fuel/repair — the client confirmed one option, not two. Widened `expenses_type_check`; re-signed `create_expense`/`update_expense`/`delete_expense` (identical signatures, `create or replace`, no drop-old) so the audit subject stops calling these rows "Repair expense". It reports in its own column in the by-date summary and the Expenses report sheet. Widens the DEC-034 fuel/repair assumed baseline.
- **Trap avoided:** `buildExpenseDateSummary`/`buildExpenseReportRows` bucketed `if (fuel) … else repair`; adding the enum value alone would have silently reported office-supplies spend as *repair* spend.

### Accessibility fix (same commit, DEC-068)
- Root cause of the four "pre-existing" test failures was **not** stale tests: `FormField` rendered `<label htmlFor>` while the DatePicker trigger is a `<button>`, so the label won the accessible-name calculation and the button announced only **"Date"** — a screen-reader user could not hear the selected date. Broken since 2026-09-14 and misfiled. Fixed with `FormField.labelAsText` + `aria-labelledby={`${id}-label ${id}-value`}` on the trigger, so it now announces "Date Oct 19, 2026" (visible label + value, WCAG 2.5.3). The three DatePicker tests had been written against the correct behaviour and pass unchanged; the SaleListPage test now drives the picker.

### Test/lint reliability
- `DatePicker.tsx` `react-hooks/set-state-in-effect` lint error fixed (month re-sync moved from the open effect into the trigger handler). Lint is now **0 problems**.
- Flakiness fixed at the root: `vite.config.ts` `testTimeout: 30000` + `src/test/setup.ts` `configure({ asyncUtilTimeout: 10000 })`. (testing-library's default is **1000ms**, which is why removing old inline `{ timeout: 5000 }` overrides first made it *worse*.)
- Gate-4: sections **35 and 36** added (office-supplies accepted end-to-end + audit label; `update_product` admin-only, case-insensitively unique against active products, blank refused, same-name no-op, audited). Two **stale pre-existing** assertions were corrected: §18 (receiving no longer adds stock since `00017`/DEC-061) and §23 (query matched two products, compared both to 40).

### Docs corrected this session
README (corrupted `**Next:**` line, stale All-stores default, new-feature entries, status line), `docs/DECISIONS.md` (DEC-068), `docs/DATA-MODEL.md`, `docs/API.md`, `.gitignore` (`graphify-out/`), `WORKFLOW.md`, and the vault notes.

## 4. Verification baseline (current)

- **Gate-4 SQL proofs** (`supabase/proofs/gate4.sql`): **36/36 pass**, **0 errors, 0 false assertions**, verified after `npx supabase db reset`. `db lint` clean. Run as `docker exec -i supabase_db_amara-feeds psql -U postgres < supabase/proofs/gate4.sql` — it is a **psql script** (`\pset`/`\set`/28 `\gset`), so it will NOT run in Supabase Studio or any GUI SQL editor (`42601 syntax error at or near "\"`). Never run the proofs against hosted/production.
- `typecheck` ✓; `lint` ✓ **0 problems**; `test:run` **410/410** (two consecutive clean full runs); `build` ✓ (PWA 11 precache entries).
- `format:check` **fails on ~198 files** — pre-existing (was 271 before this session); deliberately not auto-fixed to avoid a 198-file diff.
- Local DB: all 21 migrations applied, holds dev-parity seed (`alice@zafone.local`/`alice123`, `ben@zafone.local`/`ben123`, `owner@zafone.local`/`admin123` — mock creds, not production). Docker Desktop must be running for local Supabase; it was started this session.
- **Smoke test on production passed** (client-confirmed): office-supplies expense recorded, item renamed, both in History.

## 5. Next steps / open items

- **Phase 3 walkthrough** (owed per DEC-034 deferral) against hosted with sample data, then wipe via the DEC-039 script; **PWA real-device verification** (Android install + native prompt, iOS add-to-home, offline banner, update prompt); Phase 7/8 still pending.
- **Gate-4 harness limitation (worth fixing before the next production push):** a proof prints "pass" whenever its block raised **no exception**; `select … as assertion` only prints `t`/`f` and a false boolean does not fail the run. This hid two stale assertions. Consider converting prints to `raise exception` checks or grepping the output for a lone `f`.
- **1,000-row Supabase cap:** dashboard summaries fetch live sales and filter in the browser, so totals could truncate as data grows (DEC-065, deliberately unaddressed). Real follow-up candidate.
- `listCreditRecords` Supabase path was type-checked/mock-tested but **never executed against a live PostgREST response** (DEC-067) — the embed-shape trap class of bug.
- Flagged for the client (not built): 4-char password floor (Assumed baseline), rejected-product retention, staff self-service My Account entry (RPC `update_own_account` is already staff-capable), staff-level sale deletion, credit-detail rows inside the Credit sheet beyond Option A, `detect*` housekeeping files in git, and the ~198-file `format:check` backlog.
- Known accepted gaps (documented): down-payment write is two sequential writes (DEC-045); voiding restores stock against current quantities; sale corrections = undo + re-encode (no in-place editor, DEC-050); the Edit-stock dialog is two writes (rename then quantity/price, so a stock failure can leave the name renamed); dead `allMode` branches remain in pages.
- Confirmation Required items remain flagged in `docs/DATA-MODEL.md` §11 / `API.md` §14; adopted-baseline assumptions keep their revisit triggers (DEC-034).

## 6. Relevant files (navigation map)

- Migrations `00001–00021`: init / RLS / atomic RPCs / seed / staff fixes / pending parity / irreversible-hardening / client changes / client revisions / admin-only correction / soft rejection / approve wording / hard-delete-customer / expense delete-edit / credit+payment interest / pending receipts / **00020 office-supplies** / **00021 update_product**. Proofs: `supabase/proofs/gate4.sql` (36 sections). Cleanup: `supabase/cleanup/wipe-business-data.sql`.
- **DB gotchas for proofs:** psql does not substitute `:'var'` inside `do $$…$$` blocks (bridge via `set local app.x = :'y'`); `reset role` returns to postgres within a transaction; inserts run under `set local role authenticated` face RLS — insert fixtures as postgres **before** switching role, and give them a deterministic id (seeded expenses get random uuids; `'dddddddd-…0002'` is a VEHICLE, not an expense).
- **RPC patterns:** every mutation = SECURITY DEFINER function with `assert_active_caller()` + role/store checks + pinned `search_path` (`public, extensions` when crypt/gen_salt) + grants revoked from public/anon, granted to authenticated. Void tables: `sales.is_voided`, `payments.is_voided`, `credit_obligations.status='voided'`, `products.status='rejected'`.
- **Price precedence (source of truth for future pricing work):** `stock_levels.price_minor ?? latest priced receiving record`; `record_receiving` upserts it; `listStorePrices` mirrors it (catalog display must stay in lockstep).
- Services (dual-mode supabase/mock): `src/services/*Service.ts`; `renameProduct` in `productService.ts`; error mapping + `updateOwnAccount` in `userService.ts`; `voidCredit` lives in **creditService**. When adding a list endpoint, filter `is_voided`, `is_legacy`, `status <> 'voided'`, `status <> 'rejected'`.
- Session: `src/features/session/`. Store: `src/store/` (`DEFAULT_ADMIN_STORE` = **zeann** in `stores.ts`).
- Inventory: `InventoryPage.tsx` + `EditStockDialog.tsx` (now quantity, price **and** item name). Credit: `CreditListPage` + `ExistingCreditDialog` + `CreditDetailPage` (items + "Undo credit"). Expenses: `ExpensesPage.tsx` (three-type dropdown, Office Supplies/Others column) + `expenseSummary.ts` (`otherMinor`).
- Correction hardening lives in DB functions — see `supabase/migrations/00010_admin_correction.sql`. Reports/export: `src/features/reports/` + `src/lib/exportReportExcel.ts` (four-sheet workbook).
- Feedback: `src/lib/swal.ts` + `src/test/swalMock.ts` (auto-confirms; **calls accumulate per file**, use `.at(-1)`). Theme: `src/theme/storeThemes.ts`, `StoreThemeProvider.tsx`, `AdminLayout.tsx`.
- Graph/vault: `WORKFLOW.md`, `graphify-out/` (gitignored), `C:\Users\SSD-ORLANDO\Documents\DevVault\01-Projects\ZAF-ONE\`.

## 7. Recent decision register (one-liners)

| ID | Title | Status |
| --- | --- | --- |
| DEC-050 | Bank-style admin-only correction: void/undo for sales, credits, and inventory (migration 00010) | Accepted |
| DEC-051 | Soft product rejection (migration 00011) | Accepted |
| DEC-052 | Credit sheet in the report Excel export | Accepted |
| DEC-053 | Admin-only hard customer deletion with outstanding-credit guard (migration 00013) | Accepted |
| DEC-055 / DEC-056 | Admin-only expense deletion / editing (migrations 00014/00015) | Accepted |
| DEC-059 / DEC-062 | Manual credit interest, display-only; admin-editable (migrations 00016/00018) | Accepted |
| DEC-061 / DEC-063 | Pending stock receipts with admin approval; Pending/List tab split (migration 00017) | Accepted |
| DEC-064 | Manual per-payment interest, display-only (migration 00019) | Accepted |
| DEC-065 | Calendar-week Weekly + month-to-date Monthly dashboard periods | Superseded by DEC-066 |
| DEC-066 | Weekly dashboard period starts Sunday (Sunday–Saturday) | Accepted |
| DEC-067 | Report recorder columns, credit item lines, per-record expense sheet | Accepted |
| DEC-068 | Editable item names and a third expense type (migrations 00020/00021); also the DatePicker accessible-name fix and test/lint reliability | Accepted |

Full records in `docs/DECISIONS.md`.