import type { ProductId } from './ids'
import type { StoreId } from './store'
import type { Money } from '@/lib/money'

export interface StockLevel {
  productId: ProductId
  storeId: StoreId
  quantity: number
  /** admin-approved rows are edit/delete-locked for staff (client change) */
  adminApproved?: boolean
  /**
   * The store's current selling price. Null rows fall back to the latest
   * priced receiving record (the automatic-price rule).
   */
  priceMinor?: Money
}
