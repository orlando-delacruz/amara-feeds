-- ZAF ONE — 00001: Schema (tables, constraints, enums)
--
-- Mirrors the mock domain shapes (src/domain, src/services/mocks/seed.ts).
-- Money is stored in integer minor units (pesos x 100). Business dates are
-- `date`; record timestamps are `timestamptz`. All adopted business rules are
-- flagged Assumed in docs/DECISIONS.md (DEC-034).

-- Store is a fixed two-row dimension (exactly two stores, confirmed).
create table public.stores (
  id text primary key check (id in ('amara', 'zeann')),
  name text not null
);

-- Staff/admin identity, one row per auth user (DEC-035).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  name text not null,
  role text not null check (role in ('staff', 'admin')),
  store_id text references public.stores (id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint staff_requires_store check (role = 'admin' or store_id is not null)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text,
  address text,
  created_by_user_id uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'pending' check (status in ('pending', 'active')),
  created_by_user_id uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint products_name_not_blank check (length(btrim(name)) > 0)
);

-- Per-store riders and vehicle types (never shared across stores).
create table public.riders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  store_id text not null references public.stores (id),
  active boolean not null default true,
  created_by_user_id uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  store_id text not null references public.stores (id),
  active boolean not null default true,
  created_by_user_id uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

-- Payment terms are a fixed reference set (Assumed: 7/15/30 days).
create table public.payment_terms (
  id text primary key,
  label text not null,
  offset_days integer not null check (offset_days >= 0)
);

-- Per-store current stock quantity per product.
create table public.stock_levels (
  store_id text not null references public.stores (id),
  product_id uuid not null references public.products (id) on delete restrict,
  quantity integer not null default 0 check (quantity >= 0),
  primary key (store_id, product_id)
);

-- Store-specific stock receipts.
create table public.receiving_records (
  id uuid primary key default gen_random_uuid(),
  store_id text not null references public.stores (id),
  product_id uuid not null references public.products (id) on delete restrict,
  quantity integer not null check (quantity > 0),
  supplier text not null check (length(btrim(supplier)) > 0),
  cost_price_minor integer not null check (cost_price_minor >= 0),
  selling_price_minor integer check (selling_price_minor >= 0),
  -- legacy optional rider/vehicle references (no longer collected on the form)
  rider_id uuid references public.riders (id),
  vehicle_id uuid references public.vehicles (id),
  recorded_by_user_id uuid not null references public.profiles (id),
  received_at timestamptz not null default now()
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  store_id text not null references public.stores (id),
  sale_date date not null,
  customer_id uuid references public.customers (id),
  payment_type text not null check (payment_type in ('cash', 'charge')),
  payment_method text check (payment_method is null or length(btrim(payment_method)) > 0),
  delivery_fee_minor integer not null default 0 check (delivery_fee_minor >= 0),
  delivery_rider_id uuid references public.riders (id),
  delivery_vehicle_id uuid references public.vehicles (id),
  discount_minor integer not null default 0 check (discount_minor >= 0),
  total_minor integer not null check (total_minor >= 0),
  recorded_by_user_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.sale_lines (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price_minor integer not null check (unit_price_minor >= 0)
);

create index sale_lines_sale_idx on public.sale_lines (sale_id);

-- Shared credit obligations (shared across both stores, traceable origin store).
create table public.credit_obligations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id),
  origin_store_id text not null references public.stores (id),
  sale_id uuid references public.sales (id),
  terms_id text not null references public.payment_terms (id),
  due_date date not null,
  original_amount_minor integer not null check (original_amount_minor >= 0),
  balance_minor integer not null check (balance_minor >= 0),
  status text not null default 'outstanding' check (status in ('outstanding', 'settled')),
  created_at timestamptz not null default now(),
  constraint balance_not_exceed_original check (balance_minor <= original_amount_minor)
);

-- Cross-store payments against shared credit obligations.
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  credit_id uuid not null references public.credit_obligations (id) on delete restrict,
  store_id text not null references public.stores (id),
  amount_minor integer not null check (amount_minor > 0),
  method text check (method is null or length(btrim(method)) > 0),
  recorded_by_user_id uuid not null references public.profiles (id),
  paid_at timestamptz not null default now()
);

-- Per-store fuel/repair expenses against a rider or vehicle.
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  store_id text not null references public.stores (id),
  rider_id uuid references public.riders (id),
  vehicle_id uuid references public.vehicles (id),
  type text not null check (type in ('fuel', 'repair')),
  amount_minor integer not null check (amount_minor > 0),
  note text,
  recorded_by_user_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint expense_needs_rider_or_vehicle check (rider_id is not null or vehicle_id is not null)
);

-- Business-wide audit trail (frontend audit log moves here).
create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  actor_user_id uuid not null references public.profiles (id),
  store_id text references public.stores (id),
  related_user_id uuid references public.profiles (id),
  subject text not null,
  detail text,
  created_at timestamptz not null default now()
);

-- Seed the two stores and the assumed payment-term reference rows.
insert into public.stores (id, name) values
  ('amara', 'Amara'),
  ('zeann', 'Zeann');

insert into public.payment_terms (id, label, offset_days) values
  ('terms-7', '7 days', 7),
  ('terms-15', '15 days', 15),
  ('terms-30', '30 days', 30);