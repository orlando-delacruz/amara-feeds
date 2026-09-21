-- ZAF ONE — 00007: Security hardening (loophole audit, 2026-09-21)
--
-- C1: drop `profiles update own` — the policy only checked `id = auth.uid()`,
--     so any authenticated user could set their own role='admin', re-activate
--     a disabled account, or change store/username with one REST call.
--     Profile writes go exclusively through the admin-only SECURITY DEFINER
--     functions; direct table updates are denied by default (no policy).
-- H1: every data policy additionally requires the caller's profile to be
--     active, so a disabled account holding an unexpired token loses access
--     immediately; approve/reject_product now run the active-caller check;
--     update_staff revokes live sessions when disabling an account (previously
--     only a password reset did) and refuses clearing a staff member's store.
-- C2: record_payment decrements the balance with a guarded atomic UPDATE
--     (balance_minor >= amount predicate re-checked under the row lock), so
--     concurrent payments can never overpay a credit (the stale pre-read now
--     only produces the friendly error).
-- H2: record_sale validates the delivery rider/vehicle like record_receiving
--     and create_expense already did (active, same store).
-- M1: record_sale derives unit prices server-side from the product's most
--     recent priced receiving record at the selling store — the confirmed
--     automatic-price rule (docs/UI-UX.md "no manual price entry"). The
--     client no longer supplies prices; the RPC returns the authoritative
--     lines. Zero-amount charge sales are refused (they would create an
--     outstanding credit that can never be paid, since payments are > 0).
-- M6: submit/approve enforce the adopted unique-active-name baseline
--     (DEC-034): an active product's name cannot be duplicated.
-- M3: staff management (create/update) and vehicle creation write audit
--     events; audit rows carry the actor's real role via a trigger so the
--     History page labels admin vs staff actions correctly.

-- ---------------------------------------------------------------------------
-- M3: audit actor role (denormalized, trigger-maintained)
-- ---------------------------------------------------------------------------

alter table public.audit_events
  add column if not exists actor_role text not null default 'staff'
  check (actor_role in ('staff', 'admin'));

create or replace function public.set_audit_actor_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select coalesce(p.role, 'staff') into new.actor_role
    from public.profiles p
   where p.id = new.actor_user_id;
  return new;
end;
$$;

revoke all on function public.set_audit_actor_role() from public, anon;

drop trigger if exists audit_events_actor_role on public.audit_events;
create trigger audit_events_actor_role
  before insert on public.audit_events
  for each row execute function public.set_audit_actor_role();

-- ---------------------------------------------------------------------------
-- C1: remove the self-service profile update path
-- ---------------------------------------------------------------------------

drop policy if exists "profiles update own" on public.profiles;

-- ---------------------------------------------------------------------------
-- H1: require an active caller profile in every data policy
-- (profiles policies stay unchanged on purpose: a disabled user must still
-- read their own row so the client can detect the disabled state and sign
-- out, and admins must still see and re-enable disabled accounts.)
-- ---------------------------------------------------------------------------

drop policy if exists "stores readable by authenticated" on public.stores;
create policy "stores readable by authenticated"
  on public.stores for select
  to authenticated
  using ((select (public.current_profile()).active));

drop policy if exists "payment_terms readable by authenticated" on public.payment_terms;
create policy "payment_terms readable by authenticated"
  on public.payment_terms for select
  to authenticated
  using ((select (public.current_profile()).active));

drop policy if exists "customers read authenticated" on public.customers;
create policy "customers read authenticated"
  on public.customers for select
  to authenticated
  using ((select (public.current_profile()).active));

drop policy if exists "customers insert authenticated" on public.customers;
create policy "customers insert authenticated"
  on public.customers for insert
  to authenticated
  with check (
    length(btrim(name)) > 0
    and (select (public.current_profile()).active)
  );

drop policy if exists "products read active or owner or admin" on public.products;
create policy "products read active or owner or admin"
  on public.products for select
  to authenticated
  using (
    (
      status = 'active'
      or created_by_user_id = (select auth.uid())
      or (select (public.current_profile()).role) = 'admin'
    )
    and (select (public.current_profile()).active)
  );

drop policy if exists "products insert authenticated" on public.products;
create policy "products insert authenticated"
  on public.products for insert
  to authenticated
  with check (
    status = 'pending'
    and (select (public.current_profile()).active)
  );

drop policy if exists "riders select own store" on public.riders;
create policy "riders select own store"
  on public.riders for select
  to authenticated
  using (
    (
      store_id = (select (public.current_profile()).store_id)
      or (select (public.current_profile()).role) = 'admin'
    )
    and (select (public.current_profile()).active)
  );

drop policy if exists "riders insert own store" on public.riders;
create policy "riders insert own store"
  on public.riders for insert
  to authenticated
  with check (
    (
      store_id = (select (public.current_profile()).store_id)
      or (select (public.current_profile()).role) = 'admin'
    )
    and (select (public.current_profile()).active)
  );

drop policy if exists "riders update own store" on public.riders;
create policy "riders update own store"
  on public.riders for update
  to authenticated
  using (
    (
      store_id = (select (public.current_profile()).store_id)
      or (select (public.current_profile()).role) = 'admin'
    )
    and (select (public.current_profile()).active)
  )
  with check (
    (
      store_id = (select (public.current_profile()).store_id)
      or (select (public.current_profile()).role) = 'admin'
    )
    and (select (public.current_profile()).active)
  );

drop policy if exists "vehicles select own store" on public.vehicles;
create policy "vehicles select own store"
  on public.vehicles for select
  to authenticated
  using (
    (
      store_id = (select (public.current_profile()).store_id)
      or (select (public.current_profile()).role) = 'admin'
    )
    and (select (public.current_profile()).active)
  );

drop policy if exists "vehicles insert own store" on public.vehicles;
create policy "vehicles insert own store"
  on public.vehicles for insert
  to authenticated
  with check (
    (
      store_id = (select (public.current_profile()).store_id)
      or (select (public.current_profile()).role) = 'admin'
    )
    and (select (public.current_profile()).active)
  );

drop policy if exists "vehicles update own store" on public.vehicles;
create policy "vehicles update own store"
  on public.vehicles for update
  to authenticated
  using (
    (
      store_id = (select (public.current_profile()).store_id)
      or (select (public.current_profile()).role) = 'admin'
    )
    and (select (public.current_profile()).active)
  )
  with check (
    (
      store_id = (select (public.current_profile()).store_id)
      or (select (public.current_profile()).role) = 'admin'
    )
    and (select (public.current_profile()).active)
  );

drop policy if exists "stock select own store" on public.stock_levels;
create policy "stock select own store"
  on public.stock_levels for select
  to authenticated
  using (
    (
      store_id = (select (public.current_profile()).store_id)
      or (select (public.current_profile()).role) = 'admin'
    )
    and (select (public.current_profile()).active)
  );

drop policy if exists "receiving select own store" on public.receiving_records;
create policy "receiving select own store"
  on public.receiving_records for select
  to authenticated
  using (
    (
      store_id = (select (public.current_profile()).store_id)
      or (select (public.current_profile()).role) = 'admin'
    )
    and (select (public.current_profile()).active)
  );

drop policy if exists "sales select own store" on public.sales;
create policy "sales select own store"
  on public.sales for select
  to authenticated
  using (
    (
      store_id = (select (public.current_profile()).store_id)
      or (select (public.current_profile()).role) = 'admin'
    )
    and (select (public.current_profile()).active)
  );

drop policy if exists "sale_lines select via parent sale" on public.sale_lines;
create policy "sale_lines select via parent sale"
  on public.sale_lines for select
  to authenticated
  using (
    exists (
      select 1 from public.sales s
      where s.id = sale_id
        and (
          s.store_id = (select (public.current_profile()).store_id)
          or (select (public.current_profile()).role) = 'admin'
        )
    )
    and (select (public.current_profile()).active)
  );

drop policy if exists "credit select authenticated" on public.credit_obligations;
create policy "credit select authenticated"
  on public.credit_obligations for select
  to authenticated
  using ((select (public.current_profile()).active));

drop policy if exists "payments select authenticated" on public.payments;
create policy "payments select authenticated"
  on public.payments for select
  to authenticated
  using ((select (public.current_profile()).active));

drop policy if exists "expenses select own store" on public.expenses;
create policy "expenses select own store"
  on public.expenses for select
  to authenticated
  using (
    (
      store_id = (select (public.current_profile()).store_id)
      or (select (public.current_profile()).role) = 'admin'
    )
    and (select (public.current_profile()).active)
  );

drop policy if exists "audit select own or connected or admin" on public.audit_events;
create policy "audit select own or connected or admin"
  on public.audit_events for select
  to authenticated
  using (
    (
      actor_user_id = (select auth.uid())
      or related_user_id = (select auth.uid())
      or (select (public.current_profile()).role) = 'admin'
    )
    and (select (public.current_profile()).active)
  );

-- ---------------------------------------------------------------------------
-- Sales: H2 rider/vehicle validation, M1 server-derived prices
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

  -- Validate lines and verify stock atomically. Unit prices are derived
  -- server-side: the selling price of the product's most recent priced
  -- receiving record at this store (confirmed automatic-price rule). The
  -- client never sets prices; any unit_price_minor sent is ignored.
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
    select r.selling_price_minor into up
      from public.receiving_records r
     where r.store_id = p_store_id
       and r.product_id = pid
       and r.selling_price_minor is not null
     order by r.received_at desc
     limit 1;
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
-- Payments: C2 guarded atomic balance decrement
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
-- Products: H1 active-caller check, M6 unique active names
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
  -- Adopted baseline (DEC-034): active product names are unique. Duplicate
  -- pending submissions are allowed; the conflict surfaces at approval.
  if exists (
    select 1 from public.products
    where status = 'active'
      and lower(btrim(name)) = lower(btrim(p_name))
  ) then
    raise exception 'That name is already taken by an active item.' using errcode = 'P0001';
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
  perform public.assert_active_caller();
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
  if exists (
    select 1 from public.products
    where status = 'active'
      and lower(btrim(name)) = lower(btrim(p.name))
      and id <> p_product_id
  ) then
    raise exception 'That name is already taken by an active item.' using errcode = 'P0001';
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
  perform public.assert_active_caller();
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
-- Vehicles: M3 audit event on creation
-- ---------------------------------------------------------------------------

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
  insert into public.audit_events (action, actor_user_id, store_id, subject, detail)
  values ('vehicle.added', caller.id, p_store_id, btrim(p_label), 'Active vehicle');
  return jsonb_build_object('vehicle_id', vid);
end;
$$;

-- ---------------------------------------------------------------------------
-- Staff management: M3 audit events, H1 session revocation on disable,
-- friendly store validation
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
set search_path = public, extensions
as $$
declare
  caller public.profiles;
  new_uid uuid;
  base_email text;
begin
  select * into caller from public.profiles where id = auth.uid();
  if caller.id is null then
    raise exception 'The recording staff member is not recognized.' using errcode = 'P0001';
  end if;
  if not caller.active then
    raise exception 'This account is disabled. Contact the admin.' using errcode = 'P0001';
  end if;
  if caller.role <> 'admin' then
    raise exception 'Only admins can manage staff.' using errcode = 'P0001';
  end if;
  if p_username is null or length(btrim(p_username)) = 0 then
    raise exception 'Username is required.' using errcode = 'P0001';
  end if;
  if p_role not in ('staff', 'admin') then
    raise exception 'Invalid role.' using errcode = 'P0001';
  end if;
  if p_role = 'staff' then
    if p_store_id is null then
      raise exception 'Each staff member must be assigned to a store.' using errcode = 'P0001';
    end if;
    if not exists (select 1 from public.stores where id = p_store_id) then
      raise exception 'Unknown store.' using errcode = 'P0001';
    end if;
  end if;
  if p_password is null or length(p_password) < 4 then
    raise exception 'Password must be at least 4 characters.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.profiles where username = lower(btrim(p_username))) then
    raise exception 'That username is already taken.' using errcode = 'P0001';
  end if;

  base_email := lower(btrim(p_username)) || '@zafone.local';

  -- Create the auth identity first (Supabase Auth table). GoTrue requires
  -- these token columns as non-NULL empty strings; direct inserts otherwise
  -- break the auth schema scan.
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new,
    email_change_token_current, email_change_confirm_status, reauthentication_token,
    phone, phone_confirmed_at, phone_change, phone_change_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    base_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('name', p_name),
    now(), now(),
    '', '', '', '', '', 0,
    '',
    null, null, '', ''
  ) returning id into new_uid;

  insert into public.profiles (id, username, name, role, store_id, active)
  values (new_uid, lower(btrim(p_username)), btrim(p_name), p_role,
    case when p_role = 'admin' then null else p_store_id end, true);

  -- Password sign-in needs one identity row (provider 'email').
  insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  values (new_uid, new_uid, new_uid, 'email',
    jsonb_build_object('sub', new_uid::text, 'email', base_email, 'email_verified', true),
    now(), now(), now());

  insert into public.audit_events (action, actor_user_id, related_user_id, subject, detail)
  values ('staff.added', caller.id, new_uid, btrim(p_name),
    case when p_role = 'staff' then 'Staff · ' || p_store_id else 'Admin' end);

  return jsonb_build_object('user_id', new_uid, 'email', base_email);
end;
$$;

create or replace function public.update_staff(
  p_user_id uuid,
  p_name text,
  p_username text,
  p_store_id text,
  p_active boolean,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller public.profiles;
  target public.profiles;
  new_email text;
  new_store_id text;
begin
  select * into caller from public.profiles where id = auth.uid();
  if caller.id is null then
    raise exception 'The recording staff member is not recognized.' using errcode = 'P0001';
  end if;
  if not caller.active then
    raise exception 'This account is disabled. Contact the admin.' using errcode = 'P0001';
  end if;
  if caller.role <> 'admin' then
    raise exception 'Only admins can manage staff.' using errcode = 'P0001';
  end if;

  select * into target from public.profiles where id = p_user_id;
  if target.id is null then
    raise exception 'User not found.' using errcode = 'P0001';
  end if;

  -- Username change: keep the auth identity in sync so login still resolves.
  if p_username is not null and lower(btrim(p_username)) <> target.username then
    if exists (
      select 1 from public.profiles
      where username = lower(btrim(p_username)) and id <> p_user_id
    ) then
      raise exception 'That username is already taken.' using errcode = 'P0001';
    end if;
    new_email := lower(btrim(p_username)) || '@zafone.local';
  end if;

  if p_name is not null and length(btrim(p_name)) = 0 then
    raise exception 'Staff name is required.' using errcode = 'P0001';
  end if;

  -- Store reassignment: validate the store and never clear a staff member's
  -- assignment (the profiles check constraint would reject it with a raw
  -- error; this gives the friendly copy instead).
  new_store_id := coalesce(case when p_store_id = '' then null else p_store_id end, target.store_id);
  if target.role = 'staff' then
    if new_store_id is null then
      raise exception 'Each staff member must be assigned to a store.' using errcode = 'P0001';
    end if;
    if p_store_id is not null and p_store_id <> ''
       and not exists (select 1 from public.stores where id = new_store_id) then
      raise exception 'Unknown store.' using errcode = 'P0001';
    end if;
  end if;

  update public.profiles
     set name = coalesce(p_name, name),
         username = coalesce(lower(btrim(p_username)), username),
         store_id = case
           when target.role = 'admin' then null
           else new_store_id
         end,
         active = coalesce(p_active, active)
   where id = p_user_id;

  -- Keep the auth identity consistent with the username convention.
  if new_email is not null then
    update auth.users
       set email = new_email,
           email_confirmed_at = coalesce(email_confirmed_at, now())
     where id = p_user_id;
    update auth.identities
       set identity_data = jsonb_set(
             jsonb_set(identity_data, '{sub}', to_jsonb(p_user_id::text)),
             '{email}', to_jsonb(new_email))
     where user_id = p_user_id;
    -- identity_data.email is mirrored by the email column (generated).
  end if;

  -- Disabling an account revokes its live sessions immediately — previously
  -- only a password reset did, leaving disabled accounts fully signed in.
  if p_active = false and target.active then
    delete from auth.sessions where user_id = p_user_id;
    delete from auth.refresh_tokens where user_id = p_user_id::text;
  end if;

  -- Optional password reset (Assumed: revokes existing sessions so the new
  -- credential is the only valid one).
  if p_password is not null then
    if length(p_password) < 4 then
      raise exception 'Password must be at least 4 characters.' using errcode = 'P0001';
    end if;
    update auth.users
       set encrypted_password = crypt(p_password, gen_salt('bf'))
     where id = p_user_id;
    delete from auth.sessions where user_id = p_user_id;
    delete from auth.refresh_tokens where user_id = p_user_id::text;
  end if;

  -- M3: staff management leaves an audit trail (never the credentials).
  if (p_name is not null and btrim(p_name) <> target.name)
     or new_email is not null
     or (p_store_id is not null and target.role = 'staff'
         and new_store_id is distinct from target.store_id)
     or (p_active is not null and p_active <> target.active)
     or p_password is not null then
    insert into public.audit_events (action, actor_user_id, related_user_id, subject, detail)
    values ('staff.updated', caller.id, p_user_id, target.name,
      concat_ws(' · ',
        case when p_name is not null and btrim(p_name) <> target.name then 'renamed' end,
        case when new_email is not null then 'username changed' end,
        case when p_store_id is not null and target.role = 'staff'
              and new_store_id is distinct from target.store_id
          then 'store reassigned' end,
        case when p_active is not null and p_active <> target.active
          then case when p_active then 'reactivated' else 'disabled' end end,
        case when p_password is not null then 'password reset' end));
  end if;

  return jsonb_build_object('user_id', p_user_id);
end;
$$;
