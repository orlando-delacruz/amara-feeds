-- ZAF ONE — 00015: Admin-only expense editing (DEC-056)
--
-- Admins can correct a recorded expense's target (rider/vehicle), type,
-- amount, and note from the Expenses page. The record's store never changes.
-- Validation mirrors create_expense: amount must be positive, at least one of
-- rider/vehicle is required, and the target must be active at the record's
-- store. Net, by-date, and report figures recompute from the corrected rows.
--
-- New RPC, so old frontends are unaffected. Grants follow the house pattern.

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
  if p_type not in ('fuel', 'repair') then
    raise exception 'Expense type must be fuel or repair.' using errcode = 'P0001';
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
    case when p_type = 'fuel' then 'Fuel expense' else 'Repair expense' end,
    'Corrected to ' || to_char(p_amount_minor / 100.0, 'FM999999990.00'));

  return jsonb_build_object('expense_id', p_expense_id);
end;
$$;

revoke all on function public.update_expense(uuid, uuid, uuid, text, integer, text) from public, anon;
grant execute on function public.update_expense(uuid, uuid, uuid, text, integer, text) to authenticated;
