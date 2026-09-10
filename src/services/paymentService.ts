import type { CreditId, CreditObligation, Payment, RecordPaymentInput } from '@/domain'
import type { StoreId } from '@/domain'
import { getDb } from './mocks/db'
import { nextId } from './mocks/ids'
import { ServiceError } from './errors'

export async function listPayments(
  filter: { creditId?: CreditId; storeId?: StoreId } = {},
): Promise<Payment[]> {
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
  const db = getDb()
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

  const payment: Payment = {
    id: nextId('pay'),
    creditId: credit.id,
    storeId: input.storeId,
    amountMinor: input.amountMinor,
    paidAt: new Date().toISOString(),
  }
  db.payments.push(payment)

  credit.balanceMinor -= input.amountMinor
  if (credit.balanceMinor === 0) {
    credit.status = 'settled'
  }

  return { payment: { ...payment }, credit: { ...credit } }
}
