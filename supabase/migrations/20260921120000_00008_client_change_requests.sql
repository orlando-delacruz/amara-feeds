-- ZAF ONE — 00008: Client change requests (existing credit, approved inventory)
--
-- 1. Existing credit migration: admins can encode a customer's pre-system
--    credit balance. The balance becomes a credit obligation with no sale,
--    no terms, and no stock/receiving effect — stock only ever moves through
--    the normal sale/receiving flows. `terms_id` becomes nullable for these
--    legacy credits (charge-sale credits keep their terms); `due_date` stays
--    required and is supplied by the admin at encoding time. All existing
--    rows keep their terms — purely additive.
-- 2. Approved inventory (client change, amends DEC-032): a stock row can be
--    admin-approved; approved rows refuse staff adjust/delete while admins
--    keep full edit rights. Existing rows default to NOT approved, so current
--    behavior (staff may correct their store's stock) is preserved until an
--    admin approves a row. Receiving into an approved row stays allowed —
--    receiving is the normal workflow, not a manual edit.

-- ---------------------------------------------------------------------------
-- 1. Legacy credits carry no terms (existing rows are untouched)
-- ---------------------------------------------------------------------------

alter table public.credit_obligations
  alter column terms_id drop not null;

-- ---------------------------------------------------------------------------
-- 2. Approved-inventory lock flag (existing rows start unapproved)
-- ---------------------------------------------------------------------------

alter table public.stock_levels
  add column admin_approved boolean not null default false;

-- ---------------------------------------------------------------------------
-- Admin-only: encode an existing credit balance (no stock effect)
-- ---------------------------------------------------------------------------

create or replace function public.create_existing_credit(
  p_customer_id uuid,
  p_store_id text,
  p_amount_minor integer,
  p_due_date date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  cid uuid;
  cust_name text;
begin
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();
  if caller.role <> 'admin' then
    raise exception 'Only admins can encode existing credit.' using errcode = 'P0001';
  end if;
  if p_store_id is null or not exists (
    select 1 from public.stores where id = p_store_id
  ) then
    raise exception 'Unknown store.' using errcode = 'P0001';
  end if;
  if p_amount_minor is null or p_amount_minor <= 0 then
    raise exception 'Credit amount must be greater than zero.' using errcode = 'P0001';
  end if;
  if p_due_date is null then
    raise exception 'A due date is required.' using errcode = 'P0001';
  end if;
  select name into cust_name from public.customers where id = p_customer_id;
  if cust_name is null then
    raise exception 'Customer not found.' using errcode = 'P0001';
  end if;

  -- Balance-only obligation: no sale, no lines, no stock, no receiving.
  insert into public.credit_obligations (
    customer_id, origin_store_id, sale_id, terms_id, due_date,
    original_amount_minor, balance_minor, status
  ) values (
    p_customer_id, p_store_id, null, null, p_due_date,
    p_amount_minor, p_amount_minor, 'outstanding'
  ) returning id into cid;

  insert into public.audit_events (action, actor_user_id, store_id, subject, detail)
  values ('credit.imported', caller.id, p_store_id, cust_name,
    'Existing balance · ' || to_char(p_amount_minor / 100.0, 'FM999999990.00'));

  return jsonb_build_object('credit_id', cid);
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin-only: approve a stock row (locks staff manual edits)
-- ---------------------------------------------------------------------------

create or replace function public.approve_stock(
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
  product_name text;
begin
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();
  if caller.role <> 'admin' then
    raise exception 'Only admins can approve inventory.' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.stock_levels
    where store_id = p_store_id and product_id = p_product_id
  ) then
    raise exception 'Stock not found.' using errcode = 'P0001';
  end if;

  -- Idempotent: approving an approved row is a no-op.
  update public.stock_levels
     set admin_approved = true
   where store_id = p_store_id
     and product_id = p_product_id
     and not admin_approved;

  if found then
    select coalesce(name, 'Item') into product_name from public.products where id = p_product_id;
    insert into public.audit_events (action, actor_user_id, store_id, subject, detail)
    values ('stock.approved', caller.id, p_store_id, product_name,
      'Inventory approved — staff edits locked');
  end if;

  return jsonb_build_object('store_id', p_store_id, 'product_id', p_product_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- adjust_stock / delete_stock: staff refused on admin-approved rows
-- ---------------------------------------------------------------------------

create or replace function public.adjust_stock(
  p_store_id text,
  p_product_id uuid,
  p_quantity integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  prev integer := 0;
  prev_approved boolean := false;
  product_name text;
begin
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();
  if caller.role <> 'admin' and caller.store_id <> p_store_id then
    raise exception 'Not permitted for this store.' using errcode = 'P0001';
  end if;
  if p_quantity < 0 then
    raise exception 'Quantity must be a whole number of 0 or more.' using errcode = 'P0001';
  end if;

  select quantity, admin_approved into prev, prev_approved
    from public.stock_levels
   where store_id = p_store_id and product_id = p_product_id;

  -- Approved inventory is admin-edit-only (client change, amends DEC-032).
  if found and prev_approved and caller.role <> 'admin' then
    raise exception 'Approved inventory can only be changed by an admin.' using errcode = 'P0001';
  end if;

  insert into public.stock_levels (store_id, product_id, quantity)
  values (p_store_id, p_product_id, p_quantity)
  on conflict (store_id, product_id)
  do update set quantity = excluded.quantity;

  select coalesce(name, 'Item') into product_name from public.products where id = p_product_id;
  insert into public.audit_events (action, actor_user_id, store_id, subject, detail)
  values ('stock.updated', caller.id, p_store_id, product_name,
    'Adjusted from ' || coalesce(prev, 0)::text || ' to ' || p_quantity::text);

  return jsonb_build_object('product_id', p_product_id, 'quantity', p_quantity);
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
  row_approved boolean := false;
  product_name text;
begin
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();
  if caller.role <> 'admin' and caller.store_id <> p_store_id then
    raise exception 'Not permitted for this store.' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.stock_levels sl
    where sl.store_id = p_store_id and sl.product_id = p_product_id) then
    raise exception 'Stock not found.' using errcode = 'P0001';
  end if;

  select admin_approved into row_approved
    from public.stock_levels
   where store_id = p_store_id and product_id = p_product_id;

  -- Approved inventory is admin-edit-only (client change, amends DEC-032).
  if row_approved and caller.role <> 'admin' then
    raise exception 'Approved inventory can only be changed by an admin.' using errcode = 'P0001';
  end if;

  -- Sales-history guard (DEC-032): a product sold at this store cannot be
  -- deleted; quantity to 0 instead.
  if exists (
    select 1 from public.sale_lines sl
    join public.sales s on s.id = sl.sale_id
    where s.store_id = p_store_id and sl.product_id = p_product_id
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
-- Grants: new functions follow the house pattern — never PUBLIC/anon.
-- (create or replace preserves existing ACLs, so re-granting is harmless.)
-- ---------------------------------------------------------------------------

revoke all on function public.create_existing_credit(uuid, text, integer, date) from public, anon;
grant execute on function public.create_existing_credit(uuid, text, integer, date) to authenticated;
revoke all on function public.approve_stock(text, uuid) from public, anon;
grant execute on function public.approve_stock(text, uuid) to authenticated;
revoke all on function public.adjust_stock(text, uuid, integer) from public, anon;
grant execute on function public.adjust_stock(text, uuid, integer) to authenticated;
revoke all on function public.delete_stock(text, uuid) from public, anon;
grant execute on function public.delete_stock(text, uuid) to authenticated;
