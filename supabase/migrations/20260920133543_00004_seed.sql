-- ZAF ONE — 00004: Development-parity seed (TESTING.md §9)
--
-- Mirrors the mock seed facts (src/services/mocks/seed.ts) in shape only.
-- Customers/products/names are FAKE development data — no real customer data.
-- Auth users carry the known dev passwords (alice123 / ben123 / admin123,
-- Assumed, DEC-034) and use fabricated email handles on a .local domain.

-- crypt()/gen_salt() live in the extensions schema (pgcrypto); make them
-- resolvable in both local (db reset) and hosted (db push) migration runs.
set search_path = public, extensions;

-- Fixed UUIDs keep profiles/FKs stable across resets.
-- GoTrue requires non-NULL empty strings on these token columns; direct SQL
-- inserts leave them NULL which breaks the auth schema scan ("Database error
-- querying schema"). Values mirror Supabase's own user-creation defaults.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, email_change_confirm_status, reauthentication_token,
  phone, phone_confirmed_at, phone_change, phone_change_token
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated', 'authenticated',
    'alice@zafone.local',
    crypt('alice123', gen_salt('bf')),
    now(), jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('name', 'Alice (Amara staff)'), now(), now(),
    '', '', '', '', '', 0, '', null, null, '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated', 'authenticated',
    'ben@zafone.local',
    crypt('ben123', gen_salt('bf')),
    now(), jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('name', 'Ben (Zeann staff)'), now(), now(),
    '', '', '', '', '', 0, '', null, null, '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333333',
    'authenticated', 'authenticated',
    'owner@zafone.local',
    crypt('admin123', gen_salt('bf')),
    now(), jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('name', 'Owner (admin)'), now(), now(),
    '', '', '', '', '', 0, '', null, null, '', ''
  );

-- GoTrue password sign-in also needs one identity row per user (provider
-- 'email'). This mirrors what auth API user creation produces.
insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
values
  (
    '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111', 'email',
    jsonb_build_object('sub', '11111111-1111-1111-1111-111111111111', 'email', 'alice@zafone.local', 'email_verified', true),
    now(), now(), now()
  ),
  (
    '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222', 'email',
    jsonb_build_object('sub', '22222222-2222-2222-2222-222222222222', 'email', 'ben@zafone.local', 'email_verified', true),
    now(), now(), now()
  ),
  (
    '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333', 'email',
    jsonb_build_object('sub', '33333333-3333-3333-3333-333333333333', 'email', 'owner@zafone.local', 'email_verified', true),
    now(), now(), now()
  );

insert into public.profiles (id, username, name, role, store_id, active) values
  ('11111111-1111-1111-1111-111111111111', 'alice', 'Alice (Amara staff)', 'staff', 'amara', true),
  ('22222222-2222-2222-2222-222222222222', 'ben', 'Ben (Zeann staff)', 'staff', 'zeann', true),
  ('33333333-3333-3333-3333-333333333333', 'owner', 'Owner (admin)', 'admin', null, true);

-- Customers (FAKE data).
insert into public.customers (id, name, contact, address) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Maria Santos', '0917 000 0001', '123 Mabini Street, Barangay Poblacion'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Juan Dela Cruz', null, '45 Rizal Avenue, Barangay San Isidro'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'Ana Reyes', '0917 000 0003', '78 Quezon Boulevard, Barangay Bagong Silang');

-- Products (FAKE data; prod-3 stays pending).
insert into public.products (id, name, status, created_by_user_id) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Rice 25kg', 'active', null),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Sugar 1kg', 'active', null),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'Cooking Oil 1L', 'pending', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'Instant Coffee', 'active', null);

-- Riders / vehicles per store.
insert into public.riders (id, name, store_id, active) values
  ('cccccccc-0000-0000-0000-000000000001', 'Jojo Ramos', 'amara', true),
  ('cccccccc-0000-0000-0000-000000000002', 'Ramon Cruz', 'amara', true),
  ('cccccccc-0000-0000-0000-000000000003', 'Paolo Lim', 'zeann', true);

insert into public.vehicles (id, label, store_id, active) values
  ('dddddddd-0000-0000-0000-000000000001', 'Motorcycle', 'amara', true),
  ('dddddddd-0000-0000-0000-000000000002', 'Tricycle', 'amara', true),
  ('dddddddd-0000-0000-0000-000000000003', 'Motorcycle', 'zeann', true),
  ('dddddddd-0000-0000-0000-000000000004', 'Van', 'zeann', true);

-- Stock levels (mirror mock: sales seeded below then net stock restored).
insert into public.stock_levels (store_id, product_id, quantity) values
  ('amara', 'bbbbbbbb-0000-0000-0000-000000000001', 20),
  ('amara', 'bbbbbbbb-0000-0000-0000-000000000002', 50),
  ('amara', 'bbbbbbbb-0000-0000-0000-000000000004', 30),
  ('zeann', 'bbbbbbbb-0000-0000-0000-000000000001', 12),
  ('zeann', 'bbbbbbbb-0000-0000-0000-000000000002', 40),
  ('zeann', 'bbbbbbbb-0000-0000-0000-000000000004', 25);

-- Receiving history.
insert into public.receiving_records (
  id, store_id, product_id, quantity, supplier, cost_price_minor,
  selling_price_minor, rider_id, vehicle_id, recorded_by_user_id, received_at
) values
  ('eeeeeeee-0000-0000-0000-000000000001', 'amara', 'bbbbbbbb-0000-0000-0000-000000000001', 20, 'Central Supply', 110000, 115000, 'cccccccc-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', now()),
  ('eeeeeeee-0000-0000-0000-000000000002', 'zeann', 'bbbbbbbb-0000-0000-0000-000000000002', 40, 'Sweet Depot', 5500, 6500, 'cccccccc-0000-0000-0000-000000000003', 'dddddddd-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', now()),
  ('eeeeeeee-0000-0000-0000-000000000003', 'amara', 'bbbbbbbb-0000-0000-0000-000000000002', 50, 'Sweet Depot', 5000, 6500, 'cccccccc-0000-0000-0000-000000000002', 'dddddddd-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', now() - interval '3 days'),
  ('eeeeeeee-0000-0000-0000-000000000004', 'zeann', 'bbbbbbbb-0000-0000-0000-000000000001', 12, 'Central Supply', 110000, 120000, 'cccccccc-0000-0000-0000-000000000003', 'dddddddd-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', now()),
  ('eeeeeeee-0000-0000-0000-000000000005', 'amara', 'bbbbbbbb-0000-0000-0000-000000000004', 30, 'Coffee Traders', 8000, 9500, 'cccccccc-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', now()),
  ('eeeeeeee-0000-0000-0000-000000000006', 'zeann', 'bbbbbbbb-0000-0000-0000-000000000004', 25, 'Coffee Traders', 8000, 9500, 'cccccccc-0000-0000-0000-000000000003', 'dddddddd-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', now());

-- Sales.
insert into public.sales (
  id, store_id, sale_date, customer_id, payment_type, payment_method,
  delivery_fee_minor, delivery_rider_id, delivery_vehicle_id, discount_minor,
  total_minor, recorded_by_user_id, created_at
) values
  ('ffffffff-0000-0000-0000-000000000001', 'amara', current_date, 'aaaaaaaa-0000-0000-0000-000000000001', 'cash', 'Cash', 0, null, null, 0, 230000, '11111111-1111-1111-1111-111111111111', now()),
  ('ffffffff-0000-0000-0000-000000000002', 'zeann', current_date, 'aaaaaaaa-0000-0000-0000-000000000002', 'charge', 'GCash', 0, null, null, 0, 19500, '22222222-2222-2222-2222-222222222222', now()),
  ('ffffffff-0000-0000-0000-000000000003', 'amara', current_date, null, 'cash', 'Cash', 0, null, null, 0, 9500, '11111111-1111-1111-1111-111111111111', now()),
  ('ffffffff-0000-0000-0000-000000000004', 'zeann', current_date - 1, 'aaaaaaaa-0000-0000-0000-000000000001', 'cash', 'Maya', 0, null, null, 0, 120000, '22222222-2222-2222-2222-222222222222', now() - interval '1 day');

insert into public.sale_lines (sale_id, product_id, quantity, unit_price_minor) values
  ('ffffffff-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 2, 115000),
  ('ffffffff-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000002', 3, 6500),
  ('ffffffff-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000004', 1, 9500),
  ('ffffffff-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000001', 1, 120000);

-- Credit obligations (mock: cred-1 from zeann charge, cred-2 with cross-store
-- payments, cred-3 settled). Stock levels above already net of these sales.
insert into public.credit_obligations (
  id, customer_id, origin_store_id, sale_id, terms_id, due_date,
  original_amount_minor, balance_minor, status, created_at
) values
  ('aaaaaaaa-0000-0000-0000-000000000101', 'aaaaaaaa-0000-0000-0000-000000000002', 'zeann', 'ffffffff-0000-0000-0000-000000000002', 'terms-15', current_date + 15, 19500, 19500, 'outstanding', now()),
  ('aaaaaaaa-0000-0000-0000-000000000102', 'aaaaaaaa-0000-0000-0000-000000000001', 'amara', null, 'terms-30', current_date + 30, 50000, 20000, 'outstanding', now() - interval '5 days'),
  ('aaaaaaaa-0000-0000-0000-000000000103', 'aaaaaaaa-0000-0000-0000-000000000003', 'amara', null, 'terms-7', current_date - 2, 12000, 0, 'settled', now() - interval '9 days');

-- Payments (cred-2 cross-store: zeann then amara; cred-3 settled via bank).
insert into public.payments (credit_id, store_id, amount_minor, method, recorded_by_user_id, paid_at) values
  ('aaaaaaaa-0000-0000-0000-000000000102', 'zeann', 20000, 'GCash', '22222222-2222-2222-2222-222222222222', now() - interval '2 days'),
  ('aaaaaaaa-0000-0000-0000-000000000102', 'amara', 10000, 'Cash', '11111111-1111-1111-1111-111111111111', now() - interval '1 day'),
  ('aaaaaaaa-0000-0000-0000-000000000103', 'amara', 12000, 'Bank Transfer', '11111111-1111-1111-1111-111111111111', now() - interval '2 days');

-- Expenses.
insert into public.expenses (store_id, rider_id, vehicle_id, type, amount_minor, note, recorded_by_user_id, created_at) values
  ('amara', 'cccccccc-0000-0000-0000-000000000001', null, 'fuel', 50000, 'Weekly fuel for Amara deliveries', '11111111-1111-1111-1111-111111111111', now() - interval '1 day'),
  ('amara', null, 'dddddddd-0000-0000-0000-000000000002', 'repair', 120000, 'Tricycle tire replacement', '11111111-1111-1111-1111-111111111111', now() - interval '2 days'),
  ('zeann', 'cccccccc-0000-0000-0000-000000000003', 'dddddddd-0000-0000-0000-000000000003', 'fuel', 35000, 'Zeann store fuel allowance', '22222222-2222-2222-2222-222222222222', now() - interval '1 day');