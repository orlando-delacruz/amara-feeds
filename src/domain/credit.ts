import type { CreditId, CustomerId, PaymentTermsId, ProductId, SaleId } from './ids'
import type { StoreId } from './store'
import type { Money } from '@/lib/money'
import type { Payment } from './payment'

export type CreditStatus = 'outstanding' | 'settled' | 'voided'

export interface PaymentTerms {
  id: PaymentTermsId
  /** assumed: label only; exact term options and calculation rules are Confirmation Required */
  label: string
}

export interface CreditObligation {
  id: CreditId
  customerId: CustomerId
  originStoreId: StoreId
  /** assumed: link to the originating charge sale; absent for encoded existing balances */
  saleId?: SaleId
  /** absent for encoded existing balances (legacy credits carry no terms) */
  termsId?: PaymentTermsId
  /** assumed: due date derived from terms, or admin-set for existing balances */
  dueDate: string
  originalAmountMinor: Money
  balanceMinor: Money
  status: CreditStatus
  createdAt: string
}

export interface CreditItem {
  productId: ProductId
  productName: string
  quantity: number
  unitPriceMinor: Money
}

export interface CreditHistory {
  credit: CreditObligation
  payments: Payment[]
  /** Item details from the originating (or encoded legacy) sale. */
  items: CreditItem[]
}
