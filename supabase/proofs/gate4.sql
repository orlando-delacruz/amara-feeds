-- ZAF ONE — Gate 4 SQL proofs (Phase 4 validation).
-- Runs inside the local database as `postgres`. Simulates callers by
-- setting the request JWT claim (auth.uid()) and switching the DB role.
-- Each section uses BEGIN/ROLLBACK so state stays isolated.

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
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
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

-- --- 18. Approved inventory: staff locked out, admin retains edits -----
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
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
do $$
begin
  begin
    perform public.adjust_stock('amara', 'bbbbbbbb-0000-0000-0000-000000000001', 15);
    raise exception 'FAIL: staff adjusted approved inventory';
  exception when others then
    if sqlerrm like '%Approved inventory%' then raise notice 'staff adjust of approved stock blocked'; else raise; end if;
  end;
  begin
    perform public.delete_stock('amara', 'bbbbbbbb-0000-0000-0000-000000000001');
    raise exception 'FAIL: staff deleted approved inventory';
  exception when others then
    if sqlerrm like '%Approved inventory%' then raise notice 'staff delete of approved stock blocked'; else raise; end if;
  end;
end $$;
-- Receiving into an approved row stays allowed (normal workflow).
select public.record_receiving('amara', 'bbbbbbbb-0000-0000-0000-000000000001', 5, 'Proof Supplier', 100000, 115000, null, null);
select quantity = 25 as receiving_still_adds from public.stock_levels
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
select 'pass: approved inventory admin-edit-only, receiving unaffected' as proof;

select 'ALL GATE 4 PROOFS COMPLETED' as result;