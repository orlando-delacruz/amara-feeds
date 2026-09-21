-- ZAF ONE — 00006: Pending-seed parity (DEC-037)
--
-- The seed's demo item "Cooking Oil 1L" (prod-3, status pending) represented
-- a staff-submitted item but shipped with no receiving record and no stock —
-- so approving it made the product appear in the catalog while inventory
-- stayed empty. In the real workflow a pending item is submitted through a
-- receiving record that immediately creates stock, so the seed now mirrors
-- that: one receipt at Amara plus the matching stock row. Approval behavior
-- is unchanged (approval activates the product; stock comes from receiving).

insert into public.receiving_records (
  id, store_id, product_id, quantity, supplier, cost_price_minor,
  selling_price_minor, rider_id, vehicle_id, recorded_by_user_id, received_at
) values (
  'eeeeeeee-0000-0000-0000-000000000007',
  'amara',
  'bbbbbbbb-0000-0000-0000-000000000003',
  15,
  'Local Market',
  8200,
  9800,
  'cccccccc-0000-0000-0000-000000000001',
  'dddddddd-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  now() - interval '1 day'
);

insert into public.stock_levels (store_id, product_id, quantity)
values ('amara', 'bbbbbbbb-0000-0000-0000-000000000003', 15)
on conflict (store_id, product_id)
do update set quantity = public.stock_levels.quantity + excluded.quantity;