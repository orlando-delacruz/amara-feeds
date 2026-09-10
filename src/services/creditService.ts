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
import { ServiceError } from './errors'

/**
 * assumed: term options and due-date calculation rules are Confirmation Required.
 * This single helper is the only place the mock invents an offset, so Phase 4
 * replaces exactly one function when the real rules are confirmed.
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
  return getDb().terms.map((term) => ({ ...term }))
}

export async function previewDueDate(termsId: PaymentTermsId): Promise<string> {
  return resolveDueDate(termsId, new Date().toISOString())
}

export async function listCredits(
  filter: { customerId?: CustomerId; originStoreId?: StoreId; status?: CreditStatus } = {},
): Promise<CreditObligation[]> {
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
  createdAt: string
}

export function createObligationFromSale(input: CreateObligationInput): CreditObligation {
  const obligation: CreditObligation = {
    id: nextId('cred'),
    customerId: input.customerId,
    originStoreId: input.originStoreId,
    saleId: input.saleId,
    termsId: input.termsId,
    dueDate: resolveDueDate(input.termsId, input.createdAt),
    originalAmountMinor: input.amountMinor,
    balanceMinor: input.amountMinor,
    status: 'outstanding',
    createdAt: input.createdAt,
  }
  getDb().credits.push(obligation)
  return { ...obligation }
}
