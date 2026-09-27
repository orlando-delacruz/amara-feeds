-- ZAF ONE — 00018: Editable credit interest on the detail page (DEC-062)
--
-- The interest column (00016) could only be set while encoding. Admins can
-- now set, change, or clear it from the credit detail view. Interest stays
-- display-only: balance, payments, and status flow exactly as before, and
-- voided (undone) credits refuse the change.
--
-- New RPC, so old frontends are unaffected. Grants follow the house pattern.

create or replace function public.update_credit_interest(
  p_credit_id uuid,
  p_interest_minor integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  credit public.credit_obligations;
  cust_name text;
begin
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();
  if caller.role <> 'admin' then
    raise exception 'Only admins can update credit interest.' using errcode = 'P0001';
  end if;
  select * into credit from public.credit_obligations where id = p_credit_id;
  if credit.id is null then
    raise exception 'Credit not found.' using errcode = 'P0001';
  end if;
  if credit.status = 'voided' then
    raise exception 'Undone credits cannot be changed.' using errcode = 'P0001';
  end if;
  if p_interest_minor is not null and p_interest_minor < 0 then
    raise exception 'Credit interest cannot be negative.' using errcode = 'P0001';
  end if;

  update public.credit_obligations
     set interest_minor = p_interest_minor
   where id = p_credit_id;

  select name into cust_name from public.customers where id = credit.customer_id;

  insert into public.audit_events (action, actor_user_id, store_id, subject, detail)
  values ('credit.interest_updated', caller.id, credit.origin_store_id,
    coalesce(cust_name, 'Customer'),
    case when p_interest_minor is null
      then 'Interest cleared'
      else 'Interest set to ' || to_char(p_interest_minor / 100.0, 'FM999999990.00')
    end);

  return jsonb_build_object('credit_id', p_credit_id);
end;
$$;

revoke all on function public.update_credit_interest(uuid, integer) from public, anon;
grant execute on function public.update_credit_interest(uuid, integer) to authenticated;
