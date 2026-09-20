-- ZAF ONE — 00003: Atomic business operations
--
-- These are the Phase 5 enforcement points (docs/ARCHITECTURE.md §3.3-3.4):
-- the only mutation entry points. They run `SECURITY DEFINER` (they must
-- write cross-table atomically), so every function begins by resolving the
-- caller's profile from `auth.uid()` and refusing anything outside the
-- caller's store/admin scope — never relying on RLS inside the function body.
--
-- Functions live in `public` because PostgREST RPC only exposes schemas in
-- `api.schemas` (config.toml); they are NOT callable by `anon` (execute is
-- revoked from PUBLIC/anon and granted to `authenticated` only). See
-- docs/DECISIONS.md DEC-034 for the Supabase guidance followed here.

-- Internal helpers (never exposed to anon): caller profile lookup and active
-- check. Called only from SECURITY DEFINER functions below (they run as
-- postgres, so RLS on profiles does not apply); execute is revoked from
-- public/anon at the bottom.

-- Throws unless caller exists and is active.
create or replace function public.assert_active_caller()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.profiles;
begin
  select * into p from public.profiles where id = auth.uid();
  if p.id is null then
    raise exception 'The recording staff member is not recognized.' using errcode = 'P0001';
  end if;
  if not p.active then
    raise exception 'This account is disabled. Contact the admin.' using errcode = 'P0001';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Sales
-- ---------------------------------------------------------------------------

create or replace function public.record_sale(
  p_store_id text,
  p_sale_date date,
  p_customer_id uuid,
  p_payment_type text,
  p_payment_method text,
  p_delivery_fee_minor integer,
  p_delivery_rider_id uuid,
  p_delivery_vehicle_id uuid,
  p_discount_minor integer,
  p_terms_id text,
  p_lines jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  line jsonb;
  pid uuid;
  qty integer;
  up integer;
  items_minor integer := 0;
  fee integer := coalesce(p_delivery_fee_minor, 0);
  disc integer := coalesce(p_discount_minor, 0);
  total integer;
  sale_id uuid;
  credit_id uuid;
  offset_d integer;
  prod_name text;
begin
  -- Authorization: active caller; staff only their store, admin any store.
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();
  if caller.role <> 'admin' and caller.store_id <> p_store_id then
    raise exception 'Not permitted for this store.' using errcode = 'P0001';
  end if;

  if p_lines is null or jsonb_array_length(p_lines) = 0 then
    raise exception 'A sale needs at least one item.' using errcode = 'P0001';
  end if;
  if p_payment_type not in ('cash', 'charge') then
    raise exception 'Invalid payment type.' using errcode = 'P0001';
  end if;
  if p_payment_method is not null and length(btrim(p_payment_method)) = 0 then
    raise exception 'Payment method cannot be blank.' using errcode = 'P0001';
  end if;
  if p_payment_type = 'charge' then
    if p_customer_id is null then
      raise exception 'A charge sale requires a customer.' using errcode = 'P0001';
    end if;
    if p_terms_id is null then
      raise exception 'A charge sale requires payment terms.' using errcode = 'P0001';
    end if;
    select offset_days into offset_d from public.payment_terms where id = p_terms_id;
    if offset_d is null then
      raise exception 'Unknown payment terms.' using errcode = 'P0001';
    end if;
  end if;
  if disc < 0 then
    raise exception 'Discount cannot be negative.' using errcode = 'P0001';
  end if;

  -- Validate lines, sum items, and verify stock atomically.
  for line in select * from jsonb_array_elements(p_lines) loop
    pid := (line->>'product_id')::uuid;
    qty := (line->>'quantity')::integer;
    up := (line->>'unit_price_minor')::integer;
    if qty <= 0 then
      raise exception 'Item quantity must be greater than zero.' using errcode = 'P0001';
    end if;
    if up < 0 then
      raise exception 'Item price cannot be negative.' using errcode = 'P0001';
    end if;
    -- Insufficient-stock refusal (Assumed rule, DEC-034).
    if not exists (
      select 1 from public.stock_levels sl
      where sl.store_id = p_store_id and sl.product_id = pid and sl.quantity >= qty
    ) then
      select coalesce(name, 'item') into prod_name from public.products where id = pid;
      raise exception 'Not enough stock of % for this sale.', prod_name using errcode = 'P0001';
    end if;
    items_minor := items_minor + qty * up;
  end loop;

  if disc > items_minor + fee then
    raise exception 'Discount cannot be more than the sale amount.' using errcode = 'P0001';
  end if;
  total := items_minor + fee - disc;

  insert into public.sales (
    store_id, sale_date, customer_id, payment_type, payment_method,
    delivery_fee_minor, delivery_rider_id, delivery_vehicle_id,
    discount_minor, total_minor, recorded_by_user_id
  ) values (
    p_store_id, p_sale_date, p_customer_id, p_payment_type,
    case when p_payment_method is null then null else btrim(p_payment_method) end,
    fee, p_delivery_rider_id, p_delivery_vehicle_id, disc, total, caller.id
  ) returning id into sale_id;

  for line in select * from jsonb_array_elements(p_lines) loop
    pid := (line->>'product_id')::uuid;
    qty := (line->>'quantity')::integer;
    up := (line->>'unit_price_minor')::integer;
    insert into public.sale_lines (sale_id, product_id, quantity, unit_price_minor)
    values (sale_id, pid, qty, up);
    update public.stock_levels
       set quantity = quantity - qty
     where store_id = p_store_id and product_id = pid;
  end loop;

  -- Charge sales create a shared credit obligation (due = sale date + terms).
  if p_payment_type = 'charge' then
    insert into public.credit_obligations (
      customer_id, origin_store_id, sale_id, terms_id, due_date,
      original_amount_minor, balance_minor, status
    ) values (
      p_customer_id, p_store_id, sale_id, p_terms_id,
      p_sale_date + (offset_d * interval '1 day'),
      total, total, 'outstanding'
    ) returning id into credit_id;
  end if;

  insert into public.audit_events (action, actor_user_id, store_id, subject, detail)
  values ('sale.recorded', caller.id, p_store_id,
    case when p_store_id = 'amara' then 'Sale at Amara' else 'Sale at Zeann' end,
    jsonb_array_length(p_lines)::text || ' item(s) · ' || p_payment_type);

  return jsonb_build_object(
    'sale_id', sale_id,
    'credit_id', credit_id,
    'total_minor', total
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Receiving
-- ---------------------------------------------------------------------------

create or replace function public.record_receiving(
  p_store_id text,
  p_product_id uuid,
  p_quantity integer,
  p_supplier text,
  p_cost_price_minor integer,
  p_selling_price_minor integer,
  p_rider_id uuid,
  p_vehicle_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  rec_id uuid;
begin
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();
  if caller.role <> 'admin' and caller.store_id <> p_store_id then
    raise exception 'Not permitted for this store.' using errcode = 'P0001';
  end if;
  if p_quantity <= 0 then
    raise exception 'Received quantity must be greater than zero.' using errcode = 'P0001';
  end if;
  if p_supplier is null or length(btrim(p_supplier)) = 0 then
    raise exception 'Supplier is required.' using errcode = 'P0001';
  end if;
  if p_cost_price_minor < 0 then
    raise exception 'Cost price cannot be negative.' using errcode = 'P0001';
  end if;
  if p_selling_price_minor is not null and p_selling_price_minor < 0 then
    raise exception 'Selling price cannot be negative.' using errcode = 'P0001';
  end if;
  if p_rider_id is not null and not exists (
    select 1 from public.riders r
    where r.id = p_rider_id and r.store_id = p_store_id and r.active
  ) then
    raise exception 'Selected rider is not active at this store.' using errcode = 'P0001';
  end if;
  if p_vehicle_id is not null and not exists (
    select 1 from public.vehicles v
    where v.id = p_vehicle_id and v.store_id = p_store_id and v.active
  ) then
    raise exception 'Selected vehicle is not active at this store.' using errcode = 'P0001';
  end if;

  insert into public.receiving_records (
    store_id, product_id, quantity, supplier, cost_price_minor,
    selling_price_minor, rider_id, vehicle_id, recorded_by_user_id
  ) values (
    p_store_id, p_product_id, p_quantity, btrim(p_supplier), p_cost_price_minor,
    p_selling_price_minor, p_rider_id, p_vehicle_id, caller.id
  ) returning id into rec_id;

  insert into public.stock_levels (store_id, product_id, quantity)
  values (p_store_id, p_product_id, p_quantity)
  on conflict (store_id, product_id)
  do update set quantity = public.stock_levels.quantity + excluded.quantity;

  insert into public.audit_events (action, actor_user_id, store_id, subject, detail)
  values ('receiving.recorded', caller.id, p_store_id,
    coalesce((select name from public.products where id = p_product_id), 'Item'),
    p_quantity::text || ' pcs from ' || btrim(p_supplier));

  return jsonb_build_object('receiving_id', rec_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Payments (cross-store, against shared credit)
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
  if credit.status = 'settled' then
    raise exception 'This credit is already settled.' using errcode = 'P0001';
  end if;
  if p_amount_minor <= 0 then
    raise exception 'Payment amount must be greater than zero.' using errcode = 'P0001';
  end if;
  if p_amount_minor > credit.balance_minor then
    raise exception 'Payment cannot exceed the remaining balance.' using errcode = 'P0001';
  end if;
  if p_method is not null and length(btrim(p_method)) = 0 then
    raise exception 'Payment method is required.' using errcode = 'P0001';
  end if;

  insert into public.payments (credit_id, store_id, amount_minor, method, recorded_by_user_id)
  values (
    p_credit_id, p_store_id, p_amount_minor,
    case when p_method is null then null else btrim(p_method) end,
    caller.id
  ) returning id into pay_id;

  new_balance := credit.balance_minor - p_amount_minor;
  new_status := case when new_balance = 0 then 'settled' else 'outstanding' end;
  update public.credit_obligations
     set balance_minor = new_balance, status = new_status
   where id = p_credit_id;

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
-- Products (submit / approve / reject)
-- ---------------------------------------------------------------------------

create or replace function public.submit_product(p_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  pid uuid;
begin
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();
  if p_name is null or length(btrim(p_name)) = 0 then
    raise exception 'Product name is required.' using errcode = 'P0001';
  end if;

  insert into public.products (name, status, created_by_user_id)
  values (btrim(p_name), 'pending', caller.id)
  returning id into pid;

  insert into public.audit_events (action, actor_user_id, subject, detail)
  values ('product.submitted', caller.id, btrim(p_name), 'Awaiting admin approval');

  return jsonb_build_object('product_id', pid);
end;
$$;

create or replace function public.approve_product(p_product_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  p public.products;
begin
  select * into caller from public.profiles where id = auth.uid();
  if caller.role <> 'admin' then
    raise exception 'Only admins can approve products.' using errcode = 'P0001';
  end if;
  select * into p from public.products where id = p_product_id;
  if p.id is null then
    raise exception 'Product not found.' using errcode = 'P0001';
  end if;
  if p.status <> 'pending' then
    raise exception 'Only pending products can be approved.' using errcode = 'P0001';
  end if;

  update public.products set status = 'active' where id = p_product_id;

  insert into public.audit_events (action, actor_user_id, related_user_id, subject, detail)
  values ('product.approved', caller.id, p.created_by_user_id, p.name, 'Approved and active');

  return jsonb_build_object('product_id', p_product_id);
end;
$$;

create or replace function public.reject_product(p_product_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  p public.products;
begin
  select * into caller from public.profiles where id = auth.uid();
  if caller.role <> 'admin' then
    raise exception 'Only admins can reject products.' using errcode = 'P0001';
  end if;
  select * into p from public.products where id = p_product_id;
  if p.id is null then
    raise exception 'Product not found.' using errcode = 'P0001';
  end if;
  if p.status <> 'pending' then
    raise exception 'Only pending products can be rejected.' using errcode = 'P0001';
  end if;

  delete from public.products where id = p_product_id;

  insert into public.audit_events (action, actor_user_id, related_user_id, subject, detail)
  values ('product.rejected', caller.id, p.created_by_user_id, p.name, 'Rejected and removed');

  return jsonb_build_object('product_id', p_product_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Stock adjustments (DEC-032)
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

  select quantity into prev from public.stock_levels
   where store_id = p_store_id and product_id = p_product_id;

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
-- Riders / vehicles (create, update, guarded delete)
-- ---------------------------------------------------------------------------

create or replace function public.create_rider(p_name text, p_store_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  rid uuid;
begin
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();
  if caller.role <> 'admin' and caller.store_id <> p_store_id then
    raise exception 'Not permitted for this store.' using errcode = 'P0001';
  end if;
  if p_name is null or length(btrim(p_name)) = 0 then
    raise exception 'Rider name is required.' using errcode = 'P0001';
  end if;
  insert into public.riders (name, store_id, created_by_user_id)
  values (btrim(p_name), p_store_id, caller.id) returning id into rid;
  insert into public.audit_events (action, actor_user_id, store_id, subject, detail)
  values ('rider.added', caller.id, p_store_id, btrim(p_name),
    case when caller.role = 'admin' then 'Active rider' else 'Active rider' end);
  return jsonb_build_object('rider_id', rid);
end;
$$;

create or replace function public.delete_rider(p_rider_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  rider public.riders;
begin
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();
  select * into rider from public.riders where id = p_rider_id;
  if rider.id is null then
    raise exception 'Rider not found.' using errcode = 'P0001';
  end if;
  if caller.role <> 'admin' and caller.store_id <> rider.store_id then
    raise exception 'Not permitted for this store.' using errcode = 'P0001';
  end if;
  -- Reference guard: refused when used by sales, receiving, or expenses.
  if exists (select 1 from public.sales where delivery_rider_id = p_rider_id)
     or exists (select 1 from public.receiving_records where rider_id = p_rider_id)
     or exists (select 1 from public.expenses where rider_id = p_rider_id) then
    raise exception 'This rider is used by existing sales, receiving, or expenses. Deactivate it instead.' using errcode = 'P0001';
  end if;
  delete from public.riders where id = p_rider_id;
  return jsonb_build_object('rider_id', p_rider_id);
end;
$$;

create or replace function public.create_vehicle(p_label text, p_store_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  vid uuid;
begin
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();
  if caller.role <> 'admin' and caller.store_id <> p_store_id then
    raise exception 'Not permitted for this store.' using errcode = 'P0001';
  end if;
  if p_label is null or length(btrim(p_label)) = 0 then
    raise exception 'Vehicle type is required.' using errcode = 'P0001';
  end if;
  insert into public.vehicles (label, store_id, created_by_user_id)
  values (btrim(p_label), p_store_id, caller.id) returning id into vid;
  return jsonb_build_object('vehicle_id', vid);
end;
$$;

create or replace function public.delete_vehicle(p_vehicle_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  vehicle public.vehicles;
begin
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();
  select * into vehicle from public.vehicles where id = p_vehicle_id;
  if vehicle.id is null then
    raise exception 'Vehicle not found.' using errcode = 'P0001';
  end if;
  if caller.role <> 'admin' and caller.store_id <> vehicle.store_id then
    raise exception 'Not permitted for this store.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.sales where delivery_vehicle_id = p_vehicle_id)
     or exists (select 1 from public.receiving_records where vehicle_id = p_vehicle_id)
     or exists (select 1 from public.expenses where vehicle_id = p_vehicle_id) then
    raise exception 'This vehicle is used by existing sales, receiving, or expenses. Deactivate it instead.' using errcode = 'P0001';
  end if;
  delete from public.vehicles where id = p_vehicle_id;
  return jsonb_build_object('vehicle_id', p_vehicle_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Customers / expenses
-- ---------------------------------------------------------------------------

create or replace function public.create_customer(
  p_name text,
  p_contact text,
  p_address text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  cid uuid;
begin
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();
  if p_name is null or length(btrim(p_name)) = 0 then
    raise exception 'Customer name is required.' using errcode = 'P0001';
  end if;
  insert into public.customers (name, contact, address, created_by_user_id)
  values (
    btrim(p_name),
    case when p_contact is null then null else btrim(p_contact) end,
    case when p_address is null then null else btrim(p_address) end,
    caller.id
  ) returning id into cid;
  return jsonb_build_object('customer_id', cid);
end;
$$;

create or replace function public.create_expense(
  p_store_id text,
  p_rider_id uuid,
  p_vehicle_id uuid,
  p_type text,
  p_amount_minor integer,
  p_note text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  eid uuid;
begin
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();
  if caller.role <> 'admin' and caller.store_id <> p_store_id then
    raise exception 'Not permitted for this store.' using errcode = 'P0001';
  end if;
  if p_amount_minor <= 0 then
    raise exception 'Expense amount must be greater than zero.' using errcode = 'P0001';
  end if;
  if p_rider_id is null and p_vehicle_id is null then
    raise exception 'Assign the expense to a rider or vehicle.' using errcode = 'P0001';
  end if;
  if p_rider_id is not null and not exists (
    select 1 from public.riders r
    where r.id = p_rider_id and r.store_id = p_store_id and r.active
  ) then
    raise exception 'Selected rider is not active at this store.' using errcode = 'P0001';
  end if;
  if p_vehicle_id is not null and not exists (
    select 1 from public.vehicles v
    where v.id = p_vehicle_id and v.store_id = p_store_id and v.active
  ) then
    raise exception 'Selected vehicle is not active at this store.' using errcode = 'P0001';
  end if;

  insert into public.expenses (
    store_id, rider_id, vehicle_id, type, amount_minor, note, recorded_by_user_id
  ) values (
    p_store_id, p_rider_id, p_vehicle_id, p_type, p_amount_minor,
    case when p_note is null then null else btrim(p_note) end, caller.id
  ) returning id into eid;

  insert into public.audit_events (action, actor_user_id, store_id, subject, detail)
  values ('expense.recorded', caller.id, p_store_id,
    case when p_type = 'fuel' then 'Fuel expense' else 'Repair expense' end, p_note);

  return jsonb_build_object('expense_id', eid);
end;
$$;

-- ---------------------------------------------------------------------------
-- Staff accounts (admin-only): create the auth user + profile row.
-- ---------------------------------------------------------------------------

create or replace function public.create_staff(
  p_username text,
  p_name text,
  p_role text,
  p_store_id text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  new_uid uuid;
  base_email text;
begin
  select * into caller from public.profiles where id = auth.uid();
  if caller.role <> 'admin' then
    raise exception 'Only admins can manage staff.' using errcode = 'P0001';
  end if;
  if p_username is null or length(btrim(p_username)) = 0 then
    raise exception 'Username is required.' using errcode = 'P0001';
  end if;
  if p_role not in ('staff', 'admin') then
    raise exception 'Invalid role.' using errcode = 'P0001';
  end if;
  if p_role = 'staff' and p_store_id is null then
    raise exception 'Each staff member must be assigned to a store.' using errcode = 'P0001';
  end if;
  if p_password is null or length(p_password) < 4 then
    raise exception 'Password must be at least 4 characters.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.profiles where username = lower(btrim(p_username))) then
    raise exception 'That username is already taken.' using errcode = 'P0001';
  end if;

  base_email := lower(btrim(p_username)) || '@zafone.local';

  -- Create the auth identity first (Supabase Auth table).
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, is_sso_user, is_anonymous
  ) values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    base_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('name', p_name),
    now(), now(), false, false
  ) returning id into new_uid;

  insert into public.profiles (id, username, name, role, store_id, active)
  values (new_uid, lower(btrim(p_username)), btrim(p_name), p_role,
    case when p_role = 'admin' then null else p_store_id end, true);

  return jsonb_build_object('user_id', new_uid, 'email', base_email);
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants: deny anon, allow authenticated only; never PUBLIC.
-- ---------------------------------------------------------------------------

do $$
declare
  fn text;
begin
  for fn in select p.oid::regprocedure::text
              from pg_proc p
              join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public'
               and p.proname in (
                 'assert_active_caller', 'record_sale', 'record_receiving',
                 'record_payment', 'submit_product', 'approve_product',
                 'reject_product', 'adjust_stock', 'delete_stock',
                 'create_rider', 'delete_rider', 'create_vehicle',
                 'delete_vehicle', 'create_customer', 'create_expense',
                 'create_staff'
               )
  loop
    execute format('revoke all on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end;
$$;