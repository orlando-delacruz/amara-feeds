import type { CreditId, CustomerId, PaymentTermsId, ProductId, SaleId, UserId } from './ids'
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
  /**
   * Manually entered interest (DEC-059, encoded balances only). Display-only:
   * never added to balances or totals. Absent means no interest was entered.
   */
  interestMinor?: Money
  createdAt: string
}

export interface CreditItem {
  productId: ProductId
  productName: string
  quantity: number
  unitPriceMinor: Money
}

/**
 * A credit obligation joined with the item details and the encoder of its
 * originating sale. Read-only projection for the reports export (DEC-067):
 * nothing new is stored — `credit_obligations` carries no encoder column, and
 * both paths that create an obligation (`record_sale`, DEC-049 legacy encode)
 * write one on the linked `sales` row.
 *
 * Sale-less obligations (seed rows) have no items and no encoder; they are
 * reported as such rather than dropped.
 */
export interface CreditRecord extends CreditObligation {
  /** Item lines of the originating (or encoded legacy) sale; empty when absent. */
  items: CreditItem[]
  /** Projection of the linked sale's recorded_by_user_id. */
  recordedByUserId?: UserId
}

export interface CreditHistory {
  credit: CreditObligation
  payments: Payment[]
  /** Item details from the originating (or encoded legacy) sale. */
  items: CreditItem[]
  /**
   * Transaction date (date-only): the originating sale's sale date when the
   * linked sale exists and is readable, otherwise the credit's recording
   * date. Encoded existing balances carry their admin-set date on the
   * legacy sale row; sale-less obligations fall back to recording date.
   */
  transactionDate: string
}
