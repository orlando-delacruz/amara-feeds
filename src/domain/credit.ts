import type { CreditId, CustomerId, PaymentTermsId, SaleId } from './ids'
import type { StoreId } from './store'
import type { Money } from '@/lib/money'
import type { Payment } from './payment'

export type CreditStatus = 'outstanding' | 'settled'

export interface PaymentTerms {
  id: PaymentTermsId
  /** assumed: label only; exact term options and calculation rules are Confirmation Required */
  label: string
}

export interface CreditObligation {
  id: CreditId
  customerId: CustomerId
  originStoreId: StoreId
  /** assumed: link to the originating charge sale */
  saleId?: SaleId
  termsId: PaymentTermsId
  /** assumed: due date derived from terms; calculation rules are Confirmation Required */
  dueDate: string
  originalAmountMinor: Money
  balanceMinor: Money
  status: CreditStatus
  createdAt: string
}

export interface CreditHistory {
  credit: CreditObligation
  payments: Payment[]
}
