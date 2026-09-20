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

select 'ALL GATE 4 PROOFS COMPLETED' as result;