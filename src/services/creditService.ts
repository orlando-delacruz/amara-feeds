import type {
  CreditHistory,
  CreditId,
  CreditItem,
  CreditObligation,
  CreditStatus,
  CustomerId,
  Payment,
  PaymentTerms,
  PaymentTermsId,
  ProductId,
  Sale,
  SaleId,
  UserId,
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
      // Voided (admin-reverted) credits are corrections, not standing records.
      .neq('status', 'voided')
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
      termsId: row.terms_id ?? undefined,
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
        credit.status !== 'voided' &&
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
    // Item details come from the originating sale (a charge sale or an
    // encoded legacy credit row) — "similarly to the Sales details".
    let items: CreditItem[] = []
    if (credit.sale_id) {
      const { data: lines } = await supabase
        .from('sale_lines')
        .select('product_id, quantity, unit_price_minor, products(name)')
        .eq('sale_id', credit.sale_id)
      items = (lines ?? []).map((line) => ({
        productId: line.product_id,
        productName: (line.products as { name?: string } | null)?.name ?? 'Unknown item',
        quantity: line.quantity,
        unitPriceMinor: line.unit_price_minor as Money,
      }))
    }
    return {
      credit: {
        id: credit.id,
        customerId: credit.customer_id,
        originStoreId: credit.origin_store_id as StoreId,
        saleId: credit.sale_id ?? undefined,
        termsId: credit.terms_id ?? undefined,
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
      items,
    }
  }
  const credit = await getCredit(id)
  const payments = getDb()
    .payments.filter((payment) => payment.creditId === id)
    .map((payment) => ({ ...payment }))
  const sale = credit.saleId ? getDb().sales.find((item) => item.id === credit.saleId) : undefined
  const items: CreditItem[] = (sale?.lines ?? []).map((line) => ({
    productId: line.productId,
    productName:
      getDb().products.find((product) => product.id === line.productId)?.name ?? 'Unknown item',
    quantity: line.quantity,
    unitPriceMinor: line.unitPriceMinor,
  }))
  return { credit, payments, items }
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

export interface CreateExistingCreditItem {
  productId: ProductId
  quantity: number
  unitPriceMinor: Money
}

/**
 * Admin-only credit undo (DEC-050, bank-style correction): voids the credit,
 * its payment rows, and its underlying sale. Only system charge-sale credits
 * restore stock — encoded legacy credits never touched inventory, so undoing
 * them has no inventory effect (the DEC-048/049 guarantee holds).
 */
export async function voidCredit(id: CreditId): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.rpc('void_credit', { p_credit_id: id })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    return
  }
  const db = getDb()
  const credit = db.credits.find((item) => item.id === id)
  if (!credit) {
    throw new ServiceError('not_found', 'Credit not found.')
  }
  if (credit.status === 'voided') {
    throw new ServiceError('conflict', 'This credit was already undone.')
  }
  for (const payment of db.payments) {
    if (payment.creditId === id && !payment.isVoided) {
      payment.isVoided = true
    }
  }
  credit.status = 'voided'
  const sale = credit.saleId ? db.sales.find((item) => item.id === credit.saleId) : undefined
  if (sale) {
    if (!sale.isLegacy && !sale.isVoided) {
      for (const line of sale.lines) {
        const level = db.stock.find(
          (row) => row.storeId === sale.storeId && row.productId === line.productId,
        )
        if (level) {
          level.quantity += line.quantity
        }
      }
    }
    sale.isVoided = true
  }
}

export interface CreateExistingCreditInput {
  customerId: CustomerId
  originStoreId: StoreId
  /** Transaction date (when the customer received the items). */
  date: string
  /** Admin-set due date (legacy balances carry no terms). */
  dueDate: string
  lines: CreateExistingCreditItem[]
  initialPaymentMinor?: Money
  initialPaymentMethod?: string
  recordedByUserId: UserId
}

/**
 * Encodes a customer's pre-system credit balance with complete transaction
 * details (client revision): a legacy sales row carries the item lines
 * (excluded from sales lists and summaries), the credit obligation links to
 * it, and an optional initial partial payment rides the normal payment flow.
 * Encoding never touches inventory — stock moves only through real sales.
 * The database function is admin-only and writes the `credit.imported` audit
 * event.
 */
export async function createExistingCredit(
  input: CreateExistingCreditInput,
): Promise<CreditObligation> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('record_existing_credit', {
      p_customer_id: input.customerId,
      p_store_id: input.originStoreId,
      p_date: input.date,
      p_due_date: input.dueDate,
      p_lines: input.lines.map((line) => ({
        product_id: line.productId,
        quantity: line.quantity,
        unit_price_minor: line.unitPriceMinor,
      })),
      p_initial_payment_minor: input.initialPaymentMinor ?? null,
      p_initial_payment_method: input.initialPaymentMethod?.trim() || null,
    })
    if (error) {
      throw serviceErrorFromSupabase(error)
    }
    const totalMinor = input.lines.reduce(
      (total, line) => total + line.quantity * line.unitPriceMinor,
      0,
    )
    return {
      id: data?.credit_id as string,
      customerId: input.customerId,
      originStoreId: input.originStoreId,
      saleId: data?.sale_id as string,
      termsId: undefined,
      dueDate: input.dueDate,
      originalAmountMinor: totalMinor,
      balanceMinor: (data?.balance_minor as Money) ?? totalMinor,
      status: (data?.status as CreditStatus) ?? 'outstanding',
      createdAt: new Date().toISOString(),
    }
  }
  if (input.lines.length === 0) {
    throw new ServiceError('validation', 'At least one item is required.')
  }
  for (const line of input.lines) {
    if (line.quantity <= 0) {
      throw new ServiceError('validation', 'Item quantity must be greater than zero.')
    }
    if (line.unitPriceMinor < 0) {
      throw new ServiceError('validation', 'Item price cannot be negative.')
    }
  }
  if (!input.dueDate) {
    throw new ServiceError('validation', 'A due date is required.')
  }
  const customer = getDb().customers.find((item) => item.id === input.customerId)
  if (!customer) {
    throw new ServiceError('not_found', 'Customer not found.')
  }
  const totalMinor = input.lines.reduce(
    (total, line) => total + line.quantity * line.unitPriceMinor,
    0,
  )
  if (input.initialPaymentMinor !== undefined && input.initialPaymentMinor > totalMinor) {
    throw new ServiceError('validation', 'The initial payment cannot exceed the credit amount.')
  }

  const createdAt = new Date().toISOString()
  const sale: Sale = {
    id: nextId('sale'),
    storeId: input.originStoreId,
    saleDate: input.date,
    customerId: input.customerId,
    paymentType: 'charge',
    lines: input.lines.map((line) => ({ ...line })),
    totalMinor,
    recordedByUserId: input.recordedByUserId,
    isLegacy: true,
    createdAt,
  }
  getDb().sales.push(sale)

  const obligation: CreditObligation = {
    id: nextId('cred'),
    customerId: input.customerId,
    originStoreId: input.originStoreId,
    saleId: sale.id,
    termsId: undefined,
    dueDate: input.dueDate,
    originalAmountMinor: totalMinor,
    balanceMinor: totalMinor,
    status: 'outstanding',
    createdAt,
  }
  getDb().credits.push(obligation)

  if (input.initialPaymentMinor !== undefined && input.initialPaymentMinor > 0) {
    obligation.balanceMinor -= input.initialPaymentMinor
    if (obligation.balanceMinor === 0) {
      obligation.status = 'settled'
    }
    const payment: Payment = {
      id: nextId('pay'),
      creditId: obligation.id,
      storeId: input.originStoreId,
      amountMinor: input.initialPaymentMinor,
      ...(input.initialPaymentMethod?.trim() ? { method: input.initialPaymentMethod.trim() } : {}),
      recordedByUserId: input.recordedByUserId,
      paidAt: createdAt,
    }
    getDb().payments.push(payment)
  }

  return { ...obligation }
}
