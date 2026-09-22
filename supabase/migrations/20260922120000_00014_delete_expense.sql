-- ZAF ONE — 00014: Admin-only expense deletion (DEC-055)
--
-- Admins can delete a recorded expense from the Expenses page. No other table
-- references expenses, so the delete is a single-row removal with no cascade:
-- per-rider/vehicle net summaries recompute from the remaining rows, and the
-- by-date summary plus report export follow automatically.
--
-- New RPC, so old frontends are unaffected. Grants follow the house pattern
-- (revoked from public/anon, executable by authenticated; the function itself
-- enforces the admin role).

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
    case when rec.type = 'fuel' then 'Fuel expense' else 'Repair expense' end,
    'Deleted ' || to_char(rec.amount_minor / 100.0, 'FM999999990.00'));

  return jsonb_build_object('expense_id', p_expense_id);
end;
$$;

revoke all on function public.delete_expense(uuid) from public, anon;
grant execute on function public.delete_expense(uuid) to authenticated;
