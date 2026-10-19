-- Adds the 'office_supplies_other' expense type (client request 2026-10-19).
--
-- One additional type covering office supplies and misc, not two: it reports as
-- a single "Other" bucket in the by-date summary and the Expenses report sheet.
--
-- The fuel/repair pair is the assumed baseline from DEC-034; this widens it
-- rather than replacing it, so existing rows and their audit trail are untouched.
--
-- The three expense RPCs are re-created with the SAME signatures (only their
-- bodies change), so no drop-old is needed — unlike 00016/00018/00019, where a
-- parameter was added and the old signature had to be dropped.

-- ---------------------------------------------------------------------------
-- Widen the type constraint (column-level check, auto-named expenses_type_check)
-- ---------------------------------------------------------------------------

alter table public.expenses
  drop constraint if exists expenses_type_check;

alter table public.expenses
  add constraint expenses_type_check
  check (type in ('fuel', 'repair', 'office_supplies_other'));

-- ---------------------------------------------------------------------------
-- Record an expense. Signature unchanged.
-- ---------------------------------------------------------------------------

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
    case p_type
      when 'fuel' then 'Fuel expense'
      when 'repair' then 'Repair expense'
      else 'Office supplies / other expense'
    end, p_note);

  return jsonb_build_object('expense_id', eid);
end;
$$;

-- ---------------------------------------------------------------------------
-- Correct an expense (admin-only). Signature unchanged.
-- ---------------------------------------------------------------------------

create or replace function public.update_expense(
  p_expense_id uuid,
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
  rec public.expenses;
begin
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();
  if caller.role <> 'admin' then
    raise exception 'Only admins can edit an expense.' using errcode = 'P0001';
  end if;
  select * into rec from public.expenses where id = p_expense_id;
  if rec.id is null then
    raise exception 'Expense not found.' using errcode = 'P0001';
  end if;
  if p_type not in ('fuel', 'repair', 'office_supplies_other') then
    raise exception 'Expense type is not recognised.' using errcode = 'P0001';
  end if;
  if p_amount_minor <= 0 then
    raise exception 'Expense amount must be greater than zero.' using errcode = 'P0001';
  end if;
  if p_rider_id is null and p_vehicle_id is null then
    raise exception 'Assign the expense to a rider or vehicle.' using errcode = 'P0001';
  end if;
  if p_rider_id is not null and not exists (
    select 1 from public.riders r
    where r.id = p_rider_id and r.store_id = rec.store_id and r.active
  ) then
    raise exception 'Selected rider is not active at this store.' using errcode = 'P0001';
  end if;
  if p_vehicle_id is not null and not exists (
    select 1 from public.vehicles v
    where v.id = p_vehicle_id and v.store_id = rec.store_id and v.active
  ) then
    raise exception 'Selected vehicle is not active at this store.' using errcode = 'P0001';
  end if;

  update public.expenses
     set rider_id = p_rider_id,
         vehicle_id = p_vehicle_id,
         type = p_type,
         amount_minor = p_amount_minor,
         note = case when p_note is null then null else nullif(btrim(p_note), '') end
   where id = p_expense_id;

  insert into public.audit_events (action, actor_user_id, store_id, subject, detail)
  values ('expense.updated', caller.id, rec.store_id,
    case p_type
      when 'fuel' then 'Fuel expense'
      when 'repair' then 'Repair expense'
      else 'Office supplies / other expense'
    end,
    'Corrected to ' || to_char(p_amount_minor / 100.0, 'FM999999990.00'));

  return jsonb_build_object('expense_id', p_expense_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Delete an expense (admin-only). Signature unchanged.
-- ---------------------------------------------------------------------------

create or replace function public.delete_expense(p_expense_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  rec public.expenses;
begin
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();
  if caller.role <> 'admin' then
    raise exception 'Only admins can delete an expense.' using errcode = 'P0001';
  end if;
  select * into rec from public.expenses where id = p_expense_id;
  if rec.id is null then
    raise exception 'Expense not found.' using errcode = 'P0001';
  end if;

  delete from public.expenses where id = p_expense_id;

  insert into public.audit_events (action, actor_user_id, store_id, subject, detail)
  values ('expense.deleted', caller.id, rec.store_id,
    case rec.type
      when 'fuel' then 'Fuel expense'
      when 'repair' then 'Repair expense'
      else 'Office supplies / other expense'
    end,
    'Deleted ' || to_char(rec.amount_minor / 100.0, 'FM999999990.00'));

  return jsonb_build_object('expense_id', p_expense_id);
end;
$$;

revoke all on function public.create_expense(text, uuid, uuid, text, integer, text) from public, anon;
grant execute on function public.create_expense(text, uuid, uuid, text, integer, text) to authenticated;
revoke all on function public.update_expense(uuid, uuid, uuid, text, integer, text) from public, anon;
grant execute on function public.update_expense(uuid, uuid, uuid, text, integer, text) to authenticated;
revoke all on function public.delete_expense(uuid) from public, anon;
grant execute on function public.delete_expense(uuid) to authenticated;