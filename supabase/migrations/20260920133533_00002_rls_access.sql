-- ZAF ONE — 00002: Row Level Security + access helper
--
-- Access model (docs/SECURITY.md §3-4):
--   - staff: read/write own-store rows; read shared rows (customers, credit,
--     payments) cross-store with attribution intact
--   - admin: both stores, approvals, profiles, audit
--   - anonymous: nothing
-- Pattern: `to authenticated` + an ownership predicate. No `auth.role()`,
-- no `raw_user_meta_data`.

-- Helper: current user's profile. SECURITY DEFINER (postgres-owned) so
-- `profiles` policies can read it without recursive RLS; it only ever
-- returns the row whose id equals auth.uid(). Execute is revoked from
-- public/anon below. Policies reference it via `(select ...)` so auth.uid()
-- is evaluated once (initplan), not per row.
create or replace function public.current_profile()
returns public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.profiles
  where id = (select auth.uid())
$$;

revoke all on function public.current_profile() from public, anon;
grant execute on function public.current_profile() to authenticated;

-- Enable RLS everywhere (defense in depth; every exposed table).
alter table public.stores enable row level security;
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.riders enable row level security;
alter table public.vehicles enable row level security;
alter table public.payment_terms enable row level security;
alter table public.stock_levels enable row level security;
alter table public.receiving_records enable row level security;
alter table public.sales enable row level security;
alter table public.sale_lines enable row level security;
alter table public.credit_obligations enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.audit_events enable row level security;

-- Reference/dimension rows: readable by any authenticated user.
create policy "stores readable by authenticated"
  on public.stores for select
  to authenticated using (true);

create policy "payment_terms readable by authenticated"
  on public.payment_terms for select
  to authenticated using (true);

-- profiles: users manage their own row; admins read and manage all.
create policy "profiles read own or admin all"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or (select (public.current_profile()).role) = 'admin');

create policy "profiles update own"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Admin-only profile writes (create handled via create_staff function).
create policy "profiles insert admin"
  on public.profiles for insert
  to authenticated
  with check ((select (public.current_profile()).role) = 'admin');

create policy "profiles delete admin"
  on public.profiles for delete
  to authenticated
  using ((select (public.current_profile()).role) = 'admin');

-- Shared customers: visible to every authenticated user cross-store.
create policy "customers read authenticated"
  on public.customers for select
  to authenticated using (true);

-- Customer creation is allowed for any authenticated staff/admin (customer add
-- is part of the confirmed workflow for both roles), constrained to a valid,
-- non-blank name.
create policy "customers insert authenticated"
  on public.customers for insert
  to authenticated
  with check (length(btrim(name)) > 0);

-- Products: all authenticated can read active; pending products visible to
-- their submitter and to admins.
create policy "products read active or owner or admin"
  on public.products for select
  to authenticated
  using (
    status = 'active'
    or created_by_user_id = (select auth.uid())
    or (select (public.current_profile()).role) = 'admin'
  );

-- Staff submit products (pending); admins approve via function (00003).
create policy "products insert authenticated"
  on public.products for insert
  to authenticated
  with check (status = 'pending');

-- Riders/vehicles: staff operate their own store's rows; admins both.
create policy "riders select own store"
  on public.riders for select
  to authenticated
  using (
    store_id = (select (public.current_profile()).store_id)
    or (select (public.current_profile()).role) = 'admin'
  );

create policy "riders insert own store"
  on public.riders for insert
  to authenticated
  with check (
    store_id = (select (public.current_profile()).store_id)
    or (select (public.current_profile()).role) = 'admin'
  );

create policy "riders update own store"
  on public.riders for update
  to authenticated
  using (
    store_id = (select (public.current_profile()).store_id)
    or (select (public.current_profile()).role) = 'admin'
  )
  with check (
    store_id = (select (public.current_profile()).store_id)
    or (select (public.current_profile()).role) = 'admin'
  );

create policy "vehicles select own store"
  on public.vehicles for select
  to authenticated
  using (
    store_id = (select (public.current_profile()).store_id)
    or (select (public.current_profile()).role) = 'admin'
  );

create policy "vehicles insert own store"
  on public.vehicles for insert
  to authenticated
  with check (
    store_id = (select (public.current_profile()).store_id)
    or (select (public.current_profile()).role) = 'admin'
  );

create policy "vehicles update own store"
  on public.vehicles for update
  to authenticated
  using (
    store_id = (select (public.current_profile()).store_id)
    or (select (public.current_profile()).role) = 'admin'
  )
  with check (
    store_id = (select (public.current_profile()).store_id)
    or (select (public.current_profile()).role) = 'admin'
  );

-- Stock levels: store-scoped reads; writes go through functions (00003).
create policy "stock select own store"
  on public.stock_levels for select
  to authenticated
  using (
    store_id = (select (public.current_profile()).store_id)
    or (select (public.current_profile()).role) = 'admin'
  );

-- Receiving: store-scoped read; insert via function (00003).
create policy "receiving select own store"
  on public.receiving_records for select
  to authenticated
  using (
    store_id = (select (public.current_profile()).store_id)
    or (select (public.current_profile()).role) = 'admin'
  );

-- Sales + lines: store-scoped read; insert via function (00003).
create policy "sales select own store"
  on public.sales for select
  to authenticated
  using (
    store_id = (select (public.current_profile()).store_id)
    or (select (public.current_profile()).role) = 'admin'
  );

create policy "sale_lines select via parent sale"
  on public.sale_lines for select
  to authenticated
  using (
    exists (
      select 1 from public.sales s
      where s.id = sale_id
        and (
          s.store_id = (select (public.current_profile()).store_id)
          or (select (public.current_profile()).role) = 'admin'
        )
    )
  );

-- Credit obligations: shared, readable cross-store by every authenticated user.
create policy "credit select authenticated"
  on public.credit_obligations for select
  to authenticated using (true);

-- Payments: shared, readable cross-store; insert via function (00003).
create policy "payments select authenticated"
  on public.payments for select
  to authenticated using (true);

-- Expenses: store-scoped read; insert via function (00003).
create policy "expenses select own store"
  on public.expenses for select
  to authenticated
  using (
    store_id = (select (public.current_profile()).store_id)
    or (select (public.current_profile()).role) = 'admin'
  );

-- Audit: staff see own + connected admin events; admins see all (matches the
-- mock `listAuditEventsForUser` visibility rule).
create policy "audit select own or connected or admin"
  on public.audit_events for select
  to authenticated
  using (
    actor_user_id = (select auth.uid())
    or related_user_id = (select auth.uid())
    or (select (public.current_profile()).role) = 'admin'
  );

-- Writes that are not admin-gated at the RLS layer are performed exclusively
-- through the atomic functions in 00003 (SECURITY DEFINER), so the
-- corresponding insert/update/delete policies intentionally stay absent here:
-- direct table writes are denied by default (no policy = deny).