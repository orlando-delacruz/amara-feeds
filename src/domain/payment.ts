import type { CreditId, PaymentId, UserId } from './ids'
import type { StoreId } from './store'
import type { Money } from '@/lib/money'

export const PAYMENT_METHOD_PRESETS = [
  'Cash',
  'GCash',
  'Maya',
  'Bank Transfer',
  'Check',
  'Other',
] as const

export type PaymentMethodPreset = (typeof PAYMENT_METHOD_PRESETS)[number]

export interface Payment {
  id: PaymentId
  creditId: CreditId
  storeId: StoreId
  amountMinor: Money
  /**
   * assumed: collection method (Cash, GCash, Maya, Bank Transfer, Check, or a
   * staff-entered custom value when Other is selected). Exact methods are
   * Confirmation Required; optional so legacy records without a method stay valid.
   */
  method?: string
  /** assumed: staff member who recorded the payment; staff cannot modify another staff's records */
  recordedByUserId: UserId
  paidAt: string
}

export interface RecordPaymentInput {
  creditId: CreditId
  storeId: StoreId
  amountMinor: Money
  /** assumed: collection method; see Payment.method */
  method?: string
  /** assumed: signed-in staff member recording the payment */
  recordedByUserId: UserId
}
