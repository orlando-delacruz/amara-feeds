-- ZAF ONE — 00010: Admin-only correction (bank-style void/reversal, DEC-050)
--
-- Staff encode transactions; only Admin corrects them. Corrections are
-- reversals, not deletions: voided rows stay in the database for traceability
-- and are excluded everywhere users see data.
--
-- 1. `sales.is_voided` / `payments.is_voided` (default false — existing rows
--    unaffected) and credit status gains 'voided' (existing 'outstanding'/
--    'settled' rows untouched).
-- 2. void_sale (admin-only) replaces delete_sale: marks the sale voided,
--    restores its deducted stock ONCE, voids the linked credit and its
--    payments. Re-void is refused — no duplicate stock restoration.
-- 3. void_credit (admin-only): voids the credit, its payments, and its
--    underlying sale; restores stock for charge-sale credits. Encoded legacy
--    credits never touched stock, so undoing them has no inventory effect.
-- 4. adjust_stock / delete_stock become admin-only outright (the permission
--    table supersedes DEC-032's staff carve-out; the approval flag remains
--    admin bookkeeping). Staff keep receiving stock via the normal workflow.
-- 5. record_payment refuses voided credits.

-- ---------------------------------------------------------------------------
-- 1. Void flags + credit status vocabulary
-- ---------------------------------------------------------------------------

alter table public.sales
  add column is_voided boolean not null default false;

alter table public.payments
  add column is_voided boolean not null default false;

alter table public.credit_obligations
  drop constraint credit_obligations_status_check;

alter table public.credit_obligations
  add constraint credit_obligations_status_check
  check (status in ('outstanding', 'settled', 'voided'));

-- ---------------------------------------------------------------------------
-- 2. void_sale — admin-only reversible correction of a saved sale
-- ---------------------------------------------------------------------------

create or replace function public.void_sale(p_sale_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  sale public.sales;
  line record;
begin
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();
  if caller.role <> 'admin' then
    raise exception 'Only admins can undo a sale.' using errcode = 'P0001';
  end if;
  select * into sale from public.sales where id = p_sale_id;
  if sale.id is null then
    raise exception 'Sale not found.' using errcode = 'P0001';
  end if;
  if sale.is_legacy then
    raise exception 'Encoded credits are undone in Credit, not Sales.' using errcode = 'P0001';
  end if;
  if sale.is_voided then
    raise exception 'This sale was already undone.' using errcode = 'P0001';
  end if;

  -- Reverse the inventory effect exactly once.
  for line in
    select product_id, quantity from public.sale_lines where sale_id = p_sale_id
  loop
    update public.stock_levels
       set quantity = quantity + line.quantity
     where store_id = sale.store_id and product_id = line.product_id;
  end loop;

  update public.sales set is_voided = true where id = p_sale_id;

  -- Void the linked credit and its payment history (rows stay for audit;
  -- every listing and summary excludes voided rows).
  update public.credit_obligations
     set status = 'voided'
   where sale_id = p_sale_id
     and status <> 'voided';
  update public.payments p
     set is_voided = true
   from public.credit_obligations c
   where c.id = p.credit_id
     and c.sale_id = p_sale_id
     and not p.is_voided;

  insert into public.audit_events (action, actor_user_id, store_id, subject, detail)
  values ('sale.voided', caller.id, sale.store_id,
    case when sale.store_id = 'amara' then 'Sale at Amara' else 'Sale at Zeann' end,
    to_char(sale.total_minor / 100.0, 'FM999999990.00') || ' · transaction corrected, stock restored');

  return jsonb_build_object('sale_id', p_sale_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. void_credit — admin-only undo of a saved credit (and its sale)
-- ---------------------------------------------------------------------------

create or replace function public.void_credit(p_credit_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  credit public.credit_obligations;
  credit_sale public.sales;
  line record;
begin
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();
  if caller.role <> 'admin' then
    raise exception 'Only admins can undo a credit.' using errcode = 'P0001';
  end if;
  select * into credit from public.credit_obligations where id = p_credit_id;
  if credit.id is null then
    raise exception 'Credit not found.' using errcode = 'P0001';
  end if;
  if credit.status = 'voided' then
    raise exception 'This credit was already undone.' using errcode = 'P0001';
  end if;

  -- Void this credit's payment history (kept, excluded everywhere).
  update public.payments
     set is_voided = true
   where credit_id = p_credit_id
     and not is_voided;

  update public.credit_obligations
     set status = 'voided'
   where id = p_credit_id;

  -- Void the underlying sale too; only system sales restore stock — encoded
  -- legacy credits never touched inventory, so undoing them does not either.
  select * into credit_sale from public.sales where id = credit.sale_id;
  if credit_sale.id is not null then
    if not credit_sale.is_legacy and not credit_sale.is_voided then
      for line in
        select product_id, quantity from public.sale_lines where sale_id = credit_sale.id
      loop
        update public.stock_levels
           set quantity = quantity + line.quantity
         where store_id = credit_sale.store_id and product_id = line.product_id;
      end loop;
    end if;
    update public.sales set is_voided = true where id = credit_sale.id;
  end if;

  insert into public.audit_events (action, actor_user_id, store_id, subject, detail)
  values ('credit.voided', caller.id, credit.origin_store_id,
    coalesce((select name from public.customers where id = credit.customer_id), 'Customer'),
    to_char(credit.original_amount_minor / 100.0, 'FM999999990.00') || ' · credit record undone');

  return jsonb_build_object('credit_id', p_credit_id);
end;
$$;

drop function if exists public.delete_sale(uuid);

-- ---------------------------------------------------------------------------
-- 4. record_payment: refuse voided credits; voided rows can never be paid
-- ---------------------------------------------------------------------------

create or replace function public.record_payment(
  p_credit_id uuid,
  p_store_id text,
  p_amount_minor integer,
  p_method text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  credit public.credit_obligations;
  pay_id uuid;
  new_balance integer;
  new_status text;
begin
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();
  -- Payments may be recorded through either store; caller just needs to be active.

  select * into credit from public.credit_obligations where id = p_credit_id;
  if credit.id is null then
    raise exception 'Credit not found.' using errcode = 'P0001';
  end if;
  if credit.status = 'voided' then
    raise exception 'This credit record was undone and cannot receive payments.' using errcode = 'P0001';
  end if;
  if credit.status = 'settled' then
    raise exception 'This credit is already settled.' using errcode = 'P0001';
  end if;
  if p_amount_minor <= 0 then
    raise exception 'Payment amount must be greater than zero.' using errcode = 'P0001';
  end if;
  if p_method is not null and length(btrim(p_method)) = 0 then
    raise exception 'Payment method is required.' using errcode = 'P0001';
  end if;

  -- Guarded atomic decrement: the balance predicate is re-checked against
  -- the current row value under the row lock, so two concurrent payments
  -- can never both pass (the stale pre-read only yields the friendly error).
  update public.credit_obligations
     set balance_minor = balance_minor - p_amount_minor,
         status = case
           when balance_minor - p_amount_minor = 0 then 'settled'
           else 'outstanding'
         end
   where id = p_credit_id
     and status = 'outstanding'
     and balance_minor >= p_amount_minor
  returning balance_minor, status into new_balance, new_status;
  if new_balance is null then
    raise exception 'Payment cannot exceed the remaining balance.' using errcode = 'P0001';
  end if;

  insert into public.payments (credit_id, store_id, amount_minor, method, recorded_by_user_id)
  values (
    p_credit_id, p_store_id, p_amount_minor,
    case when p_method is null then null else btrim(p_method) end,
    caller.id
  ) returning id into pay_id;

  insert into public.audit_events (action, actor_user_id, store_id, subject, detail)
  values ('payment.recorded', caller.id, p_store_id,
    case when p_store_id = 'amara' then 'Payment at Amara' else 'Payment at Zeann' end,
    'Via ' || coalesce(btrim(p_method), 'unspecified'));

  return jsonb_build_object(
    'payment_id', pay_id,
    'credit_id', credit.id,
    'balance_minor', new_balance,
    'status', new_status
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. adjust_stock / delete_stock: admin-only correction (supersedes the
--    DEC-032 staff carve-out per the client permission table)
-- ---------------------------------------------------------------------------

create or replace function public.adjust_stock(
  p_store_id text,
  p_product_id uuid,
  p_quantity integer,
  p_price_minor integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  prev integer := 0;
  product_name text;
begin
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();
  if caller.role <> 'admin' then
    raise exception 'Only admins can correct inventory.' using errcode = 'P0001';
  end if;
  if p_quantity < 0 then
    raise exception 'Quantity must be a whole number of 0 or more.' using errcode = 'P0001';
  end if;
  if p_price_minor is not null and p_price_minor < 0 then
    raise exception 'Price cannot be negative.' using errcode = 'P0001';
  end if;

  select quantity into prev
    from public.stock_levels
   where store_id = p_store_id and product_id = p_product_id;

  insert into public.stock_levels (store_id, product_id, quantity, price_minor)
  values (p_store_id, p_product_id, p_quantity, p_price_minor)
  on conflict (store_id, product_id)
  do update set quantity = excluded.quantity,
                price_minor = coalesce(excluded.price_minor, public.stock_levels.price_minor);

  select coalesce(name, 'Item') into product_name from public.products where id = p_product_id;
  insert into public.audit_events (action, actor_user_id, store_id, subject, detail)
  values ('stock.updated', caller.id, p_store_id, product_name,
    'Adjusted from ' || coalesce(prev, 0)::text || ' to ' || p_quantity::text
    || case when p_price_minor is not null
         then ' · price set to ' || to_char(p_price_minor / 100.0, 'FM999999990.00')
         else '' end);

  return jsonb_build_object('product_id', p_product_id, 'quantity', p_quantity,
    'price_minor', p_price_minor);
end;
$$;

create or replace function public.delete_stock(
  p_store_id text,
  p_product_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  removed integer;
  product_name text;
begin
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();
  if caller.role <> 'admin' then
    raise exception 'Only admins can correct inventory.' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.stock_levels sl
    where sl.store_id = p_store_id and sl.product_id = p_product_id) then
    raise exception 'Stock not found.' using errcode = 'P0001';
  end if;

  -- Sales-history guard (DEC-032): a product sold at this store cannot be
  -- deleted; quantity to 0 instead.
  if exists (
    select 1 from public.sale_lines sl
    join public.sales s on s.id = sl.sale_id
    where s.store_id = p_store_id and sl.product_id = p_product_id
      and not s.is_voided
  ) then
    raise exception 'This item already has sales at this store. Set the quantity to 0 instead.' using errcode = 'P0001';
  end if;

  select quantity into removed from public.stock_levels
   where store_id = p_store_id and product_id = p_product_id;

  delete from public.stock_levels
   where store_id = p_store_id and product_id = p_product_id;

  select coalesce(name, 'Item') into product_name from public.products where id = p_product_id;
  insert into public.audit_events (action, actor_user_id, store_id, subject, detail)
  values ('stock.deleted', caller.id, p_store_id, product_name,
    'Removed with ' || removed::text || ' on hand');

  return jsonb_build_object('product_id', p_product_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants (house pattern)
-- ---------------------------------------------------------------------------

revoke all on function public.void_sale(uuid) from public, anon;
grant execute on function public.void_sale(uuid) to authenticated;
revoke all on function public.void_credit(uuid) from public, anon;
grant execute on function public.void_credit(uuid) to authenticated;
revoke all on function public.record_payment(uuid, text, integer, text) from public, anon;
grant execute on function public.record_payment(uuid, text, integer, text) to authenticated;
revoke all on function public.adjust_stock(text, uuid, integer, integer) from public, anon;
grant execute on function public.adjust_stock(text, uuid, integer, integer) to authenticated;
revoke all on function public.delete_stock(text, uuid) from public, anon;
grant execute on function public.delete_stock(text, uuid) to authenticated;
