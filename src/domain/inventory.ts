import type { ProductId } from './ids'
import type { StoreId } from './store'

export interface StockLevel {
  productId: ProductId
  storeId: StoreId
  quantity: number
  /** admin-approved rows are edit/delete-locked for staff (client change) */
  adminApproved?: boolean
}
