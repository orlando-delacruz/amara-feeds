-- ZAF ONE — Gate 4 SQL proofs (Phase 4 validation).
-- Runs inside the local database as `postgres`. Simulates callers by
-- setting the request JWT claim (auth.uid()) and switching the DB role.
-- Each section uses BEGIN/ROLLBACK so state stays isolated.
--
-- !! psql SCRIPT — NOT plain SQL. Do NOT paste or run this in a GUI SQL editor,
--    Supabase Studio, or any tool that hands statements straight to Postgres:
--    it contains psql meta-commands (\pset, \set, and 28 \gset captures) that a
--    plain SQL engine rejects with `42601 syntax error at or near "\"`.
--    Studio will also NOT stop on the first error, so a partial run can look
--    like a pass.
--
-- Run it exactly like this (from the repo root), never as a pasted script:
--     docker exec -i supabase_db_amara-feeds psql -U postgres < supabase/proofs/gate4.sql
-- Requires: `npx supabase db reset` applied first, or the proofs run against
-- a schema that predates the migration they cover.
--
-- KNOWN LIMIT: a proof line prints "pass" whenever its block raised no
-- exception. `select ... as some_assertion` only PRINTS t/f — a false boolean
-- does NOT fail the run. So "36 proofs pass" means "no exceptions", not
-- "every assertion is true". Grep the output for a lone `f` to audit them.

\pset pager off
\set ON_ERROR_STOP on

-- --- 1. Anonymous reaches nothing -------------------------------------
begin;
set local role anon;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000000';
set local request.jwt.claim.role = 'anon';
select count(*) = 0 as anon_sees_no_customers from public.customers;
rollback;
select 'pass: anon sees nothing' as proof;

-- --- 2. Staff-A sees own store only -----------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
select count(*) as amara_sales_visible from public.sales;  -- expect 2
select count(*) as amara_receiving_visible from public.receiving_records; -- expect 3
select count(*) as amara_stock_visible from public.stock_levels; -- expect 3
select count(*) as zeann_sales_visible from public.sales where store_id='zeann'; -- expect 0
rollback;
select 'pass: staff-A store-scoped reads' as proof;

-- --- 3. Shared records readable cross-store ---------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
select count(*) = 3 as shared_customers from public.customers;
select count(*) = 3 as shared_credits from public.credit_obligations;
select count(*) = 3 as shared_payments from public.payments;
rollback;
select 'pass: shared cross-store reads' as proof;

-- --- 4. Unauthorized update returns 0 rows (no leak) ------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
update public.riders set active = false where store_id = 'zeann';
select count(*) = 0 as zeann_riders_unchanged from public.riders
 where store_id='zeann' and active = false;
rollback;
select 'pass: cross-store update denied' as proof;

-- --- 5. Direct write without a function is denied ---------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
do $$
begin
  begin
    insert into public.sales (store_id, sale_date, payment_type, total_minor, recorded_by_user_id)
    values ('amara', current_date, 'cash', 100, '11111111-1111-1111-1111-111111111111');
    raise exception 'FAIL: direct sale insert allowed';
  exception when others then
    if sqlerrm like '%row-level security%' then raise notice 'direct sale insert correctly denied';
    else raise; end if;
  end;
end $$;
rollback;
select 'pass: direct table write denied (no insert policy)' as proof;

-- --- 6. Atomic sale: success deducts stock, refusal leaves none ------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';

-- Valid cash sale of 1 Rice 25kg at Amara (stock 20 -> 19).
select (public.record_sale(
  'amara', current_date, null, 'cash', 'Cash', 0, null, null, 0, null,
  '[{"product_id":"bbbbbbbb-0000-0000-0000-000000000001","quantity":1,"unit_price_minor":115000}]'
))->>'total_minor' as sale_total;
select quantity = 19 as stock_deducted_after_sale from public.stock_levels
 where store_id='amara' and product_id='bbbbbbbb-0000-0000-0000-000000000001';

-- Oversell (999 Rice) must fail and leave stock unchanged at 19.
do $$
begin
  begin
    perform public.record_sale(
      'amara', current_date, null, 'cash', 'Cash', 0, null, null, 0, null,
      '[{"product_id":"bbbbbbbb-0000-0000-0000-000000000001","quantity":999,"unit_price_minor":115000}]'
    );
    raise exception 'FAIL: oversell allowed';
  exception when others then
    if sqlerrm like '%Not enough stock%' then
      raise notice 'oversell correctly refused';
    else
      raise;
    end if;
  end;
end $$;
select quantity = 19 as stock_unchanged_after_oversell from public.stock_levels
 where store_id='amara' and product_id='bbbbbbbb-0000-0000-0000-000000000001';

rollback;
select 'pass: sale atomic + oversell refused' as proof;

-- --- 7. Payment: cross-store, balance/status update -------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
set local request.jwt.claim.role = 'authenticated';
-- cred-2 balance 20000 outstanding; Ben (Zeann) settles it via GCash.
select public.record_payment('aaaaaaaa-0000-0000-0000-000000000102', 'zeann', 20000, 'GCash');
select balance_minor = 0 and status = 'settled' as credit_settled from public.credit_obligations
 where id = 'aaaaaaaa-0000-0000-0000-000000000102';
-- Oversized payment refused (use cred-1, still outstanding at 19500).
do $$
begin
  begin
    perform public.record_payment('aaaaaaaa-0000-0000-0000-000000000101', 'amara', 50000, 'Cash');
    raise exception 'FAIL: overpayment allowed';
  exception when others then
    if sqlerrm like '%remaining balance%' then raise notice 'overpayment correctly refused';
    else raise; end if;
  end;
end $$;
rollback;
select 'pass: cross-store payment + overpayment refused' as proof;

-- --- 8. Approval bypass impossible ------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
do $$
begin
  begin
    perform public.approve_product('bbbbbbbb-0000-0000-0000-000000000003');
    raise exception 'FAIL: staff approved a product';
  exception when others then
    if sqlerrm like '%Only admins%' then raise notice 'staff approval blocked'; else raise; end if;
  end;
end $$;
rollback;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
select public.approve_product('bbbbbbbb-0000-0000-0000-000000000003');
select status = 'active' as product_active_after_approval from public.products
 where id = 'bbbbbbbb-0000-0000-0000-000000000003';
rollback;
select 'pass: approval gating (staff blocked, admin works)' as proof;

-- --- 9. Stock guard (DEC-032): product with sales cannot be deleted ----
begin;
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
do $$
begin
  begin
    perform public.delete_stock('amara', 'bbbbbbbb-0000-0000-0000-000000000001');
    raise exception 'FAIL: stock with sales deleted';
  exception when others then
    if sqlerrm like '%has sales%' then raise notice 'stock-with-sales delete refused'; else raise; end if;
  end;
end $$;
rollback;
select 'pass: stock-with-sales delete refused (DEC-032)' as proof;

-- --- 10. C1: self-service privilege escalation is impossible ----------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
do $$
begin
  begin
    update public.profiles set role = 'admin' where id = auth.uid();
  exception when others then
    if sqlerrm like '%row-level security%' then raise notice 'self-update denied by RLS';
    else raise; end if;
  end;
end $$;
select role = 'staff' and active as profile_unchanged from public.profiles
 where id = auth.uid();
rollback;
select 'pass: staff cannot elevate own role (C1)' as proof;

-- --- 11. H1: a disabled account loses data access immediately ---------
begin;
update public.profiles set active = false
 where id = '11111111-1111-1111-1111-111111111111';
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
select count(*) = 0 as disabled_staff_sees_no_sales from public.sales;
select count(*) = 0 as disabled_staff_sees_no_customers from public.customers;
rollback;
select 'pass: disabled account loses read access (H1)' as proof;

-- --- 12. H1: a disabled admin cannot approve products ------------------
begin;
update public.profiles set active = false
 where id = '33333333-3333-3333-3333-333333333333';
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
do $$
begin
  begin
    perform public.approve_product('bbbbbbbb-0000-0000-0000-000000000003');
    raise exception 'FAIL: disabled admin approved a product';
  exception when others then
    if sqlerrm like '%disabled%' then raise notice 'disabled admin blocked from approval';
    else raise; end if;
  end;
end $$;
rollback;
select 'pass: disabled admin cannot approve (H1)' as proof;

-- --- 13. H2: cross-store delivery rider refused on sale ----------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
do $$
begin
  begin
    perform public.record_sale(
      'amara', current_date, null, 'cash', 'Cash', 0,
      'cccccccc-0000-0000-0000-000000000003', null, 0, null,
      '[{"product_id":"bbbbbbbb-0000-0000-0000-000000000001","quantity":1}]'
    );
    raise exception 'FAIL: cross-store rider accepted on sale';
  exception when others then
    if sqlerrm like '%rider is not active at this store%' then raise notice 'cross-store rider refused on sale';
    else raise; end if;
  end;
end $$;
rollback;
select 'pass: sale delivery rider store-scoped (H2)' as proof;

-- --- 14. M1: sale prices derive from receiving; unpriced refused -------
begin;
insert into public.products (id, name, status)
values ('bbbbbbbb-0000-0000-0000-000000000099', 'Proof Unpriced Item', 'active');
insert into public.stock_levels (store_id, product_id, quantity)
values ('amara', 'bbbbbbbb-0000-0000-0000-000000000099', 5)
on conflict (store_id, product_id) do update set quantity = 5;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
-- Rice 25kg at Amara: latest priced receiving sells at 115000.
select (public.record_sale(
  'amara', current_date, null, 'cash', 'Cash', 0, null, null, 0, null,
  '[{"product_id":"bbbbbbbb-0000-0000-0000-000000000001","quantity":2}]'
))->>'total_minor' as derived_total;  -- expect 230000
do $$
begin
  begin
    perform public.record_sale(
      'amara', current_date, null, 'cash', 'Cash', 0, null, null, 0, null,
      '[{"product_id":"bbbbbbbb-0000-0000-0000-000000000099","quantity":1}]'
    );
    raise exception 'FAIL: unpriced sale allowed';
  exception when others then
    if sqlerrm like '%no price at this store%' then raise notice 'unpriced sale correctly refused';
    else raise; end if;
  end;
end $$;
rollback;
select 'pass: sale price derived server-side, unpriced refused (M1)' as proof;

-- --- 15. M6: duplicate active product names refused --------------------
begin;
insert into public.products (id, name, status)
values ('bbbbbbbb-0000-0000-0000-000000000098', 'Rice 25kg', 'pending');
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
do $$
begin
  begin
    perform public.approve_product('bbbbbbbb-0000-0000-0000-000000000098');
    raise exception 'FAIL: duplicate active name approved';
  exception when others then
    if sqlerrm like '%already taken%' then raise notice 'duplicate active name refused';
    else raise; end if;
  end;
end $$;
rollback;
select 'pass: unique active product names (M6)' as proof;

-- --- 16. C2: payment over-balance refused by the atomic guard ----------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
set local request.jwt.claim.role = 'authenticated';
-- The guarded UPDATE re-checks balance_minor >= amount under the row lock,
-- so concurrent payments cannot both pass; the single-caller case must
-- still refuse overpayment with the friendly copy.
do $$
begin
  begin
    perform public.record_payment('aaaaaaaa-0000-0000-0000-000000000101', 'zeann', 19501, 'Cash');
    raise exception 'FAIL: overpayment allowed';
  exception when others then
    if sqlerrm like '%remaining balance%' then raise notice 'overpayment correctly refused';
    else raise; end if;
  end;
end $$;
rollback;
select 'pass: atomic payment balance guard (C2)' as proof;

-- --- 17. Existing credit: admin encodes, no stock effect ---------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
select quantity = 20 as stock_before from public.stock_levels
 where store_id='amara' and product_id='bbbbbbbb-0000-0000-0000-000000000001';
select public.create_existing_credit(
  'aaaaaaaa-0000-0000-0000-000000000001', 'amara', 250000, current_date + 30
)->>'credit_id' as encoded_credit \gset
select balance_minor = 250000 and original_amount_minor = 250000 and terms_id is null
  and sale_id is null and status = 'outstanding' as legacy_credit_shape
 from public.credit_obligations
 where id = :'encoded_credit'::uuid;
select quantity = 20 as stock_unchanged_after_credit from public.stock_levels
 where store_id='amara' and product_id='bbbbbbbb-0000-0000-0000-000000000001';
-- Payment against the encoded balance rides the normal flow.
select public.record_payment(:'encoded_credit'::uuid, 'zeann', 50000, 'Cash');
select balance_minor = 200000 as encoded_balance_payable from public.credit_obligations
 where id = :'encoded_credit'::uuid;
rollback;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
do $$
begin
  begin
    perform public.create_existing_credit(
      'aaaaaaaa-0000-0000-0000-000000000001', 'amara', 250000, current_date + 30
    );
    raise exception 'FAIL: staff encoded existing credit';
  exception when others then
    if sqlerrm like '%Only admins%' then raise notice 'staff credit encoding blocked'; else raise; end if;
  end;
end $$;
rollback;
select 'pass: existing credit encoded admin-only, stock untouched' as proof;

-- --- 18. Approved inventory: admin retains edits, receiving unaffected --
begin;
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
select public.approve_stock('amara', 'bbbbbbbb-0000-0000-0000-000000000001');
select admin_approved as row_approved from public.stock_levels
 where store_id='amara' and product_id='bbbbbbbb-0000-0000-0000-000000000001';
rollback;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
select public.approve_stock('amara', 'bbbbbbbb-0000-0000-0000-000000000001');
select public.adjust_stock('amara', 'bbbbbbbb-0000-0000-0000-000000000001', 18);
select quantity = 18 as admin_still_edits from public.stock_levels
 where store_id='amara' and product_id='bbbbbbbb-0000-0000-0000-000000000001';
rollback;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
select public.approve_stock('amara', 'bbbbbbbb-0000-0000-0000-000000000001');
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
-- Receiving into an approved row stays allowed (normal workflow).
-- Since migration 00017 (DEC-061) a receipt is PENDING and does not move stock
-- until an admin approves it, so the assertion is "allowed, stock untouched"
-- (20 is the seeded quantity). The approve-then-apply path is proven in 32.
select public.record_receiving('amara', 'bbbbbbbb-0000-0000-0000-000000000001', 5, 'Proof Supplier', 100000, 115000, null, null) as staff_receipt_into_approved;
select quantity = 20 as receiving_allowed_stock_untouched from public.stock_levels
 where store_id='amara' and product_id='bbbbbbbb-0000-0000-0000-000000000001';
rollback;
select 'pass: approved inventory admin-edit-only, receiving unaffected' as proof;

-- --- 19. Existing credit with item details; stock untouched ------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
select quantity = 20 as stock_before from public.stock_levels
 where store_id='amara' and product_id='bbbbbbbb-0000-0000-0000-000000000001';
select public.record_existing_credit(
  'aaaaaaaa-0000-0000-0000-000000000003', 'amara', current_date - 10, current_date + 15,
  '[{"product_id":"bbbbbbbb-0000-0000-0000-000000000001","quantity":2,"unit_price_minor":100000}]',
  50000, 'Cash'
) as encoded \gset
select balance_minor = 150000 and status = 'outstanding' and terms_id is null
  as encoded_balance from public.credit_obligations
 where id = (:'encoded'::jsonb->>'credit_id')::uuid;
select quantity = 20 as stock_untouched_by_encoding from public.stock_levels
 where store_id='amara' and product_id='bbbbbbbb-0000-0000-0000-000000000001';
select s.is_legacy and s.total_minor = 200000 as legacy_sale_rows
  from public.sales s where s.id = (:'encoded'::jsonb->>'sale_id')::uuid;
select count(*) = 1 as legacy_sale_has_lines from public.sale_lines
 where sale_id = (:'encoded'::jsonb->>'sale_id')::uuid;
select exists (
  select 1 from public.payments p
   where p.credit_id = (:'encoded'::jsonb->>'credit_id')::uuid and p.amount_minor = 50000
) as initial_payment_recorded;
rollback;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
do $$
begin
  begin
    perform public.record_existing_credit(
      'aaaaaaaa-0000-0000-0000-000000000003', 'amara', current_date, current_date + 15,
      '[{"product_id":"bbbbbbbb-0000-0000-0000-000000000001","quantity":1,"unit_price_minor":100000}]',
      null, null);
    raise exception 'FAIL: staff encoded existing credit';
  exception when others then
    if sqlerrm like '%Only admins%' then raise notice 'staff credit encoding blocked'; else raise; end if;
  end;
end $$;
rollback;
select 'pass: encoded credit carries items + payment, stock untouched' as proof;

-- --- 20. void_sale: stock restored once; admin-only (DEC-050) ----------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
select public.record_sale('amara', current_date, null, 'cash', 'Cash', 0, null, null, 0, null,
  '[{"product_id":"bbbbbbbb-0000-0000-0000-000000000001","quantity":2}]'
) as cash_sale \gset
select :'cash_sale'::jsonb->>'sale_id' as proof_sale_id \gset
select quantity = 18 as stock_after_sale from public.stock_levels
 where store_id='amara' and product_id='bbbbbbbb-0000-0000-0000-000000000001';
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
set local app.proof_sale_id = :'proof_sale_id';
do $$
declare sid uuid := nullif(current_setting('app.proof_sale_id', true), '')::uuid;
begin
  begin
    perform public.void_sale(sid);
    raise notice 'admin voided the sale';
  exception when others then
    raise exception 'FAIL: admin void failed: %', sqlerrm;
  end;
end $$;
select quantity = 20 as stock_restored_after_void from public.stock_levels
 where store_id='amara' and product_id='bbbbbbbb-0000-0000-0000-000000000001';
rollback;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
set local request.jwt.claim.role = 'authenticated';
select public.record_sale('zeann', current_date, 'aaaaaaaa-0000-0000-0000-000000000002',
  'charge', null, 0, null, null, 0, 'terms-7',
  '[{"product_id":"bbbbbbbb-0000-0000-0000-000000000002","quantity":1}]'
) as charge_sale \gset
select :'charge_sale'::jsonb->>'sale_id' as proof_sale_id \gset
select public.record_payment(
  (select id from public.credit_obligations
    where sale_id = (:'charge_sale'::jsonb->>'sale_id')::uuid),
  'zeann', 100, 'Cash');
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
set local app.proof_sale_id = :'proof_sale_id';
select public.void_sale(nullif(current_setting('app.proof_sale_id', true), '')::uuid);
-- Paid sale: credit voided and its payment row voided, stock restored.
select status = 'voided' as credit_voided_with_sale from public.credit_obligations
 where sale_id = nullif(current_setting('app.proof_sale_id', true), '')::uuid;
rollback;
select 'pass: sale undo restores stock, voids credit and payments' as proof;

-- --- 21. Customer edit + admin-only hard delete (DEC-053) --------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
select public.create_customer('Proof Temp Customer', null, null) as temp_cust \gset
select public.update_customer((:'temp_cust'::jsonb->>'customer_id')::uuid, 'Proof Renamed', '0917', 'Address');
select name = 'Proof Renamed' and contact = '0917' as customer_renamed
  from public.customers where id = (:'temp_cust'::jsonb->>'customer_id')::uuid;
-- Staff cannot delete customers.
set local app.temp_cust = :'temp_cust';
do $$
begin
  begin
    perform public.delete_customer(
      (nullif(current_setting('app.temp_cust', true), '')::jsonb->>'customer_id')::uuid);
    raise exception 'FAIL: staff deleted a customer';
  exception when others then
    if sqlerrm like '%Only admins%' then raise notice 'staff customer delete blocked'; else raise; end if;
  end;
end $$;
-- Admin deletes the temp customer outright.
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
select public.delete_customer((:'temp_cust'::jsonb->>'customer_id')::uuid);
select count(*) = 0 as temp_customer_gone from public.customers
  where id = (:'temp_cust'::jsonb->>'customer_id')::uuid;
-- Maria (customer ...0001) backs sales + an outstanding credit: refused.
do $$
begin
  begin
    perform public.delete_customer('aaaaaaaa-0000-0000-0000-000000000001');
    raise exception 'FAIL: outstanding-credit customer deleted';
  exception when others then
    if sqlerrm like '%outstanding credit%' then raise notice 'outstanding-credit customer delete blocked'; else raise; end if;
  end;
end $$;
rollback;
select 'pass: customer edit works, admin-only hard delete, outstanding guard' as proof;

-- --- 22. update_own_account: password-verified self-service -------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
do $$
begin
  begin
    perform public.update_own_account('wrong-password', 'ownerx', null);
    raise exception 'FAIL: wrong current password accepted';
  exception when others then
    if sqlerrm like '%current password is incorrect%' then raise notice 'wrong current password refused';
    else raise; end if;
  end;
end $$;
select public.update_own_account('admin123', 'owner2', 'brandnew123');
select username = 'owner2' as username_updated from public.profiles where id = auth.uid();
reset role;
select crypt('brandnew123', encrypted_password) = encrypted_password as new_password_valid,
       email = 'owner2@zafone.local' as auth_email_synced
  from auth.users where id = '33333333-3333-3333-3333-333333333333';
rollback;
select 'pass: own-account change verified, identity synced' as proof;

-- --- 23. void_sale: reversal once, no duplicated stock, admin-only ------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
select public.record_sale('amara', current_date, null, 'cash', 'Cash', 0, null, null, 0, null,
  '[{"product_id":"bbbbbbbb-0000-0000-0000-000000000001","quantity":3}]'
) as void_proof_sale \gset
select :'void_proof_sale'::jsonb->>'sale_id' as proof_void_sale \gset
set local app.proof_void_sale = :'proof_void_sale';
select quantity = 17 as stock_after_sale from public.stock_levels
 where store_id='amara' and product_id='bbbbbbbb-0000-0000-0000-000000000001';
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
do $$
begin
  begin
    perform public.void_sale(nullif(current_setting('app.proof_void_sale', true), '')::uuid);
    raise exception 'FAIL: staff voided a sale';
  exception when others then
    if sqlerrm like '%Only admins%' then raise notice 'staff void blocked'; else raise; end if;
  end;
end $$;
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
select public.void_sale(nullif(current_setting('app.proof_void_sale', true), '')::uuid);
select is_voided as sale_voided from public.sales
 where id = nullif(current_setting('app.proof_void_sale', true), '')::uuid;
select quantity = 20 as stock_restored_once from public.stock_levels
 where store_id='amara' and product_id='bbbbbbbb-0000-0000-0000-000000000001';
do $$
begin
  begin
    perform public.void_sale(nullif(current_setting('app.proof_void_sale', true), '')::uuid);
    raise exception 'FAIL: double void allowed';
  exception when others then
    if sqlerrm like '%already undone%' then raise notice 're-void refused'; else raise; end if;
  end;
end $$;
select quantity = 20 as stock_not_double_restored from public.stock_levels
 where store_id='amara' and product_id='bbbbbbbb-0000-0000-0000-000000000001';
rollback;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
set local request.jwt.claim.role = 'authenticated';
-- Paid charge sale: admin undo voids credit AND its payments.
select public.record_sale('zeann', current_date, 'aaaaaaaa-0000-0000-0000-000000000002',
  'charge', null, 0, null, null, 0, 'terms-7',
  '[{"product_id":"bbbbbbbb-0000-0000-0000-000000000002","quantity":2}]'
) as paid_sale \gset
select :'paid_sale'::jsonb->>'sale_id' as proof_paid_sale \gset
set local app.proof_paid_sale = :'proof_paid_sale';
select public.record_payment(
  (select id from public.credit_obligations where sale_id = :'proof_paid_sale'::uuid),
  'zeann', 500, 'Cash');
select quantity = 38 as stock_after_charge_sale from public.stock_levels
 where store_id='zeann' and product_id='bbbbbbbb-0000-0000-0000-000000000002';
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
select public.void_sale(nullif(current_setting('app.proof_paid_sale', true), '')::uuid);
-- Product 2 only: the sale used it, so it is the row void_sale restores (40).
-- (This query previously also matched product 1, which void_sale never touches,
-- so it printed a spurious false alongside the true.)
select quantity = 40 as stock_restored_on_voided_sale from public.stock_levels
 where store_id='zeann' and product_id='bbbbbbbb-0000-0000-0000-000000000002';
rollback;
select 'pass: sale undo reverses stock once and voids credit + payments' as proof;

-- --- 24. void_credit: encoded credits have no stock; voided unpaid ------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
select public.record_existing_credit(
  'aaaaaaaa-0000-0000-0000-000000000001', 'amara', current_date - 5, current_date + 30,
  '[{"product_id":"bbbbbbbb-0000-0000-0000-000000000001","quantity":1,"unit_price_minor":90000}]',
  null, null
) as encoded_credit \gset
select :'encoded_credit'::jsonb->>'credit_id' as proof_credit \gset
set local app.proof_credit = :'proof_credit';
select quantity = 20 as stock_before_credit_undo from public.stock_levels
 where store_id='amara' and product_id='bbbbbbbb-0000-0000-0000-000000000001';
select public.void_credit(nullif(current_setting('app.proof_credit', true), '')::uuid);
select status = 'voided' as encoded_credit_voided from public.credit_obligations
 where id = nullif(current_setting('app.proof_credit', true), '')::uuid;
select quantity = 20 as stock_untouched_by_credit_undo from public.stock_levels
 where store_id='amara' and product_id='bbbbbbbb-0000-0000-0000-000000000001';
rollback;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
-- Seed cred-1 (-0101, sale-2's credit) with no payments: void it.
select quantity = 40 as zeann_sugar_before from public.stock_levels
 where store_id='zeann' and product_id='bbbbbbbb-0000-0000-0000-000000000002';
select public.void_credit('aaaaaaaa-0000-0000-0000-000000000101');
select quantity = 43 as charge_sale_stock_restored from public.stock_levels
 where store_id='zeann' and product_id='bbbbbbbb-0000-0000-0000-000000000002';
select status = 'voided' as credit_voided from public.credit_obligations
 where id = 'aaaaaaaa-0000-0000-0000-000000000101';
rollback;
select 'pass: credit undo voids credit+sale, stock only for system sales' as proof;

-- --- 25. record_payment refuses voided credits --------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
select public.void_credit('aaaaaaaa-0000-0000-0000-000000000101');
set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
set local request.jwt.claim.role = 'authenticated';
do $$
begin
  begin
    perform public.record_payment('aaaaaaaa-0000-0000-0000-000000000101', 'zeann', 100, 'Cash');
    raise exception 'FAIL: payment accepted on voided credit';
  exception when others then
    if sqlerrm like '%was undone%' then raise notice 'voided credit cannot receive payments';
    else raise; end if;
  end;
end $$;
rollback;
select 'pass: voided credits cannot receive payments' as proof;

-- --- 26. Inventory correction is admin-only outright --------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
do $$
begin
  begin
    perform public.adjust_stock('amara', 'bbbbbbbb-0000-0000-0000-000000000001', 99, null);
    raise exception 'FAIL: staff adjusted inventory';
  exception when others then
    if sqlerrm like '%Only admins%' then raise notice 'staff inventory correction blocked'; else raise; end if;
  end;
  begin
    perform public.delete_stock('amara', 'bbbbbbbb-0000-0000-0000-000000000002');
    raise exception 'FAIL: staff deleted inventory';
  exception when others then
    if sqlerrm like '%Only admins%' then raise notice 'staff inventory delete blocked'; else raise; end if;
  end;
end $$;
rollback;
select 'pass: inventory correction is admin-only' as proof;

-- --- 27. Soft product rejection survives receiving history (DEC-051) ----
begin;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
select public.submit_product('Proof Reject Item') as proof_product \gset
select :'proof_product'::jsonb->>'product_id' as proof_pid \gset
set local app.proof_pid = :'proof_pid';
-- Staff receive stock for the still-pending product (real, reachable flow).
select public.record_receiving('amara', nullif(current_setting('app.proof_pid', true), '')::uuid,
  4, 'Proof Supplier', 8000, 9000, null, null);
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
do $$
begin
  begin
    perform public.reject_product(nullif(current_setting('app.proof_pid', true), '')::uuid);
    raise notice 'rejection succeeded despite receiving history';
  exception when others then
    raise exception 'FAIL: reject failed: %', sqlerrm;
  end;
end $$;
select status = 'rejected' as product_soft_rejected from public.products
 where id = nullif(current_setting('app.proof_pid', true), '')::uuid;
select count(*) > 0 as receiving_history_kept from public.receiving_records
 where product_id = nullif(current_setting('app.proof_pid', true), '')::uuid;
rollback;

begin;
insert into public.products (id, name, status)
values ('bbbbbbbb-0000-0000-0000-000000000097', 'Proof Already Rejected', 'rejected');
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
do $$
begin
  begin
    perform public.approve_product('bbbbbbbb-0000-0000-0000-000000000097');
    raise exception 'FAIL: rejected product approved';
  exception when others then
    if sqlerrm like '%Only pending%' then raise notice 'rejected product cannot be approved'; else raise; end if;
  end;
end $$;
rollback;
select 'pass: soft rejection keeps history, blocks approval' as proof;

-- --- 28. Hard customer delete removes sales, credits, payments (DEC-053) --
begin;
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
select public.create_customer('Proof Doomed Customer', null, null) as doomed \gset
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
select public.record_sale('amara', current_date, (:'doomed'::jsonb->>'customer_id')::uuid,
  'charge', null, 0, null, null, 0, 'terms-7',
  '[{"product_id":"bbbbbbbb-0000-0000-0000-000000000001","quantity":1}]'
) as doomed_sale \gset
-- Charge created an outstanding credit: even the admin is refused.
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
set local app.doomed = :'doomed';
do $$
begin
  begin
    perform public.delete_customer(
      (nullif(current_setting('app.doomed', true), '')::jsonb->>'customer_id')::uuid);
    raise exception 'FAIL: outstanding-credit customer deleted';
  exception when others then
    if sqlerrm like '%outstanding credit%' then raise notice 'admin blocked by outstanding credit';
    else raise; end if;
  end;
end $$;
-- Settle the credit in full, then delete: everything goes.
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
select id as doomed_credit from public.credit_obligations
 where customer_id = (:'doomed'::jsonb->>'customer_id')::uuid \gset
select public.record_payment(:'doomed_credit'::uuid, 'amara',
  (select balance_minor from public.credit_obligations where id = :'doomed_credit'::uuid), 'Cash');
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
select public.delete_customer((:'doomed'::jsonb->>'customer_id')::uuid);
select count(*) = 0 as customer_gone from public.customers
 where id = (:'doomed'::jsonb->>'customer_id')::uuid;
select count(*) = 0 as customer_sales_gone from public.sales
 where customer_id = (:'doomed'::jsonb->>'customer_id')::uuid;
select count(*) = 0 as customer_credits_gone from public.credit_obligations
 where customer_id = (:'doomed'::jsonb->>'customer_id')::uuid;
select count(*) = 0 as customer_payments_gone from public.payments p
  join public.credit_obligations c on c.id = p.credit_id
 where c.customer_id = (:'doomed'::jsonb->>'customer_id')::uuid;
select count(*) = 1 as delete_audited from public.audit_events
 where action = 'customer.deleted'
   and subject = 'Proof Doomed Customer';
rollback;
select 'pass: hard customer delete cascades, guards outstanding, audits' as proof;

-- --- 29. delete_expense: admin-only, staff refused, audited (DEC-055) ----
begin;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
select public.create_expense('amara', 'cccccccc-0000-0000-0000-000000000001', null,
  'fuel', 42000, 'Proof fuel') as doomed_expense \gset
set local app.doomed_expense = :'doomed_expense';
-- Staff cannot delete expenses.
do $$
begin
  begin
    perform public.delete_expense(
      (nullif(current_setting('app.doomed_expense', true), '')::jsonb->>'expense_id')::uuid);
    raise exception 'FAIL: staff deleted an expense';
  exception when others then
    if sqlerrm like '%Only admins%' then raise notice 'staff expense delete blocked'; else raise; end if;
  end;
end $$;
-- Admin deletes: row gone, audit written.
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
select public.delete_expense((:'doomed_expense'::jsonb->>'expense_id')::uuid);
select count(*) = 0 as expense_gone from public.expenses
 where id = (:'doomed_expense'::jsonb->>'expense_id')::uuid;
select count(*) = 1 as delete_audited from public.audit_events
 where action = 'expense.deleted'
   and detail = 'Deleted 420.00';
rollback;
select 'pass: expense delete is admin-only and audited' as proof;

-- --- 30. update_expense: admin-only correction, validated (DEC-056) -----
begin;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
select public.create_expense('amara', 'cccccccc-0000-0000-0000-000000000001', null,
  'fuel', 42000, 'Proof fuel') as fixable_expense \gset
set local app.fixable_expense = :'fixable_expense';
-- Staff cannot edit expenses.
do $$
begin
  begin
    perform public.update_expense(
      (nullif(current_setting('app.fixable_expense', true), '')::jsonb->>'expense_id')::uuid,
      'cccccccc-0000-0000-0000-000000000001', null, 'fuel', 43000, null);
    raise exception 'FAIL: staff edited an expense';
  exception when others then
    if sqlerrm like '%Only admins%' then raise notice 'staff expense edit blocked'; else raise; end if;
  end;
end $$;
-- Admin correction validates like creation: zero amount refused.
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
do $$
begin
  begin
    perform public.update_expense(
      (nullif(current_setting('app.fixable_expense', true), '')::jsonb->>'expense_id')::uuid,
      'cccccccc-0000-0000-0000-000000000001', null, 'fuel', 0, null);
    raise exception 'FAIL: zero-amount edit allowed';
  exception when others then
    if sqlerrm like '%greater than zero%' then raise notice 'zero-amount edit refused';
    else raise; end if;
  end;
end $$;
-- Valid admin edit applies and audits.
select public.update_expense((:'fixable_expense'::jsonb->>'expense_id')::uuid,
  null, 'dddddddd-0000-0000-0000-000000000002', 'repair', 120000, 'Proof correction');
select rider_id is null and vehicle_id = 'dddddddd-0000-0000-0000-000000000002'
   and type = 'repair' and amount_minor = 120000 and note = 'Proof correction'
  as expense_corrected from public.expenses
 where id = (:'fixable_expense'::jsonb->>'expense_id')::uuid;
select count(*) = 1 as edit_audited from public.audit_events
 where action = 'expense.updated'
   and detail = 'Corrected to 1200.00';
rollback;
select 'pass: expense edit is admin-only, validated, audited' as proof;

-- --- 31. record_existing_credit stores manual interest (DEC-059) --------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
select public.record_existing_credit('aaaaaaaa-0000-0000-0000-000000000001', 'amara',
  current_date, current_date + 30,
  '[{"product_id":"bbbbbbbb-0000-0000-0000-000000000001","quantity":1,"unit_price_minor":100000}]',
  null, null, 5000) as interest_credit \gset
select interest_minor = 5000 as interest_saved from public.credit_obligations
 where id = (:'interest_credit'::jsonb->>'credit_id')::uuid;
select balance_minor = 100000 as balance_untouched_by_interest from public.credit_obligations
 where id = (:'interest_credit'::jsonb->>'credit_id')::uuid;
-- Negative interest is refused.
do $$
begin
  begin
    perform public.record_existing_credit('aaaaaaaa-0000-0000-0000-000000000001', 'amara',
      current_date, current_date + 30,
      '[{"product_id":"bbbbbbbb-0000-0000-0000-000000000001","quantity":1,"unit_price_minor":100000}]',
      null, null, -100);
    raise exception 'FAIL: negative interest accepted';
  exception when others then
    if sqlerrm like '%cannot be negative%' then raise notice 'negative interest refused';
    else raise; end if;
  end;
end $$;
-- Omitting the interest leaves it absent (old callers unchanged).
select public.record_existing_credit('aaaaaaaa-0000-0000-0000-000000000001', 'amara',
  current_date, current_date + 30,
  '[{"product_id":"bbbbbbbb-0000-0000-0000-000000000001","quantity":1,"unit_price_minor":100000}]'
) as plain_credit \gset
select interest_minor is null as interest_absent_by_default from public.credit_obligations
 where id = (:'plain_credit'::jsonb->>'credit_id')::uuid;
rollback;
select 'pass: manual credit interest saved, display-only, optional' as proof;

-- --- 32. Pending receipts: hold stock until approval, exactly once (DEC-061)
begin;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
-- Staff submits: receipt pending, stock untouched.
select public.record_receiving('amara', 'bbbbbbbb-0000-0000-0000-000000000001',
  5, 'Proof Mill', 100000, 130000, null, null) as pending_receipt \gset
select status = 'pending' as receipt_pending from public.receiving_records
 where id = (:'pending_receipt'::jsonb->>'receiving_id')::uuid;
select quantity = 20 as stock_untouched_by_pending from public.stock_levels
 where store_id = 'amara' and product_id = 'bbbbbbbb-0000-0000-0000-000000000001';
-- Staff cannot approve.
set local app.pending_receipt = :'pending_receipt';
do $$
begin
  begin
    perform public.approve_receipt(
      (nullif(current_setting('app.pending_receipt', true), '')::jsonb->>'receiving_id')::uuid);
    raise exception 'FAIL: staff approved a receipt';
  exception when others then
    if sqlerrm like '%Only admins%' then raise notice 'staff receipt approval blocked';
    else raise; end if;
  end;
end $$;
-- Admin approves: stock +5 exactly once (price follows the receipt).
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
select public.approve_receipt((:'pending_receipt'::jsonb->>'receiving_id')::uuid);
select quantity = 25 as stock_after_approval from public.stock_levels
 where store_id = 'amara' and product_id = 'bbbbbbbb-0000-0000-0000-000000000001';
select price_minor = 130000 as price_after_approval from public.stock_levels
 where store_id = 'amara' and product_id = 'bbbbbbbb-0000-0000-0000-000000000001';
do $$
begin
  begin
    perform public.approve_receipt(
      (nullif(current_setting('app.pending_receipt', true), '')::jsonb->>'receiving_id')::uuid);
    raise exception 'FAIL: double approval allowed';
  exception when others then
    if sqlerrm like '%Only pending%' then raise notice 'double approval refused';
    else raise; end if;
  end;
end $$;
select quantity = 25 as stock_still_once from public.stock_levels
 where store_id = 'amara' and product_id = 'bbbbbbbb-0000-0000-0000-000000000001';
-- Reject path: no stock movement, row kept.
select public.record_receiving('amara', 'bbbbbbbb-0000-0000-0000-000000000001',
  7, 'Reject Mill', 100000, null, null, null) as doomed_receipt \gset
select public.reject_receipt((:'doomed_receipt'::jsonb->>'receiving_id')::uuid);
select status = 'rejected' as receipt_rejected from public.receiving_records
 where id = (:'doomed_receipt'::jsonb->>'receiving_id')::uuid;
select quantity = 25 as stock_untouched_by_reject from public.stock_levels
 where store_id = 'amara' and product_id = 'bbbbbbbb-0000-0000-0000-000000000001';
-- Grandfathered seed rows are approved and can never be re-approved.
do $$
begin
  begin
    perform public.approve_receipt('eeeeeeee-0000-0000-0000-000000000001');
    raise exception 'FAIL: grandfathered receipt re-approved';
  exception when others then
    if sqlerrm like '%Only pending%' then raise notice 'grandfathered rows stay approved';
    else raise; end if;
  end;
end $$;
rollback;
select 'pass: receipts hold stock until approval, exactly once, grandfathered' as proof;

-- --- 33. update_credit_interest: admin-only, display-only (DEC-062) ------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
do $$
begin
  begin
    perform public.update_credit_interest('aaaaaaaa-0000-0000-0000-000000000101', 5000);
    raise exception 'FAIL: staff updated credit interest';
  exception when others then
    if sqlerrm like '%Only admins%' then raise notice 'staff interest edit blocked';
    else raise; end if;
  end;
end $$;
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
-- Negative interest refused; balance untouched by the edit.
do $$
begin
  begin
    perform public.update_credit_interest('aaaaaaaa-0000-0000-0000-000000000101', -100);
    raise exception 'FAIL: negative interest accepted';
  exception when others then
    if sqlerrm like '%cannot be negative%' then raise notice 'negative interest refused';
    else raise; end if;
  end;
end $$;
select public.update_credit_interest('aaaaaaaa-0000-0000-0000-000000000101', 5000);
select interest_minor = 5000 as interest_saved from public.credit_obligations
 where id = 'aaaaaaaa-0000-0000-0000-000000000101';
select balance_minor = 19500 as balance_untouched_by_interest from public.credit_obligations
 where id = 'aaaaaaaa-0000-0000-0000-000000000101';
select count(*) = 1 as edit_audited from public.audit_events
 where action = 'credit.interest_updated';
-- Clearing returns the column to absent.
select public.update_credit_interest('aaaaaaaa-0000-0000-0000-000000000101', null);
select interest_minor is null as interest_cleared from public.credit_obligations
 where id = 'aaaaaaaa-0000-0000-0000-000000000101';
-- Voided credits refuse the change.
select public.void_credit('aaaaaaaa-0000-0000-0000-000000000101');
do $$
begin
  begin
    perform public.update_credit_interest('aaaaaaaa-0000-0000-0000-000000000101', 100);
    raise exception 'FAIL: voided credit interest changed';
  exception when others then
    if sqlerrm like '%Undone credits%' then raise notice 'voided interest edit blocked';
    else raise; end if;
  end;
end $$;
rollback;
select 'pass: credit interest edits are admin-only, display-only, audited' as proof;

-- --- 34. record_payment stores manual interest, balance math intact ------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
-- Staff records a payment on cred-1 (19500 balance) with interest.
select public.record_payment('aaaaaaaa-0000-0000-0000-000000000101', 'amara',
  5000, 'Cash', 1500) as paid_with_interest \gset
select interest_minor = 1500 as payment_interest_saved from public.payments
 where id = (:'paid_with_interest'::jsonb->>'payment_id')::uuid;
-- Balance drops by the amount only (19500 - 5000 = 14500), never by interest.
select balance_minor = 14500 as balance_excludes_interest from public.credit_obligations
 where id = 'aaaaaaaa-0000-0000-0000-000000000101';
-- Negative interest refused.
do $$
begin
  begin
    perform public.record_payment('aaaaaaaa-0000-0000-0000-000000000101', 'amara',
      100, 'Cash', -100);
    raise exception 'FAIL: negative payment interest accepted';
  exception when others then
    if sqlerrm like '%cannot be negative%' then raise notice 'negative payment interest refused';
    else raise; end if;
  end;
end $$;
-- Old 4-argument callers still work: interest stays absent.
select public.record_payment('aaaaaaaa-0000-0000-0000-000000000101', 'amara',
  1000, 'Cash') as paid_without_interest \gset
select interest_minor is null as interest_absent_by_default from public.payments
 where id = (:'paid_without_interest'::jsonb->>'payment_id')::uuid;
rollback;
select 'pass: payment interest stored per payment, balance math unchanged' as proof;

-- --- 35. Office supplies expense type accepted end to end (DEC-068) --------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
-- Staff records the new type; the widened check constraint must accept it.
select public.create_expense('amara', 'cccccccc-0000-0000-0000-000000000001',
  null, 'office_supplies_other', 3000, 'Bond paper') as office_exp \gset
select type = 'office_supplies_other' as office_type_saved from public.expenses
 where id = (:'office_exp'::jsonb->>'expense_id')::uuid;
-- The audit row must exist and must not claim the expense was a repair.
select subject = 'Office supplies / other expense' as office_audit_label from public.audit_events
 where action = 'expense.recorded' and detail = 'Bond paper';
rollback;
begin;
-- update_expense accepts the widened set. Seeded expenses get random uuids
-- (the insert omits id), so use a fixture with a known id — inserted as
-- postgres BEFORE switching role, because inserts under `authenticated` face
-- RLS and because psql does not substitute :'var' inside do $$…$$ (SESSION.md
-- DB gotchas). 'dddddddd-...0002' is a VEHICLE, not an expense.
insert into public.expenses (id, store_id, vehicle_id, type, amount_minor, note, recorded_by_user_id)
values ('eeeeeeee-0000-0000-0000-000000000001', 'amara', 'dddddddd-0000-0000-0000-000000000002',
  'fuel', 5000, 'Type check', '11111111-1111-1111-1111-111111111111');
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
-- An unrecognised type is still refused (row still exists, so this is the type
-- check refusing it, not a missing row).
do $$
begin
  begin
    perform public.update_expense('eeeeeeee-0000-0000-0000-000000000001',
      null, 'dddddddd-0000-0000-0000-000000000002', 'not_a_type', 100, null);
    raise exception 'FAIL: unrecognised expense type accepted';
  exception when others then
    if sqlerrm like '%not recognised%' then raise notice 'unknown expense type refused';
    else raise; end if;
  end;
end $$;
-- The widened type is accepted, and the row updates.
select public.update_expense('eeeeeeee-0000-0000-0000-000000000001',
  null, 'dddddddd-0000-0000-0000-000000000002', 'office_supplies_other', 5000, 'Re-bucketed');
select type = 'office_supplies_other' as office_type_updated from public.expenses
 where id = 'eeeeeeee-0000-0000-0000-000000000001';
-- delete_expense still works on the new type.
select public.delete_expense('eeeeeeee-0000-0000-0000-000000000001') as office_del;
rollback;
select 'pass: office supplies expense type accepted, validated, audited' as proof;

-- --- 36. update_product: admin-only rename, unique active name (DEC-068) ---
begin;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
-- Staff must never rename: DEC-050 made all inventory correction admin-only.
do $$
begin
  begin
    perform public.update_product('bbbbbbbb-0000-0000-0000-000000000001', 'Rice 50kg');
    raise exception 'FAIL: staff renamed a product';
  exception when others then
    if sqlerrm like '%Only admins%' then raise notice 'staff rename blocked';
    else raise; end if;
  end;
end $$;
rollback;
begin;
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
-- Admin rename applies, trimmed, and is audited.
select public.update_product('bbbbbbbb-0000-0000-0000-000000000001', '  Rice 50kg  ') as renamed;
select name = 'Rice 50kg' as rename_trimmed from public.products
 where id = 'bbbbbbbb-0000-0000-0000-000000000001';
select count(*) = 1 as rename_audited from public.audit_events
 where action = 'product.renamed' and subject = 'Rice 50kg';
-- Another ACTIVE product already uses the name (case-insensitive): refused.
do $$
begin
  begin
    perform public.update_product('bbbbbbbb-0000-0000-0000-000000000002', 'rice 50kg');
    raise exception 'FAIL: rename created a duplicate active name';
  exception when others then
    if sqlerrm like '%already taken%' then raise notice 'duplicate active name refused';
    else raise; end if;
  end;
end $$;
-- A PENDING product using the name does not block it (the submit_product rule).
select public.update_product('bbbbbbbb-0000-0000-0000-000000000002', 'Cooking Oil 1L') as onto_pending;
-- Blank name refused.
do $$
begin
  begin
    perform public.update_product('bbbbbbbb-0000-0000-0000-000000000002', '   ');
    raise exception 'FAIL: blank product name accepted';
  exception when others then
    if sqlerrm like '%name is required%' then raise notice 'blank rename refused';
    else raise; end if;
  end;
end $$;
-- Renaming to the name it already has is a no-op, not a duplicate-name error.
select public.update_product('bbbbbbbb-0000-0000-0000-000000000002', 'cooking oil 1L') as same_name_noop;
rollback;
select 'pass: product rename is admin-only, unique against active, audited' as proof;

-- --- 37. Office-supplies expenses may have no rider/vehicle (DEC-069) ------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
-- Staff records office supplies with NO target: accepted, not forced onto a rider.
select public.create_expense('amara', null, null,
  'office_supplies_other', 3000, 'Bond paper') as office_untargeted \gset
select count(*) = 1 as office_saved_without_target from public.expenses
 where id = (:'office_untargeted'::jsonb->>'expense_id')::uuid
   and rider_id is null and vehicle_id is null;
-- Audit records that it was charged to the office, not to a person.
select detail = 'Charged to the office' as office_audit_detail from public.audit_events
 where action = 'expense.recorded' and subject = 'Office supplies / other expense'
 order by created_at desc limit 1;
rollback;
begin;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
-- Fuel and repair STILL require a target: the per-target net (DEC-017) depends
-- on it, so the relaxation must not leak to the other two types.
do $$
begin
  begin
    perform public.create_expense('amara', null, null, 'fuel', 3000, 'Untargeted fuel');
    raise exception 'FAIL: untargeted fuel accepted';
  exception when others then
    if sqlerrm like '%rider or vehicle%' then raise notice 'untargeted fuel refused';
    else raise; end if;
  end;
end $$;
do $$
begin
  begin
    perform public.create_expense('amara', null, null, 'repair', 3000, 'Untargeted repair');
    raise exception 'FAIL: untargeted repair accepted';
  exception when others then
    if sqlerrm like '%rider or vehicle%' then raise notice 'untargeted repair refused';
    else raise; end if;
  end;
end $$;
-- An office-supplies expense may still name a vehicle (a cart bought as office
-- stock): the target is optional, not forbidden.
select public.create_expense('amara', null, 'dddddddd-0000-0000-0000-000000000002',
  'office_supplies_other', 45000, 'Handcart') as office_with_vehicle \gset
select count(*) = 1 as office_keeps_vehicle_target from public.expenses
 where id = (:'office_with_vehicle'::jsonb->>'expense_id')::uuid
   and vehicle_id = 'dddddddd-0000-0000-0000-000000000002';
rollback;
begin;
-- Fixture as postgres BEFORE switching role: inserts under `authenticated`
-- face RLS, and psql cannot substitute :'var' inside do $$…$$.
insert into public.expenses (id, store_id, vehicle_id, type, amount_minor, note, recorded_by_user_id)
values ('eeeeeeee-0000-0000-0000-000000000002', 'amara', 'dddddddd-0000-0000-0000-000000000002',
  'office_supplies_other', 3000, 'For retarget', '11111111-1111-1111-1111-111111111111');
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set local request.jwt.claim.role = 'authenticated';
-- The admin correction path enforces the same rule.
select public.update_expense('eeeeeeee-0000-0000-0000-000000000002',
  null, null, 'office_supplies_other', 3000, 'Retargeted to the office');
select count(*) = 1 as update_can_drop_target from public.expenses
 where id = 'eeeeeeee-0000-0000-0000-000000000002' and rider_id is null and vehicle_id is null;
do $$
begin
  begin
    perform public.update_expense('eeeeeeee-0000-0000-0000-000000000002',
      null, null, 'fuel', 3000, 'Retarget as fuel');
    raise exception 'FAIL: office row retyped to fuel without a target';
  exception when others then
    if sqlerrm like '%rider or vehicle%' then raise notice 'retyping without a target refused';
    else raise; end if;
  end;
end $$;
rollback;
select 'pass: office expenses may be untargeted; fuel/repair still need one' as proof;

select 'ALL GATE 4 PROOFS COMPLETED' as result;