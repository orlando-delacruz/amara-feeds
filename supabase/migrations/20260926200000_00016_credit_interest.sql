-- ZAF ONE — 00016: Manual credit interest on encoded balances (DEC-059)
--
-- Adds a display-only, manually entered interest amount to encoded existing
-- credits. The column is nullable (no interest reads as absent, not zero)
-- and never participates in balance math — principal, payments, and status
-- flow exactly as before.
--
-- `record_existing_credit` is re-signed with an optional trailing
-- p_interest_minor (same drop-old-signature pattern as 00009's adjust_stock);
-- old callers pass nothing and behave identically. No existing rows change.

alter table public.credit_obligations
  add column interest_minor integer check (interest_minor >= 0);

create or replace function public.record_existing_credit(
  p_customer_id uuid,
  p_store_id text,
  p_date date,
  p_due_date date,
  p_lines jsonb,
  p_initial_payment_minor integer default null,
  p_initial_payment_method text default null,
  p_interest_minor integer default null
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
  if p_interest_minor is not null and p_interest_minor < 0 then
    raise exception 'Credit interest cannot be negative.' using errcode = 'P0001';
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
    original_amount_minor, balance_minor, status, interest_minor
  ) values (
    p_customer_id, p_store_id, sale_id, null, p_due_date,
    total, total, 'outstanding', p_interest_minor
  ) returning id into credit_id;

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

drop function if exists public.record_existing_credit(uuid, text, date, date, jsonb, integer, text);

revoke all on function public.record_existing_credit(uuid, text, date, date, jsonb, integer, text, integer) from public, anon;
grant execute on function public.record_existing_credit(uuid, text, date, date, jsonb, integer, text, integer) to authenticated;
