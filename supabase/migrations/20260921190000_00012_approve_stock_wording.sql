-- ZAF ONE — 00012: Refresh the approve_stock audit wording (DEC-048/050)
--
-- DEC-050 made inventory correction admin-only outright, so the earlier
-- audit detail "Inventory approved — staff edits locked" no longer describes
-- what approval means (it implied pre-approval staff edits, which no longer
-- exist). Approval is now a verification marker: the record and behavior are
-- unchanged; only the audit detail wording is refreshed. Existing rows that
-- were only approved this way, and history rows, are unaffected.

create or replace function public.approve_stock(
  p_store_id text,
  p_product_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  product_name text;
begin
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();
  if caller.role <> 'admin' then
    raise exception 'Only admins can approve inventory.' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.stock_levels
    where store_id = p_store_id and product_id = p_product_id
  ) then
    raise exception 'Stock not found.' using errcode = 'P0001';
  end if;

  -- Idempotent: approving an approved row is a no-op.
  update public.stock_levels
     set admin_approved = true
   where store_id = p_store_id
     and product_id = p_product_id
     and not admin_approved;

  if found then
    select coalesce(name, 'Item') into product_name from public.products where id = p_product_id;
    insert into public.audit_events (action, actor_user_id, store_id, subject, detail)
    values ('stock.approved', caller.id, p_store_id, product_name,
      'Inventory approved — counted and verified');
  end if;

  return jsonb_build_object('store_id', p_store_id, 'product_id', p_product_id);
end;
$$;

revoke all on function public.approve_stock(text, uuid) from public, anon;
grant execute on function public.approve_stock(text, uuid) to authenticated;
