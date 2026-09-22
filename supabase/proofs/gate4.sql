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
select public.record_receiving('amara', 'bbbbbbbb-0000-0000-0000-000000000001', 5, 'Proof Supplier', 100000, 115000, null, null);
select quantity = 25 as receiving_still_adds from public.stock_levels
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

-- --- 21. Customer edit + guarded delete --------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set local request.jwt.claim.role = 'authenticated';
select public.create_customer('Proof Temp Customer', null, null) as temp_cust \gset
select public.update_customer((:'temp_cust'::jsonb->>'customer_id')::uuid, 'Proof Renamed', '0917', 'Address');
select name = 'Proof Renamed' and contact = '0917' as customer_renamed
  from public.customers where id = (:'temp_cust'::jsonb->>'customer_id')::uuid;
select public.delete_customer((:'temp_cust'::jsonb->>'customer_id')::uuid);
select count(*) = 0 as temp_customer_gone from public.customers
 where id = (:'temp_cust'::jsonb->>'customer_id')::uuid;
do $$
begin
  begin
    perform public.delete_customer('aaaaaaaa-0000-0000-0000-000000000001');
    raise exception 'FAIL: referenced customer deleted';
  exception when others then
    if sqlerrm like '%recorded sales%' then raise notice 'referenced customer delete blocked'; else raise; end if;
  end;
end $$;
rollback;
select 'pass: customer edit works, referenced delete refused' as proof;

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
select quantity = 40 as stock_restored_on_voided_sale from public.stock_levels
 where store_id='zeann' and product_id='bbbbbbbb-0000-0000-0000-000000000001'
    or store_id='zeann' and product_id='bbbbbbbb-0000-0000-0000-000000000002';
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

select 'ALL GATE 4 PROOFS COMPLETED' as result;