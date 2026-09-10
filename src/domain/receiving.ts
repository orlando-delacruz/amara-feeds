import type { ProductId, ReceivingId } from './ids'
import type { StoreId } from './store'
import type { Money } from '@/lib/money'

export interface ReceivingRecord {
  id: ReceivingId
  storeId: StoreId
  productId: ProductId
  quantity: number
  supplier: string
  costPriceMinor: Money
  receivedAt: string
}

export interface NewReceivingInput {
  storeId: StoreId
  productId: ProductId
  quantity: number
  supplier: string
  costPriceMinor: Money
}
