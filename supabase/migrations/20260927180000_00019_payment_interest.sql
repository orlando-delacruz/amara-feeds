-- ZAF ONE — 00019: Manual interest recorded with a payment (DEC-064)
--
-- The payment flow gains an optional manually entered interest, stored on the
-- payment row. It is display-only: the guarded balance decrement keeps using
-- p_amount_minor alone, so credit balance behavior is unchanged. Distinct from
-- the credit-level display interest (DEC-059/062) — this one is per payment
-- and entered by whoever records the payment (admin or staff).
--
-- `record_payment` is re-signed with an optional trailing p_interest_minor
-- (create-new + drop-old, the 00016 precedent); old callers pass nothing and
-- behave identically. Additive column; no existing rows change.

alter table public.payments
  add column interest_minor integer check (interest_minor >= 0);

create or replace function public.record_payment(
  p_credit_id uuid,
  p_store_id text,
  p_amount_minor integer,
  p_method text,
  p_interest_minor integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles;
  credit public.credit_obligations;
  pay_id uuid;
  new_balance integer;
  new_status text;
begin
  perform public.assert_active_caller();
  select * into caller from public.profiles where id = auth.uid();
  -- Payments may be recorded through either store; caller just needs to be active.

  select * into credit from public.credit_obligations where id = p_credit_id;
  if credit.id is null then
    raise exception 'Credit not found.' using errcode = 'P0001';
  end if;
  if credit.status = 'voided' then
    raise exception 'This credit record was undone and cannot receive payments.' using errcode = 'P0001';
  end if;
  if credit.status = 'settled' then
    raise exception 'This credit is already settled.' using errcode = 'P0001';
  end if;
  if p_amount_minor <= 0 then
    raise exception 'Payment amount must be greater than zero.' using errcode = 'P0001';
  end if;
  if p_method is not null and length(btrim(p_method)) = 0 then
    raise exception 'Payment method is required.' using errcode = 'P0001';
  end if;
  if p_interest_minor is not null and p_interest_minor < 0 then
    raise exception 'Credit interest cannot be negative.' using errcode = 'P0001';
  end if;

  -- Guarded atomic decrement: the balance predicate is re-checked against
  -- the current row value under the row lock, so two concurrent payments
  -- can never both pass (the stale pre-read only yields the friendly error).
  -- Manual interest never participates in the balance math.
  update public.credit_obligations
     set balance_minor = balance_minor - p_amount_minor,
         status = case
           when balance_minor - p_amount_minor = 0 then 'settled'
           else 'outstanding'
         end
   where id = p_credit_id
     and status = 'outstanding'
     and balance_minor >= p_amount_minor
  returning balance_minor, status into new_balance, new_status;
  if new_balance is null then
    raise exception 'Payment cannot exceed the remaining balance.' using errcode = 'P0001';
  end if;

  insert into public.payments (
    credit_id, store_id, amount_minor, method, recorded_by_user_id, interest_minor
  )
  values (
    p_credit_id, p_store_id, p_amount_minor,
    case when p_method is null then null else btrim(p_method) end,
    caller.id, p_interest_minor
  ) returning id into pay_id;

  insert into public.audit_events (action, actor_user_id, store_id, subject, detail)
  values ('payment.recorded', caller.id, p_store_id,
    case when p_store_id = 'amara' then 'Payment at Amara' else 'Payment at Zeann' end,
    'Via ' || coalesce(btrim(p_method), 'unspecified'));

  return jsonb_build_object(
    'payment_id', pay_id,
    'credit_id', credit.id,
    'balance_minor', new_balance,
    'status', new_status
  );
end;
$$;

drop function if exists public.record_payment(uuid, text, integer, text);

revoke all on function public.record_payment(uuid, text, integer, text, integer) from public, anon;
grant execute on function public.record_payment(uuid, text, integer, text, integer) to authenticated;
