-- ZAF ONE — 00011: Soft product rejection (DEC-051)
--
-- reject_product used to delete the product row. Pending products can
-- legitimately already carry receiving records and stock (staff receive
-- before an admin approves), and products are FK-restricted by
-- receiving_records / stock_levels / sale_lines — so rejection hit
-- 23503 and could never succeed for received products.
--
-- Rejection becomes a soft state, consistent with the DEC-050 reversal
-- philosophy: the record is kept (history stays intact), hidden from the
-- catalog and the pending-approval list, and never resubmittable this round.
-- Existing 'pending'/'active' rows are unaffected by the extended check.

alter table public.products
  drop constraint products_status_check;

alter table public.products
  add constraint products_status_check
  check (status in ('pending', 'active', 'rejected'));

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

  -- Soft reject: keep the product record and any receiving/stock history.
  update public.products
     set status = 'rejected'
   where id = p_product_id
     and status = 'pending';

  insert into public.audit_events (action, actor_user_id, related_user_id, subject, detail)
  values ('product.rejected', caller.id, p.created_by_user_id, p.name,
    case when p_product_id
      in (select product_id from public.receiving_records where product_id = p_product_id)
    then 'Rejected — kept for its records'
    else 'Rejected' end);

  return jsonb_build_object('product_id', p_product_id);
end;
$$;

revoke all on function public.reject_product(uuid) from public, anon;
grant execute on function public.reject_product(uuid) to authenticated;
