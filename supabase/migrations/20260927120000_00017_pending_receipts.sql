-- ZAF ONE — 00017: Pending stock receipts with admin approval (DEC-060)
--
-- New receipts start 'pending' and never touch inventory until an admin
-- approves them; approval applies the quantity exactly once, rejection keeps
-- the row without touching inventory. The default 'approved' grandfathers
-- every existing row in place: live receipts never pass through approval,
-- live stock_levels rows are never rewritten, and nothing can double-count.
--
-- `record_receiving` keeps its signature (plain CREATE OR REPLACE): the
-- receipt insert gains status 'pending' and the stock upsert moves to
-- `approve_receipt`. Product approval stays independent — a receipt may be
-- approved while its product is still pending, as before.
-- Additive only: one column, two new functions, no existing-row writes.

alter table public.receiving_records
  add column status text not null default 'approved'
  check (status in ('pending', 'approved', 'rejected'));

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

  -- Pending by default: inventory moves only on admin approval.
  insert into public.receiving_records (
    store_id, product_id, quantity, supplier, cost_price_minor,
    selling_price_minor, rider_id, vehicle_id, recorded_by_user_id, status
  ) values (
    p_store_id, p_product_id, p_quantity, btrim(p_supplier), p_cost_price_minor,
    p_selling_price_minor, p_rider_id, p_vehicle_id, caller.id, 'pending'
  ) returning id into rec_id;

  insert into public.audit_events (action, actor_user_id, store_id, subject, detail)
  values ('receiving.recorded', caller.id, p_store_id,
    coalesce((select name from public.products where id = p_product_id), 'Item'),
    p_quantity::text || ' pcs from ' || btrim(p_supplier) || ' · pending approval');

  return jsonb_build_object('receiving_id', rec_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- approve_receipt / reject_receipt — admin-only receipt review (exactly once)
-- ---------------------------------------------------------------------------

create or replace function public.approve_receipt(p_receipt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  rec public.receiving_records;
begin
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();
  if caller.role <> 'admin' then
    raise exception 'Only admins can approve a receipt.' using errcode = 'P0001';
  end if;
  select * into rec from public.receiving_records where id = p_receipt_id for update;
  if rec.id is null then
    raise exception 'Receipt not found.' using errcode = 'P0001';
  end if;
  if rec.status <> 'pending' then
    raise exception 'Only pending receipts can be approved.' using errcode = 'P0001';
  end if;

  -- Apply the quantity exactly once, with the automatic-price rule a
  -- same-day receipt would have carried: the receipt's selling price becomes
  -- the stock row's current selling price (null leaves it untouched).
  insert into public.stock_levels (store_id, product_id, quantity, price_minor)
  values (rec.store_id, rec.product_id, rec.quantity, rec.selling_price_minor)
  on conflict (store_id, product_id)
  do update set quantity = public.stock_levels.quantity + excluded.quantity,
                price_minor = coalesce(excluded.price_minor, public.stock_levels.price_minor);

  update public.receiving_records set status = 'approved' where id = p_receipt_id;

  insert into public.audit_events (action, actor_user_id, store_id, subject, detail)
  values ('receipt.approved', caller.id, rec.store_id,
    coalesce((select name from public.products where id = rec.product_id), 'Item'),
    rec.quantity::text || ' pcs added to inventory');

  return jsonb_build_object('receiving_id', p_receipt_id);
end;
$$;

create or replace function public.reject_receipt(p_receipt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  rec public.receiving_records;
begin
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();
  if caller.role <> 'admin' then
    raise exception 'Only admins can reject a receipt.' using errcode = 'P0001';
  end if;
  select * into rec from public.receiving_records where id = p_receipt_id for update;
  if rec.id is null then
    raise exception 'Receipt not found.' using errcode = 'P0001';
  end if;
  if rec.status <> 'pending' then
    raise exception 'Only pending receipts can be rejected.' using errcode = 'P0001';
  end if;

  update public.receiving_records set status = 'rejected' where id = p_receipt_id;

  insert into public.audit_events (action, actor_user_id, store_id, subject, detail)
  values ('receipt.rejected', caller.id, rec.store_id,
    coalesce((select name from public.products where id = rec.product_id), 'Item'),
    rec.quantity::text || ' pcs rejected, inventory untouched');

  return jsonb_build_object('receiving_id', p_receipt_id);
end;
$$;

revoke all on function public.approve_receipt(uuid) from public, anon;
grant execute on function public.approve_receipt(uuid) to authenticated;
revoke all on function public.reject_receipt(uuid) from public, anon;
grant execute on function public.reject_receipt(uuid) to authenticated;
