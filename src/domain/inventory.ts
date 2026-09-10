import type { ProductId } from './ids'
import type { StoreId } from './store'

export interface StockLevel {
  productId: ProductId
  storeId: StoreId
  quantity: number
}
