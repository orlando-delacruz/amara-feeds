-- ZAF ONE — one-time hosted data wipe (DEC-039)
--
-- Removes all business data and every non-owner account from the linked
-- hosted project, keeping only:
--   - auth user `owner@zafone.local` + the `owner` admin profile
--   - reference rows: `stores` (amara, zeann), `payment_terms` (7/15/30)
--
-- NOT a migration: `migrations/` rerun on every `db reset/redesign` — this is
-- a deliberate live-data wipe. Run against the linked project only:
--   npx supabase db query --linked --file supabase/cleanup/wipe-business-data.sql
--
-- Deletion order respects FK restrict constraints:
--   payments →r credit_obligations
--   sale_lines →r products        (deleted before products)
--   stock_levels →r products
--   receiving_records →r products
-- and stays inside one transaction: any failure rolls back everything.

begin;

delete from public.payments;
delete from public.credit_obligations;
delete from public.sale_lines;
delete from public.sales;
delete from public.receiving_records;
delete from public.stock_levels;
delete from public.expenses;
delete from public.riders;
delete from public.vehicles;
delete from public.products;
delete from public.customers;
delete from public.audit_events;

-- Non-owner accounts (alice, ben, orlando). Cascades delete their profiles
-- (on delete cascade), auth.identities, sessions, and refresh tokens.
delete from auth.users
where email in (
  'alice@zafone.local',
  'ben@zafone.local',
  'orlando@zafone.local'
);

commit;

-- Post-wipe summary (printed after the transaction because command success
-- is checked via exit code; run the verification queries separately).
select
  (select count(*) from public.customers) + (select count(*) from public.products)
  + (select count(*) from public.sales) + (select count(*) from public.credit_obligations)
  + (select count(*) from public.payments) + (select count(*) from public.audit_events)
  + (select count(*) from public.stock_levels) + (select count(*) from public.receiving_records)
  + (select count(*) from public.expenses) + (select count(*) from public.riders)
  + (select count(*) from public.vehicles) as business_rows_left,
  (select count(*) from public.profiles) as profile_rows,
  (select count(*) from public.stores) as stores,
  (select count(*) from public.payment_terms) as terms;