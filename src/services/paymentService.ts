import type { CreditId, CreditObligation, Payment, RecordPaymentInput } from '@/domain'
import type { StoreId } from '@/domain'
import { getDb } from './mocks/db'
import { nextId } from './mocks/ids'
import { assertActiveRecorder } from './userService'
import { isSupabaseConfigured, supabase } from './supabaseClient'
import { serviceErrorFromSupabase } from './userService'
import { ServiceError } from './errors'

export async function listPayments(
  filter: { creditId?: CreditId; storeId?: StoreId } = {},
): Promise<Payment[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from('payments')
      .select('id, credit_id, store_id, amount_minor, method, recorded_by_user_id, paid_at')
    if (filter.creditId) {
      query = query.eq('credit_id', filter.creditId)
    }
    if (filter.storeId) {
      query = query.eq('store_id', filter.storeId)
    }
    const { data, error } = await query.order('paid_at', { ascending: false })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return (data ?? []).map((row) => ({
      id: row.id,
      creditId: row.credit_id,
      storeId: row.store_id as StoreId,
      amountMinor: row.amount_minor,
      method: row.method ?? undefined,
      recordedByUserId: row.recorded_by_user_id,
      paidAt: row.paid_at,
    }))
  }
  return getDb()
    .payments.filter(
      (payment) =>
        (!filter.creditId || payment.creditId === filter.creditId) &&
        (!filter.storeId || payment.storeId === filter.storeId),
    )
    .map((payment) => ({ ...payment }))
}

export async function recordPayment(
  input: RecordPaymentInput,
): Promise<{ payment: Payment; credit: CreditObligation }> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('record_payment', {
      p_credit_id: input.creditId,
      p_store_id: input.storeId,
      p_amount_minor: input.amountMinor,
      p_method: input.method?.trim() || null,
    })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return {
      payment: {
        id: data?.payment_id as string,
        creditId: input.creditId,
        storeId: input.storeId,
        amountMinor: input.amountMinor,
        method: input.method?.trim() || undefined,
        recordedByUserId: input.recordedByUserId,
        paidAt: new Date().toISOString(),
      },
      credit: {
        id: input.creditId,
        customerId: '',
        originStoreId: input.storeId,
        termsId: '',
        dueDate: '',
        originalAmountMinor: 0,
        balanceMinor: (data?.balance_minor as number) ?? 0,
        status: data?.status as CreditObligation['status'],
        createdAt: new Date().toISOString(),
      },
    }
  }
  const db = getDb()
  assertActiveRecorder(input.recordedByUserId)
  const credit = db.credits.find((item) => item.id === input.creditId)
  if (!credit) {
    throw new ServiceError('not_found', 'Credit not found.')
  }
  if (credit.status === 'settled') {
    throw new ServiceError('conflict', 'This credit is already settled.')
  }
  if (input.amountMinor <= 0) {
    throw new ServiceError('validation', 'Payment amount must be greater than zero.')
  }
  if (input.amountMinor > credit.balanceMinor) {
    throw new ServiceError('validation', 'Payment cannot exceed the remaining balance.')
  }
  const method = input.method?.trim()
  if (method !== undefined && method.length === 0) {
    throw new ServiceError('validation', 'Payment method is required.')
  }
  if (method && method.length > 40) {
    throw new ServiceError('validation', 'Payment method must be 40 characters or fewer.')
  }

  const payment: Payment = {
    id: nextId('pay'),
    creditId: credit.id,
    storeId: input.storeId,
    amountMinor: input.amountMinor,
    ...(method ? { method } : {}),
    recordedByUserId: input.recordedByUserId,
    paidAt: new Date().toISOString(),
  }
  db.payments.push(payment)

  credit.balanceMinor -= input.amountMinor
  if (credit.balanceMinor === 0) {
    credit.status = 'settled'
  }

  return { payment: { ...payment }, credit: { ...credit } }
}
