-- ZAF ONE — 00005: Staff management fixes
--
-- 1. create_staff: add `extensions` to the function search path so
--    crypt()/gen_salt() (pgcrypto) resolve at runtime on hosted projects —
--    previously search_path = public raised "function gen_salt(unknown)
--    does not exist" (42883) when the RPC ran.
-- 2. New update_staff: admin-only profile edits (rename, username, store
--    reassignment, enable/disable) plus optional password reset against
--    auth.users. RLS on profiles only covers self-updates, so admin edits go
--    through this SECURITY DEFINER function with an in-body admin check.

create or replace function public.create_staff(
  p_username text,
  p_name text,
  p_role text,
  p_store_id text,
  p_password text
)
returns jsonb
language plpgsql
security definer
-- extensions is required at runtime for crypt()/gen_salt() (pgcrypto).
set search_path = public, extensions
as $$
declare
  caller public.profiles;
  new_uid uuid;
  base_email text;
begin
  select * into caller from public.profiles where id = auth.uid();
  if caller.id is null then
    raise exception 'The recording staff member is not recognized.' using errcode = 'P0001';
  end if;
  if not caller.active then
    raise exception 'This account is disabled. Contact the admin.' using errcode = 'P0001';
  end if;
  if caller.role <> 'admin' then
    raise exception 'Only admins can manage staff.' using errcode = 'P0001';
  end if;
  if p_username is null or length(btrim(p_username)) = 0 then
    raise exception 'Username is required.' using errcode = 'P0001';
  end if;
  if p_role not in ('staff', 'admin') then
    raise exception 'Invalid role.' using errcode = 'P0001';
  end if;
  if p_role = 'staff' and p_store_id is null then
    raise exception 'Each staff member must be assigned to a store.' using errcode = 'P0001';
  end if;
  if p_password is null or length(p_password) < 4 then
    raise exception 'Password must be at least 4 characters.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.profiles where username = lower(btrim(p_username))) then
    raise exception 'That username is already taken.' using errcode = 'P0001';
  end if;

  base_email := lower(btrim(p_username)) || '@zafone.local';

  -- Create the auth identity first (Supabase Auth table). GoTrue requires
  -- these token columns as non-NULL empty strings; direct inserts otherwise
  -- break the auth schema scan.
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new,
    email_change_token_current, email_change_confirm_status, reauthentication_token,
    phone, phone_confirmed_at, phone_change, phone_change_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    base_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('name', p_name),
    now(), now(),
    '', '', '', '', '', 0,
    '',
    null, null, '', ''
  ) returning id into new_uid;

  insert into public.profiles (id, username, name, role, store_id, active)
  values (new_uid, lower(btrim(p_username)), btrim(p_name), p_role,
    case when p_role = 'admin' then null else p_store_id end, true);

  -- Password sign-in needs one identity row (provider 'email').
  insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  values (new_uid, new_uid, new_uid, 'email',
    jsonb_build_object('sub', new_uid::text, 'email', base_email, 'email_verified', true),
    now(), now(), now());

  return jsonb_build_object('user_id', new_uid, 'email', base_email);
end;
$$;

create or replace function public.update_staff(
  p_user_id uuid,
  p_name text,
  p_username text,
  p_store_id text,
  p_active boolean,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller public.profiles;
  target public.profiles;
  new_email text;
begin
  select * into caller from public.profiles where id = auth.uid();
  if caller.id is null then
    raise exception 'The recording staff member is not recognized.' using errcode = 'P0001';
  end if;
  if not caller.active then
    raise exception 'This account is disabled. Contact the admin.' using errcode = 'P0001';
  end if;
  if caller.role <> 'admin' then
    raise exception 'Only admins can manage staff.' using errcode = 'P0001';
  end if;

  select * into target from public.profiles where id = p_user_id;
  if target.id is null then
    raise exception 'User not found.' using errcode = 'P0001';
  end if;

  -- Username change: keep the auth identity in sync so login still resolves.
  if p_username is not null and lower(btrim(p_username)) <> target.username then
    if exists (
      select 1 from public.profiles
      where username = lower(btrim(p_username)) and id <> p_user_id
    ) then
      raise exception 'That username is already taken.' using errcode = 'P0001';
    end if;
    new_email := lower(btrim(p_username)) || '@zafone.local';
  end if;

  if p_name is not null and length(btrim(p_name)) = 0 then
    raise exception 'Staff name is required.' using errcode = 'P0001';
  end if;

  update public.profiles
     set name = coalesce(p_name, name),
         username = coalesce(lower(btrim(p_username)), username),
         store_id = case
           when target.role = 'admin' then null
           else coalesce(case when p_store_id = '' then null else p_store_id end, store_id)
         end,
         active = coalesce(p_active, active)
   where id = p_user_id;

  -- Keep the auth identity consistent with the username convention.
  if new_email is not null then
    update auth.users
       set email = new_email,
           email_confirmed_at = coalesce(email_confirmed_at, now())
     where id = p_user_id;
    update auth.identities
       set identity_data = jsonb_set(
             jsonb_set(identity_data, '{sub}', to_jsonb(p_user_id::text)),
             '{email}', to_jsonb(new_email))
     where user_id = p_user_id;
    -- identity_data.email is mirrored by the email column (generated).
  end if;

  -- Optional password reset (Assumed: revokes existing sessions so the new
  -- credential is the only valid one).
  if p_password is not null then
    if length(p_password) < 4 then
      raise exception 'Password must be at least 4 characters.' using errcode = 'P0001';
    end if;
    update auth.users
       set encrypted_password = crypt(p_password, gen_salt('bf'))
     where id = p_user_id;
    delete from auth.sessions where user_id = p_user_id;
    delete from auth.refresh_tokens where user_id = p_user_id::text;
  end if;

  return jsonb_build_object('user_id', p_user_id);
end;
$$;

-- Grants (same policy as 00003): authenticated only, never PUBLIC/anon.
revoke all on function public.create_staff(text, text, text, text, text) from public, anon;
grant execute on function public.create_staff(text, text, text, text, text) to authenticated;
revoke all on function public.update_staff(uuid, text, text, text, boolean, text) from public, anon;
grant execute on function public.update_staff(uuid, text, text, text, boolean, text) to authenticated;