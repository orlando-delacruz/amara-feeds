-- ZAF ONE — 00009: Client revisions (credit details, price edit, sale delete,
-- customer edit/delete, own-account changes)
--
-- 1. CREDIT — encoded existing credits now carry complete transaction
--    details: a legacy sales row (`is_legacy`, excluded from sales lists,
--    dashboards, and reports) with sale_lines holding the item details, a
--    linked credit obligation, and an optional initial payment through the
--    guarded payment logic. Encoding never touches stock_levels — inventory
--    moves only through normal sales and receiving.
-- 2. INVENTORY — `stock_levels.price_minor` is the store's current selling
--    price. Receiving maintains it (the automatic-price rule keeps working);
--    sale pricing reads it first and falls back to the latest priced
--    receiving record (existing live rows with no price keep working);
--    adjust_stock can set it, behind the same approval lock as quantity.
-- 3. SALES — admin-only delete_sale: refuses when payments exist against the
--    sale's credit, otherwise restores stock per line and removes the
--    unpaid credit, lines, and sale atomically with a `sale.deleted` audit.
-- 4. CUSTOMERS — update_customer (any active user) and delete_customer
--    (refused when sales or credit references exist).
-- 5. OWN ACCOUNT — update_own_account: self-service username/password
--    change that verifies the current password, syncs the auth identity on
--    username change, keeps the current session alive, and writes an
--    `account.updated` audit event (never the credentials).

-- ---------------------------------------------------------------------------
-- 1. Legacy sales + current selling price (existing rows keep current behavior)
-- ---------------------------------------------------------------------------

alter table public.sales
  add column is_legacy boolean not null default false;

alter table public.stock_levels
  add column price_minor integer check (price_minor >= 0);

-- ---------------------------------------------------------------------------
-- 2. record_sale: price precedence — stock row price, then latest receiving
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
  sale_lines_json jsonb := '[]'::jsonb;
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

  -- Delivery rider/vehicle must be active at the selling store (same rule
  -- as record_receiving and create_expense).
  if p_delivery_rider_id is not null and not exists (
    select 1 from public.riders r
    where r.id = p_delivery_rider_id and r.store_id = p_store_id and r.active
  ) then
    raise exception 'Selected rider is not active at this store.' using errcode = 'P0001';
  end if;
  if p_delivery_vehicle_id is not null and not exists (
    select 1 from public.vehicles v
    where v.id = p_delivery_vehicle_id and v.store_id = p_store_id and v.active
  ) then
    raise exception 'Selected vehicle is not active at this store.' using errcode = 'P0001';
  end if;

  -- Validate lines and verify stock atomically. Price precedence: the
  -- store's current selling price on the stock row (editable inventory),
  -- falling back to the product's most recent priced receiving record at
  -- this store. The client never sets prices on new sales.
  for line in select * from jsonb_array_elements(p_lines) loop
    pid := (line->>'product_id')::uuid;
    qty := (line->>'quantity')::integer;
    if qty <= 0 then
      raise exception 'Item quantity must be greater than zero.' using errcode = 'P0001';
    end if;
    -- Insufficient-stock refusal (Assumed rule, DEC-034).
    if not exists (
      select 1 from public.stock_levels sl
      where sl.store_id = p_store_id and sl.product_id = pid and sl.quantity >= qty
    ) then
      select coalesce(name, 'item') into prod_name from public.products where id = pid;
      raise exception 'Not enough stock of % for this sale.', prod_name using errcode = 'P0001';
    end if;
    select price_minor into up
      from public.stock_levels
     where store_id = p_store_id and product_id = pid;
    if up is null then
      select r.selling_price_minor into up
        from public.receiving_records r
       where r.store_id = p_store_id
         and r.product_id = pid
         and r.selling_price_minor is not null
       order by r.received_at desc
       limit 1;
    end if;
    if up is null then
      select coalesce(name, 'item') into prod_name from public.products where id = pid;
      raise exception '% has no price at this store yet.', prod_name using errcode = 'P0001';
    end if;
    items_minor := items_minor + qty * up;
    sale_lines_json := sale_lines_json || jsonb_build_object(
      'product_id', pid,
      'quantity', qty,
      'unit_price_minor', up
    );
  end loop;

  if disc > items_minor + fee then
    raise exception 'Discount cannot be more than the sale amount.' using errcode = 'P0001';
  end if;
  total := items_minor + fee - disc;

  -- A zero-amount charge sale would create an outstanding credit that can
  -- never be paid (payments require a positive amount).
  if p_payment_type = 'charge' and total = 0 then
    raise exception 'A charge sale needs an amount greater than zero.' using errcode = 'P0001';
  end if;

  insert into public.sales (
    store_id, sale_date, customer_id, payment_type, payment_method,
    delivery_fee_minor, delivery_rider_id, delivery_vehicle_id,
    discount_minor, total_minor, recorded_by_user_id
  ) values (
    p_store_id, p_sale_date, p_customer_id, p_payment_type,
    case when p_payment_method is null then null else btrim(p_payment_method) end,
    fee, p_delivery_rider_id, p_delivery_vehicle_id, disc, total, caller.id
  ) returning id into sale_id;

  for line in select * from jsonb_array_elements(sale_lines_json) loop
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
    'total_minor', total,
    'lines', sale_lines_json
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. record_receiving: maintain the stock row's current selling price
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

  -- Receiving keeps the automatic-price rule: the receipt's selling price
  -- becomes the stock row's current selling price (a null selling price
  -- leaves an existing price untouched).
  insert into public.stock_levels (store_id, product_id, quantity, price_minor)
  values (p_store_id, p_product_id, p_quantity, p_selling_price_minor)
  on conflict (store_id, product_id)
  do update set quantity = public.stock_levels.quantity + excluded.quantity,
                price_minor = coalesce(excluded.price_minor, public.stock_levels.price_minor);

  insert into public.audit_events (action, actor_user_id, store_id, subject, detail)
  values ('receiving.recorded', caller.id, p_store_id,
    coalesce((select name from public.products where id = p_product_id), 'Item'),
    p_quantity::text || ' pcs from ' || btrim(p_supplier));

  return jsonb_build_object('receiving_id', rec_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. adjust_stock: optional price edit, same approval lock as quantity
--    (new signature; the 3-argument version is dropped)
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
  if p_price_minor is not null and p_price_minor < 0 then
    raise exception 'Price cannot be negative.' using errcode = 'P0001';
  end if;

  select quantity, admin_approved into prev, prev_approved
    from public.stock_levels
   where store_id = p_store_id and product_id = p_product_id;

  -- Approved inventory is admin-edit-only (client change, amends DEC-032).
  if found and prev_approved and caller.role <> 'admin' then
    raise exception 'Approved inventory can only be changed by an admin.' using errcode = 'P0001';
  end if;

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

drop function if exists public.adjust_stock(text, uuid, integer);

-- ---------------------------------------------------------------------------
-- 5. record_existing_credit (admin-only): legacy credit with item details
-- ---------------------------------------------------------------------------

create or replace function public.record_existing_credit(
  p_customer_id uuid,
  p_store_id text,
  p_date date,
  p_due_date date,
  p_lines jsonb,
  p_initial_payment_minor integer default null,
  p_initial_payment_method text default null
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
  total integer;
  sale_id uuid;
  credit_id uuid;
  new_balance integer;
  new_status text;
  prod_name text;
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
  select name into cust_name from public.customers where id = p_customer_id;
  if cust_name is null then
    raise exception 'Customer not found.' using errcode = 'P0001';
  end if;
  if p_date is null then
    raise exception 'A transaction date is required.' using errcode = 'P0001';
  end if;
  if p_due_date is null then
    raise exception 'A due date is required.' using errcode = 'P0001';
  end if;
  if p_lines is null or jsonb_array_length(p_lines) = 0 then
    raise exception 'At least one item is required.' using errcode = 'P0001';
  end if;
  if p_initial_payment_minor is not null and p_initial_payment_minor < 0 then
    raise exception 'Initial payment cannot be negative.' using errcode = 'P0001';
  end if;
  if p_initial_payment_method is not null and length(btrim(p_initial_payment_method)) = 0 then
    raise exception 'Payment method cannot be blank.' using errcode = 'P0001';
  end if;

  -- Validate lines with admin-supplied historical prices (no server-side
  -- derivation — old prices differ from current pricing) and NO stock
  -- interaction: encoded credits never deduct or modify inventory.
  for line in select * from jsonb_array_elements(p_lines) loop
    pid := (line->>'product_id')::uuid;
    qty := (line->>'quantity')::integer;
    up := (line->>'unit_price_minor')::integer;
    if qty <= 0 then
      raise exception 'Item quantity must be greater than zero.' using errcode = 'P0001';
    end if;
    if up is null or up < 0 then
      raise exception 'Item price cannot be negative.' using errcode = 'P0001';
    end if;
    select coalesce(name, 'item') into prod_name from public.products where id = pid;
    if prod_name is null then
      raise exception 'One of the items was not found in the product list.' using errcode = 'P0001';
    end if;
    items_minor := items_minor + qty * up;
  end loop;
  total := items_minor;

  if p_initial_payment_minor is not null and p_initial_payment_minor > total then
    raise exception 'The initial payment cannot exceed the credit amount.' using errcode = 'P0001';
  end if;

  -- Legacy sales row: carries the item details, excluded from sales lists
  -- and summaries (is_legacy), never affects stock.
  insert into public.sales (
    store_id, sale_date, customer_id, payment_type, payment_method,
    delivery_fee_minor, discount_minor, total_minor, recorded_by_user_id, is_legacy
  ) values (
    p_store_id, p_date, p_customer_id, 'charge', null,
    0, 0, total, caller.id, true
  ) returning id into sale_id;

  for line in select * from jsonb_array_elements(p_lines) loop
    pid := (line->>'product_id')::uuid;
    qty := (line->>'quantity')::integer;
    up := (line->>'unit_price_minor')::integer;
    insert into public.sale_lines (sale_id, product_id, quantity, unit_price_minor)
    values (sale_id, pid, qty, up);
  end loop;

  insert into public.credit_obligations (
    customer_id, origin_store_id, sale_id, terms_id, due_date,
    original_amount_minor, balance_minor, status
  ) values (
    p_customer_id, p_store_id, sale_id, null, p_due_date,
    total, total, 'outstanding'
  ) returning id into credit_id;

  -- Optional initial partial payment through the guarded payment logic.
  if p_initial_payment_minor is not null and p_initial_payment_minor > 0 then
    update public.credit_obligations
       set balance_minor = balance_minor - p_initial_payment_minor,
           status = case
             when balance_minor - p_initial_payment_minor = 0 then 'settled'
             else 'outstanding'
           end
     where id = credit_id
       and status = 'outstanding'
       and balance_minor >= p_initial_payment_minor
    returning balance_minor, status into new_balance, new_status;
    if new_balance is null then
      raise exception 'The initial payment cannot exceed the credit amount.' using errcode = 'P0001';
    end if;
    insert into public.payments (credit_id, store_id, amount_minor, method, recorded_by_user_id)
    values (
      credit_id, p_store_id, p_initial_payment_minor,
      case when p_initial_payment_method is null then null else btrim(p_initial_payment_method) end,
      caller.id
    );
  end if;

  insert into public.audit_events (action, actor_user_id, store_id, subject, detail)
  values ('credit.imported', caller.id, p_store_id, cust_name,
    'Existing credit · ' || jsonb_array_length(p_lines)::text || ' item(s) · '
    || to_char(total / 100.0, 'FM999999990.00'));

  return jsonb_build_object(
    'sale_id', sale_id,
    'credit_id', credit_id,
    'total_minor', total,
    'balance_minor', coalesce(new_balance, total),
    'status', coalesce(new_status, 'outstanding')
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. delete_sale (admin-only): correct mistakes; never destroys payments
-- ---------------------------------------------------------------------------

create or replace function public.delete_sale(p_sale_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  sale public.sales;
  line record;
  pay_count integer := 0;
begin
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();
  if caller.role <> 'admin' then
    raise exception 'Only admins can delete sales.' using errcode = 'P0001';
  end if;
  select * into sale from public.sales where id = p_sale_id;
  if sale.id is null then
    raise exception 'Sale not found.' using errcode = 'P0001';
  end if;
  if sale.is_legacy then
    raise exception 'Encoded credits are managed in Credit, not Sales.' using errcode = 'P0001';
  end if;

  -- Payments are financial history and are never silently destroyed: a sale
  -- whose credit has payments cannot be deleted.
  select count(*) into pay_count
    from public.payments p
    join public.credit_obligations c on c.id = p.credit_id
   where c.sale_id = p_sale_id;
  if pay_count > 0 then
    raise exception 'This sale has recorded payments and cannot be deleted.' using errcode = 'P0001';
  end if;

  -- Restore stock per line. Stock rows always exist while sales exist (the
  -- DEC-032 delete guard), so plain increments never fabricate stock.
  for line in
    select product_id, quantity from public.sale_lines where sale_id = p_sale_id
  loop
    update public.stock_levels
       set quantity = quantity + line.quantity
     where store_id = sale.store_id and product_id = line.product_id;
  end loop;

  delete from public.credit_obligations where sale_id = p_sale_id;
  delete from public.sale_lines where sale_id = p_sale_id;
  delete from public.sales where id = p_sale_id;

  insert into public.audit_events (action, actor_user_id, store_id, subject, detail)
  values ('sale.deleted', caller.id, sale.store_id,
    case when sale.store_id = 'amara' then 'Sale at Amara' else 'Sale at Zeann' end,
    to_char(sale.total_minor / 100.0, 'FM999999990.00') || ' · stock restored');

  return jsonb_build_object('sale_id', p_sale_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Customer edit / delete (delete refuses referenced customers)
-- ---------------------------------------------------------------------------

create or replace function public.update_customer(
  p_customer_id uuid,
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
  cust_name text;
begin
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();
  if p_name is null or length(btrim(p_name)) = 0 then
    raise exception 'Customer name is required.' using errcode = 'P0001';
  end if;
  select name into cust_name from public.customers where id = p_customer_id;
  if cust_name is null then
    raise exception 'Customer not found.' using errcode = 'P0001';
  end if;

  update public.customers
     set name = btrim(p_name),
         contact = case when p_contact is null then null else nullif(btrim(p_contact), '') end,
         address = case when p_address is null then null else nullif(btrim(p_address), '') end
   where id = p_customer_id;

  insert into public.audit_events (action, actor_user_id, subject, detail)
  values ('customer.updated', caller.id, btrim(p_name), 'Updated from ' || cust_name);

  return jsonb_build_object('customer_id', p_customer_id);
end;
$$;

create or replace function public.delete_customer(p_customer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  cust_name text;
begin
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();
  select name into cust_name from public.customers where id = p_customer_id;
  if cust_name is null then
    raise exception 'Customer not found.' using errcode = 'P0001';
  end if;
  -- Referential guard: customers behind any transaction can never be
  -- deleted, so no historical record can break.
  if exists (select 1 from public.sales where customer_id = p_customer_id) then
    raise exception 'This customer has recorded sales and cannot be deleted.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.credit_obligations where customer_id = p_customer_id) then
    raise exception 'This customer has credit records and cannot be deleted.' using errcode = 'P0001';
  end if;

  delete from public.customers where id = p_customer_id;

  insert into public.audit_events (action, actor_user_id, subject, detail)
  values ('customer.deleted', caller.id, cust_name, 'Deleted');

  return jsonb_build_object('customer_id', p_customer_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. update_own_account: self-service username/password (current password
--    verified; current session stays alive; credentials never logged)
-- ---------------------------------------------------------------------------

create or replace function public.update_own_account(
  p_current_password text,
  p_username text default null,
  p_new_password text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller public.profiles;
  auth_row record;
  new_email text;
  changing boolean := false;
  final_username text;
begin
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();

  if p_current_password is null or length(p_current_password) = 0 then
    raise exception 'Enter your current password to confirm the change.' using errcode = 'P0001';
  end if;
  select * into auth_row from auth.users where id = auth.uid();
  if auth_row.id is null then
    raise exception 'The recording staff member is not recognized.' using errcode = 'P0001';
  end if;
  if crypt(p_current_password, auth_row.encrypted_password) <> auth_row.encrypted_password then
    raise exception 'Your current password is incorrect.' using errcode = 'P0001';
  end if;

  final_username := caller.username;
  if p_username is not null and length(btrim(p_username)) > 0
     and lower(btrim(p_username)) <> caller.username then
    if exists (
      select 1 from public.profiles
      where username = lower(btrim(p_username)) and id <> auth.uid()
    ) then
      raise exception 'That username is already taken.' using errcode = 'P0001';
    end if;
    new_email := lower(btrim(p_username)) || '@zafone.local';
    final_username := lower(btrim(p_username));
    changing := true;
  end if;

  if p_new_password is not null then
    if length(p_new_password) < 4 then
      raise exception 'Password must be at least 4 characters.' using errcode = 'P0001';
    end if;
    changing := true;
  end if;

  if not changing then
    raise exception 'Nothing to change.' using errcode = 'P0001';
  end if;

  if new_email is not null then
    update public.profiles set username = final_username where id = auth.uid();
    update auth.users
       set email = new_email,
           email_confirmed_at = coalesce(email_confirmed_at, now())
     where id = auth.uid();
    update auth.identities
       set identity_data = jsonb_set(
             jsonb_set(identity_data, '{sub}', to_jsonb(auth.uid()::text)),
             '{email}', to_jsonb(new_email))
     where user_id = auth.uid();
  end if;

  if p_new_password is not null then
    update auth.users
       set encrypted_password = crypt(p_new_password, gen_salt('bf'))
     where id = auth.uid();
    -- Revoke other sessions; the current one (verified via its claim) stays.
    delete from auth.sessions
     where user_id = auth.uid()
       and id <> (nullif(auth.jwt() ->> 'session_id', '')::uuid);
  end if;

  insert into public.audit_events (action, actor_user_id, subject, detail)
  values ('account.updated', caller.id, caller.name,
    concat_ws(' · ',
      case when new_email is not null then 'username changed' end,
      case when p_new_password is not null then 'password changed' end));

  return jsonb_build_object('user_id', auth.uid(), 'username', final_username);
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants: new and re-signed functions follow the house pattern.
-- ---------------------------------------------------------------------------

revoke all on function public.adjust_stock(text, uuid, integer, integer) from public, anon;
grant execute on function public.adjust_stock(text, uuid, integer, integer) to authenticated;
revoke all on function public.record_existing_credit(uuid, text, date, date, jsonb, integer, text) from public, anon;
grant execute on function public.record_existing_credit(uuid, text, date, date, jsonb, integer, text) to authenticated;
revoke all on function public.delete_sale(uuid) from public, anon;
grant execute on function public.delete_sale(uuid) to authenticated;
revoke all on function public.update_customer(uuid, text, text, text) from public, anon;
grant execute on function public.update_customer(uuid, text, text, text) to authenticated;
revoke all on function public.delete_customer(uuid) from public, anon;
grant execute on function public.delete_customer(uuid) to authenticated;
revoke all on function public.update_own_account(text, text, text) from public, anon;
grant execute on function public.update_own_account(text, text, text) to authenticated;
