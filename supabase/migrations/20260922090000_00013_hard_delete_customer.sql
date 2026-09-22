-- ZAF ONE — 00013: Admin-only hard customer deletion (DEC-053)
--
-- Replaces the DEC-049 guarded delete: an admin can now delete a customer
-- together with that customer's sales, credit obligations, and payments.
-- Deletion is refused only while the customer carries an outstanding
-- (non-voided, unpaid) credit balance, protecting collections. Settled and
-- voided credits are removed along with the customer.
--
-- Deleted history is gone permanently — dashboards, History, and report
-- exports will no longer include it. This is an explicit client-accepted
-- trade-off that supersedes the DEC-049 refusal.
--
-- Same signature as 00009's delete_customer, so old frontends tolerate the
-- new database. Grants are unchanged (authenticated-only since 00009;
-- CREATE OR REPLACE preserves them).

create or replace function public.delete_customer(p_customer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  cust_name text;
  sale_count integer;
  credit_count integer;
  payment_count integer;
begin
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();
  if caller.role <> 'admin' then
    raise exception 'Only admins can delete a customer.' using errcode = 'P0001';
  end if;
  select name into cust_name from public.customers where id = p_customer_id;
  if cust_name is null then
    raise exception 'Customer not found.' using errcode = 'P0001';
  end if;

  -- Collections guard: an outstanding credit blocks deletion outright.
  if exists (
    select 1 from public.credit_obligations
    where customer_id = p_customer_id
      and status = 'outstanding'
  ) then
    raise exception 'This customer has an outstanding credit balance and cannot be deleted.' using errcode = 'P0001';
  end if;

  -- Cascade inside the transaction: payments -> credits -> sales
  -- (sale_lines cascade from sales) -> the customer row.
  select count(*) into payment_count
    from public.payments p
    join public.credit_obligations c on c.id = p.credit_id
   where c.customer_id = p_customer_id;
  delete from public.payments p
   using public.credit_obligations c
   where p.credit_id = c.id
     and c.customer_id = p_customer_id;

  select count(*) into credit_count
    from public.credit_obligations
   where customer_id = p_customer_id;
  delete from public.credit_obligations where customer_id = p_customer_id;

  select count(*) into sale_count
    from public.sales
   where customer_id = p_customer_id;
  delete from public.sales where customer_id = p_customer_id;

  delete from public.customers where id = p_customer_id;

  insert into public.audit_events (action, actor_user_id, subject, detail)
  values ('customer.deleted', caller.id, cust_name,
    'Deleted with ' || sale_count || ' sale(s), '
      || credit_count || ' credit(s), ' || payment_count || ' payment(s)');

  return jsonb_build_object('customer_id', p_customer_id);
end;
$$;
