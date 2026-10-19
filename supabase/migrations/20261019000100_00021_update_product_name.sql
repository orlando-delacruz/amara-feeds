-- Admin-only product rename, so an inventory row's item name can be corrected
-- from the Edit stock dialog (client request 2026-10-19).
--
-- products.name is the single item name used by the inventory list AND the sale
-- catalog, so renaming is global by nature — there is no per-store item name.
-- The row being corrected is always an admin's (DEC-050 made all inventory
-- correction admin-only), so no new permission model is introduced.
--
-- Active-name uniqueness mirrors submit_product/approve_product (DEC-047 M6,
-- lower(btrim(...)) against active rows only) so a rename cannot smuggle in a
-- duplicate that submission and approval would have refused.

create or replace function public.update_product(p_product_id uuid, p_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  rec public.products;
begin
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();
  if caller.role <> 'admin' then
    raise exception 'Only admins can rename an item.' using errcode = 'P0001';
  end if;
  if p_name is null or length(btrim(p_name)) = 0 then
    raise exception 'Product name is required.' using errcode = 'P0001';
  end if;
  select * into rec from public.products where id = p_product_id;
  if rec.id is null then
    raise exception 'Product not found.' using errcode = 'P0001';
  end if;
  if lower(btrim(rec.name)) = lower(btrim(p_name)) then
    return jsonb_build_object('product_id', p_product_id, 'name', rec.name);
  end if;
  -- Same rule as submit_product: only ACTIVE names must stay unique.
  if exists (
    select 1 from public.products
    where id <> p_product_id
      and status = 'active'
      and lower(btrim(name)) = lower(btrim(p_name))
  ) then
    raise exception 'That name is already taken by an active item.' using errcode = 'P0001';
  end if;

  update public.products set name = btrim(p_name) where id = p_product_id;

  insert into public.audit_events (action, actor_user_id, subject, detail)
  values ('product.renamed', caller.id, btrim(p_name), 'Renamed from ' || rec.name);

  return jsonb_build_object('product_id', p_product_id, 'name', btrim(p_name));
end;
$$;

revoke all on function public.update_product(uuid, text) from public, anon;
grant execute on function public.update_product(uuid, text) to authenticated;