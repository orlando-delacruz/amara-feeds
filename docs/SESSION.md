# SESSION.md — Session Context (for a new chat session)

This file is the session handoff: a new chat session reads it first to orient on the project without re-explaining it. It is refreshed at the end of a session, or automatically whenever the client says **"hand-off context to Session.md"** (standing rule — see the note at the bottom and in `AGENTS.md`).

## 1. Objective

- **Project:** ZAF ONE — business management web app for the **Amara and Zeann** two-store business, mobile-primary.
- **Constraints:** ₱10,000 budget, target **September 30, 2026**, scope limited to the core version (`docs/PROJECT.md`, `docs/REQUIREMENTS.md`).
- **Where the project is now: Phase 4–6 are built and live.** The hosted Supabase project is linked and is the real backend; all services run against it (the in-memory mock remains only for unit tests/preview).

## 2. Live environment (key facts)

- **Supabase project (production):** `https://fsfmecmmpaljwurfqsto.supabase.co`, ref `fsfmecmmpaljwurfqsto`. Linked; migrations `00001–00006` applied. Migrations are the schema source of truth (`supabase/migrations/`).
- **`.env` (gitignored)** holds `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`. Without them the app falls back to the in-memory mock (tests/preview path).
- **YouTube-auth note:** client Supabase access token expires **2026-09-21** — after that, CLI work needs a fresh `npx supabase login` or a new personal access token.
- **Owner login (production):** `jhoann@admin.com` (+ password held by the client — **never committed**, DEC-042). The login field accepts an email-shaped handle directly; bare usernames still map to `username@zafone.local`.
- Shared-credit model is **confirmed and kept**: credit stays with its origin store; cross-store payments are recorded with payment-store attribution (client confirmed — no "transfer" behavior).

## 3. Work completed in this session (2026-09-20 → 21)

### Database + backend (DEC-034, DEC-035)
- Supabase project initialized; imperative migrations `00001` (schema, FKs, stores/terms reference rows), `00002` (RLS everywhere via `SECURITY DEFINER` `current_profile()` helper + `to authenticated` predicates; no `auth.role()`/`user_metadata`), `00003` (atomic `SECURITY DEFINER` functions with in-body `auth.uid()` store checks: `record_sale`, `record_receiving`, `record_payment`, product submit/approve/reject, `adjust_stock`/`delete_stock`, rider/vehicle guarded delete, `create_customer`, `create_expense`, `create_staff`), `00004` (dev-parity seed + 3 auth users), `00005` (`create_staff` search_path fix incl. `extensions`; admin-only `update_staff` — rename, username sync, store reassign, enable/disable, password reset with session revocation), `00006` (pending-seed parity for the demo item).
- **Gate 4 SQL proofs** in `supabase/proofs/gate4.sql` — all 9 pass (anon reaches nothing, store-scoped reads, shared cross-store reads, cross-store update denied, direct writes denied, sale atomic + oversell refused, payment settles + overpayment refused, approval gating, stock-delete guard). `db advisors` clean.
- Hosted push fixed along the way: `00004` needed `set search_path = public, extensions` (pgcrypto) and **GoTrue-safe auth.users inserts** (token columns as `''`, one `auth.identities` row per user — otherwise GoTrue throws `Database error querying schema`).

### Frontend integration
- `@supabase/supabase-js` + `src/services/supabaseClient.ts`; every service runs against Supabase when env vars are set, mock fallback otherwise; `isSupabaseConfigured` is forced false under Vitest (tests stay mock-only).
- `SessionProvider` restores the real Auth session; `signIn` authenticates via Supabase Auth with the email convention.
- All services carry supabase branches: customers, products, inventory (`update_stock`/`delete_stock` RPCs), receiving, sales (nested `sale_lines` read), credit, payments, riders, vehicles, expenses (incl. `getDeliveryNetSummary`), users (`listUsers`/`updateUser` → `update_staff`), audit (`audit_events` table), dashboard summaries.
- **Integration-hardening fixes (DEC-036):** `record_sale` receives `p_lines` as a real JSON array (stringified value arrived as jsonb scalar → 22023); staff pages run on real `profiles` (were silently mock); `serviceErrorFromSupabase` classifies `P0001` business copy and never surfaces raw SQLSTATEs; password fields gained a show/hide eye toggle; sale catalog and checkout gained distinct loading/error states.

### Product/UX decisions this session
- **DEC-032:** manual stock edit (absolute qty) + delete with sales-history guard, audited.
- **DEC-033:** sign-in brand copy "ZAF ONE / Zeann & Amara Feeds Supply / One System • One Team • One Goal".
- **DEC-037:** catalog lists only sellable items (priced = received at that store); approved-but-unstocked products stay hidden; seed parity via `00006`.
- **DEC-038:** SweetAlert2 for ALL action feedback — success/failure modals everywhere (sign-in failure incl.), themed confirm modals replacing the removed `ConfirmDialog` (stock/rider/vehicle delete, approve/reject, staff enable/disable), sign-out confirmation on More page + TopBar. Inline page load/empty/error states and field validation unchanged. Test double in `src/test/swalMock.ts` (`__awaitSwal(title)` assertions). Known cosmetica: the wrong-password 400 in DevTools is the browser's network log for the expected failed auth request — not suppressible from app code.
- **DEC-039:** hosted data wiped to owner-only clean slate (one-time FK-safe script `supabase/cleanup/wipe-business-data.sql`; kept `stores`, `payment_terms`; local dev seed untouched).
- **DEC-040/041:** admin Amara/Zeann switch relocated to the **More page** ("Store context" section, admin-only) and defaults to **All stores** — combined admin views with a Store column on inventory/riders/vehicles/expenses/receiving-history/sales-list; write flows needing a concrete store (checkout, receiving record, payment) are disabled with a pointing hint until one is chosen. Admin header never renders a single-store badge. Staff unchanged (store-locked, no switch).
- **DEC-042 (owner credential):** production owner login now uses the email handle `jhoann@admin.com` (password held by the client). `usernameEmail` passes email-shaped inputs through as-is. Client already confirmed it works in-browser after a fresh build.

## 4. Verification baseline (current)

- `typecheck`, `format:check`, `build`: pass. `lint`: exactly **1 pre-existing error** (DatePicker `react-hooks/set-state-in-effect`).
- `test:run`: **242/246** — the only failures are the 4 documented pre-existing ones (DatePicker ×3, SaleListPage ×1). MorePage sign-out occasionally flakes under full parallel runs (passes in isolation).
- Hosted: Gate-4 proofs + REST checks verified (owner sign-in, RLS scoping, sale→stock, staff create/update, wipe state).

## 5. Next steps / open items

- **Phase 3 walkthrough** (owed per DEC-034 deferral) before Phase 7; Phase 7 real-system validation; Phase 8 hardening + Vercel deploy (needs `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` in Vercel env).
- Confirmation Required items remain flagged in `docs/DATA-MODEL.md` §11 / `API.md`; adopted-baseline assumptions have revisit triggers in DEC-034.
- No new business data has been created on hosted as of 2026-09-21.

## 6. Relevant files (navigation map)

- Migrations: `supabase/migrations/00001–00006`; proofs `supabase/proofs/gate4.sql`; wipe + cleanup scripts under `supabase/cleanup/`.
- DB access: `src/services/supabaseClient.ts`; store context: `src/store/` (`StoreProvider` defaults admin to `all`, staff locked).
- Services: `src/services/*Service.ts` (dual-mode), errors mapping in `userService.serviceErrorFromSupabase`, `useAlertMutation` for popup-on-fail.
- Session: `src/features/session/` (email-shaped login handles; `SessionProvider` marks wiped profiles unsigned-out via `.maybeSingle()`).
- Feedback: `src/lib/swal.ts` (+ `src/test/swalMock.ts`), `useAlertMutation` hook.
- Sales catalog: `src/features/sales/NewSalePage.tsx` (sellable-only, store-required hints); inventory edit/delete: `src/features/inventory/`.
- Admin store switch: `src/features/more/MorePage.tsx` (More → Store context).
- Theme/admin paint: `src/app/layouts/` (AdminLayout fixed navy; TopBar hides badge for admins).

## 7. Recent decision register (one-liners)

| ID | Title | Status |
| --- | --- | --- |
| DEC-032 | Manual stock edit/delete with sales-history guard | Accepted |
| DEC-033 | Sign-in brand copy | Accepted |
| DEC-034 | Phase 3 gate deferral + assumption adoption (dev creds, email convention) | Accepted |
| DEC-035 | Supabase-direct integration (profiles authz, service swap) | Accepted |
| DEC-036 | Staff RPC fixes + admin `update_staff` semantics | Accepted |
| DEC-037 | Catalog lists only sellable items + pending-seed parity | Accepted |
| DEC-038 | SweetAlert2 feedback system + logout confirmation | Accepted |
| DEC-039 | Hosted production wipe to owner-only clean slate | Accepted |
| DEC-040 | Admin store switch relocated to the More page | Accepted |
| DEC-041 | Admin default store context is All stores | Accepted |
| DEC-042 | Production owner login uses an email handle | Accepted |

Full records in `docs/DECISIONS.md`.
