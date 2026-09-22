# SESSION.md — Session Context (for a new chat session)

This root-level file is the session handoff: a new chat session reads it first to orient on the project without re-explaining it. It is refreshed at the end of a session, or automatically whenever the client says **"hand-off context to Session.md"** (standing rule — see the note at the bottom and in `AGENTS.md`).

## 1. Objective

- **Project:** ZAF ONE — business management web app for the **Amara and Zeann** two-store business, mobile-primary.
- **Constraints:** ₱10,000 budget, target **September 30, 2026**, scope limited to the core version (`docs/PROJECT.md`, `docs/REQUIREMENTS.md`).
- **Where the project is now: Phases 4–6 built; four rounds of live client revisions implemented (audits hardening, credit/inventory/sale/customer management, My Account, admin-only correction, product rejection, credit export). The client is actively using hosted and inputting real data.** All code is committed and pushed to `origin/develop`.

## 2. Live environment (key facts)

- **Supabase hosted project:** `https://fsfmecmmpaljwurfqsto.supabase.co`, ref `fsfmecmmpaljwurfqsto`. Local migrations are `00001–00012` (the schema source of truth in `supabase/migrations/`).
- **Hosted migration state — UNRESOLVED, verify first thing:** migrations **`00007` + `00008`** were confirmed for push earlier this session (`npx supabase db push` was at the confirmation prompt with those two listed; whether the client pressed confirm is not recorded). **`00009`–`00012` were created after that and are definitely NOT pushed.** Verify with `npx supabase migration list`, then push whatever is pending (`npx supabase db push`) before/with the next deploy. All migrations are additive — safe for the client's live data.
- The old access-token expiry was resolved: the client ran `npx supabase login` during this session (hosted CLI access works again).
- **Frontend deploy status:** commits are all on `origin/develop` (GitHub → Vercel auto-deploy must be checked; confirm `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` exist in Vercel Production env). The deployed production frontend may still be an older build — the **DB push and frontend deploy must land in the same window** (new RPCs + new UI together; the old frontend tolerates the new DB).
- **`.env` (gitignored)** holds only `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`. Without them the app falls back to the in-memory mock.
- **Owner login (production):** `jhoann@admin.com` (+ password held by the client — never committed, DEC-042). Owner can now change own username/password in **My Account** (`/admin/account`); a username change changes the login handle.
- The client **actively uses the app** — treat hosted data as live: additive migrations only, never wipe, rollbacks touch no data.
- PWA facts: SW only over HTTPS; **SW disabled in dev**; verify PWA behavior via `vite preview` or a deployed build. Update prompt now works correctly (see DEC-047-session fixes).

## 3. Work completed (2026-09-21, this session — all committed, working tree clean at `c5397aa`)

### Security hardening (DEC-047, migration `00007`, commit `4ebbaca`)
- C1: dropped `profiles update own` (staff self-escalation impossible); C2: `record_payment` guarded atomic decrement (`balance_minor >= amount` re-checked under row lock — no concurrent overpay).
- H1: every RLS policy requires an active caller profile; `approve/reject_product` run the active check; disabling an account deletes its sessions (not only password resets).
- H2: `record_sale` validates delivery rider/vehicle (active, same store).
- M1: sale unit prices are **derived server-side** (latest priced receiving record; later extended with stock-row price precedence) — clients never send prices; zero-amount charge sales refused; authoritative lines returned.
- M6: unique active product names enforced in `submit_product`/`approve_product`.
- M3: `create_staff`/`update_staff`/`create_vehicle` write audit events; `audit_events.actor_role` is trigger-maintained; History renders real roles with an "Admin" fallback for staff viewing admin actors.
- Phase-3 bookings: `BUY` PWA update loop fixed already later (see below).

### Client-revision round 1 (DEC-048, migration `00008`, commit `8e5875a`)
- Existing credit encoding (later upgraded by DEC-049) + **approved-inventory lock** (`stock_levels.admin_approved`, `approve_stock` RPC).
- **Store selection: "All Stores" removed everywhere** (StoreControl offers only Amara/Zeann — Sales, Receiving, More); admin context defaults to **Zeann** (`DEFAULT_ADMIN_STORE` in `store/stores.ts`) — supersedes the DEC-041 default. `StoreContextId` keeps `'all'` in the type (unreachable via UI; allMode branches are dead-but-harmless).
- Local production-copy wipe: DB back to owner-only clean slate (`supabase/cleanup/wipe-business-data.sql`); local `db reset` re-seeds it.

### PWA update loop fix + desktop More access
- Root cause: `main.tsx` discarded `registerSW`'s updater and used `window.location.reload()` — the waiting worker never got SKIP_WAITING → prompt loop forever. Fix: capture `updateSW`, confirm calls `void updateSW(true)`; `vercel.json` adds `Cache-Control: no-cache` for `/sw.js` + `/manifest.webmanifest`; DEPLOYMENT smoke line "prompt appears once, clears after Refresh" (rode commit `47a3aad`).
- SideNav gains a **More** entry for both roles (`/admin/more` → More page / `/more`) so desktop users reach My Account, store context, install, sign out (sidebar previously had no More link at all).

### Client-revision round 2 (DEC-049, migration `00009`, commit `47a3aad`)
- **Existing credit encoding v2:** `sales.is_legacy` legacy sales rows carry item lines (`record_existing_credit`, admin-only, admin-supplied historical prices, optional initial payment via the guarded payment flow; **never touches stock**); all sales lists/dashboards/reports filter legacy; `CreditDetailPage` shows "Items received" for all credits; `ExistingCreditDialog` does multi-item entries + date + optional partial payment (layout later refined).
- **Inventory price editing:** `stock_levels.price_minor` is the store's current selling price (receiving maintains it; sale pricing + `listStorePrices` read it first with fallback to the latest priced receiving for legacy rows). `adjust_stock` gained an optional price parameter.
- **Customer edit/remove:** `update_customer` (any active user) and `delete_customer` (refused when sales/credit references exist) with audit events.
- **My Account:** `update_own_account` (current password always verified; username change syncs auth identity; keeps current session; `account.updated` audit) + `/admin/account` page (admin-only route, More link; warns that the login handle changes). RPC self-scoped so staff self-service can be enabled later.
- `MyAccountPage`, more-page linking, and staff-drivers tests refreshed for the Zeann default.

### Client-revision round 3 (DEC-050, migration `00010`, commit `8a8c2b1`)
- **Bank-style correction:** staff encode, admin correct. `sales.is_voided` / `payments.is_voided` + credit status `'voided'` — reversals instead of deletions, records kept and excluded everywhere (lists, history, summaries, balances).
- `void_sale` (admin-only) replaced `delete_sale`: voids sale, restores stock **exactly once** (re-void refused), voids linked credit + its payments. `void_credit` (admin-only) likewise from the credit side; encoded legacy credits never touch stock on undo.
- **Inventory correction admin-only outright** (supersedes DEC-032's staff carve-out); staff keep receiving, but see "Admin-managed" with no Edit/Delete.
- `record_payment` refuses voided credits; UI: admin "Undo sale" on the sales list, "Undo credit" on the credit detail page; History labels "Sale corrected (undone)" / "Credit undone".

### Product rejection fix (DEC-051, migration `00011`, commit `aa3483e`)
- Client-reported raw 23503 (`receiving_records_product_id_fkey`) when rejecting a received pending product: `products.status` gained **`'rejected'`**; `reject_product` soft-rejects (keeps receiving/stock history, never resubmittable this round); rejected rows vanish from pending approvals + catalog via status filters; StatusBadge grew a "Rejected" label; the unclassified-error `console.error` no longer prints raw schema-laden DB messages.

### Credit export (DEC-052, no migration, commit `c152be3`)
- The report Excel gains a second **"Credit"** sheet: one row per credit obligation created in the report's From/To range (Option A), honoring origin-store scope — Customer, Origin Store, Created, Due, Original, Paid, **Balance**, Status. Non-voided only (DEC-050); settled included with status; encoded existing credits ARE included here (they are credit records — only the Sales sheet excludes them). Data via `buildCreditReportRows` (`reportRows.ts`) over `listCredits`/`listCustomers`; multi-sheet via `write-excel-file` v4.1.1 (`{ data, sheet, columns }` per tab — verified against installed typings, not README).

### UX fixes (commits `ed33e2f`, `1505b47`, `c5397aa`, plus uncommitted-none)
- **Dashboard mobile responsiveness:** `StatCard` gained `min-width: 0`, clamped hero/display value sizes (`clamp(28px, 9vw, 44px)` / `clamp(22px, 7vw, 30px)`), `RowValue` no longer `flex-shrink: 0`; `Plates`/`DepotBoard` use `minmax(0, 1fr)`; RouteBoard date chip shrinks with ellipsis. (Body `overflow-x: hidden` had been clipping the overflow.)
- **"Credit & payments" cards** on the admin dashboard switched from squeezed row-orientation to the `DepotBoard` responsive column cards (same grid as the store columns).
- **Out-of-stock / insufficient stock gating:** sale catalog disables Add to Cart — `'Out of stock'` (danger) at zero, `'Insufficient stock — only N on hand'` (warning) when requested+basket qty would overdraw `on hand`; `addToCart` double-guard; database refusal still the boundary.
- **Approve button wording (commit `c5397aa`, migration `00012`):** inventory "Approve" is now an explicit **count-verified marker** (its permission role was superseded by DEC-050's admin-only correction); confirm copy + audit detail now read "Inventory approved — counted and verified" (was "staff edits locked"). Behavior unchanged; kept rather than removed because it was client-requested (DEC-048) and carries the audit trail.
- Existing-credit dialog item rows: full-width 3-column grid with `auto` remove slot (no dead right gap) and spacing above "Add item".

## 4. Verification baseline (current)

- **Gate-4 SQL proofs** (`supabase/proofs/gate4.sql`): **27/27 pass** locally (runs as `docker exec -i supabase_db_amara-feeds psql -U postgres < supabase/proofs/gate4.sql`). `db advisors` + `db lint` clean.
- `typecheck` ✓; `format:check` ✓; `lint`: exactly **1 pre-existing error** (DatePicker `react-hooks/set-state-in-effect`).
- `test:run`: **305/309** — failures are only the 4 documented pre-existing ones (DatePicker ×3, SaleListPage ×1 `user.clear`). MorePage sign-out and SignInPage occasionally flake under full parallel runs (pass in isolation).
- `build` passes (PWA 11 precache entries). PWA behavior needs `vite preview` or a deploy (SW off in dev).
- Local DB: at `00012`, holds dev-parity seed (`alice@zafone.local`/`alice123`, `ben@zafone.local`/`ben123`, `owner@zafone.local`/`admin123` — mock creds, not production).
- Verification runbook for hosted: `migration list` → `db push` (00007–00012 whatever is pending) → confirm → deploy frontend → smoke test.

## 5. Next steps / open items

- **Go-live window (highest priority):** `npx supabase migration list` (verify what 00007/00008 push actually did) → `npx supabase db push` for everything pending → confirm Vercel Production env vars → deploy frontend → smoke test per `DEPLOYMENT.md` §10/§12/§13 (sale undo, credit encode/undo, inventory admin-only + price, My Account, History entries, PWA update prompt once-and-clears).
- **Phase 3 walkthrough** (owed per DEC-034 deferral) against hosted with sample data, then wipe via DEC-039 script; **PWA real-device verification** (Android install + native prompt, iOS add-to-home, offline banner, update prompt); Phase 7/8 still pending.
- Flagged for the client (not built): 4-char password floor (Assumed baseline), rejected-product retention, staff self-service My Account entry (RPC `update_own_account` is already staff-capable), staff-level sale deletion, credit-detail rows inside the Credit sheet beyond Option A, `detect*` housekeeping files in git.
- Known accepted gaps (documented): down-payment write is two sequential writes (retry path, DEC-045); voiding restores stock against current quantities (may reflect manual corrections since); sale corrections = undo + re-encode (no in-place editor, DEC-050); dead `allMode` branches remain in pages (cleanup candidate only).
- Confirmation Required items remain flagged in `docs/DATA-MODEL.md` §11 / `API.md` §14; adopted-baseline assumptions keep their revisit triggers (DEC-034).

## 6. Relevant files (navigation map)

- Migrations `00001–00012`: init / RLS / atomic RPCs / seed / staff fixes / pending parity / irreversible-hardening / client changes / client revisions / admin-only correction / soft product rejection / approve wording. Proofs: `supabase/proofs/gate4.sql` (27 sections;pell styles: see "DB gotchas" below). Cleanup: `supabase/cleanup/wipe-business-data.sql`.
- **DB gotchas for proofs:** psql does not substitute `:'var'` inside `do $$…$$` blocks (bridge via `set local app.x = :'y'`; `SET` needs constants — extract with a second `\gset`), `reset role` returns to postgres within a transaction, and inserts run under `set local role authenticated` face RLS — insert fixtures as postgres before switching role.
- **RPC patterns:** every mutation = SECURITY DEFINER function with `assert_active_caller()` + role/store checks + pinned `search_path` (`public, extensions` when crypt/gen_salt) + grants revoked from public/anon, granted to authenticated. Void tables: `sales.is_voided`, `payments.is_voided`, `credit_obligations.status='voided'`, `products.status='rejected'`.
- **Price precedence (source of truth for future pricing work):** `stock_levels.price_minor ?? latest priced receiving record`; `record_receiving` upserts it; `listStorePrices` mirrors it (catalog display must stay in lockstep).
- Services (dual-mode supabase/mock): `src/services/*Service.ts`; error mapping + `updateOwnAccount` in `userService.ts`; `voidSale`/`voidCredit` in `saleService.ts`/`creditService.ts`; `voidCredit` lives in **creditService**; disable voided filtering when adding new list endpoints (`is_voided`, `is_legacy`, `status <> 'voided'`, `status <> 'rejected'`).
- Session: `src/features/session/` (SessionProvider reads profiles; disabled accounts detected at restore and rejected at sign-in). Store: `src/store/` (`StoreProvider` default **zeann**, staff locked; `DEFAULT_ADMIN_STORE` in `stores.ts`).
- Account: `src/features/account/MyAccountPage.tsx` (/admin/account, admin-only, More-page entry). Navigation: `SideNav.tsx` (ends with a More link), `BottomNav`/`navItems.ts` (More = mobile tab; admin list item list = SideNav).
- Sales: `NewSalePage.tsx` (out-of-stock/insufficient-stock gating, StoreControl), `SaleListPage.tsx` (admin-only Undo action), `SaleCartPage.tsx` (down-payment flow).
- Inventory: `InventoryPage.tsx` (admin-only actions incl. Approve = verified marker), `EditStockDialog.tsx` (quantity **and** price). Credit: `CreditListPage.tsx` + `ExistingCreditDialog.tsx` (items/partial payment), `CreditDetailPage.tsx` (items table + "Undo credit").
- Correction hardening lives in DB functions — see `supabase/migrations/00010_admin_correction.sql` for the canonical void semantics; frontend only surfaces the buttons.
- Reports/export: `src/features/reports/` (`reportRows.ts` = two builders: sales lines + credits; `useReportSummaries.ts`), `src/lib/exportReportExcel.ts` (two-sheet workbook via write-excel-file v4.1.1 `{ data, sheet, columns }[]`).
- Feedback: `src/lib/swal.ts` (+ `src/test/swalMock.ts` auto-confirms everything; **calls accumulate per file**, use `.at(-1)`). Tests there render assemblies via `renderWithProviders(ui, { user, store, cart })`.
- Theme/store paint: `src/theme/storeThemes.ts`, `StoreThemeProvider.tsx`, `AdminLayout.tsx` (paint follows store context; navy fallback unused since 'all' is unreachable).

## 7. Recent decision register (one-liners)

| ID | Title | Status |
| --- | --- | --- |
| DEC-032 | Manual stock edit/delete with sales-history guard | Superseded by DEC-050 (admin-only correction) |
| DEC-033 | Sign-in brand copy | Accepted |
| DEC-034 | Phase 3 gate deferral + assumption adoption (dev creds, email convention) | Accepted |
| DEC-035 | Supabase-direct integration (profiles authz, service swap) | Accepted |
| DEC-036 | Staff RPC fixes + admin `update_staff` semantics | Accepted |
| DEC-037 | Catalog lists only sellable items + pending-seed parity | Accepted |
| DEC-038 | SweetAlert2 feedback system + logout confirmation | Accepted |
| DEC-039 | Hosted production wipe to owner-only clean slate | Accepted |
| DEC-040 | Admin store switch on the More page | Accepted |
| DEC-041 | Admin default store context | Superseded by DEC-048 (default Zeann) |
| DEC-042 | Production owner login uses an email handle | Accepted |
| DEC-043 | Installable PWA with post-login install tutorial | Accepted (update loop fixed post-DEC-043) |
| DEC-044 | Admin paint follows the store context | Accepted |
| DEC-045 | Charge-sale down payments ride the payment flow | Accepted |
| DEC-046 | Dashboard, sales, and checkout UX refinements | Accepted |
| DEC-047 | Security hardening from the loophole audit (migration 00007) | Accepted |
| DEC-048 | Existing credit encoding, approved inventory lock, per-store admin selection (migration 00008) | Accepted |
| DEC-049 | Credit details, price editing, sale deletion, customer edit/delete, My Account (migration 00009) | Accepted (sale deletion superseded by DEC-050) |
| DEC-050 | Bank-style admin-only correction: void/undo for sales, credits, and inventory (migration 00010) | Accepted |
| DEC-051 | Soft product rejection (migration 00011) | Accepted |
| DEC-052 | Credit sheet in the report Excel export | Accepted |

Full records in `docs/DECISIONS.md`.
