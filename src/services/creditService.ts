import type {
  CreditHistory,
  CreditId,
  CreditObligation,
  CreditStatus,
  CustomerId,
  PaymentTerms,
  PaymentTermsId,
  SaleId,
} from '@/domain'
import type { StoreId } from '@/domain'
import type { Money } from '@/lib/money'
import { addDays } from '@/lib/dates'
import { getDb } from './mocks/db'
import { nextId } from './mocks/ids'
import { isSupabaseConfigured, supabase } from './supabaseClient'
import { serviceErrorFromSupabase } from './userService'
import { ServiceError } from './errors'

/**
 * assumed: term options and due-date calculation rules are Confirmation Required.
 * This single helper is the only place the mock invents an offset; the
 * database stores the offset on payment_terms and record_sale computes the
 * due date there.
 */
const TERM_OFFSET_DAYS: Record<string, number> = {
  'terms-7': 7,
  'terms-15': 15,
  'terms-30': 30,
}

export function resolveDueDate(termsId: PaymentTermsId, fromIso: string): string {
  return addDays(fromIso, TERM_OFFSET_DAYS[termsId] ?? 0)
}

export async function listPaymentTerms(): Promise<PaymentTerms[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('payment_terms').select('id, label').order('id')
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return (data ?? []).map((row) => ({ id: row.id, label: row.label }))
  }
  return getDb().terms.map((term) => ({ ...term }))
}

export async function previewDueDate(termsId: PaymentTermsId, fromDate?: string): Promise<string> {
  const fromIso = fromDate
    ? new Date(`${fromDate}T00:00:00`).toISOString()
    : new Date().toISOString()
  return resolveDueDate(termsId, fromIso)
}

export async function listCredits(
  filter: { customerId?: CustomerId; originStoreId?: StoreId; status?: CreditStatus } = {},
): Promise<CreditObligation[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from('credit_obligations')
      .select(
        'id, customer_id, origin_store_id, sale_id, terms_id, due_date, original_amount_minor, balance_minor, status, created_at',
      )
    if (filter.customerId) {
      query = query.eq('customer_id', filter.customerId)
    }
    if (filter.originStoreId) {
      query = query.eq('origin_store_id', filter.originStoreId)
    }
    if (filter.status) {
      query = query.eq('status', filter.status)
    }
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return (data ?? []).map((row) => ({
      id: row.id,
      customerId: row.customer_id,
      originStoreId: row.origin_store_id as StoreId,
      saleId: row.sale_id ?? undefined,
      termsId: row.terms_id,
      dueDate: row.due_date,
      originalAmountMinor: row.original_amount_minor,
      balanceMinor: row.balance_minor,
      status: row.status as CreditStatus,
      createdAt: row.created_at,
    }))
  }
  return getDb()
    .credits.filter(
      (credit) =>
        (!filter.customerId || credit.customerId === filter.customerId) &&
        (!filter.originStoreId || credit.originStoreId === filter.originStoreId) &&
        (!filter.status || credit.status === filter.status),
    )
    .map((credit) => ({ ...credit }))
}

export async function getCredit(id: CreditId): Promise<CreditObligation> {
  const credit = getDb().credits.find((item) => item.id === id)
  if (!credit) {
    throw new ServiceError('not_found', 'Credit not found.')
  }
  return { ...credit }
}

export async function getCreditHistory(id: CreditId): Promise<CreditHistory> {
  if (isSupabaseConfigured && supabase) {
    // maybeSingle() + explicit not_found: a stale/deleted credit id resolves
    // to the same ServiceError the mock path throws (never raw PGRST116).
    const { data: credit, error } = await supabase
      .from('credit_obligations')
      .select(
        'id, customer_id, origin_store_id, sale_id, terms_id, due_date, original_amount_minor, balance_minor, status, created_at',
      )
      .eq('id', id)
      .maybeSingle()
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    if (!credit) {
      throw new ServiceError('not_found', 'Credit not found.')
    }
    const { data: payments } = await supabase
      .from('payments')
      .select('id, credit_id, store_id, amount_minor, method, recorded_by_user_id, paid_at')
      .eq('credit_id', id)
      .order('paid_at', { ascending: false })
    return {
      credit: {
        id: credit.id,
        customerId: credit.customer_id,
        originStoreId: credit.origin_store_id as StoreId,
        saleId: credit.sale_id ?? undefined,
        termsId: credit.terms_id,
        dueDate: credit.due_date,
        originalAmountMinor: credit.original_amount_minor,
        balanceMinor: credit.balance_minor,
        status: credit.status as CreditStatus,
        createdAt: credit.created_at,
      },
      payments: (payments ?? []).map((row) => ({
        id: row.id,
        creditId: row.credit_id,
        storeId: row.store_id as StoreId,
        amountMinor: row.amount_minor,
        method: row.method ?? undefined,
        recordedByUserId: row.recorded_by_user_id,
        paidAt: row.paid_at,
      })),
    }
  }
  const credit = await getCredit(id)
  const payments = getDb()
    .payments.filter((payment) => payment.creditId === id)
    .map((payment) => ({ ...payment }))
  return { credit, payments }
}

export interface CreateObligationInput {
  customerId: CustomerId
  originStoreId: StoreId
  saleId?: SaleId
  termsId: PaymentTermsId
  amountMinor: Money
  saleDate?: string
  createdAt: string
}

export function createObligationFromSale(input: CreateObligationInput): CreditObligation {
  const obligation: CreditObligation = {
    id: nextId('cred'),
    customerId: input.customerId,
    originStoreId: input.originStoreId,
    saleId: input.saleId,
    termsId: input.termsId,
    dueDate: resolveDueDate(
      input.termsId,
      input.saleDate ? new Date(`${input.saleDate}T00:00:00`).toISOString() : input.createdAt,
    ),
    originalAmountMinor: input.amountMinor,
    balanceMinor: input.amountMinor,
    status: 'outstanding',
    createdAt: input.createdAt,
  }
  getDb().credits.push(obligation)
  return { ...obligation }
}
