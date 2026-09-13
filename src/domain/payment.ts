import type { CreditId, PaymentId, UserId } from './ids'
import type { StoreId } from './store'
import type { Money } from '@/lib/money'

export interface Payment {
  id: PaymentId
  creditId: CreditId
  storeId: StoreId
  amountMinor: Money
  /** assumed: staff member who recorded the payment; staff cannot modify another staff's records */
  recordedByUserId: UserId
  paidAt: string
}

export interface RecordPaymentInput {
  creditId: CreditId
  storeId: StoreId
  amountMinor: Money
  /** assumed: signed-in staff member recording the payment */
  recordedByUserId: UserId
}
