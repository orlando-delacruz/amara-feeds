import type { CreditId, PaymentId } from './ids'
import type { StoreId } from './store'
import type { Money } from '@/lib/money'

export interface Payment {
  id: PaymentId
  creditId: CreditId
  storeId: StoreId
  amountMinor: Money
  paidAt: string
}

export interface RecordPaymentInput {
  creditId: CreditId
  storeId: StoreId
  amountMinor: Money
}
